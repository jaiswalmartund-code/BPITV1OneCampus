import express from 'express';
import {
  getCaptcha,
  studentLogin,
  teacherLogin,
  adminLogin,
  getMe,
  registerUser,
} from '../controllers/auth.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/captcha', getCaptcha);
router.post('/login', studentLogin);
router.post('/teacher-login', teacherLogin);
router.post('/admin-login', adminLogin);
router.post('/register', registerUser);
router.get('/me', protect, getMe);


export default router;
