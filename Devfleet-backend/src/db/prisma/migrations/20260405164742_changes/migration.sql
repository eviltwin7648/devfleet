/*
  Warnings:

  - Added the required column `batchSeq` to the `LogChunk` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LogChunk" ADD COLUMN     "batchSeq" INTEGER NOT NULL;
