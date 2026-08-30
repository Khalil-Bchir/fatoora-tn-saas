# 🧾 Fatoora TN — Multi-Tenant Invoicing SaaS Platform (Tunisia-Focused)

A production-ready, full-stack **Multi-Tenant Invoicing Platform** tailored for Tunisian businesses, freelancers, and auto-entrepreneurs. Built with **Next.js 15**, **Hono OpenAPI**, **Prisma**, **PostgreSQL**, **Tailwind CSS v4**, **shadcn/ui**, and pre-loaded with **133 Antigravity AI Skills**.

---

## 🌟 Overview & Tunisian Legal Context

In Tunisia, invoicing requirements vary significantly across tax regimes:
- **Auto-Entrepreneurs**: Exempt from VAT, revenue capped at 75,000 DT/year. Invoices require clear legal exemption notices.
- **Régime Forfaitaire / Réel**: VAT-registered businesses subject to standard legal tax rates (0%, 7%, 13%, 19%), mandatory *Droit de Timbre Fiscal* (1.000 DT), and the upcoming *El Fatoora* / TEIF electronic invoicing obligation via TTN (TunisieTradeNet) and TunTrust.
- **Banking Reality**: No open banking APIs exist in Tunisia for direct account reconciliation. The platform provides a robust two-step manual payment confirmation flow via tokenized client proof uploads.

**Fatoora TN** is architected from the data model up to support strict multi-tenant data isolation, sequential per-organization numbering, automatic Tunisian fiscal calculations, stamp & signature embedding, and shareable public invoice links.

---

## 🏗️ Monorepo Architecture

This project is a **Turborepo** monorepo:

```text
├── apps/
│   ├── api/                    # Hono.js OpenAPI backend service
│   │   ├── src/
│   │   │   ├── middleware/     # Tenant isolation & security middlewares
│   │   │   ├── routes/v1/      # Invoices, Clients, Organizations, Public routes
│   │   │   ├── schema/v1/      # Zod OpenAPI contracts
│   │   │   └── services/       # Business logic (VAT calculation, Markdown generator)
│   └── web/                    # Next.js 15 App Router frontend
│       ├── app/
│       │   ├── (dashboard)/    # Invoices, Clients, Organization settings
│       │   └── i/[token]/      # Public client invoice view & proof submission
│       ├── components/ui/      # shadcn/ui component library
│       └── store/              # Zustand state stores (invoices, clients, organization)
├── packages/
│   ├── database/               # Prisma schema & PostgreSQL client
│   ├── types/                  # Shared TypeScript types & DTOs
│   ├── eslint-config/          # Shared ESLint configuration
│   └── typescript-config/      # Shared TypeScript base configs
└── .agents/
    └── skills/                 # 133 Pre-integrated Antigravity AI skills
```

---

## ✨ Key Features

### 🏢 1. Strict Multi-Tenant Data Isolation
- Every business-owned entity belongs to an `organizationId`.
- Server-side tenant middleware verifies and scopes every query: a bug that leaks tenant invoices or client details across tenants is strictly prevented by design.

### 💰 2. Tunisian Fiscal & VAT Compliance Engine
- **Tax Regimes**: Auto-Entrepreneur, Régime Forfaitaire, Régime Réel.
- **Automatic Calculations**:
  - Subtotal Hors Taxe (HT)
  - Selective Line-Item TVA (0%, 7%, 13%, 19%)
  - Configurable Droit de Timbre Fiscal (1.000 DT)
  - Total TTC / Net à Payer
- **Legal Notices**: Auto-generates VAT exemption clauses for auto-entrepreneurs and compliance banners for VAT-registered entities.

### 🔢 3. Per-Tenant Sequential Invoicing
- Atomic sequential numbering per organization (e.g. `FAC-2026-0001`, `FAC-2026-0002`).
- Custom invoice prefixes (`FAC`, `INV`, `DEV`) and configurable payment terms.

### 🔏 4. Cachet, Signature & Branding
- Organizations upload stamp/cachet and signature images during setup.
- Automatically stamped on digital invoice previews and PDF/print outputs.

