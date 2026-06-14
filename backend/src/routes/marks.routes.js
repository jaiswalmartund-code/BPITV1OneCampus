import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import requireTeacher from '../middlewares/teacher.middleware.js';
import {
  saveMarks,
  updateMarks,
  getMarksByClass,
  getMarksByStudent,
} from '../controllers/teacherPortal.controller.js';

const router = express.Router();

// Public student-viewable or teacher-viewable student marks (requires auth only)
router.get('/student/:id', protect, getMarksByStudent);

// Teacher-only operations
router.post('/save', protect, requireTeacher, saveMarks);
router.put('/update', protect, requireTeacher, updateMarks);
router.get('/class/:id', protect, requireTeacher, getMarksByClass);

export default router;
