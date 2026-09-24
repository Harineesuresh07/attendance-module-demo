import Joi from 'joi';

export const checkInSchema = Joi.object({
  sessionId: Joi.string().uuid().required()
    .messages({ 'string.guid': 'sessionId must be a valid UUID' }),
  qrToken: Joi.string().min(1).optional(),
});

export const markAttendanceSchema = Joi.object({
  sessionId: Joi.string().uuid().required()
    .messages({ 'string.guid': 'sessionId must be a valid UUID' }),
  studentId: Joi.string().uuid().required()
    .messages({ 'string.guid': 'studentId must be a valid UUID' }),
  status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'EXCUSED').required()
    .messages({ 'any.only': 'status must be one of PRESENT, ABSENT, LATE, EXCUSED' }),
  remarks: Joi.string().max(500).optional(),
});

export const bulkMarkAttendanceSchema = Joi.object({
  sessionId: Joi.string().uuid().required()
    .messages({ 'string.guid': 'sessionId must be a valid UUID' }),
  records: Joi.array().items(
    Joi.object({
      studentId: Joi.string().uuid().required()
        .messages({ 'string.guid': 'studentId must be a valid UUID' }),
      status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'EXCUSED').required()
        .messages({ 'any.only': 'status must be one of PRESENT, ABSENT, LATE, EXCUSED' }),
      remarks: Joi.string().max(500).optional(),
    })
  ).min(1).required()
    .messages({ 'array.min': 'At least one attendance record is required' }),
});

export const updateAttendanceSchema = Joi.object({
  status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'EXCUSED').optional()
    .messages({ 'any.only': 'status must be one of PRESENT, ABSENT, LATE, EXCUSED' }),
  remarks: Joi.string().max(500).optional(),
});
