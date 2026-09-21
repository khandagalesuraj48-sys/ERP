# MILESTONE ERP

> **Construction Machinery & Mechanical ERP**  
> Operational plant, machinery, fuel, daily log book, breakdown and maintenance management platform.

---

## 1. Product Identity

MILESTONE ERP is built for infrastructure and construction companies managing heavy earthmoving, haulage, compaction, and mechanical equipment across diverse project sites.

### Active Core Modules (Phase 1):
- **Dashboard**: Operational real-time equipment availability, today's fuel issues, open breakdowns, and recent maintenance logs.
- **Machinery Master**: Central equipment registry with dual-meter support (`KM` vs `HRS`), project assignments, and statutory compliance tracking.
- **Machinery Details (8 Tabs)**: Comprehensive view per machine (*Overview, Fuel, Log Book, Breakdowns, Maintenance, Documents, Cost Analysis, History*).
- **Daily Log Book**: Operational running hours, opening & closing readings, trip tracking, and equipment utilization.
- **Fuel Issue**: Direct-to-machine fuel transactions with dual efficiency analysis (L/100 KM & KM/L for KM machines; L/Hr for Hour machines). *Note: No inward fuel stock or inventory holding is required.*
- **Breakdowns**: Downtime ticketing, severity prioritization, and repair resolution workflows.
- **Maintenance**: Preventive servicing, corrective overhauls, workshop costing, and vendor tracking.
- **Reports & MIS**: 10 structured equipment and cost reports with export capabilities.

### Roadmap Modules:
- **Projects & Sites**: Multi-project and site allocation hierarchy.
- **Store & Spare Parts**: Consumables and parts issue.
- **Purchase & Procurement**: Vendor requisitions, quotations, and purchase orders.
- **Human Resources (HR)**: Equipment operators, site rosters, and performance.
- **Accounts & Finance**: Equipment cost centres, expense allocation, and asset depreciation.
- **Client & Subcontractor Billing**: Machinery hourly hire billing and certified RA bills.

---

## 2. Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Enterprise Dark Theme)
- **Data Visualization**: Recharts
- **Database & Storage**: Supabase (PostgreSQL)
- **State & Utilities**: date-fns, clsx, tailwind-merge, zustand

---

## 3. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

*Note: In offline / development mode without credentials set, the ERP runs cleanly with empty state indicators.*

---

## 4. Getting Started

### Install Dependencies:
```bash
npm install
```

### Run Local Development Server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The application opens directly to `/dashboard`.

### Production Build:
```bash
npm run build
```

---

## 5. Architecture & Future Roadmap

- **Data Access**: Decoupled via `src/lib/data/repository.ts` ensuring clean migration to live Supabase tables without modifying UI components.
- **Authentication**: Authentication is explicitly out of scope for the single-admin private internal phase, but schema and service abstractions are architected with `created_by`, `updated_by`, and `organization_id` to allow future Supabase Auth, roles, and permissions to be enabled seamlessly.
