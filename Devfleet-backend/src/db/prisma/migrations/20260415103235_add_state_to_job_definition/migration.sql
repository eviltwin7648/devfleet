-- CreateEnum
CREATE TYPE "JOBDEFINITIONSTATE" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');

-- AlterTable: add column with a default so existing rows are backfilled to 'ACTIVE',
-- then drop the default to keep the schema strict (no default at the DB level).
ALTER TABLE "JobDefinition" ADD COLUMN "state" "JOBDEFINITIONSTATE" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "JobDefinition" ALTER COLUMN "state" DROP DEFAULT;
