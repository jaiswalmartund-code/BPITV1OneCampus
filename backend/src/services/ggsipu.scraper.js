/**
 * GGSIPU Scraper Service
 * 
 * Proxies requests through api.ipuresults.com (which handles the
 * actual session management with examweb.ggsipu.ac.in).
 * 
 * Flow:
 *   1. fetchCaptcha()  → Get captcha image + sessionId
 *   2. fetchResults()  → Login + fetch all semester marks
 */

const IPURESULTS_API = 'https://api.ipuresults.com';

/**
 * Fetch the GGSIPU captcha image via the ipuresults proxy.
 * @returns {{ imageBase64: string, sessionId: string }}
 */
export async function fetchCaptcha() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${IPURESULTS_API}/api/captcha`, {
      signal: controller.signal,
      headers: {
        'Accept': 'image/png,image/*,*/*',
        'User-Agent': 'OneCampus/1.0',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Captcha fetch failed: ${response.status}`);
    }

    // Session ID is passed back in a response header
    const sessionId = response.headers.get('x-session-id') || `sess_${Date.now()}`;

    // Convert image bytes → base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return { imageBase64: base64, sessionId };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('GGSIPU server is not responding. Please try again.');
    }
    throw new Error(err.message || 'Failed to fetch captcha');
  }
}

/**
 * Login to GGSIPU portal and fetch all semester results.
 * 
 * @param {string} enrollmentNo   - Student enrollment number
 * @param {string} fathersName    - Father's name (used as GGSIPU password)
 * @param {string} captchaText    - Text from captcha image
 * @param {string} sessionId      - Session ID from fetchCaptcha()
 * @returns {{ studentInfo: object, subjects: array, analytics: object }}
 */
export async function fetchStudentResults(enrollmentNo, fathersName, captchaText, sessionId) {
  // ── Step 1: Login ─────────────────────────────────────────────────────────
  const loginController = new AbortController();
  const loginTimeout = setTimeout(() => loginController.abort(), 30000);

  let loginData;
  try {
    const loginResponse = await fetch(`${IPURESULTS_API}/api/login`, {
      method: 'POST',
      signal: loginController.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OneCampus/1.0',
      },
      body: JSON.stringify({
        enrollmentNumber: enrollmentNo,
        password: fathersName, // raw — ipuresults backend hashes it with SHA256
        captcha: captchaText,
        sessionId,
      }),
    });

    clearTimeout(loginTimeout);
    loginData = await loginResponse.json();

    if (!loginResponse.ok || !loginData.success) {
      // Map common GGSIPU errors to user-friendly messages
      const msg = loginData?.error || '';
      if (msg.toLowerCase().includes('captcha')) {
        throw new Error('Incorrect captcha. Please try again.');
      }
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password')) {
        throw new Error('Invalid enrollment number or father\'s name. Please check and retry.');
      }
      throw new Error(msg || 'GGSIPU login failed. Please try again.');
    }
  } catch (err) {
    clearTimeout(loginTimeout);
    if (err.name === 'AbortError') {
      throw new Error('GGSIPU server timed out. Please try again.');
    }
    throw err;
  }

  const { sessionId: newSessionId, internalMarks = [] } = loginData;
  const activeSession = newSessionId || sessionId;

  // ── Step 2: Fetch Results ─────────────────────────────────────────────────
  const resultsController = new AbortController();
  const resultsTimeout = setTimeout(() => resultsController.abort(), 30000);

  let subjects = [];
  let studentInfo = {};

  try {
    const resultsResponse = await fetch(`${IPURESULTS_API}/api/results`, {
      method: 'POST',
      signal: resultsController.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OneCampus/1.0',
      },
      body: JSON.stringify({ sessionId: activeSession, examValue: '100' }),
    });

    clearTimeout(resultsTimeout);
    const resultsData = await resultsResponse.json();

    console.log('====== SCRAPER RESULTS DATA KEYS ======');
    console.log(Object.keys(resultsData));
    if (resultsData.studentInfo) {
      console.log('studentInfo:', resultsData.studentInfo);
    }
    if (resultsData.subjects && resultsData.subjects.length > 0) {
      console.log('Sample subject keys:', Object.keys(resultsData.subjects[0]));
      console.log('Sample subject:', resultsData.subjects[0]);
    }
    console.log('=======================================');

    if (!resultsResponse.ok || !resultsData.success) {
      throw new Error(resultsData?.error || 'Failed to fetch results from GGSIPU.');
    }

    // Prefer pre-parsed JSON subjects from the API
    if (Array.isArray(resultsData.subjects) && resultsData.subjects.length > 0) {
      subjects = resultsData.subjects.map(s => ({
        semester:      parseInt(s.euno || s.semester || '1', 10) || 1,
        paperCode:     (s.papercode || s.paperCode || '').trim(),
        subjectName:   (s.papername || s.subjectName || '').trim(),
        internal:      parseFloat(s.minorprint || s.internal || '0') || 0,
        external:      parseFloat(s.majorprint || s.external || '0') || 0,
        total:         parseFloat(s.moderatedprint || s.total || '0') || 0,
        credits:       parseFloat(s.credits || '0') || 0,
        grade:         (s.grade || '').trim(),
        examSession:   (s.exam || '').trim(),
        declaredDate:  (s.declareddate || s.declaredDate || '').trim(),
      }));
    } else if (resultsData.html) {
      // Fallback: parse HTML response
      subjects = parseResultsHTML(resultsData.html);
    }

    studentInfo = resultsData.studentInfo || {};
  } catch (err) {
    clearTimeout(resultsTimeout);
    if (err.name === 'AbortError') {
      throw new Error('Results fetch timed out. Please try again.');
    }
    throw err;
  }

  if (subjects.length === 0) {
    throw new Error('No results found. GGSIPU may not have declared results yet.');
  }

  // ── Step 3: Compute Analytics ─────────────────────────────────────────────
  const analytics = computeAnalytics(subjects);

  return { studentInfo, subjects, analytics, internalMarks };
}

