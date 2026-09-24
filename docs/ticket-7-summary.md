# Ticket 7 — Attendance Module Summary

**Module:** 5 — Attendance Module  
**Branch:** `ticket-7-attendance`  
**Owners:** Sree Harini + Harinee S  
**Date Started:** 2026-09-24  

---

## Overview

Server-time-locked attendance check-in (closes 8:05 AM), prevents tampering. Time-rotating QR code scan (30s TOTP) or manual entry. Trainers can override status for valid reasons (e.g. bus late). Export attendance reports as CSV.

**Dependencies:** Module 1 (DB Schema), Module 2 (Auth & RBAC), Module 4 (Batch & Session Mgmt)

---

## Detailed Changelog (Chronological)

### Phase 1: Branch Setup & Initial Merge

**Problem:** The `ticket-7-attendance` branch was created early and was **4 commits behind main**. All skeleton files (`server.ts`, `attendance.routes.ts`, `schema.prisma`, `config/index.ts`, etc.) were **empty** because the branch was created before the assessment module and schema were merged.

**Missing from branch:**
- `d32f780` — feat: complete prisma schema design
- `877c535` — feat: implement Module 6 — Assessment & Performance Capture
- `8afab21` — Merge PR #3 (ticket-8-assessment-module)
- `187faa4` — Merge PR #4 (ticket-1)

**Resolution:** Ran `git merge main` (fast-forward) to bring in the Prisma schema, assessment module (reference implementation), shared utilities (`response.ts`, `error.middleware.ts`, `validate.middleware.ts`, `lib/prisma.ts`), and test infrastructure.

---

### Phase 2: Initial Backend Implementation

Built the attendance module following the **assessment module pattern** (validators → services → controllers → routes):

**Files created:**
1. `backend-api/src/validators/attendance.validator.ts` — Zod schemas for checkIn, markAttendance, bulkMark, updateAttendance
2. `backend-api/src/services/attendance.service.ts` — Full business logic (8:05 AM cutoff, QR TOTP, CRUD, stats, CSV export)
3. `backend-api/src/controllers/attendance.controller.ts` — 10 request handlers using `success()`/`error()` from `utils/response.ts`
4. `backend-api/src/routes/attendance.routes.ts` — All 9 endpoints
5. `backend-api/src/server.ts` — Added `import attendanceRoutes` and `app.use("/api/attendance", attendanceRoutes)`

**Original patterns used (pre-merge):**
- Validation: Zod (`z.object()`, `z.string().uuid()`, `z.enum()`)
- Response helpers: `success(res, data, statusCode)` and `error(res, message, statusCode)`
- Imports: double quotes (`"express"`)
- Prisma client: `import prisma from "../lib/prisma"`

---

### Phase 3: Second Merge — Team Completed Their Tickets

**Problem:** While we were building, other team members completed and merged their tickets into main:
- `30a93d8` — Implement authentication and RBAC (Module 2)
- `c9ae115` — fix: consolidate prisma directory after ticket-1 and ticket-4 merge
- `b2a1276` — feat: implement Module 4 — Batch & Session Management
- `d8213a6` — Merge ticket-2-and-3 into main: Auth, RBAC & User Management
- `a538b58` — **Standardize backend validation (Zod → Joi)** and response helpers; add TESTS.md
- `cfeb68d` — Merge ticket-6: Batch & Session Management
- `dddfa5f` — Add tests for Batch & Session Management module

This introduced **7 new commits** with major breaking changes to our code.

**Issue 1: Stash required before merge**
```
error: Your local changes to the following files would be overwritten by merge:
    backend-api/src/server.ts
Please commit your changes or stash them before you merge.
```
**Resolution:** Ran `git stash -u -m "attendance module work in progress"`, then merged, then `git stash pop`.

**Issue 2: Merge conflict in `server.ts`**

The stash pop produced a conflict because both our code and the team's code modified `server.ts`:

```
<<<<<<< Updated upstream (team's version)
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { logger } from './utils/logger';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import batchRoutes from './routes/batches.routes';
import sessionRoutes from './routes/sessions.routes';
=======
import express from "express";
import cors from "cors";
import assessmentRoutes from "./routes/assessments.routes";
import attendanceRoutes from "./routes/attendance.routes";
>>>>>>> Stashed changes (our version)
```

