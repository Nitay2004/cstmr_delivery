"use client";

import { ModuleTable } from "@/components/module-table";
import { ModuleBulkUpload } from "@/components/module-bulk-upload";
import { useUser, can } from "@/components/user-provider";
import type { TableColumn, FormField } from "@/lib/module-config";

const columns: TableColumn[] = [
  { key: "stage", label: "PO Stage", badge: true },
  { key: "sourcingDealNo", label: "Sourcing Deal No." },
  { key: "pickup", label: "Pickup" },
  { key: "quoteNo", label: "Quote" },
  { key: "purchaseOrderNo", label: "Purchase Order" },
  { key: "locationCode", label: "Location Code" },
  { key: "download", label: "Download", align: "right" },
];

const formFields: FormField[] = [
  {
    key: "stage",
    label: "PO Stage",
    required: true,
    placeholder: "e.g. Draft, Issued, Confirmed",
  },
  {
    key: "sourcingDealNo",
    label: "Sourcing Deal No.",
    required: true,
    placeholder: "e.g. SD-1001",
  },
  { key: "pickup", label: "Pickup", placeholder: "e.g. John's Warehouse" },
  { key: "quoteNo", label: "Quote", placeholder: "e.g. QU-0001" },
  { key: "purchaseOrderNo", label: "Purchase Order", placeholder: "e.g. PO-1001" },
  { key: "locationCode", label: "Location Code", placeholder: "e.g. MBI" },
];

const SAMPLE_CSV = `PO Stage,Sourcing Deal No.,Pickup,Quote,Purchase Order,Location Code
Issued,SD-1001,John's Warehouse,QU-0001,PO-1001,MBI
Confirmed,SD-1002,ABC Logistics,QU-0002,PO-1002,DLI`;

export default function PurchaseOrdersPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage purchase orders raised against quotes.
          </p>
        </div>
        {can(user, "importPurchaseOrders") && (
          <ModuleBulkUpload
            apiPath="/api/purchase-orders/import"
            title="Bulk Upload Purchase Orders"
            description="Import purchase orders from a CSV or Excel file."
            requiredColumns="PO Stage, Sourcing Deal No."
            optionalColumns="Pickup, Quote, Purchase Order, Location Code"
            sampleCsv={SAMPLE_CSV}
          />
        )}
      </div>

      <ModuleTable
        title="Purchase Orders"
        singular="Purchase Order"
        apiPath="/api/purchase-orders"
        listKey="orders"
        columns={columns}
        formFields={formFields}
        searchFields={[
          "stage",
          "sourcingDealNo",
          "pickup",
          "quoteNo",
          "purchaseOrderNo",
          "locationCode",
        ]}
        permissions={{
          view: "viewPurchaseOrders",
          create: "createPurchaseOrder",
          edit: "editPurchaseOrder",
          del: "deletePurchaseOrder",
        }}
      />
    </div>
  );
}