import { PickupRequestTable } from "@/components/pickup-request-table";
import { StatCards } from "@/components/stat-cards";

export default function PickupRequestPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Pickup Request
        </h1>
        <p className="text-sm text-muted-foreground">
          Create and manage your pickup requests here.
        </p>
      </div>
      <StatCards />
      <PickupRequestTable />
    </div>
  );
}
