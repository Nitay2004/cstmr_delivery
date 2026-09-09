"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FilePlus2, Clock, BadgeCheck, Loader2, type LucideIcon } from "lucide-react";

export const QUOTE_STAGES = [
  "Quote Created",
  "Pending for Allocation",
  "Quote Approved",
] as const;

export type QuoteStage = (typeof QUOTE_STAGES)[number];

interface CardDef {
  stage: QuoteStage;
  match: RegExp;
  icon: LucideIcon;
  iconClass: string;
}

const CARD_DEFS: CardDef[] = [
  {
    stage: "Quote Created",
    match: /\bquote\s*creat\w*|^created$|\bcreat\w*\s*quote/,
    icon: FilePlus2,
    iconClass: "bg-primary/10 text-primary",
  },
  {
    stage: "Pending for Allocation",
    match: /pending\s*(for\s*)?allocation|allocation\s*pending|\bpending\b/,
    icon: Clock,
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    stage: "Quote Approved",
    match: /quote\s*approved|approved/,
    icon: BadgeCheck,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

function normalizeStage(stage: string): string {
  return stage.toLowerCase().replace(/\s+/g, " ").trim();
}

function countByStage(quotes: { stage: string }[]): Record<string, number> {
  const stages = quotes.map((q) => normalizeStage(String(q.stage ?? "")));
  const count: Record<string, number> = {};
  for (const def of CARD_DEFS) {
    count[normalizeStage(def.stage)] = stages.filter((s) =>
      def.match.test(s)
    ).length;
  }
  return count;
}

export function QuoteStatCards() {
  const [summary, setSummary] = useState<{
    total: number;
    stages: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/quotes")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list: { stage: string }[] =
          data.quotes ?? data.rows ?? data.items ?? [];
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