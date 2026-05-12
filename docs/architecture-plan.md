# bazaarLink — Architecture & Strategy Plan

Response to `idea-clearation.md`. Answers all 10 questions and proposes an
MVP scope realistic for a solo developer.

## Context

You're a solo developer with strong SvelteKit/Node skills planning a B2B
sourcing marketplace for Afghan rugs, with platform-held escrow and
true-realtime chat.

The single biggest architectural constraint is **Afghanistan**: sanctions,
limited SWIFT access for Afghan banks, and OFAC obligations on US-corridor
buyers. This drives the payment, KYC, and entity-formation decisions far more
than any technology choice.

Recommendations below are opinionated. Where I disagree with one of your
stated preferences (notably "self-serve from day one" vs concierge, and
"build my own WebSocket server"), I say so and explain the trade-off.

---

## 1. Is custom SvelteKit a good choice? — **Yes, with one caveat**

Reasons it fits:
- This is not an ecommerce store; it's a **workflow + RFQ + chat + escrow**
  platform. Product-catalog/cart frameworks would fight you, not help.
- SvelteKit's full-stack model (server actions, `+page.server.ts`, hooks) is
  well-suited to RFQ flows where state lives behind the form.
- You're already productive in it.

Caveat: SvelteKit's serverless adapters do not host long-lived WebSocket
connections well. You'll either deploy via `adapter-node` on a long-running
server (Fly.io / Railway / a VPS), or split realtime to a managed service.
See §6.

## 2. MedusaJS / Saleor? — **No**

Both are catalog-and-checkout engines. Neither has first-class RFQ, neither
has chat, neither has multi-vendor commission accounting beyond plugins. You
would override 70% of them. The only scenario where Medusa makes sense is if
you ever add a *fixed-price* sub-marketplace alongside the RFQ flow — and
that's a later-phase decision, not an MVP one.

## 3. Backend architecture

**Modular monolith in SvelteKit `adapter-node`**, deployed as a single Node
process behind a CDN. Internal structure:

```
src/lib/server/
  auth/         # session, KYB status, RBAC
  suppliers/    # supplier profile, KYC state
  listings/     # rug inventory, photos
  rfq/          # RFQ + quote state machine  ← see §4
  orders/       # order, inspection, shipment
  chat/         # conversations, messages (DB writes; delivery via §6)
  escrow/       # PSP integration, ledger entries
  ledger/       # double-entry commission accounting  ← see §5
  notifications/  # outbox → email/push/in-app
  jobs/         # BullMQ workers
```

Each module has its own folder, its own Prisma models grouped by `///`
comment sections, its own service layer. Cross-module calls go through
service functions, not direct Prisma access — this is what lets you extract
a service later if you ever need to.

Stack:
- **Postgres** as the single source of truth (escrow, chat history, RFQ
  state). Logical replication off → nothing fancy until you need it.
- **Prisma** is fine. Drizzle has nicer migrations but Prisma's familiarity
  matters more for solo velocity.
- **Redis** for: BullMQ queues, rate limiting, chat presence cache.
- **Object storage** (Cloudflare R2 — cheaper than S3, no egress fees) for
  product photos, inspection PDFs, BL/PI documents.
- **BullMQ** workers in a separate process for: email, shipment polling,
  escrow state transitions, notification fan-out.
- **Outbox pattern** for any state change that triggers a side effect.
  Don't call PSP/email APIs from inside an HTTP handler.

## 4. Marketplace workflow / state machine

The RFQ → Order lifecycle is the core domain. Model it as an explicit
finite state machine in Postgres:

```
RFQ:    DRAFT → SUBMITTED → QUOTED → ACCEPTED | REJECTED | EXPIRED
Order:  PENDING_ESCROW → ESCROW_FUNDED → INSPECTION_REQUESTED
        → INSPECTION_PASSED | INSPECTION_FAILED
        → SHIPPED → DELIVERED → COMPLETED
        (branches: DISPUTED → RESOLVED | REFUNDED)
```

Implementation:
- A `transitions` table that records every state change as an immutable
  event (who, when, from, to, reason). This is your audit log and your
  debugging tool when a deal goes sideways.
- A pure function `canTransition(order, fromState, toState, actor)` that
  encodes permissions and guards. Test this exhaustively — it's the
  contract the whole platform enforces.
- Don't use XState yet. Hand-rolled is simpler for solo dev; XState's
  value shows up at 5+ engineers.

## 5. Multi-vendor & commission

Use **double-entry ledger accounting**, not derived totals. One
`journal_entry` table, debits and credits balance to zero per transaction:

```
Order #123 funded:    Buyer Wallet  -1000  |  Escrow      +1000
Inspection passed:    Escrow        -1000  |  Supplier     +900
                                              Platform     +50  (supplier commission)
                                              Platform     +50  (buyer commission, charged earlier)
```

