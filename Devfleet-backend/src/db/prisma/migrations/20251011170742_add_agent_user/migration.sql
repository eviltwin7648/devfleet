-- Step 1: Add the "userId" column to "Agent" as an optional field first.
ALTER TABLE "Agent" ADD COLUMN "userId" INTEGER;

-- Step 2: Update existing agents with a default user ID.
-- IMPORTANT: You MUST replace '1' with the actual ID of the user who should own the existing agents.
UPDATE "Agent" SET "userId" = 1 WHERE "userId" IS NULL;

-- Step 3: Now that all agents have a userId, make the column required.
ALTER TABLE "Agent" ALTER COLUMN "userId" SET NOT NULL;

---

-- Step 4: Handle the AgentAPIKey table modifications.
-- First, update any existing keys that have a NULL expiry date with a default value (e.g., 1 year from now).
UPDATE "AgentAPIKey" SET "expiresAt" = NOW() + interval '1 year' WHERE "expiresAt" IS NULL;

-- Step 5: Now, safely apply the schema changes to the AgentAPIKey table.
ALTER TABLE "AgentAPIKey"
DROP COLUMN "agentName",
ADD COLUMN "keyName" TEXT,
ALTER COLUMN "expiresAt" SET NOT NULL;

---

-- Step 6: Finally, add the foreign key constraint to link Agent and User.
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;