"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RotateCcw, Workflow, CheckCircle2, Loader2, type LucideIcon } from "lucide-react";

export const DATA_WIPING_STAGES = [
  "Data Wiping Created",
  "Under Process",
  "Completed",
] as const;

export type DataWipingStage = (typeof DATA_WIPING_STAGES)[number];

interface CardDef {
  stage: DataWipingStage;
  match: RegExp;
  icon: LucideIcon;
  iconClass: string;
}

const CARD_DEFS: CardDef[] = [
  {
    stage: "Data Wiping Created",
    match: /data\s*wip\w*\s*creat\w*|^created$|^new$/,
    icon: RotateCcw,
    iconClass: "bg-primary/10 text-primary",
  },
  {
    stage: "Under Process",
    match: /under\s*process|in\s*process|processing|in\s*progress/,
    icon: Workflow,
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    stage: "Completed",
    match: /completed|\bdone\b/,
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

function normalizeStage(stage: string): string {
  return stage.toLowerCase().replace(/\s+/g, " ").trim();
}

function countByStage(records: { status: string }[]): Record<string, number> {
  const statuses = records.map((r) => normalizeStage(String(r.status ?? "")));
  const count: Record<string, number> = {};
  for (const def of CARD_DEFS) {
    count[normalizeStage(def.stage)] = statuses.filter((s) =>
      def.match.test(s)
    ).length;
  }
  return count;
}

export function DataWipingStatCards() {
  const [summary, setSummary] = useState<{
    total: number;
    stages: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/data-wiping")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list: { status: string }[] =
          data.dataWipings ?? data.rows ?? data.items ?? [];
        setSummary({
          total: data.total ?? list.length,
          stages: countByStage(list),
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARD_DEFS.map((def) => {
        const Icon = def.icon;
        return (
          <Card key={def.stage} className="shadow-sm border-border">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${def.iconClass}`}
              >
                <Icon className="size-5" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {def.stage}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {summary.stages[normalizeStage(def.stage)] ?? 0}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}