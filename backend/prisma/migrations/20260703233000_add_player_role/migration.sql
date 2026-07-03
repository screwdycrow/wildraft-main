-- Adds the PLAYER access role and the ItemPermission enum.
-- Kept separate from the tables that use PLAYER as a default: Postgres
-- forbids using a new enum value in the same transaction that added it,
-- and each migration file runs in its own transaction.

-- CreateEnum
CREATE TYPE "ItemPermission" AS ENUM ('VIEW', 'EDIT');

-- AlterEnum
ALTER TYPE "AccessRole" ADD VALUE 'PLAYER';
