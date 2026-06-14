import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import requireAdmin from '../middlewares/admin.middleware.js';
import {
  getDashboardStats,
  getTeachers, createTeacher, updateTeacher, deleteTeacher,
  getClasses, createClass, updateClass, deleteClass,
  getClassStudents, addStudentsToClass, removeStudentFromClass,
  assignTeacherToClass, removeTeacherAssignment,
  getSubjects, createSubject, updateSubject, deleteSubject,
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require JWT + admin role
router.use(protect, requireAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// Teachers
router.get('/teachers',          getTeachers);
router.post('/teachers',         createTeacher);
router.put('/teachers/:id',      updateTeacher);
router.delete('/teachers/:id',   deleteTeacher);

// Classes
router.get('/classes',           getClasses);
router.post('/classes',          createClass);
router.put('/classes/:id',       updateClass);
router.delete('/classes/:id',    deleteClass);

// Enrollment
// router.get('/classes/:id/students',                       getClassStudents);
router.post('/classes/:id/students',                      addStudentsToClass);
router.delete('/classes/:id/students/:enrollmentNo',      removeStudentFromClass);

// Teacher Assignments
router.post('/classes/:id/assign-teacher',                assignTeacherToClass);
router.delete('/classes/:id/assign-teacher/:assignmentId', removeTeacherAssignment);

// Subjects
router.get('/subjects',          getSubjects);
router.post('/subjects',         createSubject);
router.put('/subjects/:id',      updateSubject);
router.delete('/subjects/:id',   deleteSubject);

export default router;
