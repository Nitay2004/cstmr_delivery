import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Inbox } from "lucide-react";

export function PickupRequestTable() {
  return (
    <div className="rounded-lg border bg-card p-2 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stage</TableHead>
            <TableHead>Sourcing Deal No.</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Actual Pickup Date</TableHead>
            <TableHead>Actual Delivered Date</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-40 text-center text-muted-foreground"
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <Inbox className="size-8 text-muted-foreground/60" />
                <p className="text-sm">No pickup requests yet</p>
                <p className="text-xs text-muted-foreground/70">
                  New requests will appear here.
                </p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
