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
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="p-8 animate-fade-in shadow-xl border-2 border-primary/10 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:scale-105 hover:shadow-2xl transition-all duration-500 group"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-5">
              <div className={`${stat.bgColor} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {stat.label}
                </p>
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default AspirationStats;
