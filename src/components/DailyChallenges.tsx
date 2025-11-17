import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Target } from "lucide-react";

const DailyChallenges = () => {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadChallenges();
    loadCompletions();
  }, []);

  const loadChallenges = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("challenge_date", today);

    if (data) {
      setChallenges(data);
    }
  };

  const loadCompletions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("challenge_completions")
      .select("*")
      .eq("user_id", user.id);

    if (data) {
      setCompletions(data);
    }
  };

  const isCompleted = (challengeId: string) => {
    return completions.some((c) => c.challenge_id === challengeId);
  };

  const gameTypeEmoji: Record<string, string> = {
    brain_rush: "🧠",
    pattern_master: "🎯",
    word_sprint: "📝",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-6 h-6 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">Daily Challenges</h2>
      </div>

      {challenges.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center text-white">
          Tidak ada challenge hari ini. Cek lagi besok!
        </Card>
      ) : (
        <div className="grid gap-4">
          {challenges.map((challenge) => (
            <Card
              key={challenge.id}
              className="bg-white/10 backdrop-blur-sm border-white/20 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">
                      {gameTypeEmoji[challenge.game_type]}
                    </span>
                    <h3 className="text-xl font-bold text-white">
                      {challenge.title}
                    </h3>
                  </div>
                  <p className="text-white/80">{challenge.description}</p>
                </div>
                {isCompleted(challenge.id) && (
                  <Badge className="bg-green-500 text-white">
                    <Trophy className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-white/80">
                  Target: <span className="font-bold text-white">{challenge.target_score}</span> points
                </div>
                <div className="text-yellow-400 font-bold">
                  +{challenge.bonus_points} Bonus Points
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyChallenges;
