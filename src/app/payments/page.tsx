"use client";

import { useState } from "react";
import { ModuleTable } from "@/components/module-table";
import { ModuleBulkUpload } from "@/components/module-bulk-upload";
import { PaymentStatCards, PAYMENT_STAGES } from "@/components/payment-stat-cards";
import { useUser, can } from "@/components/user-provider";
import type { TableColumn, FormField } from "@/lib/module-config";

const columns: TableColumn[] = [
  { key: "stage", label: "Stage", badge: true },
  { key: "sourcingDealNo", label: "Sourcing Deal No." },
  { key: "pickup", label: "Pickup" },
  { key: "purchaseOrderNo", label: "Purchase Order No" },
  { key: "payment", label: "Payment" },
  {
    key: "totalInvoiceAmount",
    label: "Total Invoice Amount",
    align: "right",
    format: "amount",
  },
  {
    key: "totalPaymentDone",
    label: "Total Payment Done",
    align: "right",
    format: "amount",
  },
  {
    key: "balanceAmount",
    label: "Balance Amount",
    align: "right",
    format: "amount",
  },
];

const formFields: FormField[] = [
  {
    key: "stage",
    label: "Stage",
    required: true,
    options: [...PAYMENT_STAGES],
  },
  {
    key: "sourcingDealNo",
    label: "Sourcing Deal No.",
    required: true,
    placeholder: "e.g. SD-1001",
  },
  { key: "pickup", label: "Pickup", placeholder: "e.g. John's Warehouse" },
  { key: "purchaseOrderNo", label: "Purchase Order No", placeholder: "e.g. PO-1001" },
  { key: "payment", label: "Payment", placeholder: "e.g. NEFT / reference" },
  {
    key: "totalInvoiceAmount",
    label: "Total Invoice Amount",
    inputType: "number",
    placeholder: "0.00",
  },
  {
    key: "totalPaymentDone",
    label: "Total Payment Done",
    inputType: "number",
    placeholder: "0.00",
  },
  {
    key: "balanceAmount",
    label: "Balance Amount",
    inputType: "number",
    placeholder: "0.00",
  },
];

const SAMPLE_CSV = `Stage,Sourcing Deal No.,Pickup,Purchase Order No,Payment,Total Invoice Amount,Total Payment Done,Balance Amount
Payment Created,SD-1001,John's Warehouse,PO-1001,NEFT-8891,125000,70000,55000
Payment Approved,SD-1002,ABC Logistics,PO-1002,NEFT-8892,98000,98000,0`;

export default function PaymentsPage() {
  const { user } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Payments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track invoices, payments received, and outstanding balances.
          </p>
        </div>
        {can(user, "importPayments") && (
          <ModuleBulkUpload
            apiPath="/api/payments/import"
            title="Bulk Upload Payments"
            description="Import payments from a CSV or Excel file."
            requiredColumns="Stage, Sourcing Deal No."
            optionalColumns="Pickup, Purchase Order No, Payment, Total Invoice Amount, Total Payment Done, Balance Amount"
            sampleCsv={SAMPLE_CSV}
          />
        )}
      </div>

      <PaymentStatCards key={refreshKey} />

      <ModuleTable
        title="Payments"
        singular="Payment"
        apiPath="/api/payments"
        columns={columns}
        formFields={formFields}
        searchFields={[
          "stage",
          "sourcingDealNo",
          "pickup",
          "purchaseOrderNo",
          "payment",
        ]}
        permissions={{
          view: "viewPayments",
          create: "createPayment",
          edit: "editPayment",
          del: "deletePayment",
        }}
        attach={{ module: "payment", title: "Payment" }}
        onDataChange={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}