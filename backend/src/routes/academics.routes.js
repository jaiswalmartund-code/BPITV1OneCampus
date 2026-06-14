import express from 'express';
import { getEndSemResults, getMidSemMarks, getCGPA, getRecommendations } from '../controllers/academics.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/endsem',  getEndSemResults);
router.get('/midsem',  getMidSemMarks);
router.get('/cgpa',    getCGPA);
router.get('/recommendations', getRecommendations);

export default router;
