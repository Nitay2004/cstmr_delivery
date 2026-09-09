"use client";

import { ModuleTable } from "@/components/module-table";
import { ModuleBulkUpload } from "@/components/module-bulk-upload";
import { GrnStatCards, GRN_STAGES } from "@/components/grn-stat-cards";
import { useUser, can } from "@/components/user-provider";
import type { TableColumn, FormField } from "@/lib/module-config";

const columns: TableColumn[] = [
  { key: "stage", label: "Stage", badge: true },
  { key: "sourcingDealNo", label: "Sourcing Deal No." },
  { key: "pickup", label: "Pickup Number" },
  { key: "grnDetails", label: "GRN Details" },
  { key: "invoiceNumber", label: "Invoice Number" },
  { key: "invoiceDate", label: "Invoice Date", format: "date" },
  {
    key: "materialReceivedDate",
    label: "Material Received Date",
    format: "date",
  },
];

const formFields: FormField[] = [
  {
    key: "stage",
    label: "Stage",
    required: true,
    options: [...GRN_STAGES],
  },
  {
    key: "sourcingDealNo",
    label: "Sourcing Deal No.",
    required: true,
    placeholder: "e.g. SD-1001",
  },
  { key: "pickup", label: "Pickup Number", placeholder: "e.g. PU-001" },
  { key: "grnDetails", label: "GRN Details", placeholder: "e.g. GRN-1001" },
  {
    key: "invoiceNumber",
    label: "Invoice Number",
    placeholder: "e.g. INV-1001",
  },
  { key: "invoiceDate", label: "Invoice Date", inputType: "date" },
  {
    key: "materialReceivedDate",
    label: "Material Received Date",
    inputType: "date",
  },
];

const SAMPLE_CSV = `Stage,Sourcing Deal No.,Pickup,GRN Details,Invoice Number,Invoice Date,Material Received Date
Material Received,SD-1001,PU-001,GRN-1001,INV-1001,2026-08-01,2026-08-05
Completed,SD-1002,PU-002,GRN-1002,INV-1002,2026-08-10,2026-08-12`;

export default function GrnPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            GRN
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track goods-receipt notes, invoices and material received dates.
          </p>
        </div>
        {can(user, "importGrn") && (
          <ModuleBulkUpload
            apiPath="/api/grns/import"
            title="Bulk Upload GRN"
            description="Import GRN records from a CSV or Excel file."
            requiredColumns="Stage, Sourcing Deal No."
            optionalColumns="Pickup, GRN Details, Invoice Number, Invoice Date, Material Received Date"
            sampleCsv={SAMPLE_CSV}
          />
        )}
      </div>

      <GrnStatCards />

      <ModuleTable
        title="GRN"
        singular="GRN"
        apiPath="/api/grns"
        columns={columns}
        formFields={formFields}
        searchFields={[
          "stage",
          "sourcingDealNo",
          "pickup",
          "grnDetails",
          "invoiceNumber",
        ]}
        permissions={{
          view: "viewGrn",
          create: "createGrn",
          edit: "editGrn",
          del: "deleteGrn",
        }}
        attach={{ module: "grn", title: "GRN" }}
      />
    </div>
  );
}