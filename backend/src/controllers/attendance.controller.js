import Attendance from '../models/attendance.model.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance/summary
// Overall attendance % per subject for the logged-in student
// ─────────────────────────────────────────────────────────────────────────────
export const getAttendanceSummary = async (req, res, next) => {
  try {
    const records = await Attendance.find({
      student: req.user._id,
      status: { $in: ['Present', 'Absent', 'Late'] },
    }).lean();

    if (records.length === 0) {
      return res.json({ subjects: [], overall: { percent: 0, attended: 0, total: 0 } });
    }

    // Group by subject
    const subjectMap = {};
    for (const r of records) {
      const key = r.subjectCode;
      if (!subjectMap[key]) {
        subjectMap[key] = { subjectCode: key, subject: r.subject, attended: 0, total: 0 };
      }
      subjectMap[key].total += 1;
      if (r.status === 'Present' || r.status === 'Late') {
        subjectMap[key].attended += 1;
      }
    }

    const subjects = Object.values(subjectMap).map(s => ({
      ...s,
      percent: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
    }));

    const overallAttended = subjects.reduce((a, s) => a + s.attended, 0);
    const overallTotal = subjects.reduce((a, s) => a + s.total, 0);

    res.json({
      subjects: subjects.sort((a, b) => a.percent - b.percent),
      overall: {
        percent: overallTotal > 0 ? Math.round((overallAttended / overallTotal) * 100) : 0,
        attended: overallAttended,
        total: overallTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance/calendar?subject=ETCS301&month=6&year=2025
// Per-subject monthly calendar data
// ─────────────────────────────────────────────────────────────────────────────
export const getAttendanceCalendar = async (req, res, next) => {
  try {
    const { subject, month, year } = req.query;

    if (!subject || !month || !year) {
      res.status(400);
      throw new Error('subject, month, and year query params are required.');
    }

    const startDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const endDate   = new Date(parseInt(year, 10), parseInt(month, 10), 0, 23, 59, 59);

    const records = await Attendance.find({
      student:     req.user._id,
      subjectCode: subject,
      date:        { $gte: startDate, $lte: endDate },
    }).lean();

    // Map date → status
    const calendar = {};
    for (const r of records) {
      const day = new Date(r.date).getDate();
      calendar[day] = r.status;
    }

    // Mark weekends as 'Weekend' if not already in records
    const daysInMonth = endDate.getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, d);
      const dayOfWeek = date.getDay();
      if ((dayOfWeek === 0 || dayOfWeek === 6) && !calendar[d]) {
        calendar[d] = 'Weekend';
      }
    }

    res.json({ calendar, subject, month: parseInt(month, 10), year: parseInt(year, 10) });
  } catch (error) {
    next(error);
  }
};
