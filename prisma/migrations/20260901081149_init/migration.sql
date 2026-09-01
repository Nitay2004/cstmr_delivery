-- CreateTable
CREATE TABLE "PickupRequest" (
    "id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "sourcingDealNo" TEXT NOT NULL,
    "pickup" TEXT,
    "location" TEXT,
    "actualPickupDate" TIMESTAMP(3),
    "actualDeliveredDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupFile" (
    "id" TEXT NOT NULL,
    "pickupRequestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickupFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PickupRequest_sourcingDealNo_idx" ON "PickupRequest"("sourcingDealNo");

-- CreateIndex
CREATE INDEX "PickupRequest_stage_idx" ON "PickupRequest"("stage");

-- CreateIndex
CREATE INDEX "PickupFile_pickupRequestId_idx" ON "PickupFile"("pickupRequestId");

-- AddForeignKey
ALTER TABLE "PickupFile" ADD CONSTRAINT "PickupFile_pickupRequestId_fkey" FOREIGN KEY ("pickupRequestId") REFERENCES "PickupRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
