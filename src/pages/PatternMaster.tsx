import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MultiplayerRoom from "@/components/MultiplayerRoom";
import { supabase } from "@/integrations/supabase/client";

const PatternMaster = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<"menu" | "memorize" | "playing" | "finished">("menu");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [pattern, setPattern] = useState<string[]>([]);
  const [userPattern, setUserPattern] = useState<string[]>([]);
  const [showPattern, setShowPattern] = useState(false);

  const colors = ["red", "blue", "green", "yellow", "purple", "orange"];
  
  const colorClasses: Record<string, string> = {
    red: "bg-red-500 hover:bg-red-600",
    blue: "bg-blue-500 hover:bg-blue-600",
    green: "bg-green-500 hover:bg-green-600",
    yellow: "bg-yellow-400 hover:bg-yellow-500",
    purple: "bg-purple-500 hover:bg-purple-600",
    orange: "bg-orange-500 hover:bg-orange-600",
  };

  const generatePattern = (length: number) => {
    const newPattern = [];
    for (let i = 0; i < length; i++) {
      newPattern.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    return newPattern;
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    startRound(1);
  };

  const startRound = (currentLevel: number) => {
    const patternLength = 3 + currentLevel;
    const newPattern = generatePattern(patternLength);
    setPattern(newPattern);
    setUserPattern([]);
    setGameState("memorize");
    setShowPattern(true);

    setTimeout(() => {
      setShowPattern(false);
      setGameState("playing");
    }, (patternLength + 2) * 1000);
  };

  const saveStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: currentStats } = await supabase
        .from("player_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (currentStats) {
        await supabase
          .from("player_stats")
          .update({
            total_games_played: currentStats.total_games_played + 1,
            total_points: currentStats.total_points + score,
            highest_streak: Math.max(currentStats.highest_streak || 0, level),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        await supabase.from("player_stats").insert({
          user_id: user.id,
          total_games_played: 1,
          total_points: score,
          highest_streak: level,
        });
      }
    }
  };

  const handleColorClick = (color: string) => {
    if (gameState !== "playing") return;

    const newUserPattern = [...userPattern, color];
    setUserPattern(newUserPattern);

    if (newUserPattern.length === pattern.length) {
      checkPattern(newUserPattern);
    }
  };

  const checkPattern = (userP: string[]) => {
    const correct = userP.every((color, index) => color === pattern[index]);

    if (correct) {
      const points = level * 10;
      setScore((prev) => prev + points);
      toast({
        title: "Sempurna! 🎉",
        description: `+${points} poin! Naik ke Level ${level + 1}`,
      });
      setLevel((prev) => prev + 1);
      setTimeout(() => startRound(level + 1), 1500);
    } else {
      saveStats();
      setGameState("finished");
      toast({
        title: "Waduh Salah! 😅",
        description: "Pola tidak sesuai. Game Selesai!",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
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

        {gameState === "menu" && (
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-6xl font-bold text-white mb-8">🎯 Tebak Pola Warna</h1>
            
            <Tabs defaultValue="solo" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="solo">Mode Solo</TabsTrigger>
                <TabsTrigger value="multiplayer">Mode Multiplayer</TabsTrigger>
              </TabsList>

              <TabsContent value="solo">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 mb-6">
                  <h2 className="text-2xl font-bold text-white mb-4">📜 Cara Bermain:</h2>
                  <ul className="text-left text-white/80 space-y-2">
                    <li>🎨 Perhatikan dan ingat urutan warna yang muncul</li>
                    <li>🧠 Ulangi pola warna dengan urutan yang sama persis</li>
                    <li>📈 Setiap naik level, pola akan bertambah panjang!</li>
                    <li>🏆 Semakin tinggi level, semakin banyak poin yang kamu dapat!</li>
                    <li>⚡ Jangan sampai salah, atau game over!</li>
                  </ul>
                </Card>
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={startGame}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white font-bold text-xl px-8 py-6"
                  >
                    <Play className="mr-2 h-6 w-6" />
                    Mulai Bermain
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="multiplayer">
                <MultiplayerRoom gameType="pattern_master" />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {(gameState === "memorize" || gameState === "playing") && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="flex justify-between mb-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-6 py-3">
                <p className="text-white/70 text-sm">Skor</p>
                <p className="text-3xl font-bold text-yellow-400">{score.toLocaleString('id-ID')}</p>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-6 py-3">
                <p className="text-white/70 text-sm">Level</p>
                <p className="text-3xl font-bold text-white">{level}</p>
              </Card>
            </div>

            {gameState === "memorize" && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 mb-6 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Level {level} - Hafal Pola Ini!
                </h2>
                <p className="text-white/70 text-lg mb-6">Pola akan hilang dalam {pattern.length + 2} detik...</p>
                <div className="grid grid-cols-3 gap-4">
                  {showPattern && pattern.map((color, index) => (
                    <div
                      key={index}
                      className={`h-32 rounded-lg ${colorClasses[color]} animate-pulse shadow-2xl transform transition-all hover:scale-105`}
                      style={{ animationDelay: `${index * 0.2}s` }}
                    />
                  ))}
                </div>
              </Card>
            )}

            {gameState === "playing" && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Sekarang Giliranmu! ({userPattern.length}/{pattern.length})
                </h2>
                <p className="text-white/70 mb-4">Klik warna sesuai urutan yang benar</p>
                <div className="flex gap-2 justify-center mb-6">
                  {pattern.map((_, index) => (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full transition-all ${
                        index < userPattern.length ? "bg-cyan-400 scale-110" : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorClick(color)}
                      className={`h-32 rounded-lg ${colorClasses[color]} shadow-2xl transform transition-all hover:scale-105 active:scale-95 hover:shadow-cyan-500/50`}
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {gameState === "finished" && (
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <h1 className="text-6xl font-bold text-white mb-8">🎮 Permainan Selesai!</h1>
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-12">
              <div className="mb-8">
                <p className="text-white/70 text-xl mb-2">Skor Akhir</p>
                <p className="text-7xl font-bold text-cyan-400 mb-4">{score.toLocaleString('id-ID')}</p>
                <p className="text-white/70 text-lg">Level Tertinggi: {level}</p>
                <p className="text-white/60 text-sm mt-2">Pola terpanjang: {pattern.length} warna</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={startGame}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white font-bold"
                >
                  Main Lagi
                </Button>
                <Button
                  size="lg"
                  onClick={() => navigate("/leaderboard")}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white font-bold"
                >
                  Lihat Leaderboard
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternMaster;
