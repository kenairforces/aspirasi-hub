import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [superadminPassword, setSuperadminPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = loginSchema.parse(formData);
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        if (!roles || roles.length === 0) {
          await supabase.auth.signOut();
          toast({
            title: "Akses Ditolak",
            description: "Anda tidak memiliki akses sebagai admin.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Login Berhasil",
          description: "Selamat datang di panel admin!",
        });
        navigate("/admin/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Login Gagal",
          description: "Email atau password salah.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [superadminEmail, setSuperadminEmail] = useState("");

  const handleSuperadminLogin = async () => {
    // Validate inputs
    if (!superadminEmail.trim() || !superadminPassword.trim()) {
      toast({
        title: "Input Tidak Valid",
        description: "Email dan password harus diisi.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Login with provided credentials - no hardcoded values
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: superadminEmail.trim(),
        password: superadminPassword,
      });

      if (signInError) throw signInError;

      // Verify user has superadmin role
      if (signInData.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", signInData.user.id);

        if (!roles || !roles.some((r) => r.role === "superadmin")) {
          await supabase.auth.signOut();
          throw new Error("Akun ini tidak memiliki akses superadmin");
        }

        toast({
          title: "Login Berhasil",
          description: "Selamat datang Superadmin!",
        });
        navigate("/admin/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Login Gagal",
        description: error.message || "Email atau password tidak valid.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <ThemeToggle />

      <div className="w-full max-w-md relative z-10">
        <Button
          variant="ghost"
          className="mb-6 hover:bg-muted"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <Card className="p-8 animate-fade-in shadow-2xl border-2">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-accent mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
              <LogIn className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              Admin Login
            </h1>
            <p className="text-muted-foreground">
              Masuk untuk mengelola aspirasi
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                  <Shield className="w-3 h-3 mr-1" />
                  Superadmin Access
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Superadmin Login</DialogTitle>
                  <DialogDescription>
                    Masukkan password superadmin untuk akses penuh
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="superadmin-email">Email Superadmin</Label>
                    <Input
                      id="superadmin-email"
                      type="email"
                      placeholder="Masukkan email superadmin"
                      value={superadminEmail}
                      onChange={(e) => setSuperadminEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="superadmin-password">Password Superadmin</Label>
                    <Input
                      id="superadmin-password"
                      type="password"
                      placeholder="Masukkan password superadmin"
                      value={superadminPassword}
                      onChange={(e) => setSuperadminPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSuperadminLogin}
                    className="w-full bg-gradient-to-r from-secondary to-destructive"
                    disabled={isLoading}
                  >
                    {isLoading ? "Memproses..." : "Login Superadmin"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
