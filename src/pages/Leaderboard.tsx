import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();

    // Setup real-time subscription
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_stats'
        },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("player_stats")
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .order("total_points", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-xl font-bold text-white/50">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Button
          variant="outline"
          onClick={() => navigate("/games")}
          className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Games
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Trophy className="w-24 h-24 mx-auto text-yellow-400 mb-4 animate-pulse" />
            <h1 className="text-6xl font-bold text-white mb-4">🏆 Leaderboard</h1>
            <p className="text-xl text-white/80">Top 50 Players - Kejar Ranking #1!</p>
          </div>

          {loading ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-12 text-center">
              <p className="text-white text-xl">Loading leaderboard...</p>
            </Card>
          ) : leaderboard.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-12 text-center">
              <p className="text-white text-xl">Belum ada pemain di leaderboard</p>
              <Button
                onClick={() => navigate("/games")}
                className="mt-6 bg-gradient-to-r from-yellow-500 to-orange-500"
              >
                Jadilah yang Pertama!
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((player, index) => (
                <Card
                  key={player.id}
                  className={`bg-white/10 backdrop-blur-md border-white/20 p-6 hover:bg-white/20 transition-all animate-fade-in ${
                    index < 3 ? "border-2 border-yellow-400/50" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    
                    {player.profiles?.avatar_url && (
                      <img 
                        src={player.profiles.avatar_url} 
                        alt="Avatar" 
                        className="w-12 h-12 rounded-full border-2 border-white/20"
                      />
                    )}
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">
                        {player.profiles?.username || player.profiles?.full_name || "Pemain Anonim"}
                      </h3>
                      <div className="flex gap-4 text-sm text-white/60 mt-1">
                        <span>🎯 {player.total_points.toLocaleString('id-ID')} poin</span>
                        <span>🏆 {player.total_wins || 0} menang</span>
                        <span>🎮 {player.total_games_played || 0} game</span>
                        <span>🔥 Streak: {player.highest_streak || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">
                        {player.profiles?.full_name || player.profiles?.username || "Unknown Player"}
                      </h3>
                      <p className="text-white/60 text-sm">@{player.profiles?.username}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-bold text-yellow-400">{player.total_points}</p>
                      <p className="text-white/60 text-sm">points</p>
                    </div>

                    <div className="hidden md:flex gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-400">{player.total_wins}</p>
                        <p className="text-white/60 text-xs">Wins</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-400">{player.total_games_played}</p>
                        <p className="text-white/60 text-xs">Games</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-purple-400">{player.highest_streak}</p>
                        <p className="text-white/60 text-xs">Streak</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
