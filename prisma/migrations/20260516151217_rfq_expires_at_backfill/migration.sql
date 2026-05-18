-- Backfill expires_at for legacy SUBMITTED/QUOTED RFQs that pre-date Epic 5.5.
-- Matches the new RFQ_EXPIRY_DAYS default (7 days from creation). Idempotent —
-- any RFQ whose expires_at has already been set is skipped.
UPDATE "rfqs"
  SET "expires_at" = "created_at" + INTERVAL '7 days'
  WHERE "expires_at" IS NULL AND "status" IN ('SUBMITTED', 'QUOTED');
