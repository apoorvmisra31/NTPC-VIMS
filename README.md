# NTPC-VIMS: Vendor Invoice Management System

## 1. Project Overview

An enterprise full-stack web application simulating the vendor invoice processing lifecycle of **NTPC Limited** (India's largest power utility). The platform models the vendor-facing **NTPC Flipper Portal** (`ebillpravesh.ntpc.co.in/flipper`) and back-end **OpenText SAP VIM (Vendor Invoice Management) 7.6 SPS7** (`/OPT/VIM_WP`).

NTPC-VIMS resolves invoice submission opacity, automates line-item three-way matching against Purchase Orders (PO), and enforces strict departmental governance between site processing desks, certifying engineers, commercial accountants, and finance treasury.

---

## 2. Key Features

- **Multi-Role Scoped Governance**: 8 verified roles (`vendor`, `vendor_sub_user`, `vpd`, `eic`, `vpg`, `finance`, `hr_admin`, `system_admin`) enforced via JWT authentication, route guards, and invoice ownership middleware (`invoiceOwnership.js`).
- **7 Digital Invoice Streams**: Distinct submission workflows for PO Invoices (RAB/Final Bill), Advance Payments, Credit Memos, Retention Releases, Subsequent Debits, Dispatch Payments, and Custom Duty with PDF uploads.
- **Live PO Validation Service**: Synchronous three-way matching service validating vendor codes, remaining balance quantities, tax codes, and plant matching before submission.
- **8-Tab DP Document Workspace**: SAP-style review interface covering Basic Data, Line Items, Accounting, Tax, Business Rule Exception Flags (Red/Yellow/Green severity), Other Data, Cumulative Pay Orders, and Audit History.
- **Commercial Adjustments & Deductions**: Dedicated VPG controls for calculating retention deductions (`retention_pct`), advance adjustments (`advance_adj`), and penalty deductions (`penalty_deduction`).
- **Real-Time Telemetry & Reports**: Socket.IO simulated plant telemetry for Units 1–5 (Load, RPM, Temp, Pressure), threaded per-invoice messaging, automated PDF Payment Advice/SES generation, and Excel report export.

---

## 3. End-to-End Invoice Lifecycle

The invoice lifecycle is driven by an atomic, transactional state machine managed in `backend/services/workflowService.js`. Every transition closes the active `WorkflowTask`, updates the `Invoice` status and assigned role, logs an audit entry, and appends a system comment.

```mermaid
flowchart TD
    Vendor([Vendor Submission]) -->|Status: Submitted / Role: VPD| VPD_Desk[Stage 1: VIM Processing Desk (VPD)]

    subgraph S1["Stage 1: VPD Desk"]
        VPD_Desk --> S1_Action{DP Validation &<br/>Exceptions Resolved?}
        S1_Action -->|Approve| EIC_Desk[Stage 2: Engineer-in-Charge (EIC)]
        S1_Action -->|Reject (requires reason)| RetVendor[Return to Vendor<br/>Status: Rejected / Role: VENDOR]
        S1_Action -->|Clarify| ClarV1[Public Question to Vendor]
    end

    subgraph S2["Stage 2: EIC Certification"]
        EIC_Desk --> S2_Action{Technical & GR/SES<br/>Certification OK?}
        S2_Action -->|Approve| VPG_Desk[Stage 3: Vendor Payment Group (VPG)]
        S2_Action -->|Reject| VPD_Desk
        S2_Action -->|Clarify| ClarV2[Clarification Request]
    end

    subgraph S3["Stage 3: VPG Deductions"]
        VPG_Desk --> VPG_Action[Apply Deductions:<br/>Retention %, Advance, Penalty]
        VPG_Action --> S3_Action{Commercial Audit<br/>Passed?}
        S3_Action -->|Forward| Fin_Desk[Stage 4: Finance Department]
        S3_Action -->|Reject| EIC_Desk
    end

    subgraph S4["Stage 4: Finance Treasury"]
        Fin_Desk --> S4_Action{Treasury Review}
        S4_Action -->|Hold| Fin_Hold[Status: ON_HOLD / Role: FINANCE]
        Fin_Hold -->|Release Hold| Fin_Desk
        S4_Action -->|Reject| VPG_Desk
        S4_Action -->|Approve Payment<br/>(Input UTR & Method)| Paid_State[Stage 5: Completed<br/>Status: Paid / Role: SYSTEM]
    end

    subgraph S5["Stage 5: Disbursement"]
        Paid_State --> GenAdvice[Generate Payment Record & PDF Payment Advice]
        GenAdvice --> Complete([Workflow Closed])
    end

    RetVendor -.->|Resubmit Bill| VPD_Desk
    ClarV1 -.->|Vendor Reply| VPD_Desk
```

### State & Role Progression

| Stage | Responsible Role | Starting Status | Action Taken | Resulting Status | Next Role | Branching / Fallback Paths |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **0** | `vendor` | *None* | Submit Invoice | `Submitted` | `VPD` | Validates against PO; creates pending `WorkflowTask`. |
| **1** | `vpd` | `Submitted` | Approve | `VPD_APPROVED` | `EIC` | **Reject**: returns to `VENDOR` (`Rejected`). **Clarify**: adds vendor comment. |
| **2** | `eic` | `VPD_APPROVED` | Approve | `EIC_APPROVED` | `VPG` | **Reject**: returns to `VPD` (`Rejected`). Certifies physical delivery (GR/SES). |
| **3** | `vpg` | `EIC_APPROVED` | Forward | `VPG_PROCESSED` | `FINANCE` | **Adjust**: applies retention %, advance adj, penalties. **Reject**: returns to `EIC`. |
| **4** | `finance` | `VPG_PROCESSED` | Approve Payment | `Paid` | `SYSTEM` | **Hold**: sets `ON_HOLD`. **Reject**: returns to `VPG`. Captures UTR & payment method. |
| **5** | `system` | `Paid` | Auto-generate | `Paid` | *None* | Generates `Payment` entity and downloadable branded **Payment Advice PDF**. |

*Access Enforcement*: `backend/middleware/invoiceOwnership.js` ensures vendors view only their own invoices (`vendorCode` match). Reviewers can only act on invoices where `invoice.current_role` matches their active role.

---

## 4. Technology Stack

- **Frontend**: React 18, Vite 5, Ant Design 5 (`antd`), React Router 6, Zustand, TanStack React Query, Recharts, Axios, Day.js, Socket.IO Client, `pdf-lib`.
- **Backend**: Node.js 18+, Express.js 4, MongoDB (Mongoose 8), Socket.IO 4, JWT (`jsonwebtoken`), `bcryptjs`, Multer, PDFKit, ExcelJS, Nodemailer, Swagger (`swagger-ui-express` & `swagger-jsdoc`).
- **Security & Infrastructure**: Helmet, CORS origin whitelisting, `express-rate-limit`, cookie-parser, compression, Morgan logging.

---

## 5. Demo Credentials

The database includes 8 pre-configured user personas populated via `backend/utils/seedData.js`. All passwords are encrypted using bcrypt (10 salt rounds).

> **Demo Access Warning**: These credentials are strictly for local testing. Run `npm run seed` in `backend/` to initialize.

| Role | Email | Password | Assigned Plant | Persona & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin@ntpc.co.in` | `password123` | Dadri (IT) | Superuser: User & role management, PO creation, audit logs, plant monitoring. |
| **Vendor 1** | `vendor1@example.com` | `password123` | Dadri | ABC Engineering Pvt Ltd (`V1001`): Open POs `PO-4500001234`, `PO-4500001235`, `PO-4500001238`. |
| **Vendor 2** | `vendor2@example.com` | `password123` | Rihand | XYZ Steel Industries (`V1002`): Open POs `PO-4500001236`, `PO-4500001237`. |
| **VPD Operator** | `vpd@ntpc.co.in` | `password123` | Dadri | VIM Processing Desk: Basic/line-item validation, exception resolution. |
| **EIC Operator** | `eic@ntpc.co.in` | `password123` | Dadri | Engineer-in-Charge: Work order certification, GR/SES sign-off. |
| **VPG Operator** | `vpg@ntpc.co.in` | `password123` | Dadri | Vendor Payment Group: Commercial deductions (retention, advance adjustments). |
| **Finance Officer**| `finance@ntpc.co.in` | `password123` | Dadri | Finance Treasury: Final payment approval, UTR entry, payment hold (`ON_HOLD`). |
| **HR Admin** | `hr@ntpc.co.in` | `password123` | Dadri | Human Resources: Employee leave and travel claim processing. |

---

## 6. Run Locally

### Prerequisites
- Node.js `v18.0.0` or higher (`node -v`)
- npm `v9.0.0` or higher (`npm -v`)
- MongoDB running locally on port `27017` or a MongoDB Atlas connection URI

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/apoorvmisra31/NTPC-VIMS.git
cd NTPC-VIMS

# 2. Configure and start backend
cd backend
npm install
cp .env.example .env    # Verify MONGODB_URI (e.g. mongodb://localhost:27017/ntpc_vims)

# WARNING: Destructive command — drops existing User, PO, Invoice, and DPDocument collections
npm run seed

npm run dev             # Server listens on http://localhost:5001

# 3. Configure and start frontend (in a separate terminal)
cd ../frontend
npm install
echo "VITE_API_URL=http://localhost:5001" > .env.development
npm run dev             # Vite dev server starts on http://localhost:5173
```

*One-step runner (macOS/Linux)*: Run `chmod +x start-dev.sh && ./start-dev.sh` (requires local `mongod`).

### Verified Local Endpoints
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001/api`
- **API Health Check**: `http://localhost:5001/health`
- **Swagger Documentation**: `http://localhost:5001/api-docs`

---

## 7. Live Demo

- **Deployment Status**: Configured for decoupled cloud hosting with frontend SPA rewrites in [`frontend/vercel.json`](file:///frontend/vercel.json) (Vercel) and REST API hosting on Render/Node.js with MongoDB Atlas.
- **Active Deployment**: The project is currently hosted locally for development and demonstration. To deploy live, follow the Vercel & Render configuration steps with your MongoDB Atlas URI.

---

## 8. Disclaimer

> **Academic Simulation Project**: NTPC-VIMS is an independent educational simulation and architectural portfolio project developed for enterprise software training. This project is **not an official product of NTPC Limited** and is **not affiliated with, authorized, or endorsed by NTPC Limited, SAP SE, or OpenText Corporation**.
