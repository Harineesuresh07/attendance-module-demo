import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import {
  ServiceError,
  studentCheckIn,
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  getSessionAttendance,
  getStudentAttendance,
  getBatchAttendanceStats,
  exportSessionAttendanceCsv,
  generateQRToken,
} from '../services/attendance.service';

function handleServiceError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof ServiceError) {
    return sendError(res, err.message, err.statusCode);
  }
  next(err);
}

export async function checkInHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.body.studentId || String(req.params.studentId);
    const result = await studentCheckIn(req.body.sessionId, studentId, req.body.qrToken);
    return sendSuccess(res, result, 201);
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

export async function markAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId, studentId, status, remarks } = req.body;
    const result = await markAttendance(sessionId, studentId, status, remarks);
    return sendSuccess(res, result, 201);
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

export async function bulkMarkHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId, records } = req.body;
    const result = await bulkMarkAttendance(sessionId, records);
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

export async function updateAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await updateAttendance(String(req.params.id), req.body);
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

export async function getSessionAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getSessionAttendance(String(req.params.sessionId));
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

export async function getStudentAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: { batchId?: string; from?: string; to?: string } = {};
    if (req.query.batchId) filters.batchId = String(req.query.batchId);
    if (req.query.from) filters.from = String(req.query.from);
    if (req.query.to) filters.to = String(req.query.to);
    const result = await getStudentAttendance(String(req.params.studentId), filters);
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

export async function getBatchStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getBatchAttendanceStats(String(req.params.batchId));
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

export async function exportCsvHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = String(req.params.sessionId);
    const csv = await exportSessionAttendanceCsv(sessionId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${sessionId}.csv"`);
    return res.send(csv);
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}

export async function generateQRHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = generateQRToken(String(req.params.sessionId));
    return sendSuccess(res, result);
  } catch (err) {
    return handleServiceError(err, res, next);
  }
}
