# Project Brief: Multi-Tenant Invoicing Platform (Tunisia-focused)

## 1. Context and Pivot

This is a public multi-tenant invoicing platform for small businesses in Tunisia, including VAT-registered ones. Any business can sign up and use it. Free to use for now, monetization to be figured out later (subscription tiers, usage limits, etc. — not designed yet, see section 13).

Some users will be VAT-registered, which means the El Fatoora / TEIF e-invoicing obligation (see section 2) applies to them, while other users (e.g. auto-entrepreneurs) are exempt. The platform has to account for both cases from the data model up, even if TEIF integration itself is a later phase.

## 2. Legal Context (varies per user now)

- Auto-entrepreneur users: exempt from VAT, not currently subject to El Fatoora/TEIF obligation, revenue cap 75,000 DT/year.
- Régime forfaitaire / réel users who are VAT-registered: subject to VAT (rates 0/7/13/19%), and the TEIF e-invoicing obligation applies to them, with signature via TunTrust and submission to TunisieTradeNet (TTN).
- The platform must therefore support: VAT on/off per invoice, VAT rate selection, and a place to eventually plug in TEIF generation/signature/submission for the users who need it. Not building the actual TTN integration in phase 1, but the data model shouldn't block adding it later.
- No open banking API access exists in Tunisia for individual/business accounts. Payment confirmation stays manual (proof of payment + user confirms), for every tenant.

## 3. Users and Roles

- **Business owner (tenant admin)**: signs up, represents one business/freelancer, manages their own clients, invoices, stamp/signature, bank details, and (later) billing plan
- **Team member (optional, later phase)**: some businesses may want to let an employee create invoices without full admin rights — not needed for v1, worth reserving in the data model (an `organization_id` + `user` relation instead of assuming one user = one business)
- **Client (external, no account)**: same as before, accesses one invoice via a public tokenized link, no login

For v1, keep it simple: one signed-up user = one business/organization. Structure the schema so a business could have multiple users later without a rewrite.

## 4. Core Entities (multi-tenant)

Every business-owned entity now belongs to an `organization_id`. All queries must be scoped by it. This is the most important architectural rule in the whole system: a bug that leaks one tenant's invoice or client data to another tenant is the single worst failure mode for this product.

### Organization

- id
- business name
- owner user_id
- activity type
- tax regime (auto-entrepreneur / forfaitaire / réel)
- vat_registered (boolean)
- unique tax identifier (matricule fiscal or auto-entrepreneur identifier)
- address
- bank details (for display on invoices)
- stamp_image_url
- signature_image_url
- logo_url (optional)
- invoice numbering prefix/sequence (per org, not global)
- plan (free / paid — placeholder for future billing)
- created_at

### User

- id
- organization_id
- email, password hash (or OAuth)
- role (owner, member — only owner used in v1)
- created_at

### Client

- id
- organization_id
- name, company name, email, address, notes

### Invoice

- id
- organization_id
- invoice_number (sequential per organization, e.g. each org has its own counter, not a global one)
- client_id
- line_items
- currency
- vat_applicable (boolean, inherited from organization.vat_registered by default, editable per invoice)
- vat_rate (0/7/13/19%, only relevant if vat_applicable)
- subtotal, vat_amount, total
- issue_date, due_date
- status (unchanged from before, see prior scenarios)
- public_token
- pdf_url, md_content
- notes/payment terms
- created_at, updated_at

### PaymentProof, ChatSession

- Same structure as before, each scoped by organization_id through their parent invoice.

## 5. Multi-Tenancy Architecture Notes

