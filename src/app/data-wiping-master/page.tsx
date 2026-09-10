"use client";

import { DataWipingMasterTable } from "@/components/data-wiping-master-table";
import { ModuleBulkUpload } from "@/components/module-bulk-upload";
import { useUser, can } from "@/components/user-provider";

const SAMPLE_CSV = `Pickup ID,Serial number/Asset Tag,Asset Type,HDD Serial Number,Data Wiping Date,UUID,Size,PDF Name
PU-1001,XYZ12345,Laptop,SN-0001,2026-08-15,550e8400-e29b-41d4-a716-446655440000,256GB,COC-2026-08-15-001
PU-1002,ABC98765,Desktop,SN-0002,2026-08-18,6fa459ea-ee8a-3ca4-894e-db77e160355e,512GB,COC-2026-08-18-002`;

export default function DataWipingMasterPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Data Wiping Master
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Server-side catalog of wiped assets with pickup and HDD details.
          </p>
        </div>
        {can(user, "importDataWipingMaster") && (
          <ModuleBulkUpload
            apiPath="/api/data-wiping-master/import"
            title="Bulk Upload Data Wiping Master"
            description="Import data wiping master records from a CSV or Excel file."
            requiredColumns="Serial number/Asset Tag"
            optionalColumns="Pickup ID, Asset Type, HDD Serial Number, Data Wiping Date, UUID, Size, PDF Name"
            sampleCsv={SAMPLE_CSV}
          />
        )}
      </div>

      <DataWipingMasterTable />
    </div>
  );
}