**Resolution:** Manually resolved — kept the team's full server setup (auth, cookie-parser, rate limiting, config, logger, all their routes) and added our attendance route import + mount:
```typescript
import attendanceRoutes from './routes/attendance.routes';
// ...
app.use('/api/attendance', attendanceRoutes);
```

**Issue 3: Zod → Joi migration**

The team standardized all validation from **Zod to Joi** in commit `a538b58`. Our validators used Zod:
```typescript
// OLD (our code)
import { z } from "zod";
export const checkInSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
});
```

**Resolution:** Completely rewrote `validators/attendance.validator.ts` to use Joi:
```typescript
// NEW (aligned with team)
import Joi from 'joi';
export const checkInSchema = Joi.object({
  sessionId: Joi.string().uuid().required()
    .messages({ 'string.guid': 'sessionId must be a valid UUID' }),
});
```

**Issue 4: Response utility function rename**

The team renamed response helpers in `utils/response.ts`:
- `success()` → `sendSuccess()`
- `error()` → `sendError()`
- Added new `sendPaginated()` function

Our controller imported the old names:
```typescript
// OLD
import { success, error } from "../utils/response";
```

**Resolution:** Updated all imports and usages in `controllers/attendance.controller.ts`:
```typescript
// NEW
import { sendSuccess, sendError } from '../utils/response';
```
Replaced all 7 occurrences of `success(res,` → `sendSuccess(res,` and 1 occurrence of `error(res,` → `sendError(res,`.

**Issue 5: Express v5 `req.params` type change**

TypeScript flagged 6 errors in our controller:
```
error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.
```

Express v5 types return `string | string[]` for `req.params` values. The team's batches controller handled this by wrapping with `String()`.

**Resolution:** Wrapped all `req.params` accesses with `String()`:
```typescript
// OLD
const result = await updateAttendance(req.params.id, req.body);
// NEW
const result = await updateAttendance(String(req.params.id), req.body);
```
Fixed in 6 places across the controller.

**Issue 6: Quote style inconsistency**

The team uses **single quotes** (`'express'`), our original code used **double quotes** (`"express"`).

**Resolution:** Updated all attendance files to use single quotes for consistency with the team's codebase. Affected files:
- `validators/attendance.validator.ts`
- `controllers/attendance.controller.ts`
- `routes/attendance.routes.ts`

**Issue 7: TypeScript 7 `moduleResolution` deprecation (pre-existing)**

```
tsconfig.json(17,25): error TS5108: Option 'moduleResolution=node10' has been removed.
```

The `tsconfig.json` had `"moduleResolution": "node"` which is an alias for `"node10"` — removed in TypeScript 7. This was a pre-existing issue from the team, not caused by our code.

**Resolution:** Updated `tsconfig.json`:
```json
// OLD
"module": "commonjs",
"moduleResolution": "node"
// NEW
"module": "Node16",
"moduleResolution": "node16"
```

**Note:** There are also 4 pre-existing type errors in `batches.test.ts` (comparison type mismatches like `'3' and '0' have no overlap`) — these are from the team's code, not ours.

---

### Phase 4: Unit Tests

**File created:** `backend-api/src/__tests__/attendance.test.ts`

**Issue 8: Invalid UUID in test data**

First test run had 7 failures. The second test UUID was invalid:
```typescript
// BAD — contains 'g' which is not valid hex
const VALID_UUID_2 = 'b1ffcd00-0d1c-5fg9-cc7e-7cc0ce491b22';
// FIXED
const VALID_UUID_2 = 'b1ffcd00-0d1c-4ef9-bb7e-7cc0ce491b22';
```

**Issue 9: Case-sensitive error message assertion**

Joi returns `"At least one attendance record is required"` (capital A), but test checked for lowercase `"at least"`.

**Resolution:** Changed assertion to `"At least"`.

**Final result: 35/35 tests passing.**

