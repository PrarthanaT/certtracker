/*
  Warnings:

  - Added the required column `userId` to the `PracticeScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `StudyLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Week` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PracticeScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "score" REAL,
    "passingScore" REAL NOT NULL DEFAULT 72,
    "takenAt" DATETIME,
    CONSTRAINT "PracticeScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PracticeScore" ("examName", "id", "passingScore", "score", "takenAt") SELECT "examName", "id", "passingScore", "score", "takenAt" FROM "PracticeScore";
DROP TABLE "PracticeScore";
ALTER TABLE "new_PracticeScore" RENAME TO "PracticeScore";
CREATE TABLE "new_StudyLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "duration" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudyLog" ("createdAt", "duration", "id", "text") SELECT "createdAt", "duration", "id", "text" FROM "StudyLog";
DROP TABLE "StudyLog";
ALTER TABLE "new_StudyLog" RENAME TO "StudyLog";
CREATE TABLE "new_Week" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 7,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Week_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Week" ("createdAt", "days", "id", "isOpen", "title", "weekNumber") SELECT "createdAt", "days", "id", "isOpen", "title", "weekNumber" FROM "Week";
DROP TABLE "Week";
ALTER TABLE "new_Week" RENAME TO "Week";
CREATE UNIQUE INDEX "Week_userId_weekNumber_key" ON "Week"("userId", "weekNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
