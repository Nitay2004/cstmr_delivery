"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Hourglass, BadgeCheck, Loader2, type LucideIcon } from "lucide-react";

export const CERTIFICATE_STAGES = [
  "Certificate Pending",
  "Certificate Generated",
] as const;

export type CertificateStage = (typeof CERTIFICATE_STAGES)[number];

interface CardDef {
  stage: CertificateStage;
  match: RegExp;
  icon: LucideIcon;
  iconClass: string;
}

const CARD_DEFS: CardDef[] = [
  {
    stage: "Certificate Pending",
    match: /certificate\s*pending|pending|\bpending\b/,
    icon: Hourglass,
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    stage: "Certificate Generated",
    match: /certificate\s*gen\w*|generated|\bissued\b|\breceived\b/,
    icon: BadgeCheck,
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

export function CertificateStatCards() {
  const [summary, setSummary] = useState<{
    total: number;
    stages: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/certificates")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list: { status: string }[] =
          data.certificates ?? data.rows ?? data.items ?? [];
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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