Test breakdown:
- `checkInSchema` — 6 tests (valid input, QR token, missing fields, invalid UUID, empty token, unknown field stripping)
- `markAttendanceSchema` — 9 tests (valid input, all statuses, invalid status, missing fields, invalid UUIDs, remarks length boundary)
- `bulkMarkAttendanceSchema` — 7 tests (valid bulk, single record, empty array, missing records, invalid studentId, invalid status, missing sessionId)
- `updateAttendanceSchema` — 6 tests (status only, remarks only, both, empty object, invalid status, remarks length)
- QR Token — 3 tests (generation, same-window consistency, different-session uniqueness)
- 8:05 AM Cutoff — 3 tests (before cutoff, after cutoff, same-window token match with Date mock)

---

### Phase 5: Frontend

**Files created:**
- `frontend/src/services/attendance.service.ts` — API client with 9 functions
- `frontend/src/pages/attendance/MarkAttendance.tsx` — Trainer attendance sheet
- `frontend/src/pages/attendance/SessionAttendance.tsx` — Session report page
- Modified `frontend/src/App.tsx` — Added imports, nav link, and routes

**Issue 10: TypeScript `Record` name collision**

Used `Record` as an interface name in `SessionAttendance.tsx`, which conflicts with TypeScript's built-in `Record<K, V>` utility type:
```
error TS2315: Type 'Record' is not generic.
```

**Resolution:** Renamed interface to `AttendanceRecord` and changed the `Record<string, string>` usage to `{ [key: string]: string }` index signature.

**Frontend type-check: 0 errors.**

---

## Current Frontend State

### What's built:

| Page | Component | What it does |
|------|-----------|-------------|
| Trainer attendance sheet | `MarkAttendance.tsx` | Table of all students in a session. Unmarked students default to ABSENT. Trainer toggles status (Present/Absent/Late/Excused) per student, adds optional remarks, clicks "Save Attendance" to bulk submit. Has "Mark All Present" / "Mark All Absent" quick buttons. Summary bar shows counts. Unsaved rows highlighted in yellow. |
| Session report | `SessionAttendance.tsx` | Summary cards (total, present, absent, late, excused, attendance %). Full table with status badges, check-in times, remarks. Shows unmarked students. CSV export button. Link to edit attendance. |
| API client | `attendance.service.ts` | 9 axios functions matching all backend endpoints. |

### What's NOT built yet (identified gaps):

1. **Student attendance view** — Simple page showing attendance % at top + list of sessions with status (Present/Absent/Late). Student should be able to see their own attendance history.
2. **Live QR code fullscreen page** — Dedicated page the trainer projects on screen. Shows rotating QR code that auto-refreshes every 30 seconds. Backend endpoint exists (`GET /session/:sessionId/qr`), just needs frontend display.
3. **Navigation flow** — Currently no way to get from Batches → Sessions → Mark Attendance. Need to add "Mark Attendance" link/button on the batch detail or session list page.
4. **Student check-in page** — Where the student scans the QR code (or enters the token) and checks in. Backend endpoint exists (`POST /check-in`), needs frontend.

---

## API Endpoints

| Method | Path | Description | Used by |
|--------|------|-------------|---------|
| POST | `/api/attendance/check-in` | Student self-check-in (8:05 AM cutoff enforced) | Student check-in page (not built yet) |
| POST | `/api/attendance/mark` | Trainer marks single student | MarkAttendance.tsx (via bulk) |
| POST | `/api/attendance/bulk` | Trainer bulk marks entire session | MarkAttendance.tsx |
| PUT | `/api/attendance/:id` | Update existing record (trainer override for valid reasons) | MarkAttendance.tsx (future) |
| GET | `/api/attendance/session/:sessionId` | Get session attendance + unmarked students | MarkAttendance.tsx, SessionAttendance.tsx |
| GET | `/api/attendance/student/:studentId` | Student attendance history (filters: batchId, from, to) | Student view (not built yet) |
| GET | `/api/attendance/batch/:batchId/stats` | Batch-level attendance stats per student | Batch stats page (not built yet) |
| GET | `/api/attendance/session/:sessionId/export` | Download attendance as CSV | SessionAttendance.tsx |
| GET | `/api/attendance/session/:sessionId/qr` | Generate time-rotating QR token (30s TOTP) | QR fullscreen page (not built yet) |

