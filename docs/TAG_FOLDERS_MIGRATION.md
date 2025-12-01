# Tag Folders Migration Guide

## Overview

This migration adds TagFolder support and updates the Tag model with new fields. The migration requires handling existing `folder` string data on tags.

## Changes

### New Model: TagFolder
- `id` (Int, auto-increment)
- `name` (String)
- `order` (Int, default 0)
- `libraryId` (Int, foreign key to Library)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- Unique constraint: `(libraryId, name)`

### Updated Model: Tag
- **Removed**: `folder` (String, nullable)
- **Added**: `folderId` (Int, nullable, foreign key to TagFolder)
- **Added**: `featuredImageId` (Int, nullable, foreign key to UserFile)
- **Added**: `order` (Int, default 0)
- **Added**: Relations to `folder` (TagFolder) and `featuredImage` (UserFile)

### Updated Model: UserFile
- **Added**: `featuredInTags` relation (Tag[])

### Updated Model: Library
- **Added**: `tagFolders` relation (TagFolder[])

## Migration Steps

### Option 1: Development (Data Loss Acceptable)

If you're in development and can lose data:

```bash
npx prisma db push --accept-data-loss
```

This will:
- Drop the `folder` column from Tag table
- Create TagFolder table
- Add new fields to Tag table
- Generate Prisma client

### Option 2: Production (Preserve Data)

If you need to preserve existing folder data:

1. **Create a migration script** to migrate existing `folder` string values to TagFolder records:

```sql
-- Step 1: Create TagFolder records from existing tag folders
INSERT INTO "TagFolder" ("name", "order", "libraryId", "createdAt", "updatedAt")
SELECT DISTINCT 
  t."folder" as "name",
  0 as "order",
  t."libraryId",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Tag" t
WHERE t."folder" IS NOT NULL
  AND t."folder" != ''
ON CONFLICT ("libraryId", "name") DO NOTHING;

-- Step 2: Update tags to reference TagFolder
UPDATE "Tag" t
SET "folderId" = tf."id"
FROM "TagFolder" tf
WHERE t."folder" = tf."name"
  AND t."libraryId" = tf."libraryId"
  AND t."folder" IS NOT NULL
  AND t."folder" != '';

-- Step 3: After applying schema changes, drop the old folder column
ALTER TABLE "Tag" DROP COLUMN "folder";
```

2. **Apply the schema changes**:

```bash
npx prisma db push
```

3. **Run the migration script** on your database

### Option 3: Using Prisma Migrate (Recommended for Production)

1. **Create a migration**:

```bash
npx prisma migrate dev --name add_tag_folders_and_update_tags --create-only
```

2. **Edit the migration file** to include data migration:

```sql
-- CreateTable
CREATE TABLE "TagFolder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "libraryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagFolder_pkey" PRIMARY KEY ("id")
);

-- Migrate existing folder data
INSERT INTO "TagFolder" ("name", "order", "libraryId", "createdAt", "updatedAt")
SELECT DISTINCT 
  t."folder" as "name",
  0 as "order",
  t."libraryId",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Tag" t
WHERE t."folder" IS NOT NULL
  AND t."folder" != ''
ON CONFLICT DO NOTHING;

-- Add new columns to Tag
ALTER TABLE "Tag" ADD COLUMN "folderId" INTEGER;
ALTER TABLE "Tag" ADD COLUMN "featuredImageId" INTEGER;
ALTER TABLE "Tag" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Update tags to reference TagFolder
UPDATE "Tag" t
SET "folderId" = tf."id"
FROM "TagFolder" tf
WHERE t."folder" = tf."name"
  AND t."libraryId" = tf."libraryId"
  AND t."folder" IS NOT NULL
  AND t."folder" != '';

-- Add foreign keys
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "TagFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "UserFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "Tag_folderId_idx" ON "Tag"("folderId");
CREATE INDEX "Tag_featuredImageId_idx" ON "Tag"("featuredImageId");

-- Drop old folder column
ALTER TABLE "Tag" DROP COLUMN "folder";

-- Add unique constraint
CREATE UNIQUE INDEX "TagFolder_libraryId_name_key" ON "TagFolder"("libraryId", "name");

-- Add indexes
CREATE INDEX "TagFolder_libraryId_idx" ON "TagFolder"("libraryId");
```

3. **Apply the migration**:

```bash
npx prisma migrate dev
```

4. **Generate Prisma client**:

```bash
npx prisma generate
```

## Verification

After migration, verify the changes:

```sql
-- Check TagFolder table
SELECT * FROM "TagFolder";

-- Check tags with folders
SELECT t.id, t.name, t."folderId", tf.name as folder_name
FROM "Tag" t
LEFT JOIN "TagFolder" tf ON t."folderId" = tf.id;

-- Verify no tags have old folder column (should error if column still exists)
-- SELECT "folder" FROM "Tag" LIMIT 1;
```

## Rollback

If you need to rollback:

1. **Restore the old schema** (add back `folder` column to Tag)
2. **Migrate data back** from TagFolder to Tag.folder
3. **Drop TagFolder table**

## Notes

- Existing tags with `folder` values will need to be migrated to TagFolder records
- The `order` field defaults to 0 for all existing tags
- Featured images can be set after migration
- Tag folders are library-scoped, so folder names only need to be unique within a library

