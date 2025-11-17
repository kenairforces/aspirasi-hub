import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Users, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MultiplayerRoom from "@/components/MultiplayerRoom";

const BrainRush = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<"menu" | "playing" | "finished">("menu");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState("");

  const generateQuestion = () => {
    const types = ["math", "logic", "pattern"];
    const type = types[Math.floor(Math.random() * types.length)];

    switch (type) {
      case "math":
        const num1 = Math.floor(Math.random() * 50) + 1;
        const num2 = Math.floor(Math.random() * 50) + 1;
        const ops = ["+", "-", "*"];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let result;
        if (op === "+") result = num1 + num2;
        else if (op === "-") result = num1 - num2;
        else result = num1 * num2;
        return {
          question: `${num1} ${op} ${num2} = ?`,
          answer: result.toString(),
          type: "math",
        };

      case "logic":
        const logicNum = Math.floor(Math.random() * 100) + 1;
        return {
          question: `Apakah ${logicNum} adalah bilangan genap?`,
          answer: logicNum % 2 === 0 ? "ya" : "tidak",
          type: "logic",
        };

      case "pattern":
        const start = Math.floor(Math.random() * 10) + 1;
        const diff = Math.floor(Math.random() * 5) + 1;
        const seq = [start, start + diff, start + 2 * diff, start + 3 * diff];
        return {
          question: `Lanjutkan: ${seq.join(", ")}, ?`,
          answer: (start + 4 * diff).toString(),
          type: "pattern",
        };
    }
  };

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setCurrentQuestion(generateQuestion());
  };

  const checkAnswer = () => {
    if (!currentQuestion) return;

    const userAnswer = answer.toLowerCase().trim();
    const correctAnswer = currentQuestion.answer.toString().toLowerCase();

    if (userAnswer === correctAnswer) {
      const points = 10 + streak * 2;
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      toast({
        title: "Benar! 🎉",
        description: `+${points} poin! Streak: ${streak + 1}`,
      });
    } else {
      setStreak(0);
      toast({
        title: "Salah 😅",
        description: `Jawaban yang benar: ${currentQuestion.answer}`,
        variant: "destructive",
      });
    }

    setAnswer("");
    setCurrentQuestion(generateQuestion());
  };

  const endGame = async () => {
    setGameState("finished");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("player_stats").upsert({
        user_id: user.id,
        total_games_played: 1,
        total_points: score,
        highest_streak: streak,
      }, {
        onConflict: "user_id",
        ignoreDuplicates: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
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
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-8 text-center">
              <Zap className="w-24 h-24 mx-auto text-yellow-400 mb-4 animate-pulse" />
              <h1 className="text-6xl font-bold text-white mb-4">🧠 Brain Rush</h1>
              <p className="text-xl text-white/80">
                Jawab soal matematika, logika, dan pola secepat mungkin!
              </p>
            </div>
            
            <Tabs defaultValue="solo" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="solo">Solo Mode</TabsTrigger>
                <TabsTrigger value="multiplayer">Multiplayer</TabsTrigger>
              </TabsList>

              <TabsContent value="solo">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 mb-6">
                  <h2 className="text-2xl font-bold text-white mb-4">📜 Cara Main:</h2>
                  <ul className="text-left text-white/80 space-y-2">
                    <li>⏱️ Kamu punya 60 detik</li>
                    <li>🎯 Jawab soal dengan benar untuk dapat poin</li>
                    <li>🔥 Streak berturut-turut = bonus poin!</li>
                    <li>🏆 Semakin cepat dan akurat, semakin tinggi skor!</li>
                  </ul>
                </Card>

                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={startGame}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xl px-12 py-6"
                  >
                    <Play className="mr-3 h-6 w-6" />
                    Mulai Bermain
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="multiplayer">
                <MultiplayerRoom gameType="brain_rush" />
              </TabsContent>
            </Tabs>
          </div>
        )}


        {gameState === "playing" && currentQuestion && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="flex justify-between mb-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-6 py-3">
                <p className="text-white/70 text-sm">Score</p>
                <p className="text-3xl font-bold text-yellow-400">{score}</p>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-6 py-3">
                <p className="text-white/70 text-sm">Time</p>
                <p className="text-3xl font-bold text-white">{timeLeft}s</p>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-6 py-3">
                <p className="text-white/70 text-sm">Streak</p>
                <p className="text-3xl font-bold text-orange-400">🔥 {streak}</p>
              </Card>
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-12 text-center">
              <h2 className="text-4xl font-bold text-white mb-8">{currentQuestion.question}</h2>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && checkAnswer()}
                placeholder="Ketik jawaban..."
                className="w-full p-4 text-2xl text-center bg-white/20 border-white/30 rounded-lg text-white placeholder-white/50 mb-4"
                autoFocus
              />
              <Button
                size="lg"
                onClick={checkAnswer}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white font-bold text-xl py-6"
              >
                Submit Jawaban
              </Button>
            </Card>
          </div>
        )}

        {gameState === "finished" && (
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <h1 className="text-6xl font-bold text-white mb-8">🎉 Game Selesai!</h1>
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-12">
              <div className="mb-8">
                <p className="text-white/70 text-xl mb-2">Final Score</p>
                <p className="text-7xl font-bold text-yellow-400 mb-4">{score}</p>
                <p className="text-white/70 text-lg">Best Streak: 🔥 {streak}</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={startGame}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold"
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

export default BrainRush;
