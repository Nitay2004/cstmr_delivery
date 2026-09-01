import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Clock,
  CheckCircle2,
  Send,
  Wallet,
} from "lucide-react";

type StatCard = {
  title: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
};

const statCards: StatCard[] = [
  {
    title: "Approval Pending",
    value: 0,
    icon: Clock,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "Payment Approved",
    value: 0,
    icon: CheckCircle2,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Payment Transferred",
    value: 0,
    icon: Send,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Partial Payment Done",
    value: 0,
    icon: Wallet,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

export function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <Card key={card.title}>
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}
            >
              <card.icon className={`size-5 ${card.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {card.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
