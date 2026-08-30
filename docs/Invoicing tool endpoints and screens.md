# API Endpoints and Screens

Companion to the project brief. Organized by domain, with phase noted (1 = foundation, 2 = automation/payment, 3 = maturity), matching the brief's build phases. All authenticated routes are scoped to the caller's organization_id server-side, never trust a client-supplied org id.

---

## 1. API Endpoints

### Auth (Phase 1)
- `POST /api/v1/auth/sign-up` — create user + organization
- `POST /api/v1/auth/sign-in`
- `POST /api/v1/auth/sign-out`
- `POST /api/v1/auth/refresh` — refresh session token
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me` — current user + organization summary

### Organization / Onboarding (Phase 1)
- `GET /api/v1/organizations/me`
- `PATCH /api/v1/organizations/me` — business name, activity, tax regime, VAT registered, tax identifier, address, bank details
- `POST /api/v1/organizations/me/stamp` — upload stamp image
- `POST /api/v1/organizations/me/signature` — upload signature image
- `POST /api/v1/organizations/me/logo` — upload logo (optional)
- `DELETE /api/v1/organizations/me/stamp`
- `DELETE /api/v1/organizations/me/signature`

### Clients (Phase 1)
- `GET /api/v1/clients` — list, paginated, search by name/email
- `POST /api/v1/clients`
- `GET /api/v1/clients/:id`
- `PATCH /api/v1/clients/:id`
- `DELETE /api/v1/clients/:id`

### Invoices (Phase 1 core, Phase 2 for chatbot/payment fields)
- `GET /api/v1/invoices` — list, filter by status/client/date range
- `POST /api/v1/invoices` — manual creation (phase 1)
- `GET /api/v1/invoices/:id`
- `PATCH /api/v1/invoices/:id` — edit line items, dates, VAT, notes (only while in draft)
- `DELETE /api/v1/invoices/:id` — only allowed while draft
- `POST /api/v1/invoices/:id/send` — generates PDF/MD, public_token if not present, status → sent
- `GET /api/v1/invoices/:id/pdf`
- `GET /api/v1/invoices/:id/markdown`
- `POST /api/v1/invoices/:id/cancel`
- `POST /api/v1/invoices/:id/duplicate` — for recurring/repeat invoices (phase 3, but cheap to add early)
- `PATCH /api/v1/invoices/:id/status` — manual status override (draft/sent/paid, phase 1 fallback before payment-proof flow exists)

### Payment Proofs and Confirmation (Phase 2)
- `POST /api/v1/invoices/:id/payment-proofs` — org-side manual log, rarely used (client uploads via public route instead)
- `GET /api/v1/invoices/:id/payment-proofs`
- `POST /api/v1/payment-proofs/:proofId/confirm` — org user confirms → invoice status paid
- `POST /api/v1/payment-proofs/:proofId/reject` — with reason → invoice status disputed

### AI Chat Invoice Generation (Phase 2)
- `POST /api/v1/chat-sessions` — start a session
- `POST /api/v1/chat-sessions/:id/messages` — send a message, get bot reply + updated extracted_data
- `GET /api/v1/chat-sessions/:id` — resume a draft session
- `GET /api/v1/chat-sessions` — list open/abandoned sessions
- `POST /api/v1/chat-sessions/:id/finalize` — converts extracted_data into a real Invoice (draft status)

### Public, Unauthenticated (Phase 1 view, Phase 2 payment claim)
- `GET /api/v1/public/invoices/:token` — invoice data for rendering the public page
- `GET /api/v1/public/invoices/:token/pdf`
- `POST /api/v1/public/invoices/:token/payment-proofs` — client uploads proof (file + optional note), rate-limited

### Overdue / Background Jobs (Phase 2)
- Internal cron, no public endpoint: daily job scans invoices where `due_date < now` and `status = awaiting_payment`, flips to `overdue`, iterating per organization

### Dashboard / Analytics (Phase 3)
- `GET /api/v1/dashboard/summary` — outstanding total, paid this month, overdue count
- `GET /api/v1/dashboard/revenue` — time series, filterable by date range

### Team Members (Phase 3)
- `GET /api/v1/team` — list users in the organization
- `POST /api/v1/team/invite`
- `PATCH /api/v1/team/:userId/role`
- `DELETE /api/v1/team/:userId`

### Reminders (Phase 3)
- `POST /api/v1/invoices/:id/reminder` — bot drafts a reminder message for an overdue invoice, returns text for the user to send manually (or send via email if that's built)

---

## 2. Screens

### Auth (Phase 1)
- Sign up
- Sign in
- Forgot password
- Reset password

### Onboarding (Phase 1)
- Business info form (name, activity, tax regime, VAT registered, tax identifier, address)
- Stamp and signature upload
- Bank details entry
- Done / go to dashboard

### Dashboard (Phase 1 basic, Phase 3 full analytics)
- Overview: recent invoices, quick stats (phase 1 can be just a list, phase 3 adds charts/summary cards)
- Empty state prompting "add your first client" / "create your first invoice"

### Clients (Phase 1)
- Client list (search, pagination)
- Client detail (info + their invoice history)
- Add/edit client form

### Invoices (Phase 1 manual form, Phase 2 chatbot)
- Invoice list (filter by status, client, date)
- Invoice detail/view (line items, status, timeline of status changes, linked payment proofs)
- New invoice — manual form (phase 1)
- New invoice — chatbot flow (phase 2): conversational UI, running summary panel showing the invoice being built, confirm/edit before generating
- Edit invoice (only while draft)
- Send confirmation modal (shows the public link that will be generated, option to copy it)

### Payment Review (Phase 2)
- Payment proofs inbox/queue: list of `payment_claimed` invoices across the organization needing review
- Proof detail view: uploaded file preview, invoice amount, confirm/reject buttons, reject reason field

### Public Invoice Page (Phase 1 view-only, Phase 2 adds payment claim)
- Invoice view (branded with the organization's logo/stamp/signature, line items, total, due date)
- Download PDF button
- "Mark as paid" flow: upload proof file, optional note, submit
- Status banner (paid / disputed with the org's rejection note / awaiting confirmation)

### Settings (Phase 1 basic, Phase 3 team)
- Organization profile (edit business info, tax details, bank details)
- Branding (stamp, signature, logo)
- Invoice defaults (currency, VAT rate, payment terms, numbering prefix)
- Team members (phase 3): list, invite, change role, remove
- Account (change password, delete account)

### Reminders (Phase 3)
- Draft reminder modal on an overdue invoice, editable text before sending/copying