-- Rebuild DataWipingMaster fields to match the new import headers:
-- Remove UUID and Data Wiping Date; add Wiped, Wiped Software, Wiped Date,
-- HDD Available and Remarks. (Pickup ID / Lot No. stays as pickupId.)
DROP INDEX IF EXISTS "DataWipingMaster_uuid_idx";
ALTER TABLE "DataWipingMaster" DROP COLUMN "uuid", DROP COLUMN "dataWipingDate";
ALTER TABLE "DataWipingMaster"
  ADD COLUMN "wiped" TEXT,
  ADD COLUMN "wipedSoftware" TEXT,
  ADD COLUMN "wipedDate" TEXT,
  ADD COLUMN "hddAvailable" TEXT,
  ADD COLUMN "remarks" TEXT;