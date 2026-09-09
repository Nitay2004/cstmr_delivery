"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Wallet,
  Clock3,
  CalendarClock,
  BadgeCheck,
  Hourglass,
  Loader2,
  type LucideIcon,
} from "lucide-react";

export const PAYMENT_STAGES = [
  "Payment Created",
  "First Approval Pending",
  "Second Approval Pending",
  "Payment Approved",
  "Payment Pending",
] as const;

export type PaymentStage = (typeof PAYMENT_STAGES)[number];

interface CardDef {
  stage: PaymentStage;
  match: RegExp;
  icon: LucideIcon;
  iconClass: string;
}

const CARD_DEFS: CardDef[] = [
  {
    stage: "Payment Created",
    match: /payment\s*creat\w*|^created$/,
    icon: Wallet,
    iconClass: "bg-primary/10 text-primary",
  },
  {
    stage: "First Approval Pending",
    match: /first\s*approval|approval\s*(1|one)\b|1(st|nd|rd|th)?\s*approval/,
    icon: Clock3,
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    stage: "Second Approval Pending",
    match: /second\s*approval|approval\s*(2|two)\b|2(nd|rd|th)?\s*approval/,
    icon: CalendarClock,
    iconClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    stage: "Payment Approved",
    match: /payment\s*approved|\bapproved\b/,
    icon: BadgeCheck,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    stage: "Payment Pending",
    match: /payment\s*pending|\bpending\s*payment\b/,
    icon: Hourglass,
    iconClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
];

function normalizeStage(stage: string): string {
  return stage.toLowerCase().replace(/\s+/g, " ").trim();
}

function countByStage(payments: { stage: string }[]): Record<string, number> {
  const stages = payments.map((p) => normalizeStage(String(p.stage ?? "")));
  const count: Record<string, number> = {};
  for (const def of CARD_DEFS) {
    count[normalizeStage(def.stage)] = stages.filter((s) =>
      def.match.test(s)
    ).length;
  }
  return count;
}

export function PaymentStatCards() {
  const [summary, setSummary] = useState<{
    total: number;
    stages: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/payments")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list: { stage: string }[] =
          data.payments ?? data.rows ?? data.items ?? [];
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