import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function QuickMath() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [playing, setPlaying] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (playing && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      endGame();
    }
  }, [playing, timeLeft]);

  const generateQuestion = () => {
    const operations = ["+", "-", "×", "÷"];
    const op = operations[Math.floor(Math.random() * operations.length)];
    let num1 = Math.floor(Math.random() * 50) + 1;
    let num2 = Math.floor(Math.random() * 50) + 1;
    let result = 0;

    // Make division easier
    if (op === "÷") {
      num2 = Math.floor(Math.random() * 10) + 1;
      num1 = num2 * (Math.floor(Math.random() * 10) + 1);
    }

    switch (op) {
      case "+":
        result = num1 + num2;
        break;
      case "-":
        result = num1 - num2;
        break;
      case "×":
        result = num1 * num2;
        break;
      case "÷":
        result = num1 / num2;
        break;
    }

    setQuestion(`${num1} ${op} ${num2}`);
    setCorrectAnswer(result);
    setAnswer("");
  };

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setPlaying(true);
    generateQuestion();
  };

  const checkAnswer = () => {
    const userAnswer = parseFloat(answer);
    
    if (userAnswer === correctAnswer) {
      const points = 10 + streak * 2;
      setScore(score + points);
      setStreak(streak + 1);
      toast({
        title: "Benar! 🎉",
        description: `+${points} poin (Streak: ${streak + 1})`,
      });
    } else {
      setStreak(0);
      toast({
        title: "Salah! 😅",
        description: `Jawaban: ${correctAnswer}`,
        variant: "destructive",
      });
    }
    generateQuestion();
  };

  const endGame = async () => {
    setPlaying(false);
    
    if (userId) {
      const { data: stats } = await supabase
        .from("player_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (stats) {
        await supabase
          .from("player_stats")
          .update({
            total_games_played: (stats.total_games_played || 0) + 1,
            total_points: (stats.total_points || 0) + score,
            highest_streak: Math.max(stats.highest_streak || 0, streak),
          })
          .eq("user_id", userId);
      } else {
        await supabase.from("player_stats").insert({
          user_id: userId,
          total_games_played: 1,
          total_points: score,
          highest_streak: streak,
        });
      }
    }

    toast({
      title: "Permainan Selesai!",
      description: `Skor Akhir: ${score} | Streak Terbaik: ${streak}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
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

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <Calculator className="w-24 h-24 mx-auto text-purple-400 mb-4" />
            <h1 className="text-5xl font-bold text-white mb-4">🧮 Matematika Kilat</h1>
            <p className="text-xl text-white/80">Selesaikan operasi matematika secepat mungkin!</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8">
            {!playing ? (
              <div className="text-center space-y-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-white font-bold text-xl mb-3">📋 Cara Bermain:</h3>
                  <ul className="text-white/80 text-left space-y-2">
                    <li>• Selesaikan operasi matematika (+, -, ×, ÷)</li>
                    <li>• Kamu punya waktu 60 detik</li>
                    <li>• Jawaban benar = 10 poin + bonus streak</li>
                    <li>• Combo streak memberikan bonus poin ekstra!</li>
                    <li>• Tekan Enter untuk submit jawaban</li>
                  </ul>
                </div>

                <Button
                  onClick={startGame}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white text-xl px-12 py-6"
                >
                  Mulai Game
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center text-white text-xl">
                  <div className="bg-white/10 px-6 py-3 rounded-lg">
                    <span className="font-bold">Skor: {score}</span>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 rounded-lg">
                    <span className="font-bold">🔥 Streak: {streak}</span>
                  </div>
                  <div className={`bg-white/10 px-6 py-3 rounded-lg ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                    <span className="font-bold">⏱️ {timeLeft}s</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-16 text-center border-2 border-purple-400/30">
                  <h2 className="text-8xl font-bold text-white mb-6">{question}</h2>
                  <p className="text-2xl text-white/60">= ?</p>
                </div>

                <div className="flex gap-3">
                  <Input
                    type="number"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && checkAnswer()}
                    placeholder="Ketik jawabanmu..."
                    className="text-3xl p-8 bg-white/90 text-gray-900 text-center"
                    autoFocus
                  />
                  <Button
                    onClick={checkAnswer}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 px-8"
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