### 🔗 5. Tokenized Public Share Link & Payment Proof Flow
- Clients view invoices via cryptographically secure tokens (`/i/[token]`) without requiring an account.
- Direct upload of bank transfer receipts (*Reçu de virement / versement*).
- Real-time status lifecycle: `DRAFT` ➔ `SENT` ➔ `AWAITING_PAYMENT` ➔ `PAYMENT_CLAIMED` ➔ `PAID` (or `OVERDUE` / `CANCELLED`).

### 📦 6. Export Options
- Instant Browser Print / Save to PDF.
- Clean Markdown export with complete tabular itemization and Tunisian legal coordinates.

---

## 🤖 Integrated Antigravity Skills (133 Skills)

Located in [`.agents/skills/`](file:///.agents/skills), the codebase includes:
- **`frontend-expert` & `frontend-design`**: Modern React 19, Suspense architecture, type-safe components.
- **`shadcn` & `uiux-designer`**: Polished, accessible UI design system.
- **`api-builder` & `sql-optimization`**: Hono OpenAPI schemas and query optimization.
- **`bullmq-specialist`**: Redis queue setup for automated overdue sweeps and asynchronous notifications.
- **`email-systems` & `code-reviewer`**: Automated reviews and communication pipelines.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Monorepo** | [Turborepo](https://turbo.build/), [pnpm](https://pnpm.io/) |
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Zustand](https://github.com/pmndrs/zustand), [Sonner](https://sonner.emilkowal.ski/) |
| **Backend API** | [Hono](https://hono.dev/) (Node.js runtime), [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi), [Pino](https://getpino.io/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/) |
| **Auth & Storage** | [Supabase](https://supabase.com/) |
| **Validation** | [Zod](https://zod.dev/) |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Khalil-Bchir/fatoora-tn-saas.git
cd fatoora-tn-saas
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.development`:

```bash
cp .env.example .env.development
```

Configure your `DATABASE_URL` and `DIRECT_URL` with your PostgreSQL database credentials.

### 3. Generate Prisma Client & Migrate

```bash
pnpm --filter @repo/database run db:generate
pnpm --filter @repo/database run db:migrate:dev
```

### 4. Start Development Servers

```bash
pnpm dev
```

- **Frontend App**: `http://localhost:3001`
- **Backend API**: `http://localhost:3000`
- **Swagger Documentation**: `http://localhost:3000/docs`

---

## 📖 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/organization` | Retrieve current tenant profile & fiscal settings |
| `PATCH` | `/api/v1/organization` | Update business name, tax regime, stamp, bank RIB |
| `GET` | `/api/v1/clients` | List tenant-scoped clients |
| `POST` | `/api/v1/clients` | Create a new client (with matricule fiscal for B2B) |
| `GET` | `/api/v1/invoices` | List invoices with status filter |
| `POST` | `/api/v1/invoices` | Create invoice with sequential number & VAT calculation |
| `GET` | `/api/v1/invoices/:id` | Get full invoice details, items, and payment proofs |
| `PATCH` | `/api/v1/invoices/:id/status` | Update invoice lifecycle status |
| `GET` | `/api/v1/public/invoices/:token` | Public tokenized invoice view for clients |
| `POST` | `/api/v1/public/invoices/:token/payment-proof` | Submit bank transfer receipt |

---

## 🗺️ Roadmap

- [x] **Phase 1: Multi-Tenant Foundation**
  - [x] Multi-tenant Prisma schema with Tunisian tax regimes
  - [x] Strict tenant isolation middleware
  - [x] Client & Invoice CRUD with sequential numbering
  - [x] Live VAT (0/7/13/19%) and Timbre Fiscal calculation
  - [x] Tokenized shareable public link & proof upload
  - [x] Stamp/Cachet and signature visualization
- [ ] **Phase 2: AI & Automation**
  - [ ] AI Chatbot Invoice Assistant (Vercel AI SDK)
  - [ ] Automated BullMQ cron jobs for overdue reminders
  - [ ] Automated email dispatch
- [ ] **Phase 3: Legal & Regulatory**
  - [ ] El Fatoora (TEIF) XML generation
  - [ ] TunTrust digital certificate signing & TTN integration

---

## 📄 License

MIT © [Khalil Bchir](https://github.com/Khalil-Bchir)
