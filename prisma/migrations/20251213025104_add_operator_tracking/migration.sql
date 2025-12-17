-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "adminMemoResolvedAt" DATETIME;
ALTER TABLE "Appointment" ADD COLUMN "adminMemoResolvedBy" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "createdBy" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "ClinicalRecord" ADD COLUMN "createdBy" TEXT;
