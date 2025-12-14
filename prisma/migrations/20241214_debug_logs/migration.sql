-- CreateTable
CREATE TABLE "DebugLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "source" TEXT,
    "ip" TEXT,
    "version" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "DebugLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DebugLog_createdAt_idx" ON "DebugLog"("createdAt");

-- CreateIndex
CREATE INDEX "DebugLog_ip_idx" ON "DebugLog"("ip");

-- CreateIndex
CREATE INDEX "DebugLog_level_idx" ON "DebugLog"("level");
