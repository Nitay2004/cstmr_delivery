"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PackageCheck,
  ClipboardCheck,
  Split,
  Tags,
  Sparkles,
  Sticker,
  Microscope,
  HardDrive,
  CheckCircle2,
  Loader2,
  type LucideIcon,
} from "lucide-react";

export const GRN_STAGES = [
  "Material Received",
  "GRN Done",
  "Segregation",
  "Tagging",
  "Sticker Removal",
  "Cleaning",
  "IQC",
  "Data Wiping",
  "Completed",
] as const;

export type GrnStage = (typeof GRN_STAGES)[number];

interface CardDef {
  stage: GrnStage;
  match: RegExp;
  icon: LucideIcon;
  iconClass: string;
}

const CARD_DEFS: CardDef[] = [
  {
    stage: "Material Received",
    match: /material\s*received|\breceived\b/,
    icon: PackageCheck,
    iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    stage: "GRN Done",
    match: /grn\s*done|\bdone\b/,
    icon: ClipboardCheck,
    iconClass: "bg-primary/10 text-primary",
  },
  {
    stage: "Segregation",
    match: /\bsegregation\b|\bseparation\b|\bseperation\b/,
    icon: Split,
    iconClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    stage: "Tagging",
    match: /\btagging\b|\btagged\b/,
    icon: Tags,
    iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    stage: "Sticker Removal",
    match: /sticker\s*removal|sticker\s*removed|sticker.?removal/,
    icon: Sticker,
    iconClass: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    stage: "Cleaning",
    match: /\bcleaning\b|\bcleaned\b|\bclean\b/,
    icon: Sparkles,
    iconClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    stage: "IQC",
    match: /\biqc\b/,
    icon: Microscope,
    iconClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    stage: "Data Wiping",
    match: /data\s*wip\w*|wiped/,
    icon: HardDrive,
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    stage: "Completed",
    match: /\bcompleted\b/,
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

function normalizeStage(stage: string): string {
  return stage.toLowerCase().replace(/\s+/g, " ").trim();
}

function countByStage(records: { stage: string }[]): Record<string, number> {
  const stages = records.map((r) => normalizeStage(String(r.stage ?? "")));
  const count: Record<string, number> = {};
  for (const def of CARD_DEFS) {
    count[normalizeStage(def.stage)] = stages.filter((s) =>
      def.match.test(s)
    ).length;
  }
  return count;
}

export function GrnStatCards() {
  const [summary, setSummary] = useState<{
    total: number;
    stages: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/grns")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list: { stage: string }[] =
          data.grns ?? data.rows ?? data.items ?? [];
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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