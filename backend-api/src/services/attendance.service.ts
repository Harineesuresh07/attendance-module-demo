import crypto from "crypto";
import prisma from "../lib/prisma";
import { AttendanceStatus } from "@prisma/client";

class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export { ServiceError };

const CHECKIN_CUTOFF_HOUR = 8;
const CHECKIN_CUTOFF_MINUTE = 5;
const QR_ROTATION_SECONDS = 30;

// --- QR Token helpers ---

function getQRSecret(sessionId: string): string {
  const base = process.env.QR_SECRET || "hope-qr-default-secret";
  return crypto.createHmac("sha256", base).update(sessionId).digest("hex");
}

function generateTOTP(secret: string, timeStep: number): string {
  return crypto
    .createHmac("sha256", secret)
    .update(String(timeStep))
    .digest("hex")
    .slice(0, 8);
}

export function generateQRToken(sessionId: string): { token: string; expiresInSeconds: number } {
  const secret = getQRSecret(sessionId);
  const timeStep = Math.floor(Date.now() / 1000 / QR_ROTATION_SECONDS);
  const token = generateTOTP(secret, timeStep);
  const elapsed = (Date.now() / 1000) % QR_ROTATION_SECONDS;
  return { token, expiresInSeconds: Math.floor(QR_ROTATION_SECONDS - elapsed) };
}

function validateQRToken(sessionId: string, token: string): boolean {
  const secret = getQRSecret(sessionId);
  const timeStep = Math.floor(Date.now() / 1000 / QR_ROTATION_SECONDS);
  // Accept current window and the previous one (grace period)
  return (
    generateTOTP(secret, timeStep) === token ||
    generateTOTP(secret, timeStep - 1) === token
  );
}

// --- Time check helpers ---

function isPastCutoff(now: Date): boolean {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours > CHECKIN_CUTOFF_HOUR || (hours === CHECKIN_CUTOFF_HOUR && minutes >= CHECKIN_CUTOFF_MINUTE);
}

// --- Student self-check-in ---

export async function studentCheckIn(
  sessionId: string,
  studentId: string,
  qrToken?: string
) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { batch: { include: { members: true } } },
  });
  if (!session) throw new ServiceError("Session not found", 404);

  const isMember = session.batch.members.some((m) => m.studentId === studentId);
  if (!isMember) throw new ServiceError("Student is not enrolled in this batch", 403);

  if (qrToken && !validateQRToken(sessionId, qrToken)) {
    throw new ServiceError("Invalid or expired QR code", 400);
  }

  const now = new Date();

  if (isPastCutoff(now)) {
    throw new ServiceError(
      "Check-in closed — attendance cutoff is 8:05 AM. Contact your trainer for manual entry.",
      403
    );
  }

  const existing = await prisma.attendance.findUnique({
    where: { sessionId_studentId: { sessionId, studentId } },
  });
  if (existing) throw new ServiceError("Attendance already recorded for this session", 409);

  return prisma.attendance.create({
    data: {
      sessionId,
      studentId,
      status: "PRESENT",
      checkInTime: now,
    },
    include: { student: { select: { id: true, name: true, email: true } }, session: { select: { id: true, title: true } } },
  });
}

// --- Trainer marks single student ---

export async function markAttendance(
  sessionId: string,
  studentId: string,
  status: AttendanceStatus,
  remarks?: string
) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new ServiceError("Session not found", 404);

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) throw new ServiceError("Student not found", 404);

  return prisma.attendance.upsert({
    where: { sessionId_studentId: { sessionId, studentId } },
    update: { status, remarks, checkInTime: status === "PRESENT" || status === "LATE" ? new Date() : null },
    create: {
      sessionId,
      studentId,
      status,
      remarks,
      checkInTime: status === "PRESENT" || status === "LATE" ? new Date() : null,
    },
    include: { student: { select: { id: true, name: true, email: true } }, session: { select: { id: true, title: true } } },
  });
}

// --- Trainer bulk marks a whole session ---

export async function bulkMarkAttendance(
  sessionId: string,
  records: { studentId: string; status: AttendanceStatus; remarks?: string }[]
) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new ServiceError("Session not found", 404);

  const results: { studentId: string; status: string; error?: string }[] = [];

  for (const record of records) {
    try {
      await prisma.attendance.upsert({
        where: { sessionId_studentId: { sessionId, studentId: record.studentId } },
        update: {
          status: record.status,
          remarks: record.remarks,
          checkInTime: record.status === "PRESENT" || record.status === "LATE" ? new Date() : null,
        },
        create: {
          sessionId,
          studentId: record.studentId,
          status: record.status,
          remarks: record.remarks,
          checkInTime: record.status === "PRESENT" || record.status === "LATE" ? new Date() : null,
        },
      });
      results.push({ studentId: record.studentId, status: "success" });
    } catch {
      results.push({ studentId: record.studentId, status: "error", error: "Failed to upsert" });
    }
  }

  const successCount = results.filter((r) => r.status === "success").length;
  return { total: records.length, success: successCount, errors: records.length - successCount, details: results };
}

