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
  FileText,
  ClipboardList,
  Truck,
  Factory,
  CheckCircle2,
  Loader2,
  type LucideIcon,
} from "lucide-react";

export const PICKUP_STAGES = [
  "Pickup Request",
  "Quote Generated",
  "PO Generated",
  "Pickup Aligned",
  "Delivered to Plant",
  "Completed",
] as const;

export type PickupStage = (typeof PICKUP_STAGES)[number];

interface RequestSummary {
  total: number;
  stages: Record<string, number>;
}

interface CardDef {
  stage: PickupStage;
  label?: string;
  icon: LucideIcon;
  iconClass: string;
}

const CARD_DEFS: CardDef[] = [
  {
    stage: "Pickup Request",
    label: "Pending Pickup Request",
    icon: Package2,
    iconClass: "bg-primary/10 text-primary",
  },
  {
    stage: "Quote Generated",
    icon: FileText,
    iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    stage: "PO Generated",
    icon: ClipboardList,
    iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    stage: "Pickup Aligned",
    icon: Truck,
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    stage: "Delivered to Plant",
    icon: Factory,
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    stage: "Completed",
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

function normalizeStage(stage: string): string {
  return stage.toLowerCase().replace(/\s+/g, " ").trim();
}

function countByStage(requests: { stage: string }[]): Record<string, number> {
  return requests.reduce<Record<string, number>>((acc, r) => {
    const key = normalizeStage(String(r.stage ?? ""));
    acc[key] = (acc[key] ?? 0) + 1;
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

  if (!summary) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Pickup Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{summary.total}</div>
        </CardContent>
      </Card>
      {CARD_DEFS.map((def) => {
        const Icon = def.icon;
        const count = summary.stages[normalizeStage(def.stage)] ?? 0;
        return (
          <Card key={def.stage} className="shadow-sm border-border">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${def.iconClass}`}
              >
                <Icon className="size-5" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {def.label ?? def.stage}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{count}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}