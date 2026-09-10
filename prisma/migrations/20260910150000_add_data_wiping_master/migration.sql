-- CreateTable
CREATE TABLE "DataWipingMaster" (
    "id" TEXT NOT NULL,
    "pickupId" TEXT,
    "serialNumber" TEXT,
    "assetType" TEXT,
    "hddSerialNumber" TEXT,
    "dataWipingDate" TEXT,
    "uuid" TEXT,
    "size" TEXT,
    "pdfName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataWipingMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataWipingMaster_pickupId_idx" ON "DataWipingMaster"("pickupId");

-- CreateIndex
CREATE INDEX "DataWipingMaster_serialNumber_idx" ON "DataWipingMaster"("serialNumber");

-- CreateIndex
CREATE INDEX "DataWipingMaster_assetType_idx" ON "DataWipingMaster"("assetType");

-- CreateIndex
CREATE INDEX "DataWipingMaster_hddSerialNumber_idx" ON "DataWipingMaster"("hddSerialNumber");

-- CreateIndex
CREATE INDEX "DataWipingMaster_uuid_idx" ON "DataWipingMaster"("uuid");