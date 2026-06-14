import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import requireAdmin from '../middlewares/admin.middleware.js';
import * as controller from '../controllers/adminAllocation.controller.js';

const router = express.Router();

// Protect all admin allocation routes
router.use(protect, requireAdmin);

// Student allocation endpoints
router.post('/allocation/preview', controller.previewAllocation);
router.post('/allocation/assign', controller.assignStudents);
router.get('/classes', controller.getClasses);
router.get('/classes/:id/students', controller.getClassStudents);
router.post('/students/transfer', controller.transferStudent);
router.post('/students/remove', controller.removeStudent);

// Faculty allocation endpoints
router.get('/faculty', controller.getFaculty);
router.post('/faculty/assign', controller.assignFaculty);
router.post('/faculty/reassign', controller.reassignFaculty);
router.delete('/faculty/assignment/:id', controller.removeFacultyAssignment);
router.delete('/faculty/:employeeId', controller.deleteFaculty);
router.get('/faculty/assignments', controller.getFacultyAssignments);

// Audit logs audit trail
router.get('/audit-logs', controller.getAuditLogs);

export default router;
