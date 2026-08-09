-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "EffectIdea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "typescriptCode" TEXT NOT NULL,
    "runtimeCode" TEXT NOT NULL,
    "params" JSONB,
    "docs" JSONB,
    "status" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderatedAt" TIMESTAMP(3),

    CONSTRAINT "EffectIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoodleSubmission" (
    "id" TEXT NOT NULL,
    "imageData" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderatedAt" TIMESTAMP(3),

    CONSTRAINT "DoodleSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EffectParamLimits" (
    "id" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EffectParamLimits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EffectIdea_status_createdAt_idx" ON "EffectIdea"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DoodleSubmission_status_createdAt_idx" ON "DoodleSubmission"("status", "createdAt" DESC);
