## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, tailwindcss, sveltekit-adapter, vitest, playwright

---

# CLAUDE.md — bazaarLink

B2B sourcing marketplace for Afghan rugs. Solo-developer build.
Authoritative context: `docs/architecture-plan.md` (strategy),
`docs/issues.md` (Phase 0 issue list), `SETUP_SPEC.md` (environment recipe).
If those documents conflict with this file, this file wins.

## Stack & versions

- **SvelteKit 2** with `adapter-node` (long-running server — required for Ably + BullMQ)
- **Svelte 5** — use runes only: `$state`, `$derived`, `$props`, `$effect`. Never `export let`, never Svelte 4 stores, never `$:` reactive labels.
- **TailwindCSS 4** — palette via `@theme` directive in `src/app.css`. No `tailwind.config.js`.
- **TypeScript 5** with `strict: true`
- **Prisma 7** (Prisma 7 API — `prisma.config.ts`, not the legacy generator block)
- **PostgreSQL 14+**
- **Auth:** JWT + bcryptjs (custom). Not Lucia, not Auth.js. Decision recorded in `docs/issues.md`.
- **Node:** `^24.0 || ^25.9` (pinned in `.nvmrc`)
- **Realtime:** Ably (managed). Never run a custom WebSocket server.
- **Queues:** BullMQ on Redis, separate worker process.
- **Object storage:** Cloudflare R2.

## Architecture rules — non-negotiable

1. **Modular monolith.** One folder per module under `src/lib/server/`:
   `auth, suppliers, listings, rfq, orders, chat, ledger, notifications, jobs, outbox`.
2. **No cross-module Prisma.** Routes (`+page.server.ts`, `+server.ts`) and other modules import only each module's `service.ts`. Direct `@prisma/client` use lives in that one file per module. ESLint enforces this (Epic 1.2).
3. **State changes go through the `transitions` table + outbox.** Never `prisma.order.update({ status })` directly. Always `service.transition(order, toState, actor, reason)` which writes the transition row and enqueues outbox events atomically.
4. **Double-entry ledger only.** No `commission_rate`, `total_paid`, or other derived-money columns on Order or Listing. Every money movement is one `JournalEntry` with balanced `Posting` rows (debits − credits = 0). Enforced in `postJournalEntry()`.
5. **Outbox for every external side effect.** Email, Ably publish, PSP call, webhook — none of them happen inside an HTTP handler. Write the outbox row in the same transaction as the state change; the worker fans out.
6. **`canTransition()` is the only place state machine guards live.** Pure function. Exhaustively table-tested.
7. **RBAC in middleware, not handlers.** Use `requireAuth()`, `requireRole(...)`, `requireOwnership()` from `src/lib/server/guards.ts`. Don't re-implement role checks per route.

## Theme

- **Dark mode only at boot.** `<html class="dark">` hard-coded in `src/app.html`. Do not add a light-mode toggle or reintroduce light styles without an explicit user request.
- **Placeholder palette:** amber-based values from `SETUP_SPEC` §7 (`--color-primary: #d97706` etc.). These are temporary. Real brand colors are a future issue.
- All Tailwind colors go through `@theme` tokens — never hardcode hex in components.

## Conventions

- Tabs, single quotes, no trailing commas, 100-char width (Prettier-enforced).
- **No code comments** unless the *why* is non-obvious (hidden constraint, subtle invariant, workaround). Never comment what the code does — naming should do that.
- **No multi-paragraph docstrings.** One short line max.
- **No backwards-compat shims, no `_unused` placeholders, no "removed X" comments.** Delete dead code, don't memorialize it.
- Custom string PKs where domain meaningful (e.g. `supplierCode`, `orderCode`); UUIDs otherwise.
- Prisma: `@map()` for snake_case columns, `@@map()` for table names.
- Path alias: `$lib` → `src/lib/` (SvelteKit default).

## Testing scope (Phase 0)

Write tests for, and only for:

1. **`canTransition()` table tests** — every allowed transition + every denied transition, per state machine (Epic 5.3, Epic 6.2).
2. **Ledger invariant tests** — `postJournalEntry()` rejects unbalanced entries (Epic 8.3).
3. **One Playwright happy-path smoke test** — register → list → RFQ → quote → accept → ledger entry (Epic 11.3).

Do not write unit tests for service functions, route handlers, components, or utilities unless the user explicitly asks. Test surface stays small until there are collaborators.

## Banned for Phase 0

These are explicit "no" decisions from `docs/architecture-plan.md`. Don't propose them unless the user reopens the question:

- Lucia, Auth.js, NextAuth, or any auth library
- MedusaJS, Saleor, or any commerce framework
- Custom WebSocket / Socket.IO server
- Microservices, separate API gateway, BFF layer
- Event sourcing outside the state machine + ledger
- XState (hand-rolled FSM only)
- Drizzle (Prisma chosen)
- Tazapay / real escrow (Phase 1)
- Sumsub / KYC pipeline (Phase 1)
- Postgres FTS or Meilisearch (Phase 1+)
- Multilingual / i18n (Phase 2)
- PWA / mobile (Phase 3)
- Light mode
- Read replicas, sharding, multi-region

## Common commands

```bash
npm run dev              # SvelteKit dev server
npm run dev:worker       # BullMQ worker process (Epic 9.2)
npm run validate         # format:check + lint + svelte-check
npm run check            # svelte-check only
npm run build            # production build
npx prisma db push       # apply schema to local DB (dev)
npm run db:migrate       # create + apply named migration
npm run db:seed          # seed dev data (Epic 11.1)
npm run db:studio        # Prisma Studio
```

## Working method (with Claude)

- **One sub-task per session.** Reference issues by ID (e.g. "do 2.3"). Don't ask Claude to "do Epic 2."
- **Plan mode first** for any sub-task touching >2 files or introducing a new model.
- **Branch per epic** (`epic-0-bootstrap`, `epic-2-auth`, …). PR to `main` even solo — the diff view is the review checkpoint.
- **User reads every diff before commit.** No exceptions.
- **Claude must run the code, not just write it.** `npm run validate` after every sub-task; manual browser check for UI changes.
- **Commit messages:** imperative subject under 70 chars, body explains *why*, include the `Co-Authored-By` trailer per repo policy.

## Deployment

- **Target:** `adapter-node` on Fly.io or Railway — decide before Epic 1 lands so logger/Sentry config matches. Record final choice here.
- **Currently:** undecided. (Update this line with the choice before Epic 1.)

## When CLAUDE drifts from this file

Stop and call it out. Examples to push back on:
- "Let me add a helper file for…" → probably premature abstraction.
- "I'll add a try/catch here just in case…" → no, only validate at boundaries.
- "I'll add a config option for…" → no flags without a current need.
- "I'll write a unit test for this utility…" → not in the testing scope above.
- Introducing Lucia, Drizzle, light mode, or anything in the Banned list → flat no.
