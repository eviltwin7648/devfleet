/*
  Warnings:

  - Changed the type of `type` on the `Log` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('STDOUT', 'STDERR', 'SYSTEM');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxRetries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "repeatCron" TEXT,
ADD COLUMN     "retries" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduleAt" TIMESTAMP(3),
ADD COLUMN     "tags" JSONB,
ADD COLUMN     "timeoutSec" INTEGER;

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "type",
ADD COLUMN     "type" "LogType" NOT NULL;

-- CreateTable
CREATE TABLE "AgentHealth" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "cpuUsage" DOUBLE PRECISION NOT NULL,
    "memUsage" DOUBLE PRECISION NOT NULL,
    "diskUsage" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentHealth_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AgentHealth" ADD CONSTRAINT "AgentHealth_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
