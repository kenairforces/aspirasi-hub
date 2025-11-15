import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Portal Aspirasi Siswa
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sampaikan aspirasi Anda dengan mudah. Suara Anda penting bagi kami.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card 
            className="p-8 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-fade-in border-2 hover:border-primary"
            onClick={() => navigate('/submit')}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-3">Kirim Aspirasi</h2>
                <p className="text-muted-foreground">
                  Sampaikan pendapat, saran, atau keluhan Anda secara anonim
                </p>
              </div>
              <Button 
                size="lg"
                className="w-full bg-primary hover:bg-primary/90"
              >
                Mulai Kirim
              </Button>
            </div>
          </Card>

          <Card 
            className="p-8 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-fade-in border-2 hover:border-secondary"
            onClick={() => navigate('/admin/login')}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-3">Panel Admin</h2>
                <p className="text-muted-foreground">
                  Kelola dan tanggapi aspirasi yang masuk dari siswa
                </p>
              </div>
              <Button 
                size="lg"
                variant="outline"
                className="w-full border-secondary text-secondary hover:bg-secondary hover:text-white"
              >
                Login Admin
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-muted-foreground">
            Platform ini menjamin keamanan dan kerahasiaan aspirasi Anda
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
