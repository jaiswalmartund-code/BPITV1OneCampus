import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import requireTeacher from '../middlewares/teacher.middleware.js';
import { teacherLogin } from '../controllers/auth.controller.js';
import {
  getClasses,
  getClassStudents,
  saveGeneralRemark,
  getGeneralRemarks,
} from '../controllers/teacherPortal.controller.js';
import {
  getMyClasses,
  getClassStudents as getTeacherClassStudents,
  markBulkAttendance,
  updateAttendance,
  addMidSemMarks,
  updateMidSemMark,
  createClassDeadline,
  deleteClassDeadline,
} from '../controllers/teacher.controller.js';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
// Teacher login (public endpoint)
router.post('/login', teacherLogin);

// ── Protected Teacher Routes ──────────────────────────────────────────────────
// All below require auth + teacher role
router.use(protect, requireTeacher);

// Classes — use teacherPortal getClasses which returns the correct shape for TeacherPortal.jsx
// (className, subject, subjectCode, studentCount)
router.get('/classes',                  getClasses);
router.get('/class/:id/students',       getTeacherClassStudents);

// Attendance
router.post('/attendance/bulk',         markBulkAttendance);
router.put('/attendance/:id',           updateAttendance);

// Mid-Sem Marks
router.post('/marks/midsem',            addMidSemMarks);
router.put('/marks/midsem/:id',         updateMidSemMark);

// Deadlines
router.post('/deadlines',               createClassDeadline);
router.delete('/deadlines/:id',         deleteClassDeadline);

// Remarks
router.post('/remarks',                 saveGeneralRemark);
router.get('/remarks/:studentId',       getGeneralRemarks);

export default router;

