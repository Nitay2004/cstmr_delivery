"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package2,
  Clock,
  Truck,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface RequestSummary {
  total: number;
  stages: Record<string, number>;
}

function countByStage(requests: { stage: string }[]): Record<string, number> {
  return requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.stage] = (acc[r.stage] ?? 0) + 1;
    return acc;
  }, {});
}

export function StatCards() {
  const [summary, setSummary] = useState<RequestSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/pickup-requests")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const stages = countByStage(data.requests ?? []);
        setSummary({
          total: data.total ?? 0,
          stages,
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const data = (() => {
    const s = summary;
    if (!s) return { total: 0, approvalPending: 0, inTransit: 0, delivered: 0 };
    const match = (keys: string[]) =>
      keys.reduce((acc, k) => acc + (s.stages[k] ?? 0), 0);
    return {
      total: s.total,
      approvalPending: match([
        "approval pending",
        "pending",
        "requested",
        "submitted",
      ]),
      inTransit: match(["in transit", "picked up", "transit", "pickedup"]),
      delivered: match(["delivered", "completed"]),
    };
  })();

  if (!summary) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Package2 className="size-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data.total}</div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="size-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Approval Pending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data.approvalPending}</div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Truck className="size-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            In Transit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data.inTransit}</div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Delivered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data.delivered}</div>
        </CardContent>
      </Card>
    </div>
  );
}