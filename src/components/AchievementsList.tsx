import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Award, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const AchievementsList = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load achievements
    const { data: achievementsData } = await supabase
      .from("achievements")
      .select("*")
      .order("requirement_value", { ascending: true });

    if (achievementsData) {
      setAchievements(achievementsData);
    }

    // Load unlocked achievements
    const { data: unlockedData } = await supabase
      .from("player_achievements")
      .select("*")
      .eq("user_id", user.id);

    if (unlockedData) {
      setUnlockedAchievements(unlockedData);
    }

    // Load player stats
    const { data: statsData } = await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (statsData) {
      setStats(statsData);
    }
  };

  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some((a) => a.achievement_id === achievementId);
  };

  const getProgress = (achievement: any) => {
    if (!stats) return 0;

    const currentValue = stats[achievement.requirement_type] || 0;
    const progress = Math.min(100, (currentValue / achievement.requirement_value) * 100);
    return progress;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-6 h-6 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">Achievements</h2>
        <Badge className="bg-yellow-500 text-white ml-auto">
          {unlockedAchievements.length}/{achievements.length}
        </Badge>
      </div>

      <div className="grid gap-4">
        {achievements.map((achievement) => {
          const unlocked = isUnlocked(achievement.id);
          const progress = getProgress(achievement);

          return (
            <Card
              key={achievement.id}
              className={`p-6 ${
                unlocked
                  ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30"
                  : "bg-white/10 border-white/20"
              } backdrop-blur-sm`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{unlocked ? achievement.icon : <Lock className="w-10 h-10 text-white/30" />}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {achievement.title}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {achievement.description}
                      </p>
                    </div>
                    {unlocked && (
                      <Badge className="bg-green-500 text-white">
                        Unlocked!
                      </Badge>
                    )}
                  </div>

                  {!unlocked && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm text-white/70 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <div className="mt-2 text-yellow-400 font-bold text-sm">
                    +{achievement.points_reward} Points
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsList;