- **Data isolation**: every table with tenant data carries `organization_id`. Enforce this at the query layer (never trust a request to only ask for its own org's data without a server-side check), and ideally also with Postgres row-level security as a second line of defense, since this is the kind of bug you don't want to discover in production
- **Public invoice links**: the `public_token` alone must be sufficient to resolve the right invoice, without needing the client to know or select an organization. No cross-tenant leakage through this route either — a token only ever resolves one invoice.
- **File storage**: namespace uploads (stamps, signatures, payment proofs) by organization_id in the storage path, so a storage misconfiguration can't accidentally expose another tenant's files by guessing a path
- **Invoice numbering**: must be per-organization, not a global sequence, since businesses expect their own invoice numbers to be sequential and meaningful to them (and to any future TTN submission)

## 6. Feature: AI Chatbot Invoice Generation

Same flow as the original single-user design (client lookup/creation, line items, dates, currency, confirmation, generation), with these additions:

- The bot now also asks/confirms VAT applicability if the organization is VAT-registered ("Apply VAT at 19% as usual?")
- The bot pulls organization-level defaults (currency, VAT rate, payment terms) rather than any single user's personal defaults
- Chat sessions are scoped by organization_id like everything else

## 7. Feature: Invoice Status and Payment Tracking

Unchanged from the original design: the same status machine (draft → sent → awaiting_payment → payment_claimed → paid/disputed, overdue via cron, cancelled) applies per invoice, per organization. Confirmation is always manual, done by the organization's own user, against their own bank account. No change needed here for multi-tenancy beyond scoping.

## 8. Feature: PDF / Markdown Export and Stamp/Signature

- Each organization uploads its own stamp and signature images during onboarding, stored per organization
- PDF template pulls organization branding (name, activity, tax ID, bank details, stamp, signature, logo if provided) instead of hardcoded values
- If `vat_applicable`, the PDF must show subtotal, VAT rate, VAT amount, and total (TTC), matching normal Tunisian invoice conventions. If not applicable, show only the total with a note like "TVA non applicable — régime auto-entrepreneur" or similar, matching the org's regime
- Markdown export same as before, per organization

## 9. Feature: Public Shareable Link

Unchanged in behavior. Technical note: token generation must be cryptographically random and long enough that brute-forcing across many tenants' invoices isn't feasible (this matters more now with many orgs and many invoices than it did for a single-user tool).

## 10. Onboarding Flow (new, needed for multi-tenant)

1. Sign up (email + password, or OAuth)
2. Business info: name, activity, tax regime, VAT registered or not, tax identifier
3. Upload stamp and signature images
4. Enter bank details (for display on invoices)
5. Optional: invite a team member (can be skipped, reserved for later)
6. Land on empty dashboard, prompted to add first client or generate first invoice

## 11. Tech Stack

Same as before, adjusted for multi-tenancy:

- Frontend: Next.js + React
- Backend: Node.js, Fastify or Hono
- Database: PostgreSQL + Prisma, with organization_id scoping and row-level security as a hardening step
- File storage: S3-compatible or Azure Blob, namespaced per organization
- Background jobs: BullMQ + Redis for overdue checks (now iterating across all orgs, not just one), async PDF generation
- Auth: proper multi-user auth now needed (e.g. NextAuth, or a lightweight JWT/session system with password hashing — do not roll your own crypto)
- Deployment: Docker, same as current setup

## 12. Suggested Build Phases

### Phase 1 — Multi-tenant foundation

1. Auth (signup/login), Organization model, onboarding flow
2. Client CRUD, scoped per organization
3. Manual invoice creation form (chatbot deferred to phase 2, same as before)
4. PDF generation with per-org stamp/signature/branding, VAT-aware template
5. Public link page (view + download)
6. Manual status updates

### Phase 2 — Automation and payment flow

1. AI chatbot invoice generation, org-aware
2. Payment proof upload by client
3. Two-step payment confirmation
4. Overdue cron, now iterating per organization
5. Markdown export

### Phase 3 — Platform maturity

1. Team members / multiple users per organization
2. Dashboard analytics per organization
3. Reminder message drafting
4. Recurring invoices
5. Audit log per invoice
6. Billing/plan system (free tier limits, paid tier features) — see section 13
7. TEIF/El Fatoora integration for VAT-registered organizations that need it (this is the feature that turns "invoicing tool" into "compliant invoicing tool" for that segment, and is likely the actual monetizable feature later)

## 13. Open Questions to Resolve Before Building

- What does "free for now" mean concretely: any limits on number of invoices/clients per org, or fully unlimited until a paid tier exists?
- Future monetization direction: per-invoice pricing, monthly subscription, or tiered by feature (e.g. TEIF compliance as the paid feature, basic invoicing free)? Worth deciding roughly now since it shapes whether to build usage tracking/limits from day one or bolt it on later
- Should VAT-registered organizations be told plainly, inside the app, that this tool does not yet handle their legal TEIF obligation, so they don't assume it's compliant when it isn't? Recommend a visible disclaimer for that segment until phase 3 TEIF work lands, to avoid a user unknowingly running afoul of the law using your tool
- Same open questions as before: bank transfer detail format on invoices (now per-org, so this is a form field, not a hardcoded value), whether to build outbound email sending, whether partial payments are common enough to build for
