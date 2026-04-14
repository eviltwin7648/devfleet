/*
  Warnings:

  - A unique constraint covering the columns `[apiKeyId]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "apiKeyId" INTEGER;

-- CreateTable
CREATE TABLE "AgentAPIKey" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "agentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "agentName" TEXT,

    CONSTRAINT "AgentAPIKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentAPIKey_apiKey_key" ON "AgentAPIKey"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "AgentAPIKey_agentId_key" ON "AgentAPIKey"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_apiKeyId_key" ON "Agent"("apiKeyId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "AgentAPIKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAPIKey" ADD CONSTRAINT "AgentAPIKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
