# **HOPE Engagement Intelligence Platform — Development Plan**

**Delivery Date:** October 9 **Development + Testing Window:** 3 weeks (Sept 18 – Oct 8) **Team Size:** 10 members | **Module Cap:** 30 (1 module/member/week)

---

## **1. Users**

| **Role** | **Purpose on Platform** |
| --- | --- |
| **HOPE Student** | Attends training, submits proofs, tracks own progress, receives interventions |
| **Trainer** | Delivers sessions, gives feedback, marks attendance/assessments |
| **Faculty** | Oversees academic-side performance, views engagement data |
| **Mentor** | Receives risk alerts, runs interventions, logs outcomes |
| **Placement Coordinator** | Tracks placement-readiness, hackathon prep, event registration |
| **Program Administrator** | Manages batches, roles, permissions, system-wide config |

---

## **2. Requirements Mapped to Features**

**Mandatory:** Batch/session mgmt · Attendance & assessment performance · Training history · Trainer feedback · Engagement dashboard · Risk categories · AI weakness analysis · Mentor intervention workflow

**Strong:** Weekly multi-signal risk analysis · Trend/decline detection · Automated mentor alerts · Intervention follow-up · Department/batch comparison · Reason-coded outcomes

**Advanced:** Placement-readiness integration · Predictive disengagement · Personalized training recommendations · Trainer-effectiveness analytics

**From HOPE in-charge (folded into modules below):** Event registration · Proof/certification submission · Hackathon-prep reminders · Strict, unfakeable 8:05 AM attendance cutoff · Flexible tracking for different learning types/speeds · Weekly high-achiever promotion · Self-set schedules with fixed hard deadlines · Room for future extension

**Risk-engine logic (from the mandated agentic workflow):** every risk/intervention module must follow *Review signals → Detect pattern → Identify causes → Recommend intervention → Create mentor task → Track response → Reassess* — not a single LLM call, but a stateful agent that acts on data and verifies outcomes.

---

## **3. Timeline (3 Weeks)**

| **Week** | **Dates** | **Theme** |
| --- | --- | --- |
| **Week 1** | Sep 18 – Sep 24 | Foundation: auth, schemas, core data capture (attendance, marks, feedback, history) |
| **Week 2** | Sep 25 – Oct 1 | Intelligence layer: dashboards, risk detection, AI weakness analysis, mentor workflow |
| **Week 3** | Oct 2 – Oct 8 | Advanced analytics, comparison, polish, security hardening, integration testing |
| **Oct 9** | — | Delivery |

**Team Leads (for POC):** Jaya Prathiba — AI/ML lead · Joanna Kiruba — Fullstack lead

**Process per module:** ticket created → assignee works → mark complete → reviewer reviews → PR raised (merge owner = one member only) → pull & test → validate → close ticket. Weekly sprint calls: yesterday / today / blockers, documented by every member.

---

## **4. Tech Stack**

