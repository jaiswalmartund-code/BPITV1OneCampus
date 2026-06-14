import express from 'express';
import { getUserProfile } from '../controllers/user.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);

export default router;
