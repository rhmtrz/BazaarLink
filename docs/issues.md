# bazaarLink — Phase 0 Issue List

Scope: environment setup + Phase 0 concierge MVP (months 1–3) from
`docs/architecture-plan.md` §8. Tracker: this file. Convert to GitHub
issues later if needed.

**Auth decision:** JWT + bcryptjs (per `SETUP_SPEC.md`), diverging from
architecture-plan §9 which suggests Lucia. Revisit if 2FA/passkey/social
login become priorities.

**Theme:** dark-mode-only at boot with the placeholder amber palette from
`SETUP_SPEC` §7. Real brand palette is its own future issue.

Dependency notation: `[deps: E0, E2]` means depends on Epic 0 and Epic 2.

---

## Epic 0 — Environment bootstrap [deps: none]

Goal: working `npm run dev` matching SETUP_SPEC.

- [x] 0.1 `nvm install 24 && nvm use 24`; create `.nvmrc` (`v24.15.0`) + `.npmrc` (`engine-strict=true`)
- [x] 0.2 `npx sv create .` (minimal + TS + Prettier + ESLint); commit scaffold
- [x] 0.3 Add `.gitignore`, `.prettierrc`, `.prettierignore` per SETUP_SPEC §3
- [x] 0.4 Install dev + runtime deps from SETUP_SPEC §4 (single `npm i -D …` + `npm i …`)
- [x] 0.5 Drop in `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js` per SETUP_SPEC §5–6
- [x] 0.6 `src/app.css` with `@theme` amber placeholder + `@custom-variant dark`; force `<html class="dark">` in `src/app.html`; import `app.css` in root `+layout.svelte`
- [x] 0.7 `prisma.config.ts`, `prisma/schema.prisma`, `src/lib/prisma.ts` singleton; create local Postgres DB; `.env` from `.env.example`
- [x] 0.8 `npm run validate && npm run build` both pass

## Epic 1 — Skeleton, module boundaries, observability [deps: E0]

Goal: folder layout and day-one ops hygiene from architecture-plan §3 + §9.

- [ ] 1.1 Create `src/lib/server/{auth,suppliers,listings,rfq,orders,chat,ledger,notifications,jobs,outbox}/` each with `index.ts` and one-line README
- [ ] 1.2 ESLint rule forbidding cross-module `@prisma/client` imports outside each module's service file
- [ ] 1.3 `src/lib/routes.ts` — central route constants
- [ ] 1.4 `src/hooks.server.ts` skeleton (request-id, logging, error boundary)
- [ ] 1.5 Pino structured logger in `src/lib/server/logger.ts`
- [ ] 1.6 Sentry SDK init (client + server hooks)
- [ ] 1.7 `/healthz` endpoint + BetterStack (or stub) uptime monitor

## Epic 2 — Auth & RBAC [deps: E0, E1]

Goal: JWT-based session, four roles, request-time identity in `locals.user`.

- [ ] 2.1 Prisma models: `User`, `Role` enum (BUYER/SUPPLIER/ADMIN/INSPECTOR), `Session`
- [ ] 2.2 `src/lib/server/auth.ts` — register/login/logout with bcryptjs + signed JWT
- [ ] 2.3 `hooks.server.ts` — verify JWT each request, populate `event.locals.user`
- [ ] 2.4 `src/lib/server/guards.ts` — `requireAuth()`, `requireRole(...)`, `requireOwnership()`
- [ ] 2.5 Session cookies: httpOnly + Secure + SameSite=Lax; CSRF tokens on form actions
- [ ] 2.6 Redis-backed sliding-window rate limiter on `/login`, `/register`
- [ ] 2.7 `AuditEvent` model + helper for admin/role-change/login-from-new-device events
- [ ] 2.8 Login + register pages (dark-mode UI, placeholder palette)

## Epic 3 — Supplier profiles [deps: E2]

Goal: suppliers exist, admin approves them (concierge — no Sumsub).

- [ ] 3.1 `Supplier` model linked to User; contact info; `kycStatus` enum (PENDING/APPROVED/REJECTED, manual)
- [ ] 3.2 Supplier registration → profile edit page
- [ ] 3.3 Admin approve/reject action writes `AuditEvent`
- [ ] 3.4 Service layer (`suppliers/service.ts`) — routes never touch Prisma directly

## Epic 4 — Listings + photos [deps: E3]

Goal: suppliers list rugs, buyers browse, admin moderates.

- [ ] 4.1 `Listing` model (title, description, material, origin, size, dimensions, weave, indicative price, tags, status enum)
- [ ] 4.2 Photo upload via signed URLs to Cloudflare R2 (or local disk for concierge); MIME allowlist, 25 MB cap
- [ ] 4.3 Supplier CRUD with ownership guard
- [ ] 4.4 Buyer browse + detail page (server-rendered, no client search yet)
- [ ] 4.5 Admin moderation queue (approve/hide)

