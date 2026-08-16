-- AlterTable
ALTER TABLE "ApprovalItem" ADD COLUMN "hashMismatchAt" DATETIME;
ALTER TABLE "ApprovalItem" ADD COLUMN "lockedHash" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "assignedTo" TEXT;

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "content" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
