-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "quote" TEXT NOT NULL,
    "annotation" TEXT NOT NULL,
    "fallacyType" TEXT,
    "userId" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Annotation_url_idx" ON "Annotation"("url");

-- CreateIndex
CREATE INDEX "Annotation_fallacyType_idx" ON "Annotation"("fallacyType");

-- CreateIndex
CREATE INDEX "Annotation_createdAt_idx" ON "Annotation"("createdAt");

