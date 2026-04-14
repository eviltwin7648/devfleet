/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Agent_hostname_key";

-- CreateIndex
CREATE UNIQUE INDEX "Agent_id_key" ON "Agent"("id");
