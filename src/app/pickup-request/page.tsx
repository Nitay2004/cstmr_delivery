"use client";

import { PickupRequestTable } from "@/components/pickup-request-table";
import { StatCards } from "@/components/stat-cards";
import { BulkUpload } from "@/components/bulk-upload";
import { useUser, can } from "@/components/user-provider";

export default function PickupRequestPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Pickup Requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your pickup requests and monitor their status.
          </p>
        </div>
        {can(user, "importPickupRequests") && <BulkUpload />}
      </div>

      <StatCards />

      <PickupRequestTable />
    </div>
  );
}