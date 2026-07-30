-- CreateTable
CREATE TABLE "ChildKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChildKey_tags_idx" ON "ChildKey" USING GIN ("tags" jsonb_path_ops);