## Frontend Routes

| Path | Component | Status |
|------|-----------|--------|
| `/attendance/mark/:sessionId` | MarkAttendance | Built |
| `/attendance/session/:sessionId` | SessionAttendance | Built |
| `/attendance/student/:studentId` | StudentAttendance | Not built |
| `/attendance/qr/:sessionId` | QRFullscreen | Not built |
| `/attendance/check-in` | StudentCheckIn | Not built |

---

## Key Design Decisions

1. **8:05 AM cutoff** — Server-time only (`new Date()` on server), no client timestamp accepted. `isPastCutoff()` checks `hours > 8 || (hours === 8 && minutes >= 5)`. Students get 403 after cutoff with message to contact trainer. Trainers are NOT subject to the cutoff — they can mark attendance any time via `/mark` or `/bulk`.

2. **Trainer override** — `PUT /api/attendance/:id` lets trainers change any status. Use case: student arrives at 8:10 AM, bus was late, talks to trainer → trainer changes ABSENT/LATE to PRESENT with a remark like "Bus delay". No cutoff applies to trainer actions.

3. **QR codes (TOTP-style)** — Uses HMAC-SHA256 with a per-session secret derived from `QR_SECRET` env var + sessionId. Token = first 8 hex chars of `HMAC(secret, floor(timestamp / 30))`. Rotates every 30 seconds. Validation accepts current window + previous window (grace period for scan delay). Prevents QR sharing because token expires before it can be forwarded.

4. **Bulk operations** — `POST /bulk` uses upsert (insert or update) per student. Each record is processed independently — if one fails, others still succeed. Response includes per-student success/error details. Frontend sends only changed rows (unsaved rows tracked in state).

5. **Default status** — Unmarked students default to ABSENT in the trainer's UI. Trainer only needs to toggle the students who are Present/Late/Excused, then submit.

6. **Attendance rate calculation** — `(PRESENT + LATE) / total * 100`. Late counts as attended. Excused is not counted as attended.

---

## Schema Reference

```prisma
enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}

model Attendance {
  id          String           @id @default(uuid())
  sessionId   String
  studentId   String
  status      AttendanceStatus
  checkInTime DateTime?
  remarks     String?
  createdAt   DateTime         @default(now())

  session     Session @relation(fields: [sessionId], references: [id])
  student     User    @relation(fields: [studentId], references: [id])

  @@unique([sessionId, studentId])
  @@map("attendance")
}
```

**Related models used by the service:**
- `Session` — has batchId, trainerId, scheduledDate, startTime, endTime
- `Batch` → `BatchMember` — to get list of students enrolled in a session's batch
- `User` — student name, email for display and reports

---

## Files Changed (Complete List)

### New files:
| File | Description |
|------|-------------|
| `backend-api/src/validators/attendance.validator.ts` | Joi validation schemas (4 schemas) |
| `backend-api/src/services/attendance.service.ts` | Business logic (10 exported functions + helpers) |
| `backend-api/src/controllers/attendance.controller.ts` | Express request handlers (10 handlers) |
| `backend-api/src/__tests__/attendance.test.ts` | Unit tests (35 tests) |
| `frontend/src/services/attendance.service.ts` | Axios API client (9 functions) |
| `frontend/src/pages/attendance/MarkAttendance.tsx` | Trainer attendance sheet page |
| `frontend/src/pages/attendance/SessionAttendance.tsx` | Session attendance report page |
| `docs/ticket-7-summary.md` | This file |

### Modified files:
| File | Change |
|------|--------|
| `backend-api/src/server.ts` | Added attendance route import and mount (`/api/attendance`) |
| `backend-api/src/routes/attendance.routes.ts` | Was empty skeleton → full route definitions |
| `backend-api/tsconfig.json` | Fixed `module` and `moduleResolution` for TypeScript 7 |
| `frontend/src/App.tsx` | Added attendance imports, nav link, and route definitions |
| `frontend/src/services/attendance.service.ts` | Was empty → full API client |
