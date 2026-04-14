/*
  Warnings:

  - Made the column `executionId` on table `Log` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_executionId_fkey";

-- DropIndex
DROP INDEX "Log_executionId_key";

-- AlterTable
ALTER TABLE "Log" ALTER COLUMN "executionId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "JobExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
