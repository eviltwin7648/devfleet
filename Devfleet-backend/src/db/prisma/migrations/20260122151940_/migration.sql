/*
  Warnings:

  - You are about to drop the column `jobId` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[executionId]` on the table `Log` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('CREATED', 'DISPATCHED', 'RUNNING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED', 'LOST');

-- CreateEnum
CREATE TYPE "FailureType" AS ENUM ('USER_ERROR', 'AGENT_ERROR', 'SYSTEM_ERROR');

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_userId_fkey";

-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_jobId_fkey";

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "jobId",
ADD COLUMN     "executionId" TEXT;

-- DropTable
DROP TABLE "Job";

-- DropEnum
DROP TYPE "jobStatus";

-- CreateTable
CREATE TABLE "JobDefinition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "script" TEXT NOT NULL,
    "env" JSONB,
    "scheduleAt" TIMESTAMP(3),
    "repeatCron" TEXT,
    "isRecurring" BOOLEAN NOT NULL,
    "maxRetries" INTEGER NOT NULL,
    "timeoutSec" INTEGER,
    "tags" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobExecution" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "agentId" TEXT,
    "attempt" INTEGER NOT NULL,
    "status" "ExecutionStatus" NOT NULL,
    "exitCode" INTEGER,
    "failureType" "FailureType",
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Log_executionId_key" ON "Log"("executionId");

-- AddForeignKey
ALTER TABLE "JobDefinition" ADD CONSTRAINT "JobDefinition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobExecution" ADD CONSTRAINT "JobExecution_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobExecution" ADD CONSTRAINT "JobExecution_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "JobExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
