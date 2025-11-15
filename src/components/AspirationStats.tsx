import { Card } from "@/components/ui/card";
import { MessageSquare, MessageCircle, Clock } from "lucide-react";

interface AspirationStatsProps {
  aspirations: Array<{
    id: string;
    comments: any[];
    created_at: string;
  }>;
}

const AspirationStats = ({ aspirations }: AspirationStatsProps) => {
  const totalAspirations = aspirations.length;
  const totalComments = aspirations.reduce(
    (sum, asp) => sum + asp.comments.length,
    0
  );
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAspirations = aspirations.filter(
    (asp) => new Date(asp.created_at) >= today
  ).length;

  const stats = [
    {
      label: "Total Aspirasi",
      value: totalAspirations,
      icon: MessageSquare,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Total Komentar",
      value: totalComments,
      icon: MessageCircle,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Aspirasi Hari Ini",
      value: todayAspirations,
      icon: Clock,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="p-6 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-4">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default AspirationStats;
