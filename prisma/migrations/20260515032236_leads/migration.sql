-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeadRoleIntent" AS ENUM ('BUYER', 'SUPPLIER');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "message" TEXT NOT NULL,
    "role_intent" "LeadRoleIntent",
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");
