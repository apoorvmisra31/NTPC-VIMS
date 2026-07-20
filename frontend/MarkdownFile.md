**NTPC LIMITED**

National Thermal Power Corporation

**ENTERPRISE INTERNSHIP PROJECT**

ENHANCED REQUIREMENT SPECIFICATION

**SAP-Integrated Vendor Invoice Management**

**& HR Workflow Simulation Platform (VIMS+)**

**⚠ SIMULATION PLATFORM — NOT A REAL SAP SYSTEM**

Inspired by NTPC Flipper Portal (OpenText VIM 7.6 SPS7) for Academic Demonstration

Prepared for Industry-Level Internship Development | Full-Stack Enterprise Web Application

# 1\. Executive Summary & Project Context

This document defines the full requirement specification for an industry-level internship project that simulates the NTPC Vendor Invoice Management System (VIMS), powered by OpenText SAP VIM 7.6 SPS7 and the Flipper Vendor Portal. The simulation faithfully replicates the real-world business process observed at NTPC while remaining a fully self-contained academic web application built on modern open-source technologies.

## 1.1 Real-World Reference: NTPC Flipper + VIM

The reference system is composed of two integrated subsystems used operationally at NTPC power stations:

→ Flipper Portal (OpenText) — A vendor-facing web application at https://ebillpravesh.ntpc.co.in/flipper, used for invoice submission, PO management, payment advice download, SES documents, and vendor-NTPC messaging.

→ VIM Workplace (/OPT/VIM\_WP) — An SAP back-end processing environment where VIM Processing Desk (VPD), Engineer-in-Charge (EIC), and Vendor Payment Group (VPG) operators validate DP documents, resolve exception flags, manage approvals, and post invoices to SAP.

→ VIM Analytics (/OPT/VIM\_VA2) — Reporting and analytics module covering invoice trends, plant-wise data, MSME/TReDS flags, and payment status across CAPEX/OPEX categories.

## 1.2 Project Mission

Build a full-stack enterprise web application that:

→ Replicates the Flipper vendor-facing portal with all 7 invoice types and sub-workflows.

→ Simulates the SAP VIM DP-document lifecycle (ingestion → OCR extraction → validation → exceptions → posting → payment advice).

→ Implements role-based multi-stage approval chains modelled on actual NTPC user roles.

→ Demonstrates analytics, audit trails, and compliance-grade document management.

→ Includes HR SAP portal simulation and plant monitoring dashboard.

# 2\. Technology Stack

| Frontend Framework | React 18 (Vite build tool) |
| --- | --- |
| UI Component Library | Ant Design 5.x (primary) + Material UI v5 (secondary) |
| State Management | Zustand (global) + React Query v5 (server state/caching) |
| Charts & Graphs | Recharts + ApexCharts (plant monitoring) |
| PDF Handling | react-pdf (viewer) + pdf-lib (annotation simulation) |
| Backend Runtime | Node.js 20 LTS |
| Backend Framework | Express.js 4.x with modular router structure |
| Authentication | JWT (jsonwebtoken) + bcryptjs + refresh token rotation |
| Database | MongoDB 7.x via Mongoose ODM (MongoDB Compass for local dev) |
| File Uploads | Multer + custom digital-signature validation middleware |
| Real-time Notifications | Socket.IO 4.x |
| Email (simulated) | Nodemailer (Ethereal SMTP for dev) |
| PDF Generation | PDFKit (payment advice, DP documents) |
| API Documentation | Swagger UI via swagger-jsdoc |
| Testing | Jest + Supertest (backend) | Vitest + React Testing Library (frontend) |
| Containerization | Docker + docker-compose (optional, for deployment demo) |
| Deployment (free tier) | Render.com (backend) + Vercel (frontend) + MongoDB Atlas (DB) |

# 3\. User Roles & Permissions (RBAC)

The role model is directly inspired by NTPC's production system user taxonomy. Each role maps to real NTPC system roles.

### 3.1 Vendor (Flipper User)

→ Registers via email invite link (simulating vimspayment@ntpc.co.in flow).

→ Can manage up to 4 sub-users under the same vendor account (User Management feature).

→ Submits invoices of all 7 types with mandatory document checklist per type.

→ Views Open POs, Draft/Submitted/Unpaid invoices on dashboard.

→ Downloads Payment Advice and SES PDF documents.

→ Uses in-portal messaging to communicate with NTPC operators.

### 3.2 VIM Processing Desk / Validator (VPD)

→ Receives DP documents after OCR extraction in VIM Workplace inbox.

→ Reviews and corrects extracted data on Basic Data, Line Items, Accounting, Tax, and Other Data tabs.

→ Resolves exception flags (business rule violations) before approval routing.

→ Can Refer documents to HR Department, Tax Department, C&M, or Finance.

→ Can initiate Return to Vendor (RTV) process with reason codes.

### 3.3 Engineer-in-Charge (EIC L1)

→ Ingests invoices via EIC/DAK channel (simulated T-code ZVIMEICDAK).

→ Uses Get Proposal feature to auto-populate PO proposal lines.

→ Certifies invoices under 'Certification by EIC' business rule (mandatory).

→ Handles Retention Release, Cover Invoice, TReDS/LSC linking, and PO Remarks.

→ Addresses red-flagged MIR7 validation failures (Proc Type 885 and below).

### 3.4 Vendor Payment Group (VPG L1)

→ Final approver before invoice is posted to SAP (simulated).

→ Sets Payment Group (V=Vendor, F=Fuel, E=Employee) and Payment Type (Running Bill, PVC Bill, Final Bill).

→ Handles Third-Party Payment configuration and Cumulative Pay Order deductions.

→ Can refer to Tax Department and Finance Department exclusively.

### 3.5 Finance / Manager Approver

→ Reviews and approves invoices referred by VPG for financial posting sign-off.

→ Manages payment method codes: Q (Opex), A (Capex), D (DD), C (Cheque), T (Third-Party), 3 (TReDS), L (LC/LSC).