## Epic 5 — RFQ state machine [deps: E2, E4]

Goal: hand-rolled FSM with audit trail; tested exhaustively.

- [ ] 5.1 Prisma models: `RFQ`, `Quote`, `Transition` (immutable: actor, from, to, reason, ts)
- [ ] 5.2 `canTransition(rfq, from, to, actor)` pure function
- [ ] 5.3 Integration tests for every allowed + every denied transition
- [ ] 5.4 Buyer submits RFQ → supplier quotes → buyer accepts/rejects flow
- [ ] 5.5 BullMQ worker for `EXPIRED` transitions on stale RFQs

## Epic 6 — Orders (concierge, no PSP) [deps: E5]

Goal: order record + manual state advancement by admin.

- [ ] 6.1 `Order` model linked to accepted RFQ
- [ ] 6.2 Order state machine reusing transitions table from E5
- [ ] 6.3 Admin: manually advance order state with reason note
- [ ] 6.4 Order detail view for buyer + supplier
- [ ] 6.5 Soft-delete only (data retention per architecture-plan §11)

## Epic 7 — Realtime chat (Ably) [deps: E2, E5]

Goal: per-conversation channels, DB-of-record, no homemade WebSocket server.

- [ ] 7.1 Sign up for Ably free tier; `ABLY_API_KEY` in env
- [ ] 7.2 Prisma: `Conversation`, `Message` (text only for Phase 0)
- [ ] 7.3 `/api/ably-token` endpoint — capability scoped to conversations the user is in
- [ ] 7.4 Send-message flow: write to Postgres first, then publish to Ably channel via outbox
- [ ] 7.5 Client subscribes per-conversation; renders history from DB on mount
- [ ] 7.6 Typing indicators ephemeral on Ably only (no DB write)
- [ ] 7.7 Rate-limit message send per user (Redis sliding window)

## Epic 8 — Ledger (manual entries, double-entry) [deps: E6]

Goal: bookkeeping model proven before any PSP integration.

- [ ] 8.1 Models: `Account` (buyer wallet, supplier wallet, escrow, platform revenue, platform fees), `JournalEntry`, `Posting`
- [ ] 8.2 `postJournalEntry(entries)` service — rejects if debits ≠ credits
- [ ] 8.3 Unit tests for invariant
- [ ] 8.4 Admin UI: create journal entry against accounts with narration
- [ ] 8.5 Account balance view + per-account transaction history
- [ ] 8.6 Seeded chart of accounts in `prisma/seed.ts`

## Epic 9 — Outbox + background jobs [deps: E1]

Goal: state changes never call external APIs synchronously.

- [ ] 9.1 `OutboxEvent` Prisma model (id, topic, payload, status, attempts)
- [ ] 9.2 Redis + BullMQ; separate worker process; `npm run dev:worker`
- [ ] 9.3 Outbox dispatcher worker (poll-then-process)
- [ ] 9.4 Notification fan-out worker (email stub via console / Resend later)
- [ ] 9.5 Email template scaffolding (text-only Phase 0)

## Epic 10 — Admin dashboard [deps: E2, E3, E4, E5, E6, E8]

Goal: one human (you) can operate the whole platform from one console.

- [ ] 10.1 `/admin` route group with `requireRole('ADMIN')` guard
- [ ] 10.2 Supplier directory + approve/reject
- [ ] 10.3 Listing moderation queue
- [ ] 10.4 RFQ + order viewer with full transition history
- [ ] 10.5 Ledger: account list + journal entry form
- [ ] 10.6 Admin TOTP 2FA (mandatory per architecture-plan §11)
- [ ] 10.7 `AuditEvent` viewer with filters

## Epic 11 — Phase 0 wrap & verification [deps: all]

Goal: prove the end-to-end concierge flow works before onboarding pilot users.

- [ ] 11.1 Seed: 3 suppliers + 5 buyers + 1 admin + chart of accounts
- [ ] 11.2 Manual E2E walkthrough: register supplier → list rug → buyer RFQ → quote → accept → admin records ledger entries → mark complete; document any friction
- [ ] 11.3 Smoke test script in CI (`npm run validate` + a Playwright happy-path)
- [ ] 11.4 Deploy target decision doc — Fly.io vs Railway vs VPS for `adapter-node` (no commit yet)
- [ ] 11.5 README + runbook (how to start dev, worker, run migrations, rotate JWT secret)

---

## Deferred (intentionally out of Phase 0)

From architecture-plan §8 Phase 1+:

- Tazapay / real escrow integration
- Sumsub KYC pipeline
- Third-party inspection workflow + scoring
- Postgres FTS catalog search (Phase 1)
- Multilingual UI + chat translation (Phase 2)
- Meilisearch upgrade (Phase 2)
- PWA / mobile (Phase 3)
- Real brand palette + design system
- Real virus scanning (ClamAV worker) — stub only in Phase 0

These get their own issue lists after Phase 0 concierge runs surface real requirements.
