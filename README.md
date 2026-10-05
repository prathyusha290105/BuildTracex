# BuildTracex — Construction Site Quality, Inspection & Defect Management Platform

> **Organisation:** NxtWise IT Pvt. Ltd.  
> **Category:** Enterprise Construction Quality Control & Defect Lifecycle Management  
> **Version:** 1.0.0 — Production Ready  

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Quick Start](#5-quick-start)
6. [Supabase Configuration](#6-supabase-configuration)
7. [Database Migrations](#7-database-migrations)
8. [Supabase Storage Setup](#8-supabase-storage-setup)
9. [Running the Application](#9-running-the-application)
10. [Testing](#10-testing)
11. [The 9-Stage Defect Lifecycle](#11-the-9-stage-defect-lifecycle)
12. [Demo Personas & Access Credentials](#12-demo-personas--access-credentials)
13. [Key Workflows](#13-key-workflows)
14. [Reports & PDF Export](#14-reports--pdf-export)
15. [Deployment](#15-deployment)
16. [Environment Variables](#16-environment-variables)
17. [Outstanding Notes & Limitations](#17-outstanding-notes--limitations)

---

## 1. Product Overview

**BuildTracex** eliminates the inefficiencies of paper checklists, spreadsheets, and messaging apps on construction sites by providing a single, auditable source of truth for:

- **Site Inspections** — Execute standardised checklists on any device
- **Defect Management** — Track every defect from discovery to closure with a complete audit trail
- **Contractor Assignment & Rectification** — Hold contractors accountable with SLA deadlines and evidence requirements
- **QA/QC Reinspection** — Enforce independent verification before any defect can be officially closed
- **Analytics & PDF Reports** — Surface quality KPIs, ageing breakdowns, contractor SLA scorecards, and generate downloadable PDF dossiers

### Core lifecycle

```
Project Setup
  → Inspection Template
    → Site Inspection (Checklist Execution)
      → Defect Generation (Auto from Fails / Manual)
        → Contractor Assignment + SLA Deadline
          → Rectification Evidence Upload
            → QA/QC Reinspection
              → Closed ✓  or  Rejected → Reopened → (repeat)
```

---

## 2. User Roles & Permissions

| Role | Key Responsibilities |
|---|---|
| **System Administrator** | Global access — manage users, projects, contractors, templates, view audit logs, configure system settings |
| **Quality Manager** | Define templates, monitor quality trends, contractor SLA scorecards, approve high-impact actions |
| **QA/QC Engineer** | Execute inspections, raise defects, review rectifications, approve/reject reinspections, close defects |
| **Site Engineer** | Run assigned inspections, raise ad-hoc defects with photo evidence, monitor contractor progress |
| **Project Manager** | Project-level KPIs, defect ageing dashboards, contractor performance tables, export PDF reports |
| **Contractor** | View only own company's assigned defects, acknowledge, submit repair notes + photo evidence |

All permissions are enforced **both** in the React UI (route guards & action gates) and at the database level via **Row Level Security** policies.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + TypeScript 6 |
| Build Tooling | Vite 8 |
| Styling | Tailwind CSS 4 + custom design tokens |
| UI Primitives | Radix UI components |
| Icons | Lucide React |
| Charts | Recharts |
| PDF Generation | jsPDF + jspdf-autotable |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage (`evidence` bucket) |
| Row Level Security | Supabase RLS policies |
| Testing | Vitest |

---

## 4. Project Structure

```
c:\Development\BuildTracex\
├── src/
│   ├── __tests__/          # Vitest test suites
│   │   ├── workflow.test.ts    # State machine, ageing, SLA, role logic (15 tests)
│   │   └── reports.test.ts     # PDF generation (4 tests)
│   ├── components/
│   │   ├── common/         # Reusable: StatusBadge, SeverityBadge, AgeingBadge, MetricCard, EmptyState, etc.
│   │   ├── defects/        # DefectTable, AssignmentModal
│   │   ├── evidence/       # PhotoUploader, EvidenceGallery
│   │   ├── inspections/    # InspectionChecklist
│   │   ├── layout/         # AppShell (sidebar, navbar, notifications, project selector)
│   │   └── ui/             # Button, Card, Input, Textarea, Badge
│   ├── context/
│   │   ├── AuthContext.tsx         # User session, role checks, demo persona switcher
│   │   ├── ProjectContext.tsx      # Global project selector
│   │   └── NotificationContext.tsx # In-app notification badge + drawer
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client, connection diagnostic
│   │   └── utils.ts        # cn(), formatDate, ageing engine, status transition matrix
│   ├── pages/
│   │   ├── admin/          # AdminOverview, Users, Projects, Locations, Contractors, Templates, Activity, Settings
│   │   ├── auth/           # Login, ForgotPassword
│   │   ├── contractor/     # ContractorDashboard, ContractorDefects, ContractorDefectDetail
│   │   ├── dashboard/      # Main KPI dashboard
│   │   ├── defects/        # DefectsList, NewDefect, DefectDetail (8-section dossier)
│   │   ├── inspections/    # InspectionsList, NewInspection (4-step wizard), InspectionDetail
│   │   ├── notifications/  # NotificationsPage
│   │   ├── profile/        # ProfilePage
│   │   ├── projects/       # ProjectsList, ProjectDetail, ProjectLocations
│   │   ├── reports/        # ReportsPage with PDF export
│   │   └── templates/      # TemplatesList, TemplateEditor
│   ├── routes/
│   │   ├── AppRouter.tsx   # All route definitions
│   │   └── ProtectedRoute.tsx  # Role-aware route guard
│   ├── services/           # All Supabase data operations
│   │   ├── activityService.ts
│   │   ├── authService.ts
│   │   ├── contractorService.ts
│   │   ├── defectService.ts
│   │   ├── evidenceService.ts
│   │   ├── inspectionService.ts
│   │   ├── notificationService.ts
│   │   ├── projectService.ts
│   │   ├── rectificationService.ts
│   │   ├── reinspectionService.ts
│   │   ├── reportService.ts
│   │   └── templateService.ts
│   └── types/
│       └── index.ts        # All TypeScript interfaces for 21 entities
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql          # 21 tables, enums, triggers, functions
│       ├── 002_rls_policies.sql    # Row Level Security policies
│       └── 003_seed_data.sql       # Realistic demo dataset
├── .env.example            # Environment variable template (no secrets)
├── README.md               # This file
├── package.json
├── tailwind.config.js
├── tsconfig.app.json
└── vite.config.ts
```

---

## 5. Quick Start

### Prerequisites

- **Node.js** v18 or higher ([download](https://nodejs.org))
- **npm** v9 or higher (included with Node.js)
- A **Supabase** account — free tier works: [app.supabase.com](https://app.supabase.com)

### Install dependencies

```bash
cd c:\Development\BuildTracex
npm install
```

---

## 6. Supabase Configuration

### Step 1 — Create a Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and click **New Project**.
2. Choose a name (e.g. `buildtracex`), set a database password, and select a region.
3. Wait for the project to initialise (~1 minute).

### Step 2 — Retrieve your API credentials

In your Supabase Dashboard:
1. Click **Project Settings** (gear icon, bottom-left).
2. Click **API** in the left sidebar.
3. Copy:
   - **Project URL** (e.g. `https://abcdefghijkl.supabase.co`)
   - **anon / public** key (long JWT string — safe for frontend)

> ⚠️ **Never copy the `service_role` key into frontend code.** Only the `anon` key should be in `.env`.

### Step 3 — Create your `.env` file

```bash
# In c:\Development\BuildTracex, create .env:
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key-here
VITE_SUPABASE_STORAGE_BUCKET=evidence
```

---

## 7. Database Migrations

Run the three migration files **in order** using the Supabase SQL Editor.

### How to access the SQL Editor

1. Open your Supabase Dashboard.
2. Click **SQL Editor** in the left sidebar.
3. Click **+ New query**.

### Migration 1 — Schema (`001_schema.sql`)

Copy the entire contents of `supabase/migrations/001_schema.sql` and run it.

This creates:
- 21 relational tables
- Custom PostgreSQL ENUMs (defect statuses, severity levels, user roles, etc.)
- Auto-numbering triggers (`BTX-0001`, `BTX-0002` for defects; `INS-0001` for inspections)
- `updated_at` auto-update triggers on all tables
- Helper security-definer functions: `has_role()`, `is_project_member()`, `is_contractor_user()`

### Migration 2 — Row Level Security (`002_rls_policies.sql`)

Copy and run `supabase/migrations/002_rls_policies.sql`.

This enables strict RLS enforcing:
- Contractors can **only** view defects assigned to their company
- Project members are scoped to their assigned projects
- QA/QC actions are gated to authorised roles
- Admins retain global access

### Migration 3 — Seed Data (`003_seed_data.sql`)

Copy and run `supabase/migrations/003_seed_data.sql`.

This creates a realistic "Northstar Residential Block A" dataset including:
- 5 site locations (Building → Floor → Zone)
- 4 contractor companies across different trades
- Standardised inspection templates
- 10 inspection records
- Defects covering all 9 lifecycle statuses
- Rectification submissions, reinspection records, comments, notifications, and audit logs

> 💡 You can re-run the seed script safely — it uses `ON CONFLICT DO NOTHING` for idempotent inserts.

---

## 8. Supabase Storage Setup

1. In your Supabase Dashboard, click **Storage** in the left sidebar.
2. Click **+ New bucket**.
3. Name it exactly: `evidence`
4. Set **Public bucket** to **Enabled** (allows direct photo URL access in the UI).
5. Click **Save**.

### Storage RLS Policy (Optional but recommended)

After creating the bucket, in Storage > Policies, add a policy:

```sql
-- Allow authenticated users to upload to evidence bucket
CREATE POLICY "Authenticated users can upload evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidence');

-- Allow public read of evidence files
CREATE POLICY "Evidence files are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidence');
```

---

## 9. Running the Application

### Development server

```bash
npm run dev
```

Open `http://localhost:5173` (or the port shown in your terminal).

### Production build

```bash
npm run build
```

Generates optimised assets in `dist/`.

### Preview production build locally

```bash
npm run preview
```

---

## 10. Testing

BuildTracex includes an automated Vitest test suite covering:

```bash
npm test
```

**Test coverage (19 tests across 2 files):**

### `workflow.test.ts` (15 tests)
1. ✅ Defect state machine — valid progressive lifecycle transitions
2. ✅ Defect state machine — blocks illegal shortcuts and skipped stages
3. ✅ Defect state machine — role-based constraints for Contractor role
4. ✅ 5-tier ageing engine — correct bracket mapping (0-3, 4-7, 8-14, 15-30, 30+ days)
5. ✅ Ageing engine — accurate day calculation between ISO date strings
6. ✅ Ageing engine — defaults to current date when `closedAt` is null
7. ✅ SLA overdue detection — flags past-due open defects
8. ✅ SLA overdue detection — does not flag closed defects
9. ✅ SLA overdue detection — does not flag future due dates
10. ✅ SLA overdue detection — returns false when no due date given
11. ✅ Role labels — all 6 roles format correctly
12. ✅ Role labels — all 6 roles are distinct
13. ✅ Severity labels — all 4 levels format correctly
14. ✅ Status labels — all 8 statuses format correctly
15. ✅ Inspection pass rate — correct formula excluding N/A items

### `reports.test.ts` (4 tests)
1. ✅ Inspection Summary PDF — generates without errors
2. ✅ Defect Dossier PDF — generates without errors
3. ✅ Defect Register PDF — generates with data
4. ✅ Defect Register PDF — handles empty lists gracefully

---

## 11. The 9-Stage Defect Lifecycle

```
OPEN
  → ASSIGNED (contractor designated, SLA set)
    → IN_PROGRESS (contractor acknowledges / begins work)
      → RECTIFIED_PENDING_REINSPECTION (contractor submits proof)
        ┌──→ CLOSED ✓ (QA/QC approves reinspection)
        └──→ REJECTED (QA/QC rejects — inadequate repair)
              → REOPENED (returned to contractor)
                → IN_PROGRESS (contractor resumes)
```

### 5-Tier Ageing Classification

| Age | Bracket | Meaning |
|---|---|---|
| 0 – 3 days | 🟢 Fresh | Normal / within SLA |
| 4 – 7 days | 🔵 Attention | Review recommended |
| 8 – 14 days | 🟡 Approaching | Escalation risk |
| 15 – 30 days | 🟠 Escalated | Critical delay |
| 30+ days | 🔴 Severe Breach | SLA violation |

---

## 12. Demo Personas & Access Credentials

The application includes an **Instant Demo Persona Switcher** in the top navigation bar and user profile menu. No separate logins are required.

After setting up Supabase Auth, create the following user accounts and link them to the seed data profiles:

| Persona | Email | Role | Access Level |
|---|---|---|---|
| System Admin | `admin@buildtracex.com` | System Administrator | Full global access |
| Quality Manager | `qm@buildtracex.com` | Quality Manager | Templates, analytics, overdue escalation |
| QA/QC Engineer | `qa@buildtracex.com` | QA/QC Engineer | Inspections, defects, reinspections |
| Site Engineer | `site@buildtracex.com` | Site Engineer | Field inspections, defect reporting |
| Project Manager | `pm@buildtracex.com` | Project Manager | KPIs, reports, contractor matrix |
| Contractor | `contractor@buildtracex.com` | Contractor | Scoped defect queue, rectification portal |

> 💡 Create these in **Supabase Dashboard → Authentication → Users → Invite user**. The seed data creates matching `profiles` rows — ensure the UUIDs match after creating auth accounts.

---

## 13. Key Workflows

### Creating a Site Inspection (4-Step Wizard)

1. Navigate to **Inspections → New Inspection**
2. **Step 1:** Select Project and Location (Building → Floor → Zone)
3. **Step 2:** Choose an Inspection Template and confirm inspector
4. **Step 3:** Execute checklist — mark each item Pass / Fail / N/A with optional remarks
5. **Step 4:** Review summary → Submit. Any Fail items prompt automatic defect creation.

### Managing a Defect (Full Lifecycle)

1. **QA/QC Engineer** logs or receives defect (status: `OPEN`)
2. **QA/QC Engineer** assigns contractor + due date (status: `ASSIGNED`)
3. **Contractor** logs in → sees defect in their portal → acknowledges (`IN_PROGRESS`)
4. **Contractor** completes repair → opens DefectDetail → submits Rectification + uploads photos (`RECTIFIED_PENDING_REINSPECTION`)
5. **QA/QC Engineer** receives notification → opens DefectDetail → conducts reinspection:
   - **Approve** → defect moves to `CLOSED`
   - **Reject** (requires comment) → defect moves to `REJECTED` → `REOPENED` → contractor notified
6. Contractor re-submits → cycle repeats until closure

### Admin Panel

Navigate to `/admin` to:
- Create/manage users and role assignments
- Add projects and site hierarchies
- Create/modify inspection templates
- Manage contractor companies
- View system audit log

---

## 14. Reports & PDF Export

### Inspection Summary Report
- Navigate to an Inspection Detail page
- Click **Download PDF Report**
- Generates: inspection metadata, inspector, location, pass/fail rates, full itemised checklist results, linked defects

### Defect Dossier
- Navigate to any Defect Detail page
- Click **Export Dossier**
- Generates: defect metadata, severity, SLA status, status audit trail, rectification history, reinspection records

### Defect Register Report
- Navigate to **Reports**
- Apply filters (project, status, contractor, severity, date range)
- Click **Export Defect Register PDF**
- Generates: tabular register with all columns including age, SLA alert, contractor performance matrix

---

## 15. Deployment

### Vercel (Recommended)

```bash
npm run build
# Deploy the dist/ folder to Vercel
```

Or connect the GitHub repository to Vercel for automatic deployments. Set environment variables in the Vercel project dashboard:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_STORAGE_BUCKET=evidence
```

### Netlify

```bash
npm run build
# Set publish directory to: dist
# Set build command to: npm run build
```

### Other static hosts

The `dist/` folder after `npm run build` can be deployed to any static file host (AWS S3 + CloudFront, Azure Static Web Apps, GitHub Pages with SPA redirect, etc.).

---

## 16. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous/public key (safe for frontend) |
| `VITE_SUPABASE_STORAGE_BUCKET` | Optional | Storage bucket name (default: `evidence`) |

> ⚠️ **Security:** Never commit `.env` to version control. Only `.env.example` (with placeholder values) is committed. The `service_role` key must **never** be placed in any frontend file.

---

## 17. Outstanding Notes & Limitations

| Item | Status | Notes |
|---|---|---|
| Database migrations | ✅ Complete | Run in Supabase SQL Editor |
| Row Level Security | ✅ Complete | Full policy coverage on all sensitive tables |
| Authentication | ✅ Complete | Supabase Auth with profile sync and role resolution |
| Storage (evidence uploads) | ✅ Complete | Requires `evidence` bucket created in Supabase Storage |
| Demo persona switcher | ✅ Complete | UI-level instant role switching for evaluation |
| TypeScript compilation | ✅ 0 errors | `tsc -b` passes cleanly |
| Production build | ✅ 0 errors | `vite build` produces optimised `dist/` assets |
| Automated tests | ✅ 19/19 passing | Vitest — workflow logic + PDF generation |
| Real-time notifications | ⚠️ Polled | Uses 30-second polling interval; Supabase Realtime subscriptions can be added for instant push |
| Email notifications | ⚠️ Not implemented | Supabase Edge Functions + an email provider (Resend, SendGrid) required for out-of-app emails |
| Mobile native app | ⚠️ Out of scope | Responsive web — not a React Native or PWA |
| Bundle size | ⚠️ Large (1.6 MB) | jsPDF and Recharts are large. Code splitting via dynamic `import()` can reduce initial load if needed |
| Supabase Auth user-to-profile sync | ⚠️ Manual for demo | In production, a Supabase Auth trigger (webhook) should auto-create `profiles` rows on signup |

---

*BuildTracex — engineered for NxtWise IT Pvt. Ltd. Construction Quality Management.*