→ Generates simulated payment advice documents after approval.

### 3.6 HR Admin

→ Manages employee leave requests, travel claims, and reimbursements.

→ Approves or rejects HR workflow items with comments.

→ Generates HR reports for attendance and payroll data.

### 3.7 System Admin

→ Full system access: role assignment, workflow configuration, user management, audit log review.

→ Configures plant details, company codes, PO validation rules, and document checklists.

→ Manages VIM Analytics report parameters and notification templates.

# 4\. Core Module Specifications

## 4.1 Module 1 — Flipper Vendor Portal (Invoice Submission)

Faithfully replicates the NTPC Flipper Portal (https://ebillpravesh.ntpc.co.in/flipper).

### 4.1.1 Vendor Registration & Authentication

→ Admin-initiated registration: System Admin sends invite link via simulated email (Nodemailer).

→ Vendor clicks link, sets password (old-password + new-password flow as per real Flipper).

→ Login with Email ID as username. JWT issued on successful auth.

→ Forgot Password: Email reset link flow (15-minute expiry token).

→ Digital signature validation simulated: Multer middleware checks PDF metadata for DS properties.

### 4.1.2 Vendor Dashboard

→ Four summary cards: Open Purchase Orders | Draft Invoices | Submitted/Unpaid Invoices | Last 90 Days Activity.

→ Cards are filterable by PO Number. Clicking any card opens the detailed list view.

→ Quick-access tiles for: Submit Invoice, Reports, Administration, Messages.

### 4.1.3 Purchase Order Management

→ Table of open and closed POs with export to Excel (xlsx).

→ PO detail view: Line item breakdown with quantity, rate, amount, GR/SES status.

→ PO Number Validation service: On invoice submission, system validates PO and auto-populates vendor/plant details.

### 4.1.4 Invoice Submission — All 7 Types

Each invoice type has a distinct workflow and mandatory document checklist (replicating NTPC's subtype-based checklist system):

• 1. PO Invoice (Standard): Select PO(s) from list → Process Invoice popup → Fill mandatory fields → Document checklist → Preview (select bank details) → Submit. Only one invoice per upload; only one PO per invoice.

• 2. Advance Payment: Enter PO No → Validate PO (mandatory, service call) → Fill fields → Upload digitally signed invoice + supporting docs → Preview → Submit. Material POs only for certain subtypes.

• 3. Credit Memo (Credit Note): Select an already-invoiced PO → System auto-fills invoice reference & line items → Upload signed credit memo → Submit.

• 4. Retention Release: PO validation → Mandatory fields → Retention type selection (SD, Safety, MRC, COF, PGT, EIC Ret) → Upload docs → Submit.

• 5. Subsequent Debit: PO validation → Reason code entry (auto-populated from Flipper for Flipper channel) → Upload → Submit.

• 6. Dispatch Payment: Material POs ONLY (non-material POs blocked by PO validation response) → Fill dispatch details → Submit.

• 7. Custom Duty & Others: For imported material customs and miscellaneous charges → PO validation → Upload → Submit.

### 4.1.5 Invoice Subtypes (O&M / Civil)

→ O&M Bills: Subtype selection — RAB (Running Account Bill) or Final Bill.

→ Civil Works: Subtype — O&M Civil or Package Civil.

→ Mandatory document checklist dynamically changes based on Invoice Type + Subtype combination.

### 4.1.6 Digital Signature Validation

→ Simulate DS check: Uploaded PDFs are parsed for signature metadata (pdf-lib). A validity badge shown on document checklist.

→ Signed documents show green DS-valid icon; unsigned or print-saved PDFs flagged with warning.

→ Do's & Don'ts checklist enforced: one invoice per upload, no combined invoices, no print-saved PDFs.

### 4.1.7 Invoice Preview & Bank Selection

→ Before final submission, vendor sees a preview of all entered data.

→ Vendor selects bank account from registered bank details list.

→ Submit from Preview page creates final invoice record and triggers VIM DP document creation.

### 4.1.8 Payment Advice & SES Download

→ Payment Advice: Available for invoices where payment has been processed. Download button enabled in invoice grid Actions column.

→ SES Document: SES PDF available against SES line items. Download button in invoice grid.

### 4.1.9 Vendor Sub-User Management

→ Vendor Admin can add up to 4 sub-users (email-based invite).

→ Sub-users get invoice submission rights. Admin can enable/disable sub-user accounts.

→ Admin can view invoice reports for all sub-users under the same vendor code.

### 4.1.10 Vendor–NTPC Messaging

→ Per-invoice message thread. Vendor posts query; VPD/EIC responds in same thread.

→ Real-time Socket.IO push notifications when new messages arrive.

### 4.1.11 Vendor Reports (6 Standard Reports)

• 1. Number of invoices posted for a given period

• 2. Invoice status report for a given period

• 3. Payment status report

• 4. Total invoice count vs. paid amount for the year (bar chart)

• 5. Number of logins

• 6. Login status per user (for vendor admin)

## 4.2 Module 2 — VIM Workplace Simulation (SAP Back-End)

Simulates the VIM Workplace (/OPT/VIM\_WP) — the NTPC internal processing environment for invoice validation and approval.

### 4.2.1 Invoice Ingestion Channels

→ Flipper Channel: Automatic ingestion when vendor submits via Flipper portal.

→ EIC/DAK Channel (simulated): EIC user enters PO number → PO validation → invoice fields → Get Proposal → line items auto-populated → document upload → Execute → Reg-ID generated.

### 4.2.2 DP Document Creation

→ On successful ingestion, a DP Document is auto-created with a unique DP-ID.

→ DP document is linked to the invoice image. OCR extraction simulated: system pre-fills extracted fields from submitted form data.

→ DP document enters VPD's My Inbox in the VIM Workplace.

### 4.2.3 VIM Workplace Inbox (Personal View)

→ Three inbox tabs: My Inbox (awaiting action), My Pending (action done, awaiting another user), My Completed (posted or marked obsolete).

→ Selection Pane filters: Vendor Code, DP-ID, Plant, Invoice Type, Date Range, Priority flag.

→ Bulk action: Refer multiple items to one individual simultaneously.

→ Sortable, customizable column layout (show/hide columns).

→ Show-500 limit control for performance.

### 4.2.4 DP Document Processing Tabs

Each DP document has 8 processing tabs replicating the real VIM screen:

• Basic Data Tab: Vendor Data, PO Number, Company Code, Partner Bank, GST Partner, GSTIN, Gross Amount, Exception reason display.

• Line Items Tab: PO Reference and G/L Account sub-tabs. Line item proposal feature (MIR7/MIRO-style). EIC can adopt proposal lines.

• Accounting Tab: Baseline Date, Payment Terms, Business Area, Business Place, Section Code. Payment Method codes (Q/A/D/C/T/3/L).

• Tax Tab: GST details, Withholding Tax, Other applicable taxes.

• Process Tab: Duplicate invoice detection, technical DP metadata, Priority Payment flag (red-highlighted rows for urgent/SME/MSME).

• Other Data Tab: Payment Group (V/F/E), Payment Type (Running Bill/PVC Bill/Final Bill/Others). BG Display, GeMPO Indicator, Gem Order ID, Cover Invoice checkbox, ECM Approval Number, DOP Clause/Section (auto-fetch), TReDS/LSC selector, SES display, PO Remarks, Certifications by EIC, Third-Party Payment requisition display.

• Cumulative Pay Order Tab: Retention & deduction codes/amounts → auto-generates retention documents on posting. Shows cumulative Gross Amount, Retention Amount, Deduction Amount.

• History Tab: Full audit trail of all actions taken on the DP document (who, what, when).

### 4.2.5 Business Rules / Exception Flags System

→ Business rules determined by Document Type. Rules can be bypassed (configurable per rule).

→ All rules at Proc Type ≤ 885 (MIR7 validation failures) flagged red; must be resolved by EIC L1 before approval.

→ Clicking Message button on a red-flagged rule shows detailed error description.

→ Exception flag examples: Missing GSTIN, GR/SES quantity mismatch, duplicate invoice number, missing mandatory document, PO line quantity exceeded, bank detail mismatch.

### 4.2.6 Refer & Return to Vendor

→ Refer Option (EIC and VPG): Refer document to VIM Processing Desk, EIC L1, C&M, HR Department, VPG L1, Tax Department (VPG only), Finance/IF Department (VPG only). Refer reason is mandatory.

→ Return to Vendor (RTV): Opens RTV details screen → email triggered to vendor via SAP Connect (simulated Nodemailer) → DP document marked Obsolete → DP workflow completed. RTV reason codes selectable.

### 4.2.7 Invoice Posting Simulation & Payment Advice

→ After all exceptions resolved and VPG L1 final approval: Simulated posting — invoice status updated to 'Posted', accounting entry created in AuditLogs.

→ Payment run simulation: Status updated to 'Paid'. Payment Advice PDF generated (PDFKit) with payment details.

→ Payment status and advice reflected back in Flipper vendor view.

### 4.2.8 Special Invoice Processes

→ Cover Invoice: EIC uploads Excel file via Upload File tab with Cover Invoice checkbox selected.

→ Third-Party Payment: DP-ID entered in ZFI\_TP01 equivalent. Payee set to default (1020770). Payment method set to 'T'.

→ Miscellaneous PO: ECM Approval Number entry → auto-populate DOP Clause/Section. Manual entry fallback.

→ Advance Invoice Business Rules: Separate rule set for advance processing.

→ Retention Release: EIC enters proposed EIC Amount in Retention Release tab → Adopt → DP Doc field validation.

## 4.3 Module 3 — VIM Analytics Dashboard

Simulates /OPT/VIM\_VA2 — Vendor Invoice Analytics (VAN).

→ Filter panel: Plant, DP-ID, Date Range, TReDS flag, MSME flag, GeM flag, Plant Group (SSC), Payment Group (V/F/E), CAPEX/OPEX.

→ Charts: Invoice status distribution (pie), invoices over time (line), plant-wise volume (bar), exception rate trend (area).

→ Drill-down: Click chart segment to see filtered invoice list.

→ Export: Full report export to Excel and PDF.

## 4.4 Module 4 — HR SAP Portal Simulation

### Leave Management

→ Leave types: Earned Leave, Casual Leave, Medical Leave, Compensatory Off.

→ Employee submits leave request. Manager approves/rejects with comments.

→ Leave balance tracking per employee. Calendar view of approved leaves.

### Attendance Tracking

→ Simulated attendance records (in/out timestamps). Monthly summary report.

→ Flag late arrivals, absences, and WFH days.

### Travel & Reimbursement

→ Employee submits travel claim with: travel dates, destination, mode, lodging, meal allowances, receipts upload.

→ Manager approval workflow. Finance processes reimbursement after approval.

→ Status tracking: Draft → Submitted → Manager Approved → Finance Processed.

### Employee Profile Dashboard

→ Personal details, designation, department, plant assignment, manager hierarchy.

→ Leave history, travel history, payslip stubs (simulated).

## 4.5 Module 5 — Plant Monitoring Dashboard (Simulation)

→ Real-time parameter simulation: Load (MW), RPM, Temperature (°C), Pressure (Bar), Efficiency (%).

→ Parameter cards with status indicators (Normal / Warning / Critical).

→ Line graphs with 60-second rolling window using WebSocket push (Socket.IO).

→ Configurable alert thresholds. Alert history log.

→ Multiple unit view: Switch between generating units.

## 4.6 Module 6 — Admin Panel

→ Role Assignment: Assign/revoke roles for any user. Grant vendor admin rights.

→ Workflow Configuration: Define approval chains per invoice type. Configure which business rules are bypassable.

→ Document Checklist Config: Set mandatory supporting documents per invoice type + subtype combination.

→ Plant & Company Code Management: Add/edit plant details (used in PO validation simulation).

→ Report Generation: Cross-module reports with date/role/status filters. Export to Excel/PDF.

→ Audit Log Viewer: Searchable log of all system events.

→ Notification Template Management: Configure email templates for various system events.

# 5\. MongoDB Schema Design

All collections are designed for the 500MB MongoDB Atlas free tier. References (ObjectId) are used over embedding for large related datasets to control document size.

### 5.1 users

| Collection / Field | Type | Description / Notes |
| --- | --- | --- |
| _id | ObjectId | Auto-generated primary key |
| email | String | Unique. Used as login ID for vendors |
| passwordHash | String | bcrypt hash |
| role | String (enum) | vendor | vpd | eic | vpg | finance | hr_admin | sys_admin |
| vendorCode | String | NTPC vendor code (vendors only) |
| parentVendor | ObjectId ref users | For sub-users under vendor admin |
| plantCode | String | Assigned plant (internal users) |
| isActive | Boolean | Account enabled/disabled |
| profile | Object | { name, phone, designation, department } |
| bankDetails | [Object] | Array of { bankName, accountNo, ifsc, isPrimary } |
| lastLogin | Date | Timestamp of last successful login |
| createdAt / updatedAt | Date | Timestamps |

### 5.2 purchaseOrders

| Collection / Field | Type | Description / Notes |
| --- | --- | --- |
| _id | ObjectId | Auto-generated |
| poNumber | String | Unique PO number (e.g. 4000000899) |
| vendorCode | String | Linked vendor |
| plantCode | String | Plant reference |
| companyCode | String | SAP company code |
| poType | String (enum) | Material | Service |
| status | String (enum) | Open | Closed | Partial |
| totalValue | Number | Total PO value |
| currency | String | Default INR |
| lineItems | [Object] | Array of { lineNo, description, qty, unit, rate, grQty, sesNo } |
| capexOpex | String (enum) | CAPEX | OPEX |
| createdAt | Date |  |

### 5.3 invoices

| Collection / Field | Type | Description / Notes |
| --- | --- | --- |
| _id | ObjectId |  |
| referenceNumber | String | Portal-generated reference (e.g. INV-2024-00123) |
| vendorCode | String |  |
| submittedBy | ObjectId ref users |  |
| invoiceType | String (enum) | PO | Advance | CreditMemo | RetentionRelease | SubsequentDebit | Dispatch | CustomDuty |
| invoiceSubtype | String | RAB | FinalBill | Civil_OM | Civil_Package | etc. |
| channel | String (enum) | Flipper | EIC | DAK |
| poNumber | String |  |
| invoiceNumber | String | As per physical invoice |
| invoiceDate | Date |  |
| grossAmount | Number |  |
| currency | String | INR |
| bankDetailId | String | Selected bank from vendor's bank list |
| documents | [Object] | Array of { docType, fileName, fileUrl, isSigned, uploadedAt } |
| checklistItems | [Object] | Array of { itemName, isMandatory, isChecked } |
| status | String (enum) | Draft | Submitted | Processing | Posted | Paid | Rejected | Obsolete |
| paymentAdviceUrl | String | URL to generated PDF (post-payment) |
| sesLineItems | [Object] | SES reference data |
| submittedAt | Date |  |
| createdAt / updatedAt | Date |  |

### 5.4 dpDocuments

| Collection / Field | Type | Description / Notes |
| --- | --- | --- |
| _id | ObjectId |  |
| dpId | String | Unique DP-ID (e.g. DP-2024-00456) |
| invoiceRef | ObjectId ref invoices |  |
| assignedTo | ObjectId ref users | Current processor |
| inboxStatus | String (enum) | MyInbox | MyPending | MyCompleted |
| basicData | Object | { vendorData, poNumber, companyCode, partnerBank, gstin, grossAmount, exceptionReason } |
| lineItems | [Object] | Proposed + adopted line items |
| accountingData | Object | { baselineDate, paymentTerms, businessArea, businessPlace, sectionCode, paymentMethod } |
| taxData | Object | { gst, withholdingTax, otherTaxes } |
| otherData | Object | { paymentGroup, paymentType, gemPoIndicator, coverInvoice, ecmApprovalNo, dopClause, certificationByEIC, thirdPartyPayment, tredsLsc } |
| cumulativePayOrder | [Object] | { retentionCode, amount } — for deductions |
| priorityFlag | Boolean | Red-row priority payment |
| referHistory | [Object] | Array of { referredTo, reason, referredBy, referredAt, resolvedAt } |
| rtvData | Object | { reason, sentAt, emailLog } — if Return to Vendor used |
| workflowStage | String (enum) | VPD_Review | EIC_Review | VPG_Review | Finance_Review | Posted | Obsolete |
| exceptions | [Object] | Array of { ruleCode, procType, description, status, resolvedBy, resolvedAt } |
| createdAt / updatedAt | Date |  |

### 5.5 approvals

| Collection / Field | Type | Description / Notes |
| --- | --- | --- |
| _id | ObjectId |  |
| dpDocRef | ObjectId ref dpDocuments |  |
| stage | String | VPD | EIC | VPG | Finance |
| approverRef | ObjectId ref users |  |
| action | String (enum) | Approved | Rejected | Referred | RTV | Pending |
| comments | String |  |
| timestamp | Date |  |

### 5.6 hrLeaves

| Collection / Field | Type | Description / Notes |
| --- | --- | --- |
| _id | ObjectId |  |
| employeeRef | ObjectId ref users |  |
| leaveType | String (enum) | Earned | Casual | Medical | CompOff |
| fromDate / toDate | Date |  |
| days | Number | Calculated working days |
| reason | String |  |
| status | String (enum) | Draft | Submitted | Approved | Rejected |
| approverRef | ObjectId ref users |  |
| approverComments | String |  |
| createdAt | Date |  |

### 5.7 travelClaims

| Collection / Field | Type | Description / Notes |
| --- | --- | --- |
| _id | ObjectId |  |
| employeeRef | ObjectId ref users |  |
| travelDate | Date |  |
| destination | String |  |
| purpose | String |  |
| mode | String (enum) | Air | Rail | Road | Local |
| lodgingAmount / mealAmount / transportAmount | Number |  |
| receipts | [String] | File URLs |
| totalAmount | Number |  |
| status | String (enum) | Draft | Submitted | ManagerApproved | FinanceProcessed | Rejected |
| createdAt | Date |  |

### 5.8 notifications

| Collection / Field | Type | Description / Notes |
| --- | --- | --- |
| _id | ObjectId |  |
| recipientRef | ObjectId ref users |  |
| type | String (enum) | InvoiceSubmitted | DPCreated | ExceptionRaised | ApprovalRequired | StatusUpdate | Message | RTV | PaymentAdvice |
| message | String |  |
| relatedDoc | String | DP-ID or Invoice reference |
| isRead | Boolean |  |
| createdAt | Date |  |

### 5.9 auditLogs

| Collection / Field | Type | Description / Notes |
| --- | --- | --- |
| _id | ObjectId |  |
| actorRef | ObjectId ref users | User who performed action |
| action | String | e.g. INVOICE_SUBMITTED, DP_CREATED, EXCEPTION_RESOLVED |
| entityType | String | Invoice | DPDocument | User | PO | HRLeave |
| entityId | ObjectId |  |
| details | Object | Before/after snapshot or metadata |
| ipAddress | String |  |
| timestamp | Date | Indexed for range queries |

### 5.10 messages

| Collection / Field | Type | Description / Notes |
| --- | --- | --- |
| _id | ObjectId |  |
| invoiceRef | ObjectId ref invoices |  |
| senderRef | ObjectId ref users |  |
| senderRole | String | Vendor or NTPC operator role |
| message | String |  |
| attachments | [String] | Optional file URLs |
| createdAt | Date | Indexed |

# 6\. Backend REST API Routes

### 6.1 Auth Routes — /api/auth

| Method | Endpoint | Auth Role | Description |
| --- | --- | --- | --- |
| POST | /register-invite | sys_admin | Admin sends vendor registration invite email |
| POST | /complete-registration | Public | Vendor sets password from invite link token |
| POST | /login | Public | JWT + refresh token issued |
| POST | /refresh-token | Public | Rotate refresh token |
| POST | /logout | Authenticated | Invalidate refresh token |
| POST | /forgot-password | Public | Send reset link |
| POST | /reset-password | Public | Validate token, set new password |

### 6.2 Vendor / PO Routes — /api/vendor

| Method | Endpoint | Auth Role | Description |
| --- | --- | --- | --- |
| GET | /dashboard | vendor | Summary card counts |
| GET | /purchase-orders | vendor | List open & closed POs with filters |
| GET | /purchase-orders/:poNumber | vendor | PO line item detail |
| POST | /validate-po | vendor | eic | PO number validation & plant auto-populate |
| GET | /proposal/:poNumber | eic | Get proposal lines for PO (EIC Get Proposal) |
| GET | /sub-users | vendor_admin | List sub-users |
| POST | /sub-users | vendor_admin | Add sub-user (sends invite) |
| PATCH | /sub-users/:id/toggle | vendor_admin | Enable/disable sub-user |

### 6.3 Invoice Routes — /api/invoices

| Method | Endpoint | Auth Role | Description |
| --- | --- | --- | --- |
| GET | / | vendor | vpd | eic | vpg | finance | List invoices with filters |
| GET | /:id | Authenticated | Invoice detail |
| POST | /submit/po | vendor | eic | Submit PO Invoice |
| POST | /submit/advance | vendor | eic | Submit Advance Payment |
| POST | /submit/credit-memo | vendor | eic | Submit Credit Memo |
| POST | /submit/retention-release | vendor | eic | Submit Retention Release |
| POST | /submit/subsequent-debit | vendor | eic | Submit Subsequent Debit |
| POST | /submit/dispatch | vendor | eic | Submit Dispatch Payment |
| POST | /submit/custom-duty | vendor | eic | Submit Custom Duty |
| GET | /:id/payment-advice | vendor | finance | Download payment advice PDF |
| GET | /:id/ses-document | vendor | Download SES PDF |
| PATCH | /:id/save-draft | vendor | Save as draft |

### 6.4 DP Document Routes — /api/dp

| Method | Endpoint | Auth Role | Description |
| --- | --- | --- | --- |
| GET | /workplace/inbox | vpd | eic | vpg | finance | Personal view inbox (my-inbox / pending / completed) |
| GET | /:dpId | vpd | eic | vpg | finance | Full DP document with all tabs |
| PATCH | /:dpId/basic-data | vpd | Update basic data tab |
| PATCH | /:dpId/line-items | eic | vpd | Update / adopt line items |
| PATCH | /:dpId/accounting | vpd | vpg | Update accounting tab |
| PATCH | /:dpId/tax | vpd | Update tax tab |
| PATCH | /:dpId/other-data | eic | vpd | vpg | Update other data tab |
| PATCH | /:dpId/cumulative | eic | vpg | Update cumulative pay order |
| POST | /:dpId/resolve-exception | eic | vpd | Mark exception as resolved |
| POST | /:dpId/refer | eic | vpg | Refer to another role |
| POST | /:dpId/return-to-vendor | vpd | eic | Initiate RTV process |
| POST | /:dpId/approve | vpd | eic | vpg | finance | Stage approval action |
| POST | /:dpId/post | finance | Simulate invoice posting |
| GET | /:dpId/history | Authenticated | Full DP document history/timeline |

### 6.5 Analytics — /api/analytics

| Method | Endpoint | Auth Role | Description |
| --- | --- | --- | --- |
| GET | /vim-summary | vpd | eic | vpg | finance | sys_admin | Aggregate counts by status, plant, type |
| GET | /invoice-trends | vpd | vpg | sys_admin | Time-series data for charts |
| GET | /exception-report | sys_admin | Exception frequency by rule code |
| GET | /payment-status | vendor | finance | CAPEX/OPEX/TReDS/MSME breakdown |

### 6.6 HR Routes — /api/hr

| Method | Endpoint | Auth Role | Description |
| --- | --- | --- | --- |
| GET | /leaves | employee | hr_admin | List leave requests |
| POST | /leaves | employee | Submit leave request |
| PATCH | /leaves/:id | hr_admin | manager | Approve/reject leave |
| GET | /travel-claims | employee | hr_admin | List travel claims |
| POST | /travel-claims | employee | Submit travel claim |
| PATCH | /travel-claims/:id/approve | manager | Manager approval |
| PATCH | /travel-claims/:id/process | finance | Finance processing |

### 6.7 Admin Routes — /api/admin

| Method | Endpoint | Auth Role | Description |
| --- | --- | --- | --- |
| GET | /users | sys_admin | All users with filters |
| PATCH | /users/:id/role | sys_admin | Assign/change role |
| GET | /workflow-config | sys_admin | Approval chain config |
| PUT | /workflow-config | sys_admin | Update workflow config |
| GET | /checklist-config | sys_admin | Document checklists per type/subtype |
| PUT | /checklist-config | sys_admin | Update checklists |
| GET | /audit-logs | sys_admin | Paginated audit logs |
| GET | /reports/generate | sys_admin | Cross-module report export |

# 7\. React Component Hierarchy

### 7.1 App Shell

→ App.jsx — Router (React Router v6), Theme Provider, AuthContext, SocketContext

• AuthLayout — Login, Register, ForgotPassword, ResetPassword

• PrivateRoute — Role-based route guard

• DashboardLayout — Sidebar + TopBar + Notification Bell + Content Outlet

### 7.2 Shared / Common Components

→ StatusBadge — Color-coded status chip (Draft/Submitted/Posted/Paid/Rejected)

→ DocumentChecklist — Dynamic checklist renderer with DS-valid icons

→ InvoicePreviewModal — Preview modal with bank selection before submit

→ TimelineTracker — Workflow timeline with stage-by-stage status (VPD→EIC→VPG→Finance)

→ FileUploader — Multer-backed uploader with DS validation feedback

→ NotificationDrawer — Real-time notification panel (Socket.IO)

→ MessageThread — Per-invoice vendor-NTPC message thread

→ AuditLogTable — Searchable/filterable audit log viewer

→ ExportButton — Excel/PDF export trigger

### 7.3 Vendor Portal Components

→ VendorDashboard — 4 summary cards + quick-access tiles

→ POList / PODetail — Purchase order table & line item detail

→ SubmitInvoiceMenu — Type selector (7 invoice types) dropdown

→ POInvoiceForm / AdvanceForm / CreditMemoForm / RetentionForm / SubsequentDebitForm / DispatchForm / CustomDutyForm — Per-type submission forms

→ SubtypeSelector — O&M / Civil subtype picker with dynamic checklist

→ POValidationWidget — Inline PO validate button + plant auto-populate

→ BankSelector — Bank detail selection in Preview step

→ VendorInvoiceGrid — Invoice list with Payment Advice & SES download actions

→ VendorReports — 6 standard report views with chart rendering

→ SubUserManagement — Add/disable sub-users, view sub-user invoice activity

### 7.4 VIM Workplace Components

→ VIMWorkplace — Personal View container with My Inbox / My Pending / My Completed tabs

→ WorkplaceSelectionPane — Vendor code, DP-ID, Plant, date filters + Apply/Reset

→ DocumentInbox — DP document list with sortable/customizable columns, bulk action, Show-500 control

→ DPDocumentView — Master container for all 8 DP tabs

• BasicDataTab / LineItemsTab / AccountingTab / TaxTab / ProcessTab / OtherDataTab / CumulativeTab / HistoryTab

→ ExceptionFlagList — Business rules table with red/green status, Message detail viewer

→ ReferModal — Refer-to selector with mandatory reason field

→ RTVModal — Return to Vendor flow with reason code, preview, send steps

→ EICIngestionForm — DAK/EIC channel invoice ingestion (simulated T-code)

→ PriorityPaymentToggle — Mark DP as priority (red row in workplace)

### 7.5 Analytics Components

→ VIMAnalyticsDashboard — Filter panel + chart grid

→ InvoiceStatusPie / InvoiceTrendLine / PlantVolumeBar / ExceptionRateArea — Chart components

→ AnalyticsFilterPanel — All VIM Analytics filters (Plant, TReDS, MSME, GeM, CAPEX/OPEX)

### 7.6 HR Portal Components

→ HRDashboard — Employee profile + leave balance + quick actions

→ LeaveRequestForm / LeaveList / LeaveApprovalTable

→ AttendanceCalendar / AttendanceSummaryCard

→ TravelClaimForm / TravelClaimList / TravelApprovalQueue

### 7.7 Plant Monitoring Components

→ PlantDashboard — Unit selector + parameter card grid

→ ParameterCard — Value + status indicator (Normal/Warning/Critical)

→ RollingLineChart — 60-second WebSocket-fed chart (ApexCharts)

→ AlertThresholdConfig — Set min/max thresholds per parameter

→ AlertHistoryLog — Triggered alert list

### 7.8 Admin Components

→ UserRoleManager — User list with role assignment controls

→ WorkflowConfigurator — Drag-and-drop approval chain builder per invoice type

→ ChecklistConfigurator — Checklist item management per type+subtype matrix

→ AdminReportBuilder — Filter + generate + export cross-module reports

# 8\. Full Project Folder Structure

ntpc-vims-simulation/ ├── client/ # React frontend (Vite) │ ├── public/ │ ├── src/ │ │ ├── api/ # Axios instances & API call functions │ │ │ ├── authApi.js │ │ │ ├── invoiceApi.js │ │ │ ├── dpApi.js │ │ │ ├── vendorApi.js │ │ │ └── hrApi.js │ │ ├── assets/ # Logos, icons, NTPC branding │ │ ├── components/ │ │ │ ├── common/ # StatusBadge, FileUploader, Timeline, etc. │ │ │ ├── vendor/ # Vendor portal components │ │ │ ├── vim/ # VIM Workplace components │ │ │ ├── analytics/ # VIM Analytics charts │ │ │ ├── hr/ # HR portal components │ │ │ ├── plant/ # Plant monitoring components │ │ │ └── admin/ # Admin panel components │ │ ├── context/ │ │ │ ├── AuthContext.jsx │ │ │ ├── SocketContext.jsx │ │ │ └── NotificationContext.jsx │ │ ├── hooks/ # useAuth, useSocket, useInvoice, useDP │ │ ├── layouts/ │ │ │ ├── AuthLayout.jsx │ │ │ └── DashboardLayout.jsx # SAP-style sidebar + topbar │ │ ├── pages/ │ │ │ ├── auth/ # Login, Register, ForgotPassword │ │ │ ├── vendor/ # Dashboard, PO, Submit, Reports, Messages │ │ │ ├── vim/ # Workplace, DPDocument, Analytics │ │ │ ├── hr/ # Leave, Attendance, Travel │ │ │ ├── plant/ # MonitoringDashboard │ │ │ └── admin/ # UserMgmt, Workflow, Reports │ │ ├── router/ │ │ │ └── AppRouter.jsx # All routes with PrivateRoute guards │ │ ├── store/ # Zustand stores │ │ │ ├── authStore.js │ │ │ └── notificationStore.js │ │ ├── theme/ │ │ │ ├── antdTheme.js # Ant Design custom token config │ │ │ └── muiTheme.js # MUI theme (dark/light) │ │ ├── utils/ # formatters, validators, constants │ │ ├── App.jsx │ │ └── main.jsx │ ├── .env.development │ └── vite.config.js │ ├── server/ # Node.js Express backend │ ├── config/ │ │ ├── db.js # Mongoose connection │ │ ├── env.js # dotenv config │ │ └── swagger.js # Swagger/OpenAPI setup │ ├── controllers/ │ │ ├── authController.js │ │ ├── vendorController.js │ │ ├── invoiceController.js │ │ ├── dpController.js │ │ ├── analyticsController.js │ │ ├── hrController.js │ │ └── adminController.js │ ├── middleware/ │ │ ├── authMiddleware.js # JWT verification │ │ ├── roleMiddleware.js # RBAC role guard factory │ │ ├── uploadMiddleware.js # Multer + DS validation │ │ ├── auditMiddleware.js # Auto audit log writer │ │ └── errorHandler.js │ ├── models/ │ │ ├── User.js │ │ ├── PurchaseOrder.js │ │ ├── Invoice.js │ │ ├── DPDocument.js │ │ ├── Approval.js │ │ ├── HRLeave.js │ │ ├── TravelClaim.js │ │ ├── Notification.js │ │ ├── AuditLog.js │ │ └── Message.js │ ├── routes/ │ │ ├── authRoutes.js │ │ ├── vendorRoutes.js │ │ ├── invoiceRoutes.js │ │ ├── dpRoutes.js │ │ ├── analyticsRoutes.js │ │ ├── hrRoutes.js │ │ └── adminRoutes.js │ ├── services/ │ │ ├── dpService.js # DP document creation & OCR simulation │ │ ├── emailService.js # Nodemailer email templates │ │ ├── pdfService.js # PDFKit payment advice generation │ │ ├── poValidationService.js # Simulate PO validation API │ │ ├── notificationService.js # Socket.IO push + DB notification │ │ └── reportService.js # Report generation (xlsx + PDF) │ ├── sockets/ │ │ └── socketHandler.js # Socket.IO event handlers │ ├── utils/ │ │ ├── jwtUtils.js │ │ ├── exceptionRules.js # Business rules definitions │ │ └── checklistConfig.js # Checklist per invoice type/subtype │ ├── uploads/ # Local storage (dev) for invoice PDFs │ ├── app.js # Express app setup │ ├── server.js # HTTP + Socket.IO server bootstrap │ └── .env │ ├── docker-compose.yml # MongoDB + backend + frontend containers ├── .gitignore └── README.md

# 9\. Step-by-Step Implementation Roadmap

### Phase 1 — Foundation (Week 1–2)

→ Set up monorepo structure, Vite + React + Ant Design, Express + MongoDB.

→ Implement JWT auth with refresh tokens, role middleware, and audit log middleware.

→ Build AuthLayout (Login, Register, Forgot Password, Reset Password flows).

→ Seed database: 2 vendors, 1 VPD, 1 EIC, 1 VPG, 1 Finance, 1 HR Admin, 1 Sys Admin, 5 sample POs.

→ Deploy skeleton to Render.com (backend) + Vercel (frontend) + MongoDB Atlas.

### Phase 2 — Flipper Vendor Portal (Week 3–4)

→ Build Vendor Dashboard with 4 summary cards (filter by PO).

→ Implement PO list, PO detail, and PO Number Validation service.

→ Build all 7 invoice submission forms with dynamic checklist renderer.

→ Implement Digital Signature simulation (pdf-lib metadata check).

→ Add Invoice Preview + Bank Selection step.

→ Build Payment Advice PDF generation (PDFKit) and download endpoint.

→ Implement Sub-user Management and Vendor Reports (6 types).

### Phase 3 — VIM Workplace (Week 5–6)

→ Build DP Document auto-creation service triggered on invoice submission.

→ Implement VIM Workplace Personal View (3-tab inbox + selection pane).

→ Build all 8 DP Document tabs (Basic Data through History).

→ Implement Business Rules / Exception Flags engine with configurable rules.

→ Add Refer Modal, Return-to-Vendor flow (with email simulation + obsolete marking).

→ Implement multi-stage approval chain: VPD → EIC → VPG → Finance → Posting.

→ Build EIC/DAK ingestion form with Get Proposal feature.

### Phase 4 — Analytics & Messaging (Week 7)

→ Build VIM Analytics Dashboard with all 4 chart types and filter panel.

→ Implement Socket.IO real-time notifications (new DP, exception raised, message received).

→ Build per-invoice vendor-NTPC message thread with real-time updates.

→ Add export to Excel (SheetJS) and PDF (PDFKit) across all report surfaces.

### Phase 5 — HR Portal & Plant Monitoring (Week 8)

→ Build HR Leave Management, Attendance Tracking, and Travel Reimbursement modules.

→ Implement Plant Monitoring Dashboard with Socket.IO-fed simulated parameter data.

→ Add alert threshold configuration and alert history log.

### Phase 6 — Admin Panel & Polish (Week 9)

→ Build Admin Panel: User/Role Manager, Workflow Configurator, Checklist Configurator.

→ Build cross-module Admin Report Builder with date/status/role filters.

→ Implement dark/light theme toggle with NTPC branding (green accent).

→ Add lazy loading (React.lazy + Suspense) for all page-level routes.

→ Performance audit: MongoDB index review (poNumber, vendorCode, dpId, timestamp).

### Phase 7 — Testing & Documentation (Week 10)

→ Backend: Jest + Supertest for all API endpoints (auth, invoice lifecycle, DP workflow).

→ Frontend: Vitest + React Testing Library for critical form flows.

→ Write Swagger documentation for all 40+ API endpoints.

→ Prepare demo walkthrough: Vendor submits invoice → VPD processes → EIC certifies → VPG approves → Finance posts → Payment Advice generated.

→ Write README with setup instructions, .env configuration, and seeding guide.

# 10\. Non-Functional Requirements

### 10.1 Performance

→ MongoDB indexes on: poNumber, vendorCode, dpId (unique), status, workflowStage, timestamp, recipientRef.

→ React.lazy + Suspense for page-level code splitting. Ant Design Tree-shaking enabled.

→ React Query caching for PO lists and invoice grids (staleTime: 5 minutes).

→ File uploads limited to 10MB per file; chunked reading for PDF preview.

### 10.2 Security

→ JWT with 15-minute access token + 7-day refresh token (HTTP-only cookie for refresh).

→ Role middleware applied at route level — no frontend-only role checks.

→ Multer file type whitelist: PDF only for invoice documents.

→ Helmet.js for HTTP security headers. Rate limiting (express-rate-limit): 100 req/15min.

→ Input sanitization with express-validator on all POST/PATCH endpoints.

### 10.3 MongoDB 500MB Optimisation

→ Use ObjectId references instead of full document embedding for Users, POs, and Approvals.

→ Store file contents on file system (or cloud storage URL) — only metadata in MongoDB.

→ AuditLogs collection: TTL index set to 90 days (auto-expire old logs).

→ Notifications: TTL index set to 30 days for read notifications.

→ Plant monitoring data: stored in memory / Socket.IO only — not persisted to MongoDB.

### 10.4 Scalability & Maintainability

→ Modular Express router structure — adding a new module requires only a new routes/ + controllers/ + models/ set.

→ Centralized error handler with structured JSON error responses.

→ Environment-based config (dotenv). No hardcoded credentials anywhere.

→ Swagger-documented API ensures frontend-backend contract clarity.

# 11\. UI Layout & Design Language

### 11.1 Layout Structure

→ Sidebar Navigation (220px): NTPC logo, module sections (Vendor Portal / VIM Workplace / Analytics / HR / Plant / Admin). Collapsible to icon-only mode.

→ Top Bar: Breadcrumb trail, notification bell (badge count), user avatar + role badge, theme toggle (light/dark).

→ Content Area: Breadcrumb, page title, action buttons (top-right), main content.

### 11.2 SAP-Style Tile Navigation

→ Home screen for each module shows SAP-style tiles (large icon cards) for quick sub-module access.

→ Tiles display live counts (e.g. 'My Inbox: 3 items', 'Exceptions: 2 flagged').

### 11.3 NTPC Branding

→ Primary: NTPC Green (#1A6B3C). Secondary: Dark Navy (#0D2137). Accent: Enterprise Blue (#1565C0).

→ Ant Design token overrides for colorPrimary, colorBgContainer, borderRadius.

→ Light mode default; dark mode available via theme toggle (CSS variables).

### 11.4 Key UI Patterns

→ VIM Workplace inbox: Dense data table with sticky header, color-coded status, bulk select checkbox.

→ DP Document: Horizontal tab navigator (8 tabs) with save-on-tab-change behavior.

→ Exception flags: Red/green traffic-light row highlighting in business rules table.

→ Invoice submission: Multi-step form wizard (Step 1: Type/PO → Step 2: Details → Step 3: Documents → Step 4: Preview → Step 5: Confirm).

→ Plant monitoring: Dark-themed card grid with animated gauge values and rolling line charts.

# 12\. Free Resources & Tools

| MongoDB Atlas | Free 512MB cluster — cloud.mongodb.com |
| --- | --- |
| Render.com | Free tier Node.js web service (spins down on idle) |
| Vercel | Free React/Vite hosting with CI/CD from GitHub |
| Nodemailer + Ethereal | Free SMTP simulation — ethereal.email |
| pdf-lib | npm: PDF metadata reading for DS simulation |
| PDFKit | npm: Server-side PDF generation for payment advice |
| SheetJS (xlsx) | npm: Excel export for all report tables |
| Socket.IO | npm: Free real-time WebSocket layer |
| ApexCharts (react-apexcharts) | npm: Free chart library for plant monitoring |
| Recharts | npm: Free chart library for VIM analytics |
| Swagger UI Express | npm: Free API documentation UI |
| Postman | Free API testing and collection sharing |
| Draw.io | Free wireframe/architecture diagramming |
| GitHub | Free private repo, GitHub Actions for CI/CD |
| Ant Design Icons | Free icon set bundled with Ant Design |