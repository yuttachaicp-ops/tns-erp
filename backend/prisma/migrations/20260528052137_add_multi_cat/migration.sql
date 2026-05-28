/*
  Warnings:

  - Added the required column `catId` to the `cat_daily_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `catId` to the `cat_vaccinations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `catId` to the `cat_vet_visits` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "cats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "color" TEXT,
    "birthDate" TEXT,
    "weight" TEXT,
    "microchip" TEXT,
    "allergy" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cat_daily_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "catId" TEXT NOT NULL,
    "logDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medicine" TEXT,
    "foodIntake" TEXT,
    "waterIntake" TEXT,
    "excretion" TEXT,
    "behavior" TEXT,
    "temperature" REAL,
    "weight" REAL,
    "symptoms" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cat_daily_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cat_daily_logs_catId_fkey" FOREIGN KEY ("catId") REFERENCES "cats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cat_daily_logs" ("behavior", "createdAt", "excretion", "foodIntake", "id", "logDate", "medicine", "note", "symptoms", "temperature", "updatedAt", "userId", "waterIntake", "weight") SELECT "behavior", "createdAt", "excretion", "foodIntake", "id", "logDate", "medicine", "note", "symptoms", "temperature", "updatedAt", "userId", "waterIntake", "weight" FROM "cat_daily_logs";
DROP TABLE "cat_daily_logs";
ALTER TABLE "new_cat_daily_logs" RENAME TO "cat_daily_logs";
CREATE TABLE "new_cat_vaccinations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "catId" TEXT NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "vacDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDate" DATETIME,
    "clinic" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cat_vaccinations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cat_vaccinations_catId_fkey" FOREIGN KEY ("catId") REFERENCES "cats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cat_vaccinations" ("clinic", "createdAt", "id", "nextDate", "note", "updatedAt", "userId", "vacDate", "vaccineName") SELECT "clinic", "createdAt", "id", "nextDate", "note", "updatedAt", "userId", "vacDate", "vaccineName" FROM "cat_vaccinations";
DROP TABLE "cat_vaccinations";
ALTER TABLE "new_cat_vaccinations" RENAME TO "cat_vaccinations";
CREATE TABLE "new_cat_vet_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "catId" TEXT NOT NULL,
    "visitDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "results" TEXT,
    "bloodValues" TEXT,
    "additionalDiag" TEXT,
    "medicationChange" TEXT,
    "cost" REAL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cat_vet_visits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cat_vet_visits_catId_fkey" FOREIGN KEY ("catId") REFERENCES "cats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cat_vet_visits" ("additionalDiag", "bloodValues", "cost", "createdAt", "id", "medicationChange", "note", "results", "updatedAt", "userId", "visitDate") SELECT "additionalDiag", "bloodValues", "cost", "createdAt", "id", "medicationChange", "note", "results", "updatedAt", "userId", "visitDate" FROM "cat_vet_visits";
DROP TABLE "cat_vet_visits";
ALTER TABLE "new_cat_vet_visits" RENAME TO "cat_vet_visits";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
