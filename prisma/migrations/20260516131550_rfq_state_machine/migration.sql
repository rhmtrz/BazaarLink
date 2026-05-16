-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('ACTIVE', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "rfqs" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "quantity" INTEGER,
    "status" "RfqStatus" NOT NULL DEFAULT 'DRAFT',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "rfq_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transitions" (
    "id" TEXT NOT NULL,
    "rfq_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "from_status" "RfqStatus" NOT NULL,
    "to_status" "RfqStatus" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rfqs_buyer_id_idx" ON "rfqs"("buyer_id");

-- CreateIndex
CREATE INDEX "rfqs_listing_id_idx" ON "rfqs"("listing_id");

-- CreateIndex
CREATE INDEX "rfqs_status_idx" ON "rfqs"("status");

-- CreateIndex
CREATE INDEX "rfqs_expires_at_idx" ON "rfqs"("expires_at");

-- CreateIndex
CREATE INDEX "rfqs_created_at_idx" ON "rfqs"("created_at");

-- CreateIndex
CREATE INDEX "quotes_rfq_id_idx" ON "quotes"("rfq_id");

-- CreateIndex
CREATE INDEX "quotes_supplier_id_idx" ON "quotes"("supplier_id");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "transitions_rfq_id_idx" ON "transitions"("rfq_id");

-- CreateIndex
CREATE INDEX "transitions_created_at_idx" ON "transitions"("created_at");

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transitions" ADD CONSTRAINT "transitions_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transitions" ADD CONSTRAINT "transitions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