Why ledger, not "commission_rate column on Order":
- Refunds, partial refunds, disputes, and currency conversions all become
  *additional journal entries* instead of column edits — your books are
  always consistent.
- Auditable. When a supplier asks "why did I receive $897 not $900?" you
  can show them every entry.

Tables: `account` (buyer wallet, supplier wallet, escrow, platform revenue,
platform fees), `journal_entry`, `posting`. Keep it boring. Resist NoSQL.

## 6. Realtime chat — **Use a managed service**

You said "true realtime from day one." Fine, but **do not run Socket.IO
yourself as a solo dev** while also building escrow, RFQ, and ledger.

Recommended: **Ably** (or Supabase Realtime as the cheaper alternative).

|  | Supabase Realtime | Ably |
|---|---|---|
| Cost at <10k msg/day | Free tier covers it | ~$30/mo |
| Auth integration | Tied to Supabase Auth (friction with Lucia) | Token-based, stack-agnostic |
| Vendor lock-in | High (postgres-replication coupled) | Low (standard pub/sub) |

Recommendation: **Ably**. Lower lock-in, you keep Postgres + your own auth
(Lucia or Auth.js). Chat messages get written to Postgres (authoritative)
AND published to an Ably channel for delivery; clients subscribe to channels
per conversation. Typing indicators stay ephemeral on Ably and never hit
Postgres.

If budget is zero, Supabase Realtime works but plan to migrate before
auth complexity grows.

**Do not build your own WebSocket server until chat volume justifies it
(>100k messages/day).** That threshold is years away for a B2B platform.

## 7. Escrow & payment-holding — **The hardest part. Plan for 3+ months.**

Afghanistan-specific reality:
- Most Afghan banks have severely restricted SWIFT access since 2021.
- US (OFAC) and EU sanctions regimes apply to many counterparties.
- Wise, Payoneer, Stripe, and most PSPs **do not support AF**.
- Your real settlement path is one of:
  1. **UAE-intermediary**: incorporate a platform entity in UAE (DIFC or
     RAK ICC), partner with a UAE PSP (e.g. Tazapay, Mashreq NeoBiz),
     suppliers receive USD into UAE-side accounts they own or that you
     operate on their behalf. This is how most existing Afghan exporters
     already work.
  2. **Hawala bridge** for last-mile delivery to suppliers without UAE
     accounts. Operationally heavy, hard to KYC.
  3. **Stablecoin (USDC)** with off-ramp to local cash via OTC desk.
     Faster to integrate but regulatory grey zone, and US/EU buyers
     will balk.

Recommendation:
- **Incorporate the platform in UAE.** Don't try to operate this from a
  US/EU entity — your buyer-side compliance burden becomes enormous.
- **Partner with Tazapay or a similar B2B escrow provider** rather than
  building escrow yourself. They handle KYB, sanction screening, and
  release-on-condition. Building escrow internally means becoming a
  regulated payments business.
- **KYC/KYB via Sumsub or Veriff.** Required for any escrow partner anyway.

This is the area where I'd most encourage you to pause engineering and have
5+ conversations with payment partners *before* writing escrow code. The
wrong partner choice gets baked into your data model.

## 8. MVP scope — **Concierge first, even though you said full self-serve**

I'm pushing back on your answer here. Solo + escrow + realtime chat + RFQ +
inspection + shipment + multilingual at MVP = 12+ months of solo build
before first real transaction. By then you'll have built features no real
user asked for.

**Phase 0 — Concierge (months 1–3)**
- Auth (Lucia), supplier profiles, listings with photos, RFQ submission,
  realtime chat (Ably), order record, basic admin dashboard.
- **No escrow integration.** You manually broker payments — record them in
  the ledger via admin actions. This validates that your ledger model is
  correct before you couple it to a PSP.
- 3–10 hand-picked suppliers, 5–20 hand-picked buyers.
- Goal: prove the workflow, learn what inspection actually requires, and
  generate enough transaction data to negotiate with payment partners.

**Phase 1 — Real escrow + inspection (months 4–6)**
- Tazapay (or similar) integration, KYB onboarding, automated escrow
  state transitions wired to the ledger.
- Inspection workflow: third-party inspector uploads PDF + photos,
  buyer approves/rejects, drives state machine.
- Sumsub for supplier KYC.
- Catalog search via **Postgres full-text search** (`tsvector` on title,
  description, material, origin, tags). Boring, free, scales to ~50k
  listings without trouble.

**Phase 2 — Self-serve, search, multilingual (months 7–9)**
- Open supplier signup, KYC pipeline, listing moderation queue.
- Shipment tracking integrations (17track, AfterShip).
- **Multilingual UI** (Dari, Pashto, English, Arabic, Mandarin) +
  **on-the-fly chat translation** (DeepL API preferred; Google Translate
  fallback). Store both original and translated message in Postgres so
  disputes always reference the original wording.
