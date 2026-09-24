# Testing Guide — HOPE Backend API

This document explains how to set up and run the backend test suite, and describes what each test file covers.

## Prerequisites

- **Node.js** >= 22.x
- **npm** >= 12.x

## Setup

From the `backend-api/` directory:

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Approve native build scripts (bcrypt, prisma, swc, etc.)
npm install-scripts approve --all

# 3. Rebuild native modules (needed for bcrypt)
npm rebuild bcrypt
```

> **Note:** `--legacy-peer-deps` is required because some packages have peer dependency version mismatches that don't affect runtime behavior.

## Running Tests

```bash
# Run all tests
npm test

# Run all tests with verbose output (shows individual test names)
npx jest --verbose

# Run a single test file
npx jest src/__tests__/assessments.test.ts
npx jest src/__tests__/assessments.integration.test.ts
npx jest src/__tests__/batches.test.ts
npx jest src/__tests__/batches.integration.test.ts
npx jest tests/auth-rbac.test.ts

# Run tests matching a pattern
npx jest --testPathPattern="auth"
npx jest --testPathPattern="assessments"
npx jest --testPathPattern="batches"
```

## Test Framework

- **Jest** (v30) as the test runner
- **@swc/jest** for fast TypeScript transpilation (no `ts-jest` needed)
- **supertest** for HTTP-level integration tests
- Config: `jest.config.ts` — roots are `src/` and `tests/`

## Test Files and What They Cover

The suite has **284 tests** across **5 test files**, covering three completed modules.

---

### 1. `src/__tests__/assessments.test.ts` — Assessment Validators & Logic (Unit)

**Module:** Ticket 1 & 4 — Assessment Tracking

These are pure unit tests with no database or HTTP dependencies. They validate the Joi schemas and scoring logic used by the assessments module.

| Section | Tests | What it covers |
|---------|-------|----------------|
| **createAssessmentSchema** | 14 | Validates required fields (batchId as UUID, title non-empty, type enum, ISO date), section/question structure, weightage rules (all-or-none, must total 100%), and rejects invalid inputs |
| **updateAssessmentSchema** | 3 | Partial updates allowed, empty object allowed, rejects empty title |
| **addSectionSchema** | 4 | Valid section creation, weightage bounds (0–100), rejects empty title |
| **addQuestionSchema** | 3 | Valid question, rejects missing label, rejects zero maxScore |
| **submitScoresSchema** | 5 | Valid score submission with UUIDs, rejects negative scores, invalid UUIDs, empty arrays, accepts optional remarks |
| **maxScore auto-calculation** | 2 | Sum of all question maxScores across sections, handles empty sections |
| **Score calculation logic** | 5 | Raw total (no weightage), weighted scoring out of 100, partial scores, empty sections, zero-maxScore edge case |
| **CSV parsing validation** | 3 | Required header detection (case-insensitive), missing header detection |
| **Weightage validation** | 3 | Detects partial weightage, validates sum equals 100, rejects incorrect sums |

---

### 2. `src/__tests__/assessments.integration.test.ts` — Assessment API Routes (Integration)

**Module:** Ticket 1 & 4 — Assessment Tracking

HTTP-level tests using **supertest** against an Express app. The service layer is fully mocked (`jest.mock`), so these tests verify routing, validation middleware, request/response shape, and status codes without needing a database.

| Section | Tests | What it covers |
|---------|-------|----------------|
| **POST /api/assessments** | 7 | Create assessment — valid 201, validation 400s (empty title, invalid type, partial weightage, weightages not totaling 100), batch-not-found 404, create without sections |
| **GET /api/assessments** | 2 | List assessments — 200 response, query filter passthrough (batchId, type) |
| **GET /api/assessments/:id** | 2 | Get single — 200 success, 404 not found |
| **PUT /api/assessments/:id** | 3 | Update — 200 valid, 400 empty title, 404 not found |
| **DELETE /api/assessments/:id** | 2 | Delete — 200 success, 404 not found |
| **Section CRUD** | 6 | Add section (201, 400 empty title, 409 scores-exist), update section (200, 409), delete section (200, 409) |
| **Question CRUD** | 5 | Add question (201, 400 missing/zero maxScore, 409), update question (200, 409), delete question (200) |
| **POST /api/assessments/:id/scores** | 6 | Submit scores — 201 valid, 400 negative score, 400 empty array, 400 invalid UUID, 400 student not in batch, 400 score exceeds max |
| **GET /api/assessments/:id/results** | 2 | Get results — 200 success, 404 assessment not found |
| **GET /api/assessments/:id/results/:studentId** | 2 | Get student result — 200 with overallScore, 404 no result |
| **POST /api/assessments/:id/scores/bulk** | 6 | CSV bulk upload — 200 all-success, 207 partial, 400 no file, 400 empty file, 400 missing columns, case-insensitive headers, quoted fields |
| **Service call verification** | 8 | Verifies correct arguments are passed to each service function (assessmentId, sectionId, nested payloads, etc.) |

---

### 3. `tests/auth-rbac.test.ts` — Auth & RBAC (Unit)

**Module:** Ticket 2 & 3 — Authentication, RBAC, and User Management

Pure unit tests covering the authentication system, role-based access control, and user management logic. Uses `jsonwebtoken` and `bcrypt` directly for crypto tests; no database or HTTP server required.

| Section | Tests | What it covers |
|---------|-------|----------------|
| **Permission Catalog Integrity** | 6 | Every role-permission code exists in PERMISSIONS, TRAINER risk-score access is category-only, MENTOR has no proofs/event_registrations, ADMIN doesn't hold session/assessment/feedback creation, ADMIN doesn't hold intervention operational perms, ADMIN holds all required admin permissions, STUDENT scoped to :self/:own only |
| **JWT Access Token** | 4 | Sign and verify, expired token rejection, wrong-secret rejection, 15-minute expiry |
| **Token Hashing** | 3 | Deterministic hashing, uniqueness, raw != hash |
| **Password Validation** | 8 | Min 12 chars, no leading/trailing whitespace, common password rejection, no user name, no email local part, sequential character rejection, strong password acceptance |
| **resolveScope — scope suffix matching** | 11 | own_given vs own distinction, own_received vs own distinction, category:batch vs batch distinction, correct resolution for each scope type (:any, :assigned, :batch, :own, :self), broadest-scope-wins, unsuffixed permissions |
| **Logout refresh-cookie handling** | 2 | Cookie path covers both /auth/refresh and /auth/logout, family revocation on logout |
| **Bulk CSV Parsing and Validation** | 10 | Valid CSV parsing, missing header rejection, missing name/email rejection, email normalization, duplicate detection, PENDING status with null passwordHash, activation token size (256-bit), users:create is ADMIN-only, optional columns |
| **RBAC Scope Assignment** | 6 | Trainer category-only risk access, Mentor assigned-student risk access, Student own-interventions only, Mentor intervention CRUD, Coordinator users:read:any, Faculty read-only oversight |
| **Scope Enforcement Rules** | 5 | :self scope identity check, :own scope record ownership, Student no broad scope, Mentor no event_registrations, Mentor no proofs, Trainer batch-scoped (no :any) |
| **Refresh Token Rotation Rules** | 5 | Hash determinism, hash uniqueness, family grouping, replay detection (revoked beyond grace), grace window tolerance (within 10s), 30-day absolute session ceiling |
| **Role-Change Escalation Guard** | 5 | Self-role-change rejection, non-ADMIN assigning ADMIN rejection, ADMIN assigning non-ADMIN allowed, ADMIN assigning ADMIN allowed, only users:change_role holders can change roles |
| **Login Security Rules** | 6 | Null passwordHash rejection, PENDING user rejection, INACTIVE user rejection, wrong password (bcrypt), correct password (bcrypt), generic error message for both not-found and wrong-password, per-account rate limiting |
| **Audit Logging** | 3 | audit_logs:read is ADMIN-only, CSV user creation audit action, role change audit with old/new values |
| **Seed Configuration** | 4 | All 6 roles defined, 67 unique permission codes, no duplicate codes, every role has at least one permission |

---

### 4. `src/__tests__/batches.test.ts` — Batch & Session Validators & Logic (Unit)

**Module:** Ticket 6 — Batch & Session Management

Pure unit tests validating the Joi schemas for batches, student/trainer assignment, and sessions. Also tests the delete-safeguard logic and session time validation.

| Section | Tests | What it covers |
|---------|-------|----------------|
| **createBatchSchema** | 7 | Required fields (name, startDate as ISO date), optional fields (department, endDate, description), rejects empty/missing name, invalid dates |
| **updateBatchSchema** | 5 | Partial updates, empty object allowed, rejects empty name, accepts date updates, rejects invalid dates |
| **assignStudentSchema** | 3 | Valid UUID, rejects invalid UUID, rejects missing studentId |
| **assignTrainerSchema** | 3 | Valid UUID, rejects invalid UUID, rejects missing trainerId |
| **createSessionSchema** | 10 | Valid session with all fields, optional topic, rejects empty title, missing/invalid trainerId, invalid dates, endTime before/equal to startTime with error message check |
| **updateSessionSchema** | 6 | Partial update, empty object, rejects empty title, rejects endTime before startTime, accepts valid time update, accepts endTime alone |
| **Batch delete safeguard logic** | 3 | Blocks deletion when sessions exist, blocks when assessments exist, allows when neither exist |
| **Session delete safeguard logic** | 3 | Blocks deletion when attendance exists, blocks when feedback exists, allows when neither exist |
| **Session time validation logic** | 3 | Rejects equal times, rejects end before start, accepts end after start |

---

### 5. `src/__tests__/batches.integration.test.ts` — Batch & Session API Routes (Integration)

**Module:** Ticket 6 — Batch & Session Management

HTTP-level tests using **supertest** against an Express app with both `/api/batches` and `/api/sessions` routes mounted. The service layer is fully mocked.

| Section | Tests | What it covers |
|---------|-------|----------------|
| **POST /api/batches** | 5 | Create batch — 201 valid, 400 missing/empty name, 400 invalid date, 201 with all optional fields |
| **GET /api/batches** | 2 | List batches — 200 with data, 200 empty array |
| **GET /api/batches/:id** | 2 | Get single — 200 success, 404 not found |
| **PUT /api/batches/:id** | 3 | Update — 200 valid, 400 empty name, 404 not found |
| **DELETE /api/batches/:id** | 4 | Delete — 200 success, 404 not found, 409 has sessions, 409 has assessments |
| **Roster (Students)** | 7 | GET roster (200, 404 batch), POST add student (201, 400 invalid UUID, 404 not found, 409 duplicate), DELETE remove student (200, 404 not in batch) |
| **Trainers** | 7 | GET trainers (200, 404 batch), POST assign trainer (201, 400 invalid UUID, 404 not found, 409 duplicate), DELETE remove trainer (200, 404 not assigned) |
| **Batch-scoped sessions** | 8 | GET list sessions (200, 404 batch), POST create session (201, 400 empty title, 400 invalid trainerId, 400 endTime before startTime, 404 batch not found, 404 trainer not found) |
| **GET /api/sessions/:id** | 2 | Get session — 200 success, 404 not found |
| **PUT /api/sessions/:id** | 5 | Update session — 200 valid, 400 empty title, 400 endTime before startTime, 404 not found, 400 service time conflict |
| **DELETE /api/sessions/:id** | 4 | Delete session — 200 success, 404 not found, 409 has attendance, 409 has feedback |
| **Service call verification** | 12 | Verifies correct arguments passed to each service function (batchId, studentId, trainerId, session body, etc.) |

---

## Adding Tests for New Modules

When adding tests for a new module:

1. **Unit tests** go in `src/__tests__/<module>.test.ts`
2. **Integration tests** go in `src/__tests__/<module>.integration.test.ts`
3. **Cross-cutting tests** (like auth-rbac) can go in `tests/`

All three locations are picked up by the Jest config. Use `@swc/jest` for TypeScript — no additional config needed.

### Conventions

- **Validation tests**: Import the Joi schema, call `schema.validate(input)`, check `error` (undefined = valid, defined = invalid)
- **Integration tests**: Use `supertest` with a test Express app, mock the service layer with `jest.mock`
- **No database required**: All current tests run without a database connection — services are mocked at the module boundary
