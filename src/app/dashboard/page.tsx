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
  Legend,
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

const CATEGORY_DATA = [
  { month: "Oct/25", Laptop: 7049, Desktop: 1746, "TFT / Monitor": 1344, "IP Phones": 0, Others: 0 },
  { month: "Feb/26", Laptop: 186, Desktop: 0, "TFT / Monitor": 0, "IP Phones": 0, Others: 0 },
  { month: "Apr/26", Laptop: 2643, Desktop: 5, "TFT / Monitor": 534, "IP Phones": 0, Others: 282 },
  { month: "Jun/26", Laptop: 1325, Desktop: 0, "TFT / Monitor": 566, "IP Phones": 5285, Others: 0 },
  { month: "Jul/26", Laptop: 81, Desktop: 0, "TFT / Monitor": 0, "IP Phones": 4972, Others: 63 },
  { month: "Aug/26", Laptop: 689, Desktop: 5, "TFT / Monitor": 305, "IP Phones": 0, Others: 70 },
];

const CATEGORY_BY_CITY = [
  {
    city: "Bangalore",
    Laptop: 267,
    Desktop: 0,
    "TFT / Monitor": 0,
    "IP Phones": 846,
    Others: 17,
  },
  {
    city: "Hyderabad",
    Laptop: 3968,
    Desktop: 5,
    "TFT / Monitor": 1100,
    "IP Phones": 5285,
    Others: 0,
  },
  {
    city: "Noida",
    Laptop: 3667,
    Desktop: 227,
    "TFT / Monitor": 1649,
    "IP Phones": 3112,
    Others: 398,
  },
  {
    city: "Gurgaon",
    Laptop: 4071,
    Desktop: 1524,
    "TFT / Monitor": 0,
    "IP Phones": 1014,
    Others: 0,
  },
];

const CITY_TOTAL = CATEGORY_BY_CITY.reduce(
  (acc, row) =>
    acc + row.Laptop + row.Desktop + row["TFT / Monitor"] + row["IP Phones"] + row.Others,
  0
);

const CATEGORY_COLORS: { key: string; fill: string }[] = [
  { key: "Laptop", fill: "var(--chart-1)" },
  { key: "Desktop", fill: "var(--chart-2)" },
  { key: "TFT / Monitor", fill: "var(--chart-3)" },
  { key: "IP Phones", fill: "var(--chart-4)" },
  { key: "Others", fill: "var(--chart-5)" },
];

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey?: string | number; name?: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  if (payload.length === 1) {
    return (
      <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
        <div className="font-medium text-foreground">{label}</div>
        <div className="mt-0.5 font-semibold text-primary">
          {formatNumber(payload[0]?.value ?? 0)}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <div className="font-medium text-foreground">{label}</div>
      <div className="mt-1 flex flex-col gap-0.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-semibold text-foreground">
              {formatNumber(entry.value ?? 0)}
            </span>
          </div>
        ))}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base">Category Wise Devices by Month</CardTitle>
            <CardDescription>
              Device breakdown by category across months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={CATEGORY_DATA} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis
                  dataKey="month"
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
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {CATEGORY_COLORS.map((c) => (
                  <Bar
                    key={c.key}
                    dataKey={c.key}
                    stackId="device"
                    fill={c.fill}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={56}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base">Category Wise Devices by City</CardTitle>
            <CardDescription>
              Device breakdown by category across cities. Total:{" "}
              {formatNumber(CITY_TOTAL)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={CATEGORY_BY_CITY}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis
                  dataKey="city"
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
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {CATEGORY_COLORS.map((c) => (
                  <Bar
                    key={c.key}
                    dataKey={c.key}
                    stackId="city"
                    fill={c.fill}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={72}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}