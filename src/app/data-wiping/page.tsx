"use client";

import { useState } from "react";
import { ModuleTable } from "@/components/module-table";
import { ModuleBulkUpload } from "@/components/module-bulk-upload";
import { DataWipingStatCards, DATA_WIPING_STAGES } from "@/components/data-wiping-stat-cards";
import { DeviceDetailSheet } from "@/components/device-detail-sheet";
import { useUser, can } from "@/components/user-provider";
import type { TableColumn, FormField, ModuleRow } from "@/lib/module-config";

const formFields: FormField[] = [
  {
    key: "status",
    label: "Status",
    required: true,
    options: [...DATA_WIPING_STAGES],
  },
  {
    key: "sourcingDealNo",
    label: "Sourcing Deal No.",
    required: true,
    placeholder: "e.g. SD-1001",
  },
  { key: "pickup", label: "Pickup Number", placeholder: "e.g. PU-001" },
  { key: "dataWipingId", label: "Data Wiping Id", placeholder: "e.g. DW-0001" },
  { key: "laptop", label: "Laptop", inputType: "number", placeholder: "0" },
  {
    key: "laptopSsdHddReceived",
    label: "SSD/HDD Received",
    inputType: "number",
    placeholder: "0",
  },
  {
    key: "laptopWiped",
    label: "Laptop Data Sanitized",
    inputType: "number",
    placeholder: "0",
  },
  {
    key: "laptopShreddingDone",
    label: "Shredding Done",
    inputType: "number",
    placeholder: "0",
  },
  {
    key: "laptopNotWiped",
    label: "Laptop SSD Not Received",
    inputType: "number",
    placeholder: "0",
  },
  { key: "desktop", label: "Desktop", inputType: "number", placeholder: "0" },
  {
    key: "desktopSsdHddReceived",
    label: "SSD/HDD Received",
    inputType: "number",
    placeholder: "0",
  },
  {
    key: "desktopWiped",
    label: "Desktop Data Sanitized",
    inputType: "number",
    placeholder: "0",
  },
  {
    key: "desktopShreddingDone",
    label: "Shredding Done",
    inputType: "number",
    placeholder: "0",
  },
  {
    key: "desktopNotWiped",
    label: "Desktop SSD Not Received",
    inputType: "number",
    placeholder: "0",
  },
];

const SAMPLE_CSV = `Status,Sourcing Deal No.,Pickup Number,Data Wiping Id,Laptop,SSD/HDD Received,Laptop Data Sanitized,Shredding Done,Laptop SSD Not Received,Desktop,SSD/HDD Received,Desktop Data Sanitized,Shredding Done,Desktop SSD Not Received
Under Process,SD-1001,PU-001,DW-0001,10,8,6,5,2,5,4,3,3,1
Completed,SD-1002,PU-002,DW-0002,20,18,18,18,0,10,9,9,9,0`;

export default function DataWipingPage() {
  const { user } = useUser();
  const [detail, setDetail] = useState<{
    pickup: string;
    deviceType: "Laptop" | "Desktop";
  } | null>(null);

  const openDetail = (pickup: string, deviceType: "Laptop" | "Desktop") => {
    if (!pickup) return;
    setDetail({ pickup, deviceType });
  };

  const countLink = (row: ModuleRow, deviceType: "Laptop" | "Desktop") => {
    const value = Number(row[deviceType.toLowerCase()] ?? 0);
    if (!value || value <= 0) return <span className="text-muted-foreground">—</span>;
    return (
      <button
        type="button"
        onClick={() => openDetail(String(row.pickup ?? ""), deviceType)}
        className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
        title={`View ${deviceType} details for ${String(row.pickup ?? "")}`}
      >
        {value.toLocaleString("en-IN")}
      </button>
    );
  };

  const columns: TableColumn[] = [
    { key: "status", label: "Status", badge: true },
    { key: "sourcingDealNo", label: "Sourcing Deal No." },
    { key: "pickup", label: "Pickup Number" },
    { key: "dataWipingId", label: "Data Wiping Id" },
    {
      key: "laptop",
      label: "Laptop",
      align: "right",
      render: (row) => countLink(row, "Laptop"),
    },
    { key: "laptopSsdHddReceived", label: "SSD/HDD Received", align: "right" },
    { key: "laptopWiped", label: "Laptop Data Sanitized", align: "right" },
    { key: "laptopShreddingDone", label: "Shredding Done", align: "right" },
    { key: "laptopNotWiped", label: "Laptop SSD Not Received", align: "right" },
    {
      key: "desktop",
      label: "Desktop",
      align: "right",
      render: (row) => countLink(row, "Desktop"),
    },
    { key: "desktopSsdHddReceived", label: "SSD/HDD Received", align: "right" },
    { key: "desktopWiped", label: "Desktop Data Sanitized", align: "right" },
    { key: "desktopShreddingDone", label: "Shredding Done", align: "right" },
    { key: "desktopNotWiped", label: "Desktop SSD Not Received", align: "right" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Data Wiping
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track devices wiped per deal with laptop and desktop counts.
          </p>
        </div>
        {can(user, "importDataWiping") && (
          <ModuleBulkUpload
            apiPath="/api/data-wiping/import"
            title="Bulk Upload Data Wiping"
            description="Import data wiping records from a CSV or Excel file."
            requiredColumns="Status, Sourcing Deal No., Pickup Number, Data Wiping Id"
            optionalColumns="Laptop, SSD/HDD Received, Laptop Data Sanitized, Shredding Done, Laptop SSD Not Received, Desktop, SSD/HDD Received, Desktop Data Sanitized, Shredding Done, Desktop SSD Not Received"
            sampleCsv={SAMPLE_CSV}
          />
        )}
      </div>

      <DataWipingStatCards />

      <ModuleTable
        title="Data Wiping"
        singular="Data Wiping"
        listKey="dataWipings"
        apiPath="/api/data-wiping"
        columns={columns}
        formFields={formFields}
        searchFields={["dataWipingId", "status", "sourcingDealNo", "pickup"]}
        permissions={{
          view: "viewDataWiping",
          create: "createDataWiping",
          edit: "editDataWiping",
          del: "deleteDataWiping",
        }}
        attach={{ module: "data-wiping", title: "Data Wiping" }}
      />

      <DeviceDetailSheet
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        pickup={detail?.pickup ?? ""}
        deviceType={detail?.deviceType ?? "Laptop"}
      />
    </div>
  );
}