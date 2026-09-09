"use client";

import { ModuleTable } from "@/components/module-table";
import { ModuleBulkUpload } from "@/components/module-bulk-upload";
import { ConsolidatedStatCards } from "@/components/consolidated-stat-cards";
import { useUser, can } from "@/components/user-provider";
import type { TableColumn, FormField } from "@/lib/module-config";

const columns: TableColumn[] = [
  { key: "category", label: "Category" },
  { key: "qty", label: "Qty", align: "right" },
  { key: "amount", label: "Amount", align: "right", format: "amount" },
];

const formFields: FormField[] = [
  {
    key: "category",
    label: "Category",
    required: true,
    placeholder: "e.g. Laptops",
  },
  { key: "qty", label: "Qty", inputType: "number", placeholder: "0" },
  { key: "amount", label: "Amount", inputType: "number", placeholder: "0.00" },
];

const SAMPLE_CSV = `Category,Qty,Amount
Laptops,10,250000
Desktops,5,120000`;

export default function ConsolidatedPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Consolidated
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consolidated category-wise quantities and amounts.
          </p>
        </div>
        {can(user, "importConsolidated") && (
          <ModuleBulkUpload
            apiPath="/api/consolidated/import"
            title="Bulk Upload Consolidated"
            description="Import consolidated records from a CSV or Excel file."
            requiredColumns="Category"
            optionalColumns="Qty, Amount"
            sampleCsv={SAMPLE_CSV}
          />
        )}
      </div>

      <ConsolidatedStatCards />

      <ModuleTable
        title="Consolidated"
        singular="Consolidated"
        listKey="consolidated"
        apiPath="/api/consolidated"
        columns={columns}
        formFields={formFields}
        searchFields={["category"]}
        permissions={{
          view: "viewConsolidated",
          create: "createConsolidated",
          edit: "editConsolidated",
          del: "deleteConsolidated",
        }}
      />
    </div>
  );
}