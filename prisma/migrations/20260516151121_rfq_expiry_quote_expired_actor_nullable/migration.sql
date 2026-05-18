-- AlterEnum
ALTER TYPE "QuoteStatus" ADD VALUE 'EXPIRED';

-- DropForeignKey
ALTER TABLE "transitions" DROP CONSTRAINT "transitions_actor_id_fkey";

-- AlterTable
ALTER TABLE "transitions" ALTER COLUMN "actor_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transitions" ADD CONSTRAINT "transitions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
