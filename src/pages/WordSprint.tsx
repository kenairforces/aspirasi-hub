import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MultiplayerRoom from "@/components/MultiplayerRoom";

const WordSprint = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<"menu" | "playing" | "finished">("menu");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [letters, setLetters] = useState("");
  const [word, setWord] = useState("");
  const [foundWords, setFoundWords] = useState<string[]>([]);

  const generateLetters = () => {
    const vowels = "AEIOU";
    const consonants = "BCDFGHJKLMNPQRSTVWXYZ";
    let result = "";
    
    for (let i = 0; i < 3; i++) {
      result += vowels[Math.floor(Math.random() * vowels.length)];
    }
    for (let i = 0; i < 6; i++) {
      result += consonants[Math.floor(Math.random() * consonants.length)];
    }
    
    return result.split("").sort(() => Math.random() - 0.5).join("");
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
    setTimeLeft(90);
    setFoundWords([]);
    setWord("");
    setLetters(generateLetters());
  };

  const endGame = () => {
    setGameState("finished");
  };

  const checkWord = () => {
    const upperWord = word.toUpperCase().trim();
    
    if (upperWord.length < 3) {
      toast({
        title: "Kata terlalu pendek!",
        description: "Minimal 3 huruf",
        variant: "destructive",
      });
      return;
    }

    if (foundWords.includes(upperWord)) {
      toast({
        title: "Kata sudah dipakai!",
        description: "Coba kata lain",
        variant: "destructive",
      });
      return;
    }

    // Check if all letters are available
    const letterCount: Record<string, number> = {};
    for (const letter of letters) {
      letterCount[letter] = (letterCount[letter] || 0) + 1;
    }

    for (const letter of upperWord) {
      if (!letterCount[letter] || letterCount[letter] === 0) {
        toast({
          title: "Huruf tidak tersedia!",
          description: "Gunakan huruf yang ada saja",
          variant: "destructive",
        });
        return;
      }
      letterCount[letter]--;
    }

    // Simple word validation (in real app, use dictionary API)
    const points = upperWord.length * 5;
    setScore((prev) => prev + points);
    setFoundWords([...foundWords, upperWord]);
    setWord("");
    
    toast({
      title: "Kata Diterima! 🎉",
      description: `+${points} poin!`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
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
            <h1 className="text-6xl font-bold text-white mb-8">📝 Word Sprint</h1>
            
            <Tabs defaultValue="solo" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="solo">Solo Mode</TabsTrigger>
                <TabsTrigger value="multiplayer">Multiplayer</TabsTrigger>
              </TabsList>

              <TabsContent value="solo">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 mb-6">
                  <h2 className="text-2xl font-bold text-white mb-4">📜 Cara Main:</h2>
                  <ul className="text-left text-white/80 space-y-2">
                    <li>🔤 Kamu dapat 9 huruf acak</li>
                    <li>✍️ Buat sebanyak mungkin kata dari huruf tersebut</li>
                    <li>⏱️ Waktu: 90 detik</li>
                    <li>📏 Kata minimal 3 huruf</li>
                    <li>🎯 Kata lebih panjang = lebih banyak poin!</li>
                  </ul>
                </Card>
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={startGame}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white font-bold text-xl px-8 py-6"
                  >
                    <Play className="mr-2 h-6 w-6" />
                    Mulai Bermain
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="multiplayer">
                <MultiplayerRoom gameType="word_sprint" />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {gameState === "playing" && (
          <div className="max-w-3xl mx-auto animate-fade-in">
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
                <p className="text-white/70 text-sm">Words</p>
                <p className="text-3xl font-bold text-green-400">{foundWords.length}</p>
              </Card>
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 mb-6">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Huruf Tersedia:</h2>
              <div className="flex justify-center gap-2 flex-wrap mb-8">
                {letters.split("").map((letter, index) => (
                  <div
                    key={index}
                    className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-2xl font-bold text-white"
                  >
                    {letter}
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && checkWord()}
                  placeholder="Ketik kata di sini..."
                  className="w-full p-4 text-2xl text-center bg-white/20 border-white/30 rounded-lg text-white placeholder-white/50 uppercase"
                  autoFocus
                />
              </div>

              <Button
                onClick={checkWord}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xl py-6"
              >
                Submit Kata
              </Button>
            </Card>

            {foundWords.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Kata yang ditemukan:</h3>
                <div className="flex flex-wrap gap-2">
                  {foundWords.map((w, index) => (
                    <span
                      key={index}
                      className="bg-white/20 px-4 py-2 rounded-lg text-white font-semibold"
                    >
                      {w} <span className="text-yellow-400">({w.length * 5}pts)</span>
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {gameState === "finished" && (
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <h1 className="text-6xl font-bold text-white mb-8">🎉 Game Selesai!</h1>
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-12">
              <div className="mb-8">
                <p className="text-white/70 text-xl mb-2">Final Score</p>
                <p className="text-7xl font-bold text-yellow-400 mb-4">{score}</p>
                <p className="text-white/70 text-lg">Kata Ditemukan: {foundWords.length}</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={startGame}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white font-bold"
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

export default WordSprint;
