/*
  Warnings:

  - You are about to drop the column `filePath` on the `Attachment` table. All the data in the column will be lost.
  - Added the required column `storageKey` to the `Attachment` table without a default value. This is not possible if the table is not empty.
  - Made the column `staffId` on table `ClinicalRecord` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "recordId" TEXT,
    "fileType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "ocrText" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attachment_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ClinicalRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Attachment" ("createdAt", "fileType", "id", "ocrText", "patientId", "recordId") SELECT "createdAt", "fileType", "id", "ocrText", "patientId", "recordId" FROM "Attachment";
DROP TABLE "Attachment";
ALTER TABLE "new_Attachment" RENAME TO "Attachment";
CREATE TABLE "new_ClinicalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "visitDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "subjective" TEXT NOT NULL DEFAULT '',
    "objective" TEXT NOT NULL DEFAULT '',
    "assessment" TEXT NOT NULL DEFAULT '',
    "plan" TEXT NOT NULL DEFAULT '',
    "rawText" TEXT DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "staffId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClinicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClinicalRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ClinicalRecord" ("assessment", "createdAt", "id", "metadata", "objective", "patientId", "plan", "rawText", "staffId", "subjective", "tags", "updatedAt", "visitCount", "visitDate") SELECT "assessment", "createdAt", "id", "metadata", "objective", "patientId", "plan", "rawText", "staffId", "subjective", "tags", "updatedAt", "visitCount", "visitDate" FROM "ClinicalRecord";
DROP TABLE "ClinicalRecord";
ALTER TABLE "new_ClinicalRecord" RENAME TO "ClinicalRecord";
CREATE INDEX "ClinicalRecord_patientId_visitDate_idx" ON "ClinicalRecord"("patientId", "visitDate");
CREATE INDEX "ClinicalRecord_visitDate_idx" ON "ClinicalRecord"("visitDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