- **Frontend:** React + Tailwind CSS (fast to build, matches team's fullstack skillset)
- **Backend (core API):** Node.js + Express — handles auth, CRUD, RBAC, workflow orchestration
- **Backend (AI/ML service):** Python + FastAPI — risk scoring, weakness analysis, prediction, recommendations (keeps ML separate from core API, callable internally)
- **Database (structured):** PostgreSQL — users, batches, attendance, marks, contests, risk scores, intervention records
- **Database (unstructured):** MongoDB — trainer feedback text, proof/certificate documents, mentor notes
- **File storage:** S3-compatible object storage (certs, proof uploads)
- **Auth:** JWT + refresh tokens, RBAC (role-permission matrix, not just role checks)
- **Realtime/alerts:** WebSocket or scheduled job queue (e.g., BullMQ) for mentor alerts, reminders
- **Deployment:** Docker containers; separate services for API, ML service, frontend
- **Testing:** Jest/Supertest (Node), Pytest (Python), Cypress/Playwright (E2E)

**Security note (Day 1, per mentor guidance):** RBAC enforced at API layer (not just UI hiding), attendance write-path server-time-locked (no client timestamp trust) to prevent faking the 8:05 AM cutoff, audit logging on all mentor/admin actions, input validation on every endpoint since AI-generated code will not add this by default.

---

## **5. Module Breakdown (30 Modules)**

### **Week 1 — Foundation & Core Data Layer**

| **#** | **Module** | **Owner** | **Description** |
| --- | --- | --- | --- |
| 1 | Auth & RBAC core | Prazilla Pearl | Login, JWT/refresh, role-permission matrix for all 6 roles |
| 2 | User & role management | Prisha Aditi | Profile CRUD for students/trainers/faculty/mentors/coordinators/admins |
| 3 | Batch/session management | Joanna Kiruba | Create/manage batches, sessions, trainer assignment |
| 4 | Attendance module | Pon Swetha | Server-time-locked check-in, closes 8:05 AM, tamper-resistant |
| 5 | Assessment & coding performance capture | Sree Harini | Ingests marks, coding test scores, contest results, assignments |
| 6 | Student training history | Meenakshi | Chronological record of sessions, topics covered, scores over time |
| 7 | Trainer feedback module | Ayesha Sidiqqa | Structured + free-text feedback per student per session |
| 8 | Structured DB schema (Postgres) | Jaya Prathiba | Core schema: users, batches, attendance, marks, risk, interventions |
| 9 | Unstructured store & proof/cert schema (Mongo + storage) | Harinee S | Feedback text, certificate/proof documents, mentor notes |
| 10 | Event registration | Tisha Angel | Students register for hackathons/events; coordinator manages listings |

### **Week 2 — Intelligence & Engagement Layer**

| **#** | **Module** | **Owner** | **Description** |
| --- | --- | --- | --- |
| 11 | Engagement dashboard | Joanna Kiruba | Unified view of attendance, marks, feedback per student/batch |
| 12 | Risk categorization engine | Jaya Prathiba | Classifies students into risk tiers from combined signals |
| 13 | AI-assisted weakness analysis | Meenakshi | Identifies specific skill/topic gaps from performance data |
| 14 | Weekly multi-signal risk analysis | Ayesha Siddiqa | Runs the review→detect→cause pipeline weekly across all signals |
| 15 | Trend & decline detection | Harinee S | Flags downward trajectories, not just static low scores |
| 16 | Automated mentor alerts | Tisha Angel | Notifies mentor when risk pattern is confirmed |
| 17 | Mentor intervention workflow | Pon Swetha | Mentor creates/assigns intervention task, records action taken |
| 18 | Intervention follow-up tracking | Sree Harini | Tracks whether intervention task was completed and when |
| 19 | Proof submission & verification | Prazilla Pearl | Students upload certs/course proof; trainer/coordinator verifies |
| 20 | Hackathon-prep reminders | Prisha Aditi | Early, scheduled reminders tied to registered events |

### **Week 3 — Advanced, Comparative & Polish Layer**

| **#** | **Module** | **Owner** | **Description** |
| --- | --- | --- | --- |
| 21 | Reason-coded intervention outcomes | Meenakshi | Tags why an intervention worked/failed for pattern learning |
| 22 | Department/batch comparison analytics | Ayesha Siddiqa | Compares engagement/risk trends across batches or departments |
| 23 | Placement-readiness integration | Jaya Prathiba | Rolls up DSA + domain + soft-skill signals into a readiness score |
| 24 | Predictive disengagement analysis | Harinee S | Forecasts likely disengagement before it fully manifests |
| 25 | Personalized training recommendations | Tisha Angel | Suggests topics/resources based on weakness analysis |
| 26 | Trainer-effectiveness analytics | Joanna Kiruba | Correlates trainer sessions with student outcome improvement |
| 27 | Weekly high-achiever leaderboard | Pon Swetha | Surfaces top performers weekly to motivate students |
| 28 | Individual progress tracking & self-set schedules | Sree Harini | Student-set goals/deadlines alongside fixed college deadlines |
| 29 | Security hardening & audit logging | Prazilla Pearl | Penetration-style review, permission tests, action audit trail |
| 30 | Integration testing, QA & deployment pipeline | Prisha Aditi | End-to-end test suite, CI/CD, final demo environment |

---

## **6. Directory Structure (Approximate)**

```
hope-engagement-platform/
├── frontend/                      # React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── student/
│   │   │   ├── trainer/
│   │   │   ├── mentor/
│   │   │   ├── faculty/
│   │   │   ├── coordinator/
│   │   │   └── admin/
│   │   ├── hooks/
│   │   ├── context/                # auth/role context
│   │   ├── services/                # API clients
│   │   └── App.jsx
│   └── package.json
│
├── backend-api/                   # Node.js + Express (core)
│   ├── src/
│   │   ├── auth/                    # JWT, RBAC middleware
│   │   ├── routes/
│   │   │   ├── users.js
│   │   │   ├── batches.js
│   │   │   ├── attendance.js
│   │   │   ├── assessments.js
│   │   │   ├── feedback.js
│   │   │   ├── interventions.js
│   │   │   ├── events.js
│   │   │   └── proofs.js
│   │   ├── controllers/
│   │   ├── models/                  # Postgres models
│   │   ├── services/                 # calls to ML service
│   │   ├── jobs/                     # reminders, alert scheduling
│   │   └── middleware/               # audit logging, validation
│   └── package.json
│
├── ml-service/                    # Python + FastAPI
│   ├── app/
│   │   ├── risk_engine/              # review→detect→cause→recommend pipeline
│   │   ├── weakness_analysis/
│   │   ├── predictive_disengagement/
│   │   ├── recommendation_engine/
│   │   └── trainer_effectiveness/
│   └── requirements.txt
│
├── database/
│   ├── postgres/
│   │   ├── migrations/
│   │   └── schema.sql
│   └── mongo/
│       └── collections/              # feedback_text, proofs, mentor_notes
│
├── infra/
│   ├── docker-compose.yml
│   └── ci-cd/
│
└── docs/
    ├── sprint-notes/
    └── module-tickets/
```

---

## **7. Notes**

- This is a **tentative** split — fine-grained task breakdown within each module (tickets, sub-tasks, exact days) is the next layer of detail for each owner to draft.
- The risk/intervention modules (12–18, 21, 23–25) all plug into the same agentic pipeline pattern, not standalone scripts — keep that shared logic centralized in `ml-service/app/risk_engine/` rather than duplicated per module.
- Attendance (Module 4) and Security hardening (Module 29) are flagged as highest-scrutiny items given the "cannot be faked" and Day-1-security requirements.