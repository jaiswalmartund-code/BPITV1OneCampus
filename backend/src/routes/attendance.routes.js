import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import requireTeacher from '../middlewares/teacher.middleware.js';
import {
  getAttendanceSummary,
  getAttendanceCalendar
} from '../controllers/attendance.controller.js';
import {
  saveAttendance,
  getAttendance,
  updateAttendance,
} from '../controllers/teacherPortal.controller.js';

const router = express.Router();

// Student routes (requires protect only)
router.get('/summary', protect, getAttendanceSummary);
router.get('/calendar', protect, getAttendanceCalendar);

// Teacher routes (requires protect + requireTeacher)
router.post('/save', protect, requireTeacher, saveAttendance);
router.get('/:classId', protect, requireTeacher, getAttendance);
router.put('/update', protect, requireTeacher, updateAttendance);

export default router;
