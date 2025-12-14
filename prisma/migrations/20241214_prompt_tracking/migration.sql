-- Add prompt tracking to Analysis
ALTER TABLE "Analysis" ADD COLUMN "promptUsed" TEXT;
ALTER TABLE "Analysis" ADD COLUMN "isCustomPrompt" BOOLEAN NOT NULL DEFAULT false;
