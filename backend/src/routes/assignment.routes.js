import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import requireTeacher from '../middlewares/teacher.middleware.js';
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByClass,
  getAssignmentSubmissions,
  reviewSubmission,
} from '../controllers/teacherPortal.controller.js';

const router = express.Router();

// Apply auth + teacher checks on all assignment routes
router.use(protect, requireTeacher);

router.post('/create', createAssignment);
router.put('/update', updateAssignment);
router.delete('/:id', deleteAssignment);
router.get('/class/:id', getAssignmentsByClass);
router.get('/:id/submissions', getAssignmentSubmissions);
router.post('/review', reviewSubmission);

export default router;
