import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Award, Medal } from "lucide-react";

interface Ranking {
  rank_name: string;
  rank_icon: string;
  achieved_at: string;
}

interface Badge {
  badge_name: string;
  badge_icon: string;
  badge_description: string;
  earned_at: string;
}

const RANK_THRESHOLDS = [
  { name: "Pemula", icon: "🥉", min_points: 0 },
  { name: "Perunggu", icon: "🥉", min_points: 100 },
  { name: "Perak", icon: "🥈", min_points: 500 },
  { name: "Emas", icon: "🥇", min_points: 1000 },
  { name: "Platinum", icon: "💎", min_points: 2500 },
  { name: "Diamond", icon: "💠", min_points: 5000 },
  { name: "Master", icon: "👑", min_points: 10000 },
  { name: "Legend", icon: "⭐", min_points: 25000 },
];

export default function RankingsDisplay({ userId, totalPoints }: { userId: string; totalPoints: number }) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [currentRank, setCurrentRank] = useState<typeof RANK_THRESHOLDS[0]>(RANK_THRESHOLDS[0]);

  useEffect(() => {
    loadRankingsAndBadges();
    checkAndUpdateRank();
  }, [userId, totalPoints]);

  const loadRankingsAndBadges = async () => {
    const { data: rankData } = await supabase
      .from("player_rankings")
      .select("*")
      .eq("user_id", userId)
      .order("achieved_at", { ascending: false });

    const { data: badgeData } = await supabase
      .from("player_badges")
      .select("*")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (rankData) setRankings(rankData);
    if (badgeData) setBadges(badgeData);
  };

  const checkAndUpdateRank = async () => {
    // Find current rank based on points
    const newRank = [...RANK_THRESHOLDS]
      .reverse()
      .find((rank) => totalPoints >= rank.min_points) || RANK_THRESHOLDS[0];

    setCurrentRank(newRank);

    // Check if this rank is already achieved
    const hasRank = rankings.some((r) => r.rank_name === newRank.name);
    if (!hasRank) {
      await supabase.from("player_rankings").insert({
        user_id: userId,
        rank_name: newRank.name,
        rank_icon: newRank.icon,
        min_points: newRank.min_points,
      });
      loadRankingsAndBadges();
    }

    // Auto-grant badges based on achievements
    await checkBadges();
  };

  const checkBadges = async () => {
    const { data: stats } = await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!stats) return;

    const badgesToGrant = [];

    // First Win badge
    if (stats.total_wins >= 1 && !badges.some((b) => b.badge_name === "Kemenangan Pertama")) {
      badgesToGrant.push({
        user_id: userId,
        badge_name: "Kemenangan Pertama",
        badge_icon: "🎖️",
        badge_description: "Menang pertama kali dalam game",
      });
    }

    // Veteran badge (100 games)
    if (stats.total_games_played >= 100 && !badges.some((b) => b.badge_name === "Veteran")) {
      badgesToGrant.push({
        user_id: userId,
        badge_name: "Veteran",
        badge_icon: "🏅",
        badge_description: "Bermain 100 game",
      });
    }

    // Combo Master (streak 20+)
    if (stats.highest_streak >= 20 && !badges.some((b) => b.badge_name === "Combo Master")) {
      badgesToGrant.push({
        user_id: userId,
        badge_name: "Combo Master",
        badge_icon: "🔥",
        badge_description: "Mencapai streak 20",
      });
    }

    // Point Collector (10k+ points)
    if (totalPoints >= 10000 && !badges.some((b) => b.badge_name === "Point Collector")) {
      badgesToGrant.push({
        user_id: userId,
        badge_name: "Point Collector",
        badge_icon: "💰",
        badge_description: "Mengumpulkan 10,000 poin",
      });
    }

    if (badgesToGrant.length > 0) {
      await supabase.from("player_badges").insert(badgesToGrant);
      loadRankingsAndBadges();
    }
  };

  const getNextRank = () => {
    const currentIndex = RANK_THRESHOLDS.findIndex((r) => r.name === currentRank.name);
    return RANK_THRESHOLDS[currentIndex + 1];
  };

  const nextRank = getNextRank();
  const progress = nextRank
    ? ((totalPoints - currentRank.min_points) / (nextRank.min_points - currentRank.min_points)) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Current Rank */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="text-6xl">{currentRank.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">Peringkat: {currentRank.name}</h3>
            </div>
            <p className="text-muted-foreground mb-3">
              {totalPoints.toLocaleString('id-ID')} / {nextRank ? nextRank.min_points.toLocaleString('id-ID') : "MAX"} poin
            </p>
            {nextRank && (
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Badges */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-accent" />
          <h3 className="text-xl font-bold text-foreground">Lencana ({badges.length})</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.badge_name}
              className="bg-accent/5 rounded-lg p-4 text-center hover:bg-accent/10 transition-all border border-accent/20"
            >
              <div className="text-4xl mb-2">{badge.badge_icon}</div>
              <h4 className="font-bold text-sm text-foreground">{badge.badge_name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{badge.badge_description}</p>
            </div>
          ))}
        </div>
        {badges.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Belum ada lencana. Bermain lebih banyak untuk mendapatkan lencana!
          </p>
        )}
      </Card>

      {/* All Ranks */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Medal className="w-6 h-6 text-secondary" />
          <h3 className="text-xl font-bold text-foreground">Semua Peringkat</h3>
        </div>
        <div className="space-y-2">
          {RANK_THRESHOLDS.map((rank) => {
            const achieved = totalPoints >= rank.min_points;
            return (
              <div
                key={rank.name}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  achieved ? "bg-primary/10 border border-primary/30" : "bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{rank.icon}</span>
                  <div>
                    <h4 className="font-bold text-foreground">{rank.name}</h4>
                    <p className="text-xs text-muted-foreground">{rank.min_points.toLocaleString('id-ID')} poin</p>
                  </div>
                </div>
                {achieved && <span className="text-primary font-bold">✓</span>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
