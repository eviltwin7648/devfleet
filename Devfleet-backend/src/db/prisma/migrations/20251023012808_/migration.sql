/*
  Warnings:

  - The primary key for the `Agent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `AgentAPIKey` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Job` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `status` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Log` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `emailOtp` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `userId` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "jobStatus" AS ENUM ('Success', 'Failure', 'Pending', 'Running');

-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_apiKeyId_fkey";

-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_userId_fkey";

-- DropForeignKey
ALTER TABLE "AgentAPIKey" DROP CONSTRAINT "AgentAPIKey_userId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_jobId_fkey";

-- AlterTable
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "apiKeyId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Agent_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Agent_id_seq";

-- AlterTable
ALTER TABLE "AgentAPIKey" DROP CONSTRAINT "AgentAPIKey_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "agentId" SET DATA TYPE TEXT,
ADD CONSTRAINT "AgentAPIKey_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "AgentAPIKey_id_seq";

-- AlterTable
ALTER TABLE "Job" DROP CONSTRAINT "Job_pkey",
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "agentId" SET DATA TYPE TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "jobStatus" NOT NULL DEFAULT 'Pending',
ADD CONSTRAINT "Job_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Job_id_seq";

-- AlterTable
ALTER TABLE "Log" DROP CONSTRAINT "Log_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "jobId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Log_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Log_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "emailOtp" DROP CONSTRAINT "emailOtp_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "emailOtp_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "emailOtp_id_seq";

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "AgentAPIKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAPIKey" ADD CONSTRAINT "AgentAPIKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
