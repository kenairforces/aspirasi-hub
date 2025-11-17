import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Brain, Zap, MessageCircle, Trophy, Users, ArrowLeft, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DailyChallenges from "@/components/DailyChallenges";
import AchievementsList from "@/components/AchievementsList";
import PowerUpsShop from "@/components/PowerUpsShop";
import RankingsDisplay from "@/components/RankingsDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Games = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        toast({
          title: "Login Required",
          description: "Silakan login terlebih dahulu untuk bermain game",
          variant: "destructive",
        });
        navigate("/player-auth");
        return;
      }
      setUser(user);
      loadStats(user.id);
    });
  }, []);

  const loadStats = async (userId: string) => {
    const { data } = await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (!data) {
      // Create initial stats
      await supabase.from("player_stats").insert({ user_id: userId });
      setStats({ total_games_played: 0, total_wins: 0, total_points: 0, highest_streak: 0 });
    } else {
      setStats(data);
    }
  };

  const games = [
    {
      id: "brain_rush",
      title: "🧠 Brain Rush",
      description: "Jawab soal matematika & logika secepat kilat! Asah otak sambil adu cepat dengan teman.",
      color: "from-purple-500 to-pink-500",
      icon: Brain,
      path: "/games/brain-rush",
    },
    {
      id: "pattern_master",
      title: "🎯 Pattern Master",
      description: "Ingat pola warna yang muncul! Uji daya ingat dan konsentrasi kamu dalam game seru ini.",
      color: "from-blue-500 to-cyan-500",
      icon: Zap,
      path: "/games/pattern-master",
    },
    {
      id: "word_sprint",
      title: "📝 Word Sprint",
      description: "Temukan kata-kata tersembunyi dari huruf acak! Adu kecerdasan dengan teman.",
      color: "from-green-500 to-emerald-500",
      icon: MessageCircle,
      path: "/games/word-sprint",
    },
    {
      id: "nato_alphabet",
      title: "📻 NATO Alphabet",
      description: "Belajar alfabet NATO seperti pilot! Konversi huruf dan kode NATO dengan cepat.",
      color: "from-amber-500 to-yellow-500",
      icon: MessageCircle,
      path: "/games/nato-alphabet",
    },
    {
      id: "quick_math",
      title: "🧮 Matematika Kilat",
      description: "Selesaikan operasi matematika secepat kilat! Latih kemampuan berhitung kamu.",
      color: "from-indigo-500 to-purple-500",
      icon: Brain,
      path: "/games/quick-math",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/profile")}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-bold mb-4 text-white drop-shadow-lg">
            🎮 Game Zone
          </h1>
          <p className="text-xl text-white/90 mb-6">
            Asah otak, kejar leaderboard, dan main bareng teman!
          </p>
          
          {/* Player Stats */}
          {stats && (
            <div className="flex justify-center gap-4 flex-wrap mb-8">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-6 py-3">
                <p className="text-white/70 text-sm">Games Played</p>
                <p className="text-2xl font-bold text-white">{stats.total_games_played}</p>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-6 py-3">
                <p className="text-white/70 text-sm">Total Wins</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.total_wins}</p>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-6 py-3">
                <p className="text-white/70 text-sm">Total Points</p>
                <p className="text-2xl font-bold text-green-400">{stats.total_points}</p>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-6 py-3">
                <p className="text-white/70 text-sm">Best Streak</p>
                <p className="text-2xl font-bold text-purple-400">{stats.highest_streak}</p>
              </Card>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          <Button
            size="lg"
            onClick={() => navigate("/leaderboard")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold"
          >
            <Trophy className="mr-2 h-5 w-5" />
            Leaderboard
          </Button>
          <Button
            size="lg"
            onClick={() => navigate("/friends")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
          >
            <Users className="mr-2 h-5 w-5" />
            Friends
          </Button>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {games.map((game, index) => (
            <Card
              key={game.id}
              className="group cursor-pointer hover:scale-105 transition-all duration-300 bg-white/10 backdrop-blur-md border-white/20 overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(game.path)}
            >
              <div className={`h-2 bg-gradient-to-r ${game.color}`} />
              <div className="p-6">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <game.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">{game.title}</h3>
                <p className="text-white/70 mb-4">{game.description}</p>
                <Button className={`w-full bg-gradient-to-r ${game.color} text-white font-bold`}>
                  Main Sekarang!
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Daily Challenges & Achievements */}
        <div className="mt-16 max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <DailyChallenges />
          <AchievementsList />
        </div>

        {/* Features */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-8">✨ Fitur Keren</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="font-bold text-xl text-white mb-2">Leaderboard Global</h3>
              <p className="text-white/70">Kejar ranking tertinggi dan tunjukkan kehebatanmu!</p>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-bold text-xl text-white mb-2">Multiplayer</h3>
              <p className="text-white/70">Main bareng teman di custom room dengan chat!</p>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
              <div className="text-4xl mb-3">🧠</div>
              <h3 className="font-bold text-xl text-white mb-2">Brain Training</h3>
              <p className="text-white/70">Asah otak dan tingkatkan kemampuan berpikirmu!</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Games;
