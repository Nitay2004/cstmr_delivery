"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RotateCcw, Workflow, CheckCircle2, Laptop, HardDrive, XCircle, Scissors, Loader2, type LucideIcon } from "lucide-react";

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

interface SumCardDef {
  key:
    | "laptop"
    | "laptopSsdHddReceived"
    | "laptopNotWiped"
    | "laptopWiped"
    | "laptopShreddingDone"
    | "desktop"
    | "desktopSsdHddReceived"
    | "desktopNotWiped"
    | "desktopWiped"
    | "desktopShreddingDone";
  label: string;
  icon: LucideIcon;
  iconClass: string;
}

const SUM_CARD_DEFS: SumCardDef[] = [
  {
    key: "laptop",
    label: "Total Laptop Received",
    icon: Laptop,
    iconClass: "bg-primary/10 text-primary",
  },
  {
    key: "laptopSsdHddReceived",
    label: "SSD/HDD Received",
    icon: HardDrive,
    iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    key: "laptopNotWiped",
    label: "SSD Not Received",
    icon: XCircle,
    iconClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    key: "laptopWiped",
    label: "Data Sanitization Done",
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "laptopShreddingDone",
    label: "Shredding Done",
    icon: Scissors,
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
];

const DESKTOP_SUM_CARD_DEFS: SumCardDef[] = [
  {
    key: "desktop",
    label: "Total Desktop Received",
    icon: Laptop,
    iconClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    key: "desktopSsdHddReceived",
    label: "SSD/HDD Received",
    icon: HardDrive,
    iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    key: "desktopNotWiped",
    label: "SSD Not Received",
    icon: XCircle,
    iconClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    key: "desktopWiped",
    label: "Data Sanitization Done",
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "desktopShreddingDone",
    label: "Shredding Done",
    icon: Scissors,
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
];

const formatNumber = (value: number): string => value.toLocaleString("en-US");

function sumBy(
  records: Record<string, unknown>[],
  key: SumCardDef["key"]
): number {
  return records.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

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
    sums: Record<SumCardDef["key"], number>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/data-wiping")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list: Record<string, unknown>[] =
          data.dataWipings ?? data.rows ?? data.items ?? [];
        setSummary({
          total: data.total ?? list.length,
          stages: countByStage(list as { status: string }[]),
          sums: {
            laptop: sumBy(list, "laptop"),
            laptopSsdHddReceived: sumBy(list, "laptopSsdHddReceived"),
            laptopNotWiped: sumBy(list, "laptopNotWiped"),
            laptopWiped: sumBy(list, "laptopWiped"),
            laptopShreddingDone: sumBy(list, "laptopShreddingDone"),
            desktop: sumBy(list, "desktop"),
            desktopSsdHddReceived: sumBy(list, "desktopSsdHddReceived"),
            desktopNotWiped: sumBy(list, "desktopNotWiped"),
            desktopWiped: sumBy(list, "desktopWiped"),
            desktopShreddingDone: sumBy(list, "desktopShreddingDone"),
          },
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
    <div className="flex flex-col gap-4">
<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {SUM_CARD_DEFS.map((def) => {
          const Icon = def.icon;
          return (
            <Card key={def.key} size="sm" className="shadow-sm border-border">
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-0">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${def.iconClass}`}
                >
                  <Icon className="size-3.5" />
                </div>
                <CardTitle className="text-[11px] font-medium text-muted-foreground">
                  {def.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatNumber(summary.sums[def.key] ?? 0)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {DESKTOP_SUM_CARD_DEFS.map((def) => {
          const Icon = def.icon;
          return (
            <Card key={def.key} size="sm" className="shadow-sm border-border">
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-0">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${def.iconClass}`}
                >
                  <Icon className="size-3.5" />
                </div>
                <CardTitle className="text-[11px] font-medium text-muted-foreground">
                  {def.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatNumber(summary.sums[def.key] ?? 0)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARD_DEFS.map((def) => {
          const Icon = def.icon;
          return (
            <Card key={def.stage} size="sm" className="shadow-sm border-border">
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-0">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${def.iconClass}`}
                >
                  <Icon className="size-3.5" />
                </div>
                <CardTitle className="text-[11px] font-medium text-muted-foreground">
                  {def.stage}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {summary.stages[normalizeStage(def.stage)] ?? 0}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}