// --- Update existing record (trainer override) ---

export async function updateAttendance(
  attendanceId: string,
  data: { status?: AttendanceStatus; remarks?: string }
) {
  const existing = await prisma.attendance.findUnique({ where: { id: attendanceId } });
  if (!existing) throw new ServiceError("Attendance record not found", 404);

  const updateData: Record<string, unknown> = {};
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "PRESENT" || data.status === "LATE") {
      updateData.checkInTime = existing.checkInTime ?? new Date();
    }
  }
  if (data.remarks !== undefined) updateData.remarks = data.remarks;

  return prisma.attendance.update({
    where: { id: attendanceId },
    data: updateData,
    include: { student: { select: { id: true, name: true, email: true } }, session: { select: { id: true, title: true } } },
  });
}

// --- Get attendance for a session ---

export async function getSessionAttendance(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { batch: { include: { members: { include: { student: { select: { id: true, name: true, email: true } } } } } } },
  });
  if (!session) throw new ServiceError("Session not found", 404);

  const records = await prisma.attendance.findMany({
    where: { sessionId },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const attendedIds = new Set(records.map((r) => r.studentId));
  const unmarked = session.batch.members
    .filter((m) => !attendedIds.has(m.studentId))
    .map((m) => ({ studentId: m.studentId, student: m.student, status: "NOT_MARKED" as const }));

  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const excused = records.filter((r) => r.status === "EXCUSED").length;
  const total = session.batch.members.length;

  return {
    session: { id: session.id, title: session.title, scheduledDate: session.scheduledDate },
    summary: { total, present, absent, late, excused, unmarked: unmarked.length },
    records,
    unmarked,
  };
}

// --- Get attendance history for a student ---

export async function getStudentAttendance(
  studentId: string,
  filters?: { batchId?: string; from?: string; to?: string }
) {
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) throw new ServiceError("Student not found", 404);

  const where: Record<string, unknown> = { studentId };
  if (filters?.batchId || filters?.from || filters?.to) {
    const sessionFilter: Record<string, unknown> = {};
    if (filters.batchId) sessionFilter.batchId = filters.batchId;
    if (filters.from || filters.to) {
      sessionFilter.scheduledDate = {};
      if (filters.from) (sessionFilter.scheduledDate as Record<string, unknown>).gte = new Date(filters.from);
      if (filters.to) (sessionFilter.scheduledDate as Record<string, unknown>).lte = new Date(filters.to);
    }
    where.session = sessionFilter;
  }

  const records = await prisma.attendance.findMany({
    where,
    include: { session: { select: { id: true, title: true, scheduledDate: true, batch: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const excused = records.filter((r) => r.status === "EXCUSED").length;
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return {
    student: { id: student.id, name: student.name, email: student.email },
    summary: { total, present, late, absent, excused, attendanceRate },
    records,
  };
}

// --- Batch-level attendance stats ---

export async function getBatchAttendanceStats(batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { members: { include: { student: { select: { id: true, name: true, email: true } } } }, sessions: { select: { id: true } } },
  });
  if (!batch) throw new ServiceError("Batch not found", 404);

  const sessionIds = batch.sessions.map((s) => s.id);

  const records = await prisma.attendance.findMany({
    where: { sessionId: { in: sessionIds } },
  });

  const studentStats = batch.members.map((member) => {
    const studentRecords = records.filter((r) => r.studentId === member.studentId);
    const total = sessionIds.length;
    const present = studentRecords.filter((r) => r.status === "PRESENT").length;
    const late = studentRecords.filter((r) => r.status === "LATE").length;
    const absent = studentRecords.filter((r) => r.status === "ABSENT").length;
    const excused = studentRecords.filter((r) => r.status === "EXCUSED").length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { student: member.student, total, present, late, absent, excused, attendanceRate: rate };
  });

  const overallRate =
    studentStats.length > 0
      ? Math.round(studentStats.reduce((sum, s) => sum + s.attendanceRate, 0) / studentStats.length)
      : 0;

  return {
    batch: { id: batch.id, name: batch.name },
    totalSessions: sessionIds.length,
    overallAttendanceRate: overallRate,
    students: studentStats.sort((a, b) => a.attendanceRate - b.attendanceRate),
  };
}

// --- CSV export for a session ---

export async function exportSessionAttendanceCsv(sessionId: string): Promise<string> {
  const data = await getSessionAttendance(sessionId);

  const rows = [["Student Name", "Email", "Status", "Check-In Time", "Remarks"]];

  for (const record of data.records) {
    rows.push([
      record.student.name,
      record.student.email,
      record.status,
      record.checkInTime ? new Date(record.checkInTime).toISOString() : "",
      record.remarks ?? "",
    ]);
  }

  for (const um of data.unmarked) {
    rows.push([um.student.name, um.student.email, "NOT_MARKED", "", ""]);
  }

  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}
