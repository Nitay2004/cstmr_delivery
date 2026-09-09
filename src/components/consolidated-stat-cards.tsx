"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IndianRupee, Boxes, Loader2 } from "lucide-react";

interface Summary {
  totalQty: number;
  totalAmount: number;
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatQty(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export function ConsolidatedStatCards() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/consolidated")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const records: { qty?: number | null; amount?: number | null }[] =
          data.consolidated ?? [];
        const totalQty = records.reduce(
          (sum, r) => sum + (Number(r.qty) || 0),
          0
        );
        const totalAmount = records.reduce(
          (sum, r) => sum + (Number(r.amount) || 0),
          0
        );
        setSummary({ totalQty, totalAmount });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!summary) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IndianRupee className="size-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Amount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatAmount(summary.totalAmount)}</div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Boxes className="size-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Quantity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatQty(summary.totalQty)}</div>
        </CardContent>
      </Card>
    </div>
  );
}