-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('LOGIN', 'LOGOUT', 'REGISTER', 'LOGIN_FROM_NEW_DEVICE');

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "type" "AuditEventType" NOT NULL,
    "actor_user_id" TEXT,
    "session_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_actor_user_id_idx" ON "audit_events"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_events_type_idx" ON "audit_events"("type");

-- CreateIndex
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at");

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
