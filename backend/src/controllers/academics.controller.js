import ExamScore from '../models/examScore.model.js';
import MidSemMark from '../models/midSemMark.model.js';
import SyllabusRecommendation from '../models/syllabusRecommendation.model.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for GGSIPU CBCS calculations
// ─────────────────────────────────────────────────────────────────────────────
const getPaperCredits = (paperCode) => {
  const code = (paperCode || '').toUpperCase().trim();
  const creditsMap = {
    // Semester 1
    'BS103': 2, 'BS105': 3, 'ES107': 4, 'BS111': 4, 'HS113': 4, 'ES119': 4,
    'BS151': 1, 'BS155': 1, 'ES157': 1, 'ES159': 1,
    // Semester 2
    'BS106': 2, 'BS110': 4, 'BS112': 2, 'HS116': 2, 'HS118': 2,
    'BS152': 2, 'ES154': 1, 'ES158': 1, 'BS162': 1, 'ES164': 2, 'ES114': 2, 'ES102': 4,
    // Semester 3
    'ES201': 2, 'HS203': 2, 'ECC205': 2, 'ECC207': 4, 'ECC209': 4, 'ECC211': 4,
    'ES251': 2, 'ECC253': 1, 'ECC255': 2, 'ECC257': 1, 'ECC259': 2
  };
  return creditsMap[code];
};

const getGP = (total) => {
  if (total >= 90) return 10;
  if (total >= 75) return 9;
  if (total >= 65) return 8;
  if (total >= 55) return 7;
  if (total >= 50) return 6;
  if (total >= 45) return 5;
  if (total >= 40) return 4;
  return 0;
};

