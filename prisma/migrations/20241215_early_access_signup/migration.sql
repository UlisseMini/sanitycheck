-- CreateTable
CREATE TABLE "EarlyAccessSignup" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "discord" TEXT,
    "reason" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "EarlyAccessSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EarlyAccessSignup_email_idx" ON "EarlyAccessSignup"("email");

-- CreateIndex
CREATE INDEX "EarlyAccessSignup_createdAt_idx" ON "EarlyAccessSignup"("createdAt");
