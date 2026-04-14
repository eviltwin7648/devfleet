/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `emailOtp` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "emailOtp_email_key" ON "emailOtp"("email");