/**
 * Compute SGPA per semester and overall CGPA from raw subjects array.
 */
function computeAnalytics(subjects) {
  const semMap = {};

  for (const s of subjects) {
    const sem = s.semester;
    if (!semMap[sem]) semMap[sem] = { subjects: [], creditPoints: 0, totalCredits: 0 };
    semMap[sem].subjects.push(s);

    // Dynamic GGSIPU CBCS Grade Point
    const gp = s.total >= 90 ? 10 : s.total >= 80 ? 9 : s.total >= 70 ? 8 : s.total >= 60 ? 7 : s.total >= 50 ? 6 : s.total >= 45 ? 5 : s.total >= 40 ? 4 : 0;
    
    // Dynamic GGSIPU Credits
    const credits = s.credits > 0 ? s.credits : (() => {
      const code = (s.paperCode || '').toUpperCase();
      const name = (s.subjectName || '').toUpperCase();
      const numMatch = code.match(/\d+/);
      const num = numMatch ? parseInt(numMatch[0], 10) : null;
      if (num !== null && num % 100 >= 50) return 1; // Labs
      if (name.includes('LAB') || name.includes('PRACTICAL') || name.includes('WORKSPACE')) return 1;
      if (name.includes('GRAPHICS') || name.includes('WORKSHOP') || name.includes('DRAWING')) return 2;
      if (name.includes('CONSTITUTION') || name.includes('VALUES') || name.includes('ETHICS') || name.includes('ENVIRONMENTAL') || name.includes('KNOWLEDGE SYSTEM')) return 2;
      return 4; // Theory
    })();

    semMap[sem].creditPoints += gp * credits;
    semMap[sem].totalCredits += credits;
    
    // Update the scraped object with proper credits and grade
    s.credits = credits;
    s.grade = s.total >= 90 ? 'O' : s.total >= 80 ? 'A+' : s.total >= 70 ? 'A' : s.total >= 60 ? 'B+' : s.total >= 50 ? 'B' : s.total >= 45 ? 'C' : s.total >= 40 ? 'P' : 'F';
  }

  const semesterWise = {};
  let overallCreditPoints = 0;
  let overallCredits = 0;

  for (const [sem, data] of Object.entries(semMap)) {
    const totalMarks = data.subjects.reduce((a, s) => a + s.total, 0);
    const maxMarks = data.subjects.length * 100;
    const sgpa = data.totalCredits > 0
      ? parseFloat((data.creditPoints / data.totalCredits).toFixed(2))
      : parseFloat(((totalMarks / maxMarks) * 10).toFixed(2));

    semesterWise[sem] = {
      subjects: data.subjects,
      sgpa,
      totalMarks,
      maxMarks,
      totalCredits: data.totalCredits,
    };

    overallCreditPoints += data.creditPoints;
    overallCredits += data.totalCredits;
  }

  const cgpa = overallCredits > 0
    ? parseFloat((overallCreditPoints / overallCredits).toFixed(2))
    : 0;

  return { semesterWise, cgpa };
}

/**
 * Fallback HTML parser using cheerio (if API returns raw HTML).
 */
async function parseResultsHTML(html) {
  const { load } = await import('cheerio');
  const $ = load(html);
  const subjects = [];

  $('table tr').each((i, row) => {
    if (i === 0) return; // skip header
    const cells = $(row).find('td');
    if (cells.length < 4) return;
    subjects.push({
      semester:    parseInt($(cells[0]).text().trim(), 10) || 1,
      paperCode:   $(cells[1]).text().trim(),
      subjectName: $(cells[2]).text().trim(),
      internal:    parseFloat($(cells[3]).text().trim()) || 0,
      external:    parseFloat($(cells[4]).text().trim()) || 0,
      total:       parseFloat($(cells[5]).text().trim()) || 0,
      credits:     0,
      grade:       $(cells[6]).text().trim() || '',
      examSession: '',
      declaredDate: '',
    });
  });

  return subjects;
}
