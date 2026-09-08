"use client";

import { ModuleTable } from "@/components/module-table";
import { ModuleBulkUpload } from "@/components/module-bulk-upload";
import { useUser, can } from "@/components/user-provider";
import type { TableColumn, FormField } from "@/lib/module-config";

const columns: TableColumn[] = [
  { key: "stage", label: "Quote Stage", badge: true },
  { key: "sourcingDealNo", label: "Sourcing Deal No." },
  { key: "pickup", label: "Pickup Number" },
  { key: "quoteNo", label: "Quote No." },
  { key: "totalAmount", label: "Total Amount", align: "right", format: "amount" },
  { key: "locationCode", label: "Location Code" },
  { key: "download", label: "Download", align: "right" },
];

const formFields: FormField[] = [
  {
    key: "stage",
    label: "Quote Stage",
    required: true,
    placeholder: "e.g. Draft, Submitted, Approved",
  },
  {
    key: "sourcingDealNo",
    label: "Sourcing Deal No.",
    required: true,
    placeholder: "e.g. SD-1001",
  },
  { key: "pickup", label: "Pickup Number", placeholder: "e.g. PU-001" },
  { key: "quoteNo", label: "Quote No.", placeholder: "e.g. QU-0001" },
  {
    key: "totalAmount",
    label: "Total Amount",
    inputType: "number",
    placeholder: "0.00",
  },
  { key: "locationCode", label: "Location Code", placeholder: "e.g. MBI" },
];

const SAMPLE_CSV = `Quote Stage,Sourcing Deal No.,Pickup Number,Quote No.,Total Amount,Location Code
Submitted,SD-1001,PU-001,QU-0001,125000,MBI
Approved,SD-1002,PU-002,QU-0002,98000,DLI`;

export default function QuotesPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Quotes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage quotes linked to your deals and track their status.
          </p>
        </div>
        {can(user, "importQuotes") && (
          <ModuleBulkUpload
            apiPath="/api/quotes/import"
            title="Bulk Upload Quotes"
            description="Import quotes from a CSV or Excel file."
            requiredColumns="Quote Stage, Sourcing Deal No."
            optionalColumns="Pickup Number, Quote No., Total Amount, Location Code"
            sampleCsv={SAMPLE_CSV}
          />
        )}
      </div>

      <ModuleTable
        title="Quotes"
        singular="Quote"
        apiPath="/api/quotes"
        columns={columns}
        formFields={formFields}
        searchFields={["stage", "sourcingDealNo", "pickup", "quoteNo", "locationCode"]}
        permissions={{
          view: "viewQuotes",
          create: "createQuote",
          edit: "editQuote",
          del: "deleteQuote",
        }}
      />
    </div>
  );
}