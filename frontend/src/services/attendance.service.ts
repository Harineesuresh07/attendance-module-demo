import axios from "axios";

const API = "/api/attendance";

export interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks?: string;
}

export async function getSessionAttendance(sessionId: string) {
  const res = await axios.get(`${API}/session/${sessionId}`);
  return res.data;
}

export async function markAttendance(
  sessionId: string,
  studentId: string,
  status: string,
  remarks?: string
) {
  const res = await axios.post(`${API}/mark`, { sessionId, studentId, status, remarks });
  return res.data;
}

export async function bulkMarkAttendance(sessionId: string, records: AttendanceRecord[]) {
  const res = await axios.post(`${API}/bulk`, { sessionId, records });
  return res.data;
}

export async function updateAttendance(id: string, data: { status?: string; remarks?: string }) {
  const res = await axios.put(`${API}/${id}`, data);
  return res.data;
}

export async function getStudentAttendance(
  studentId: string,
  params?: { batchId?: string; from?: string; to?: string }
) {
  const res = await axios.get(`${API}/student/${studentId}`, { params });
  return res.data;
}

export async function getBatchAttendanceStats(batchId: string) {
  const res = await axios.get(`${API}/batch/${batchId}/stats`);
  return res.data;
}

export async function exportSessionCsv(sessionId: string) {
  const res = await axios.get(`${API}/session/${sessionId}/export`, { responseType: "blob" });
  return res.data;
}

export async function getSessionQR(sessionId: string) {
  const res = await axios.get(`${API}/session/${sessionId}/qr`);
  return res.data;
}

export async function studentCheckIn(sessionId: string, qrToken?: string) {
  const res = await axios.post(`${API}/check-in`, { sessionId, qrToken });
  return res.data;
}
