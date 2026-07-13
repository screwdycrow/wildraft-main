-- Add MINDMAP value to the LibraryItemType enum.
-- Additive, non-destructive change.
ALTER TYPE "LibraryItemType" ADD VALUE IF NOT EXISTS 'MINDMAP' AFTER 'NOTE';
