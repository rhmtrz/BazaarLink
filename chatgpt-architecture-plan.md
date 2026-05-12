# B2B Afghan Rug Marketplace — Architecture Strategy

## Vision

Build a managed B2B sourcing and trade platform for Afghan carpets and rugs that connects producers/factories with international wholesale buyers.

The platform is not a traditional eCommerce website.

The core value is:
- trust,
- sourcing,
- verification,
- negotiation,
- shipment coordination,
- and transaction workflow management.

---

# Core Business Model

## Platform Role

The platform acts as:
- marketplace,
- sourcing intermediary,
- trust layer,
- verification service,
- and logistics coordinator.

Revenue sources:
- seller commission,
- buyer commission,
- inspection/service fees,
- shipment coordination fees,
- future premium subscriptions.

---

# Product Strategy

## Phase 1 Goal (MVP)

Focus on:
- supplier onboarding,
- buyer onboarding,
- quotation workflow,
- realtime communication,
- catalog management,
- verification workflow.

Avoid:
- advanced escrow,
- auction systems,
- AI features,
- advanced ERP,
- blockchain/crypto.

The MVP should validate:
- supplier participation,
- buyer interest,
- quotation workflow,
- operational process.

---

# Recommended Technology Stack

## Frontend + Backend

### Primary Framework
- SvelteKit
- TypeScript

Why:
- fast development,
- full-stack capability,
- excellent UX,
- SEO-friendly,
- smaller codebase,
- mobile-first performance.

---

## Database

### PostgreSQL

Reason:
- relational workflows,
- transaction consistency,
- complex marketplace relationships,
- chat and audit logging.

---

## ORM

### Prisma ORM

Reason:
- type safety,
- migration tooling,
- rapid development,
- maintainability.

---

## Authentication

Recommended:
- Lucia Auth
or
- Auth.js

Support:
- buyers,
- suppliers,
- admins,
- inspectors.

---

## Realtime Communication

### Socket.IO
or
### Supabase Realtime

Used for:
- negotiation chat,
- notifications,
- RFQ updates,
- shipment updates.

All messages should be stored permanently in PostgreSQL.

---

## File Storage

### Object Storage
Recommended:
- Cloudflare R2
or
- AWS S3

Store:
- rug images,
- videos,
- certificates,
- invoices,
- shipment documents,
- chat attachments.

---

## Hosting

### Initial Infrastructure
- Vercel (frontend)
- Railway / Render / Fly.io (backend)
- Managed PostgreSQL

Later:
- Kubernetes
- dedicated infrastructure
- CDN optimization.

---

# System Architecture

## Architecture Style

### Modular Monolith First

Do NOT start with microservices.

Reason:
- faster development,
- lower operational complexity,
- easier debugging,
- easier iteration.

Structure the codebase in domain modules.

Example:
- auth
- users
- suppliers
- products
- quotations
- chat
- orders
- shipment
- verification
- commissions
- notifications

Later:
- extract services if scaling requires it.

---

# Core Domain Modules

## 1. Supplier Module

Features:
- onboarding
- verification
- KYC
- showroom profile
- inventory management

---

## 2. Buyer Module

Features:
- wholesale verification
- buyer profile
- RFQ management
- negotiation history

---

## 3. Product Catalog Module

Features:
- rug listings
- dimensions
- material
- weaving type
- origin
- stock quantity
- media gallery
- pricing
- tags/filtering

---

## 4. RFQ / Quotation Module

This is the most important module.

Workflow:
RFQ
→ supplier response
→ negotiation
→ agreement
→ order creation

Features:
- quotation revisions
- attachments
- expiration dates
- approval flow

---

## 5. Chat Module

Critical platform feature.

Requirements:
- realtime messaging
- media attachments
- quotation-linked conversations
- persistent message history
- admin visibility for disputes

Store:
- all messages
- timestamps
- read states
- attachments

Potential future:
- translation support
- AI summarization

---

## 6. Order Workflow Module

The platform should be workflow-centric.

Example:
Quotation Requested
→ Negotiating
→ Agreement Reached
→ Deposit Pending
→ Inspection Pending
→ Shipment Scheduled
→ In Transit
→ Delivered
→ Completed

Use:
- workflow/state machine architecture.

---

## 7. Verification Module

Features:
- supplier verification
- rug inspection
- media verification
- quality approval
- admin reports

Potential:
- inspection scoring system.

---

## 8. Shipment Module

Features:
- shipment tracking
- logistics coordination
- shipment status updates
- document uploads

Potential future integrations:
- DHL
- FedEx
- freight forwarders

---

## 9. Commission Module

Track:
- buyer commission
- seller commission
- inspection fees
- platform revenue

Requirements:
- audit logs
- transaction transparency

---

## 10. Admin Panel

Admin capabilities:
- manage suppliers
- manage buyers
- moderate chats
- approve listings
- verify inspections
- resolve disputes
- manage commissions
- monitor workflows

---

# Data Strategy

## Important Principle

Do NOT model the platform like:
store → cart → checkout

Instead model around:
trade workflow and relationships.

Core entities:
- users
- suppliers
- buyers
- products
- quotations
- negotiations
- messages
- orders
- inspections
- shipments
- commissions

---

# Mobile Strategy

## Supplier Experience

Design mobile-first.

Reason:
many suppliers/producers may primarily use smartphones.

Prioritize:
- image uploads
- quotation responses
- chat
- shipment updates

Desktop optimization can follow.

---

# Security Strategy

Requirements:
- role-based access control
- audit logging
- rate limiting
- secure uploads
- encrypted credentials
- activity tracking

Important:
store all negotiation history for dispute resolution.

---

# Escrow / Payment Strategy

## Initial Recommendation

Do NOT implement full escrow initially.

Instead:
- quotation agreements,
- deposits,
- invoice workflows,
- milestone tracking.

Reason:
holding funds may introduce financial regulation risk.

Future:
integrate licensed payment/escrow partners.

---

# Scaling Strategy

## Early Stage
Use:
- modular monolith
- managed infrastructure
- rapid iteration

## Growth Stage
Add:
- Redis caching
- search indexing
- queue workers
- CDN optimization
- event-driven architecture

## Enterprise Stage
Potentially split:
- chat service
- notification service
- search service
- media processing service

---

# Recommended Development Phases

## Phase 1 — MVP
Build:
- authentication
- supplier onboarding
- buyer onboarding
- catalog
- quotations
- chat
- admin panel
- basic workflow

Goal:
validate market.

---

## Phase 2 — Trade Operations
Add:
- shipment tracking
- verification workflows
- commission system
- reporting
- analytics

---

## Phase 3 — Trust Infrastructure
Add:
- deposits
- payment integration
- dispute handling
- advanced verification

---

## Phase 4 — Marketplace Expansion
Add:
- multilingual support
- AI search
- recommendation engine
- auction system
- financing tools

---

# Final Strategic Recommendation

The platform should be designed as:
- a trade workflow system,
- not merely an eCommerce website.

The competitive advantage will come from:
- trust,
- supplier network,
- verification,
- operational coordination,
- and international trade relationships.

Technology should support those workflows rather than force traditional shopping-cart architecture.