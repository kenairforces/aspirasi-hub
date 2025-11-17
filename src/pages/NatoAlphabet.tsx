import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NATO_ALPHABET = {
  A: "Alfa", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo",
  F: "Foxtrot", G: "Golf", H: "Hotel", I: "India", J: "Juliett",
  K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar",
  P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango",
  U: "Uniform", V: "Victor", W: "Whiskey", X: "Xray", Y: "Yankee", Z: "Zulu"
};

export default function NatoAlphabet() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"text-to-nato" | "nato-to-text">("text-to-nato");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [playing, setPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

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

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setPlaying(true);
    generateQuestion();
  };

  const generateQuestion = () => {
    const letters = Object.keys(NATO_ALPHABET);
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    
    if (mode === "text-to-nato") {
      setCurrentQuestion(randomLetter);
      setCorrectAnswer(NATO_ALPHABET[randomLetter as keyof typeof NATO_ALPHABET]);
    } else {
      const natoWord = NATO_ALPHABET[randomLetter as keyof typeof NATO_ALPHABET];
      setCurrentQuestion(natoWord);
      setCorrectAnswer(randomLetter);
    }
    setAnswer("");
  };

  const checkAnswer = () => {
    const userAnswer = answer.trim().toLowerCase();
    const correct = correctAnswer.toLowerCase();

    if (userAnswer === correct) {
      setScore(score + 10);
      toast({
        title: "Benar! 🎉",
        description: "+10 poin",
      });
    } else {
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
          })
          .eq("user_id", userId);
      } else {
        await supabase.from("player_stats").insert({
          user_id: userId,
          total_games_played: 1,
          total_points: score,
        });
      }
    }

    toast({
      title: "Permainan Selesai!",
      description: `Skor Akhir: ${score}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
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
            <Radio className="w-24 h-24 mx-auto text-yellow-400 mb-4" />
            <h1 className="text-5xl font-bold text-white mb-4">📻 NATO Alphabet</h1>
            <p className="text-xl text-white/80">Belajar alfabet NATO seperti pilot!</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8">
            {!playing ? (
              <div className="text-center space-y-6">
                <div className="bg-white/5 rounded-lg p-6 mb-6">
                  <h3 className="text-white font-bold text-xl mb-4">Pilih Mode:</h3>
                  <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/10">
                      <TabsTrigger value="text-to-nato" className="data-[state=active]:bg-primary">
                        Huruf → NATO
                      </TabsTrigger>
                      <TabsTrigger value="nato-to-text" className="data-[state=active]:bg-primary">
                        NATO → Huruf
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-white font-bold text-xl mb-3">📋 Cara Bermain:</h3>
                  <ul className="text-white/80 text-left space-y-2">
                    <li>• Mode Huruf → NATO: Lihat huruf, ketik kode NATO-nya</li>
                    <li>• Mode NATO → Huruf: Lihat kode NATO, ketik hurufnya</li>
                    <li>• Kamu punya waktu 60 detik</li>
                    <li>• Setiap jawaban benar = 10 poin</li>
                    <li>• Tekan Enter untuk submit jawaban</li>
                  </ul>
                </div>

                <Button
                  onClick={startGame}
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white text-xl px-12 py-6"
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
                  <div className={`bg-white/10 px-6 py-3 rounded-lg ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                    <span className="font-bold">Waktu: {timeLeft}s</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-12 text-center border-2 border-yellow-400/30">
                  <p className="text-white/60 text-lg mb-2">
                    {mode === "text-to-nato" ? "Ketik Kode NATO untuk:" : "Ketik Huruf untuk:"}
                  </p>
                  <h2 className="text-7xl font-bold text-white mb-6">{currentQuestion}</h2>
                </div>

                <div className="flex gap-3">
                  <Input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && checkAnswer()}
                    placeholder={mode === "text-to-nato" ? "Contoh: Alfa" : "Contoh: A"}
                    className="text-2xl p-6 bg-white/90 text-gray-900 placeholder:text-gray-400"
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

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2">Referensi NATO Alphabet:</h4>
                  <div className="grid grid-cols-5 gap-2 text-white/70 text-sm">
                    {Object.entries(NATO_ALPHABET).map(([letter, nato]) => (
                      <div key={letter} className="bg-white/5 p-2 rounded">
                        <span className="font-bold">{letter}</span> = {nato}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
