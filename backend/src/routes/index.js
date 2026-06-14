import express from 'express';
import authRoutes            from './auth.routes.js';
import academicsRoutes       from './academics.routes.js';
import attendanceRoutes      from './attendance.routes.js';
import deadlinesRoutes       from './deadlines.routes.js';
import teacherRoutes         from './teacher.routes.js';
import adminRoutes           from './admin.routes.js';
import adminAllocationRoutes from './adminAllocation.routes.js';
import userRoutes            from './user.routes.js';
import marksRoutes           from './marks.routes.js';
import assignmentRoutes      from './assignment.routes.js';

const router = express.Router();

// Public & auth routes
router.use('/auth',       authRoutes);

// Student routes
router.use('/academics',  academicsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/deadlines',  deadlinesRoutes);
router.use('/user',       userRoutes);
router.use('/marks',      marksRoutes);
router.use('/assignment', assignmentRoutes);

// Teacher routes (login public, operations protected)
router.use('/teacher',    teacherRoutes);

// Admin routes — both admin.routes and adminAllocation.routes share /api/admin prefix
// They have non-overlapping paths so this is safe
router.use('/admin',      adminRoutes);
router.use('/admin',      adminAllocationRoutes);

export default router;

