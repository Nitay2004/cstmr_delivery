"use client";

import { FileText } from "lucide-react";
import { ModuleTable } from "@/components/module-table";
import { ModuleBulkUpload } from "@/components/module-bulk-upload";
import { CertificateStatCards, CERTIFICATE_STAGES } from "@/components/certificate-stat-cards";
import { useUser, can } from "@/components/user-provider";
import type { TableColumn, FormField, ModuleRow } from "@/lib/module-config";
import type { AttachmentFile } from "@/components/attachment-section";

const FILE_CATEGORIES = [
  { key: "green-certificate", label: "Green Certificate / COD" },
  { key: "form6", label: "Form 6" },
  { key: "form2", label: "Form 2" },
];

function certCell(r: ModuleRow, category: string) {
  const files = (r["files"] as AttachmentFile[] | undefined) ?? [];
  const matching = files.filter((f) => f.category === category);
  if (matching.length === 0) return "—";
  return (
    <span className="flex flex-col items-start gap-1">
      {matching.map((f) => (
        <a
          key={f.id}
          href={`/api/attachments/file?module=certificate&id=${f.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-[180px] items-center gap-1 truncate text-sm text-primary hover:underline"
        >
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{f.fileName}</span>
        </a>
      ))}
    </span>
  );
}

const columns: TableColumn[] = [
  { key: "status", label: "Status", badge: true },
  { key: "sourcingDealNo", label: "Sourcing Deal No." },
  { key: "pickup", label: "Pickup Number" },
  {
    key: "greenCertificate",
    label: "Green Certificate / COD",
    render: (r) => certCell(r, "green-certificate"),
  },
  { key: "form6", label: "Form 6", render: (r) => certCell(r, "form6") },
  { key: "form2", label: "Form 2", render: (r) => certCell(r, "form2") },
];

const formFields: FormField[] = [
  {
    key: "status",
    label: "Status",
    required: true,
    options: [...CERTIFICATE_STAGES],
  },
  {
    key: "sourcingDealNo",
    label: "Sourcing Deal No.",
    required: true,
    placeholder: "e.g. SD-1001",
  },
  { key: "pickup", label: "Pickup Number", placeholder: "e.g. PU-001" },
];

const SAMPLE_CSV = `Status,Sourcing Deal No.,Pickup
Certificate Pending,SD-1001,PU-001
Certificate Generated,SD-1002,PU-002`;

export default function CertificatesPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Certificates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track certificates per deal — preview Green Certificate / COD, Form 6 and Form 2 files.
          </p>
        </div>
        {can(user, "importCertificate") && (
          <ModuleBulkUpload
            apiPath="/api/certificates/import"
            title="Bulk Upload Certificates"
            description="Import certificates from a CSV or Excel file."
            requiredColumns="Status, Sourcing Deal No."
            optionalColumns="Pickup"
            sampleCsv={SAMPLE_CSV}
          />
        )}
      </div>

      <CertificateStatCards />

      <ModuleTable
        title="Certificates"
        singular="Certificate"
        apiPath="/api/certificates"
        columns={columns}
        formFields={formFields}
        searchFields={["status", "sourcingDealNo", "pickup"]}
        permissions={{
          view: "viewCertificate",
          create: "createCertificate",
          edit: "editCertificate",
          del: "deleteCertificate",
        }}
        attach={{
          module: "certificate",
          title: "Certificate",
          categories: FILE_CATEGORIES,
        }}
      />
    </div>
  );
}