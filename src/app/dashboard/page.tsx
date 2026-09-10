"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CITY_DATA = [
  { name: "Hyderabad", count: 10358 },
  { name: "Noida", count: 9053 },
  { name: "Gurugram", count: 6609 },
  { name: "Bangalore", count: 1130 },
];

const MONTH_DATA = [
  { name: "Oct/25", count: 10139 },
  { name: "Feb/26", count: 186 },
  { name: "Apr/26", count: 3464 },
  { name: "Jun/26", count: 7176 },
  { name: "Jul/26", count: 5116 },
  { name: "Aug/26", count: 1069 },
];

const TOTAL = CITY_DATA.reduce((sum, d) => sum + d.count, 0);

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <div className="font-medium text-foreground">{label}</div>
      <div className="mt-0.5 font-semibold text-primary">
        {formatNumber(payload[0]?.value ?? 0)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Device pickup summary by city and month.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base">Devices by City</CardTitle>
            <CardDescription>
              Total devices across cities: {formatNumber(TOTAL)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={CITY_DATA} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatNumber}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--border)" }} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  <LabelList
                    dataKey="count"
                    position="top"
                    formatter={(v) => formatNumber(Number(v ?? 0))}
                    style={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base">Devices by Month</CardTitle>
            <CardDescription>
              Total devices across months: {formatNumber(TOTAL)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={MONTH_DATA} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatNumber}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--border)" }} />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  <LabelList
                    dataKey="count"
                    position="top"
                    formatter={(v) => formatNumber(Number(v ?? 0))}
                    style={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}