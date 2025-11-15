import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Shield, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <ThemeToggle />
      
      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block mb-4">
            <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-fade-in">
            Portal Aspirasi Siswa
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Sampaikan aspirasi Anda dengan mudah dan aman. 
            <span className="block mt-2 text-primary font-semibold">Suara Anda sangat berarti! ✨</span>
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card 
            className="p-10 hover:shadow-2xl transition-all duration-500 cursor-pointer group animate-fade-in border-2 hover:border-primary bg-gradient-to-br from-card to-card/50 backdrop-blur-sm relative overflow-hidden"
            onClick={() => navigate('/submit')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <MessageSquare className="w-12 h-12 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Kirim Aspirasi
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Sampaikan pendapat, saran, atau keluhan Anda dengan mudah dan aman
                </p>
              </div>
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-white font-semibold py-6 text-lg shadow-lg"
              >
                ✍️ Mulai Kirim Sekarang
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-20 text-center animate-fade-in space-y-6" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-center gap-2 text-muted-foreground flex-wrap mb-4">
            <Shield className="w-5 h-5" />
            <p className="text-sm">
              Platform ini menjamin keamanan dan kerahasiaan aspirasi Anda dengan teknologi{' '}
              <button 
                onClick={() => navigate('/admin/login')}
                className="text-primary hover:text-accent font-semibold underline decoration-dotted transition-colors"
              >
                enkripsi
              </button>
              {' '}modern
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">100% Anonim</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium">Data Terenkripsi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-sm font-medium">Respon Cepat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
