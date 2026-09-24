import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import {
  checkInSchema,
  markAttendanceSchema,
  bulkMarkAttendanceSchema,
  updateAttendanceSchema,
} from '../validators/attendance.validator';
import {
  checkInHandler,
  markAttendanceHandler,
  bulkMarkHandler,
  updateAttendanceHandler,
  getSessionAttendanceHandler,
  getStudentAttendanceHandler,
  getBatchStatsHandler,
  exportCsvHandler,
  generateQRHandler,
} from '../controllers/attendance.controller';

const router = Router();

// Student self-check-in (8:05 AM cutoff enforced server-side)
router.post('/check-in', validate(checkInSchema), checkInHandler);

// Trainer marks single student
router.post('/mark', validate(markAttendanceSchema), markAttendanceHandler);

// Trainer bulk marks entire session
router.post('/bulk', validate(bulkMarkAttendanceSchema), bulkMarkHandler);

// Trainer updates existing record (override — e.g. late student marked PRESENT for valid reason)
router.put('/:id', validate(updateAttendanceSchema), updateAttendanceHandler);

// Get all attendance for a session (includes unmarked students)
router.get('/session/:sessionId', getSessionAttendanceHandler);

// Get attendance history for a student (supports ?batchId=&from=&to= filters)
router.get('/student/:studentId', getStudentAttendanceHandler);

// Get batch-level attendance stats
router.get('/batch/:batchId/stats', getBatchStatsHandler);

// Export session attendance as CSV
router.get('/session/:sessionId/export', exportCsvHandler);

// Generate time-rotating QR token for a session (trainer calls this)
router.get('/session/:sessionId/qr', generateQRHandler);

export default router;