- **Inspection scoring**: numeric scores per dimension (weave quality,
  dye stability, dimension accuracy, photo accuracy) accumulating into a
  supplier reputation score that feeds listing ranking and buyer-facing
  trust signals. Builds on the Phase 1 inspection workflow.
- **Upgrade catalog search to Meilisearch** if Postgres FTS hits its
  limits — typically beyond ~50k listings or when you need faceted
  filtering across many attributes (size × material × origin × price).
  Until then, stay on FTS. Boring tech wins.

**Phase 3 — Mobile + scale**
- PWA-first for suppliers (most have Android, intermittent connectivity —
  PWA + offline queue beats native here). Native only if PWA hits limits.
- Read replicas, queue scaling, observability hardening.

## 9. Scalability & long-term maintainability

Things to do **now** that pay off later:
- Strict module boundaries via folder structure (§3) and a lint rule
  forbidding cross-module Prisma imports.
- Outbox pattern for every external side effect from day one.
- Sentry + structured JSON logs (pino) + an uptime monitor (BetterStack)
  from day one. Solo founders cannot debug blind.
- Integration tests for the state machine (`canTransition` table tests).
  Skip unit tests for everything else until you have collaborators.
- Database migrations checked into git, reviewed before applying.

Things to **not** do now:
- Microservices. You're one person.
- Event sourcing for everything. Just for state machines (§4) and ledger (§5).
- Read replicas, sharding, multi-region. Wait for the metric to demand it.
- Custom auth. Use Lucia (or Auth.js). Don't roll your own.

## 10. Team structure & priorities

Order of hires, in priority:
1. **Trade operations lead** (not engineer) — someone with Afghan export
   experience, freight-forwarder relationships, inspection contacts. This
   person un-blocks the platform 10× more than another dev. Hire by month 2.
2. **Inspection partner contracts** — outsource to SGS / Bureau Veritas
   for high-value orders, local inspectors for smaller. Not a hire, a
   commercial agreement. Month 3–4.
3. **Customer success / supplier onboarder** (Dari + Pashto + English) —
   the human who walks suppliers through their first listing. Month 4–6.
4. **Engineer #2** — only when you can name three specific things you're
   the bottleneck on. Typically month 9–12. Hire someone strong in the
   payments/ledger area, not another full-stack generalist.

Don't hire designers, marketers, or growth before product-market fit. They
have nothing to optimize until transactions are flowing.

## 11. Security & compliance

A standalone checklist, since these concerns cut across every module:

- **RBAC**: four role types — buyer, supplier, admin, inspector. Every
  protected route validates role + ownership (a supplier can only see
  their own RFQs, not others'). Encode in middleware, not handlers.
- **Audit log**: the `transitions` table (§4) covers state changes. Add
  an `audit_event` table for non-state-machine actions — admin overrides,
  role changes, data exports, login from new device.
- **Rate limiting**: Redis-backed sliding-window limiter on auth, RFQ
  submission, and chat send. Stops account-takeover scripts and
  message-flooding.
- **File uploads**: signed URLs to R2, MIME-type allowlist (no
  executables), size cap (~25 MB images, 50 MB PDFs), background virus
  scan via ClamAV worker before exposing the file to other users.
- **Sanction screening**: don't roll your own. Tazapay/Sumsub include
  OFAC/EU/UN sanctions screening as part of KYB. Verify they actually
  screen against the lists you care about (some skip the EU list).
- **Session security**: httpOnly + Secure + SameSite=Lax cookies, CSRF
  tokens on form actions, 2FA mandatory for admins and recommended for
  suppliers and buyers (TOTP via authenticator app — SMS is not reliable
  in AF).
- **Data retention**: chat messages and transition events are kept
  indefinitely — they're dispute evidence. Don't add account-deletion
  flows that purge history; soft-delete only.
- **Secrets**: environment variables for MVP, move to AWS Secrets Manager
  or Doppler once you have >2 environments.

The full negotiation history (chat + RFQ revisions + state transitions)
for every deal is your dispute resolution backbone — keep it forever.

---

## How to validate this plan before committing

1. **Talk to 3 payment partners** (Tazapay, PingPong, one local UAE PSP)
   and confirm Afghan-supplier settlement is feasible at your expected
   volumes and corridors. If two say no, the entire escrow plan changes.
2. **Talk to 5 Afghan exporters** and ask how they currently get paid.
   Their answer tells you whether UAE-intermediary is normal or alien.
3. **Talk to 3 wholesale buyers** in your target corridors (China, UAE,
   USA) and ask what would make them try a new platform vs Alibaba.
   If their answer is "lower commission" you have a price war ahead;
   if it's "trust + verification" your inspection workflow is the moat.
4. **Build the concierge MVP (Phase 0) and run 10 real transactions
   manually** before writing any escrow code. The data model you'll
   discover from those 10 deals is the real spec.

If steps 1–3 surface contradictions with this plan, revise before coding.
