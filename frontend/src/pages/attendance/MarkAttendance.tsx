import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getSessionAttendance,
  bulkMarkAttendance,
  type AttendanceRecord,
} from "../../services/attendance.service";

type Status = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface StudentRow {
  studentId: string;
  name: string;
  email: string;
  status: Status;
  remarks: string;
  saved: boolean;
}

export default function MarkAttendance() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [sessionTitle, setSessionTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    loadAttendance();
  }, [sessionId]);

  async function loadAttendance() {
    setLoading(true);
    try {
      const res = await getSessionAttendance(sessionId!);
      const data = res.data;
      setSessionTitle(data.session?.title || "");

      const studentRows: StudentRow[] = [];

      for (const rec of data.records || []) {
        studentRows.push({
          studentId: rec.student.id,
          name: rec.student.name,
          email: rec.student.email,
          status: rec.status,
          remarks: rec.remarks || "",
          saved: true,
        });
      }

      for (const um of data.unmarked || []) {
        studentRows.push({
          studentId: um.studentId,
          name: um.student.name,
          email: um.student.email,
          status: "ABSENT",
          remarks: "",
          saved: false,
        });
      }

      setRows(studentRows.sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      setMessage("Failed to load attendance data");
    }
    setLoading(false);
  }

  function updateRow(idx: number, field: "status" | "remarks", value: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value, saved: false } : r))
    );
  }

  function markAllAs(status: Status) {
    setRows((prev) => prev.map((r) => ({ ...r, status, saved: false })));
  }

  async function handleSubmit() {
    if (!sessionId) return;
    setSaving(true);
    setMessage("");

    const records: AttendanceRecord[] = rows
      .filter((r) => !r.saved)
      .map((r) => ({
        studentId: r.studentId,
        status: r.status,
        remarks: r.remarks || undefined,
      }));

    if (records.length === 0) {
      setMessage("No changes to save.");
      setSaving(false);
      return;
    }

    try {
      const res = await bulkMarkAttendance(sessionId, records);
      const data = res.data;
      setMessage(`Saved: ${data.success} of ${data.total} records.`);
      await loadAttendance();
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Failed to save attendance");
    }
    setSaving(false);
  }

  const summary = {
    total: rows.length,
    present: rows.filter((r) => r.status === "PRESENT").length,
    absent: rows.filter((r) => r.status === "ABSENT").length,
    late: rows.filter((r) => r.status === "LATE").length,
    excused: rows.filter((r) => r.status === "EXCUSED").length,
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading attendance...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Mark Attendance</h1>
          {sessionTitle && <p className="text-gray-600">{sessionTitle}</p>}
        </div>
        <Link to={`/attendance/session/${sessionId}`} className="text-blue-600 hover:underline">
          View Report
        </Link>
      </div>

      {/* Summary bar */}
      <div className="flex gap-4 mb-4 text-sm">
        <span className="bg-gray-100 px-3 py-1 rounded">Total: {summary.total}</span>
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded">Present: {summary.present}</span>
        <span className="bg-red-100 text-red-800 px-3 py-1 rounded">Absent: {summary.absent}</span>
        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded">Late: {summary.late}</span>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">Excused: {summary.excused}</span>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => markAllAs("PRESENT")} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
          Mark All Present
        </button>
        <button onClick={() => markAllAs("ABSENT")} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
          Mark All Absent
        </button>
      </div>

      {/* Attendance table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-600">
              <th className="px-4 py-3 w-8">#</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.studentId}
                className={`border-t text-sm ${!row.saved ? "bg-yellow-50" : ""}`}
              >
                <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                <td className="px-4 py-2 font-medium">{row.name}</td>
                <td className="px-4 py-2 text-gray-500">{row.email}</td>
                <td className="px-4 py-2">
                  <select
                    value={row.status}
                    onChange={(e) => updateRow(idx, "status", e.target.value)}
                    className={`border rounded px-2 py-1 text-sm ${
                      row.status === "PRESENT"
                        ? "text-green-700 bg-green-50"
                        : row.status === "ABSENT"
                        ? "text-red-700 bg-red-50"
                        : row.status === "LATE"
                        ? "text-yellow-700 bg-yellow-50"
                        : "text-blue-700 bg-blue-50"
                    }`}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={row.remarks}
                    onChange={(e) => updateRow(idx, "remarks", e.target.value)}
                    placeholder="Optional remarks..."
                    className="border rounded px-2 py-1 text-sm w-full"
                    maxLength={500}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit */}
      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Attendance"}
        </button>
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </div>
  );
}
