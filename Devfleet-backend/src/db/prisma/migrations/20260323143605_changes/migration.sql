/*
  Warnings:

  - You are about to drop the `Log` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "ExecutionStatus" ADD VALUE 'READY';

-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_executionId_fkey";

-- DropTable
DROP TABLE "Log";

-- CreateTable
CREATE TABLE "LogChunk" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "type" "LogType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LogChunk_executionId_seq_key" ON "LogChunk"("executionId", "seq");

-- AddForeignKey
ALTER TABLE "LogChunk" ADD CONSTRAINT "LogChunk_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "JobExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