const calculateAcademicStats = (scores) => {
  const semMap = {};
  for (const s of scores) {
    const sem = s.semester;
    if (!semMap[sem]) {
      semMap[sem] = { semester: sem, totalCredits: 0, creditPoints: 0, subjects: [] };
    }

    const credits = getPaperCredits(s.paperCode) || s.credits || (() => {
      const code = (s.paperCode || '').toUpperCase();
      const name = (s.subjectName || '').toUpperCase();
      const numMatch = code.match(/\d+/);
      const num = numMatch ? parseInt(numMatch[0], 10) : null;
      if (num !== null && num % 100 >= 50) return 1;
      if (name.includes('LAB') || name.includes('PRACTICAL') || name.includes('WORKSPACE')) return 1;
      if (name.includes('GRAPHICS') || name.includes('WORKSHOP') || name.includes('DRAWING')) return 2;
      if (name.includes('CONSTITUTION') || name.includes('VALUES') || name.includes('ETHICS') || name.includes('ENVIRONMENTAL') || name.includes('KNOWLEDGE SYSTEM')) return 2;
      return 4;
    })();

    const gp = getGP(s.total);
    semMap[sem].totalCredits += credits;
    semMap[sem].creditPoints += gp * credits;

    // Attach dynamic fields
    s.credits = credits;
    s.grade = s.total >= 90 ? 'O' : s.total >= 75 ? 'A+' : s.total >= 65 ? 'A' : s.total >= 55 ? 'B+' : s.total >= 50 ? 'B' : s.total >= 45 ? 'C' : s.total >= 40 ? 'P' : 'F';
    semMap[sem].subjects.push(s);
  }

  const sgpaList = [];
  let overallCreditPoints = 0;
  let overallCredits = 0;

  for (const [sem, data] of Object.entries(semMap)) {
    const sgpa = data.totalCredits > 0 ? parseFloat((data.creditPoints / data.totalCredits).toFixed(3)) : 0;
    sgpaList.push({
      semester: parseInt(sem, 10),
      sgpa,
      totalCredits: data.totalCredits,
      subjects: data.subjects
    });
    overallCreditPoints += data.creditPoints;
    overallCredits += data.totalCredits;
  }

  sgpaList.sort((a, b) => a.semester - b.semester);
  const cgpa = overallCredits > 0 ? parseFloat((overallCreditPoints / overallCredits).toFixed(3)) : 0;

  return { cgpa, sgpaList };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/academics/endsem
// All end-sem results for the logged-in student, grouped by semester
// ─────────────────────────────────────────────────────────────────────────────
export const getEndSemResults = async (req, res, next) => {
  try {
    const scores = await ExamScore.find({ student: req.user._id })
      .sort({ semester: 1, paperCode: 1 })
      .lean();

    if (scores.length === 0) {
      return res.json({ semesters: [], totalSemesters: 0 });
    }

    const { sgpaList } = calculateAcademicStats(scores);

    res.json({
      semesters: sgpaList,
      totalSemesters: sgpaList.length,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/academics/midsem
// Mid-sem marks for the logged-in student
// ─────────────────────────────────────────────────────────────────────────────
export const getMidSemMarks = async (req, res, next) => {
  try {
    const marks = await MidSemMark.find({ student: req.user._id })
      .sort({ examType: 1, subject: 1 })
      .lean();

    const grouped = {};
    for (const mark of marks) {
      const key = mark.examType;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(mark);
    }

    res.json({ marks: grouped, total: marks.length });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/academics/cgpa
// SGPA per semester + overall CGPA
// ─────────────────────────────────────────────────────────────────────────────
export const getCGPA = async (req, res, next) => {
  try {
    const scores = await ExamScore.find({ student: req.user._id })
      .sort({ semester: 1 })
      .lean();

    if (scores.length === 0) {
      return res.json({ cgpa: 0, sgpaList: [], message: 'No results found yet.' });
    }

    const { cgpa, sgpaList } = calculateAcademicStats(scores);
    res.json({ cgpa, sgpaList });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/academics/recommendations
// Returns syllabus recommendations for the student's branch + semester
// ─────────────────────────────────────────────────────────────────────────────
export const getRecommendations = async (req, res, next) => {
  try {
    const branch  = (req.user?.branch  || 'ECE').toUpperCase();
    const semester = req.user?.semester || 4;

    const recs = await SyllabusRecommendation.find({ branch, semester })
      .select('-__v -createdAt -updatedAt')
      .lean();

    // Return as a map keyed by subjectCode for O(1) lookup on frontend
    const map = {};
    
    // Built-in aliases map to handle variation in teacher-created subject codes
    const aliasesMap = {
      'BS202': ['PSLP'],
      'ECC210': ['MICROPROCE', 'MICROPROCESSORS', 'MICROPROCESSOR', 'MPMC'],
      'EEC206': ['NETWORK', 'NAS', 'NETWORKSYNTHESIS'],
      'ECC212': ['DIGITAL', 'DC', 'COMMUNICATION', 'DIGITALCOMMUNICATIONS'],
      'ECC214': ['ANALOG', 'AE2', 'ANALOG2', 'ANALOGELECTRONICS2'],
      'ECC213': ['ELECTROMAGNETIC', 'EMFT'],
      'HS204': ['TECHNICAL', 'TW', 'TECHNICALWRITING'],
      'BBA102': ['MARKETING', 'MM', 'MARKETINGMANAGEMENT'],
      'BBA104': ['DECISION', 'DTB', 'DECISIONTECHNIQUES'],
      'BBA106': ['HUMAN', 'HRM', 'HUMANRESOURCEMANAGEMENT'],
      'BBA108': ['BUSINESS', 'BC', 'BUSINESSCOMMUNICATION'],
      'BBA112': ['ECOMMERCE', 'EC'],
      'BBA118': ['INDIAN', 'IKS', 'INDIANKNOWLEDGE'],
    };

    for (const rec of recs) {
      const code = rec.subjectCode.toUpperCase();
      map[code] = rec;
      
      const cleanCode = code.replace(/[-\s]/g, '');
      map[cleanCode] = rec;

      const aliases = aliasesMap[cleanCode] || [];
      for (const alias of aliases) {
        map[alias.toUpperCase()] = rec;
      }
    }

    res.json({ recommendations: map, count: recs.length });
  } catch (error) {
    next(error);
  }
};

