# Noble Education ERP
### Enterprise School & Coaching Management System
**Location**: Vadodara, Gujarat, India  
**Brand**: Noble Education Group (`nobleedu.in`)

A comprehensive, production-ready, multi-tenant Education ERP built for schools, colleges, and competitive coaching institutes (JEE / NEET / GUJCET / DDCET) across Vadodara.

---

## Quick Links for Testing

| Service | Local URL | Description |
|---|---|---|
| **Web Portal Application** | [http://localhost:5173](http://localhost:5173) | Complete React + Vite + Tailwind ERP frontend |
| **Common Portal Select** | [http://localhost:5173/login](http://localhost:5173/login) | Directory of all 12 dedicated portals with 1-click test logins |
| **Backend REST API** | [http://localhost:5000/api/v1](http://localhost:5000/api/v1) | Express TypeScript REST API with Prisma ORM |
| **API Demo Credentials** | [http://localhost:5173/api/v1/auth/demo-credentials](http://localhost:5173/api/v1/auth/demo-credentials) | Public test credential matrix |

---

## 12 Dedicated Login Portals & Verified Test Credentials

All accounts are pre-seeded with the universal password: **`Noble@2026`**

| Portal # | Dedicated URL | Role Name | Login Identifier / Email | Features & Scope |
|---|---|---|---|---|
| **1** | `/login/super-admin` | **Super Administrator** | `superadmin@nobleedu.in` | Global multi-branch & multi-school visibility, P&L, audit logs |
| **2** | `/login/branch-admin` | **Branch Administrator** | `admin.alkapuri@nobleedu.in` | Alkapuri hub campus management |
| **3** | `/login/school-admin` | **School Administrator** | `admin.royal@nobleedu.in` | Royal Eduworld School principal portal |
| **4** | `/login/academic-coordinator` | **Academic Coordinator** | `coordinator@nobleedu.in` | Timetable generation, syllabus tracking, exam schedules |
| **5** | `/login/teacher` | **Teacher / Faculty** | `teacher.rajesh@nobleedu.in` | Attendance marking, homework assignments, marks entry |
| **6** | `/login/accountant` | **Accountant** | `accountant@nobleedu.in` | Fee collection, receipts, cash/bank vouchers, expense records |
| **7** | `/login/hr` | **HR & Payroll Manager** | `hr@nobleedu.in` | Staff records, leaves, Indian statutory payroll (PF/ESI/PT/TDS) |
| **8** | `/login/reception` | **Front Desk / Admissions** | `reception@nobleedu.in` | Walk-in inquiries, phone calls, CRM pipeline follow-ups |
| **9** | `/login/student` | **Student Portal** | `student.aarav@nobleedu.in` | Timetable, attendance stats, homework submissions, fee receipts |
| **10** | `/login/parent` | **Parent Portal** | `parent.patel@nobleedu.in` | Child performance, attendance tracking, fee payment ledger |
| **11** | `/login/transport` | **Transport Coordinator** | `transport@nobleedu.in` | Bus routes, stops, vehicle tracking, driver allocation |
| **12** | `/login/librarian` | **Librarian** | `librarian@nobleedu.in` | Book cataloging, barcode issues, return tracking, overdue fines |

---

## Multi-Tenant Organization Hierarchy

- **Parent Organization**: Noble Education Group (`NOBLE-EDU`), Head Office: Alkapuri, Vadodara, Gujarat (`nobleedu.in`).
- **3 Geographic Branches in Vadodara**:
  1. **Alkapuri Campus (Main Hub)** (`ALKAPURI-MAIN`) - RC Dutt Road, Alkapuri, Vadodara - 390007.
  2. **Manjalpur Campus** (`MANJALPUR-BRANCH`) - GIDC Road, Manjalpur, Vadodara - 390011.
  3. **Karelibaug Campus** (`KARELIBAUG-BRANCH`) - Water Tank Road, Karelibaug, Vadodara - 390018.
- **5 Schools & Educational Units**:
  1. **Royal Eduworld School** (`ROYAL_EDUWORLD`) - CBSE K-12 English Medium.
  2. **Newheaven Vidyalaya** (`NEWHEAVEN_VIDYALAYA`) - GSEB Secondary & Higher Secondary.
  3. **Raghukul Vidyalaya** (`RAGHUKUL_VIDYALAYA`) - GSEB Primary & High School.
  4. **Noble Education Coaching Institute** (`NOBLE_COACHING`) - JEE / NEET / GUJCET Entrance Prep.
  5. **Noble Engineering Academy** (`NOBLE_ENGG_ACADEMY`) - Diploma to Degree (DDCET) & Engineering Foundation.

---

## Operational Modules Included

1. **Authentication, RBAC & Brute-Force Guard**: 12 dedicated portals, JWT rotation, 5-attempt account lockout guard with 15-minute cooldown.
2. **Admissions CRM Pipeline**: Lead stages, follow-up reminders, conversion funnel analytics.
3. **Student Information System (SIS)**: 10-section comprehensive student profile, admission documents, parent linking.
4. **Faculty & Staff Management**: Employee codes, qualifications, subject specializations, class teacher assignments.
5. **Academics & Timetable**: Weekly timetable grid with automated teacher and room collision prevention engine.
6. **Attendance Tracking**: Student attendance register with daily marking and percentage calculator.
7. **Fees & Double-Entry Accounting**: Fee heads, installment plans, receipt generation (`REC-2026-XXXXX`), payment vouchers, and P&L summaries.
8. **HR & Indian Statutory Payroll**: Gross salary, Basic, HRA, DA, EPF (12%), ESIC (0.75%), Gujarat Professional Tax (PT ?200), and TDS deduction.
9. **Examinations & Digital LMS**: Exam scheduling, marks entry, automated grade calculation, and homework assignments.
10. **Campus Operations**: Barcode library tracking (issue/return/fines) and transport management (routes/stops/vehicles).
11. **Security Audit Logs**: Immutable audit log explorer capturing User, Role, Action, IP, User Agent, and timestamp.
12. **Enterprise Settings**: Multi-tenant branch and school manager, academic terms, and RBAC matrix.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JSON Web Tokens (JWT), Bcrypt, Zod, Helmet, CORS, Express-Rate-Limit.
- **Database**: Prisma Schema compatible with PostgreSQL and SQLite (`file:./noble_erp.db`).
- **AI Core (Optional Companion Service)**: FastAPI, local Ollama (Llama 3), Scikit-learn, Tesseract OCR, and ChromaDB.

---

## Running Locally

### 1. Start the Backend API
```bash
cd backend
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run build
npm start # runs on http://localhost:5000
```

### 2. Start the Frontend Client
```bash
cd client
npm install
npm run build
npm run dev # runs on http://localhost:5173
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
