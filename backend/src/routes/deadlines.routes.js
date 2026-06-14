import express from 'express';
import { getDeadlines, createDeadline, toggleDeadline, deleteDeadline, submitAssignment } from '../controllers/deadlines.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/',        getDeadlines);
router.post('/',       createDeadline);
router.patch('/:id/toggle', toggleDeadline);
router.delete('/:id',  deleteDeadline);
router.post('/:id/submit', submitAssignment);

export default router;
