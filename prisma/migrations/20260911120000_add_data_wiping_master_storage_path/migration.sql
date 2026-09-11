-- Add storagePath to DataWipingMaster to link each asset to its PDF on the office server.
ALTER TABLE "DataWipingMaster" ADD COLUMN "storagePath" TEXT;