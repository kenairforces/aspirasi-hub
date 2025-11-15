import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Download, Search, MessageSquare, Users, ShieldCheck } from "lucide-react";
import AspirationCard from "@/components/AspirationCard";
import AspirationStats from "@/components/AspirationStats";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Aspiration {
  id: string;
  student_name: string;
  student_class: string | null;
  content: string;
  status: string;
  created_at: string;
  comments: Array<{
    id: string;
    comment_text: string;
    created_at: string;
    admin_id: string;
  }>;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [aspirations, setAspirations] = useState<Aspiration[]>([]);
  const [filteredAspirations, setFilteredAspirations] = useState<Aspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [showSuperAdminPanel, setShowSuperAdminPanel] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchAspirations();
  }, []);

  useEffect(() => {
    filterAspirations();
  }, [searchQuery, aspirations]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/admin/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      navigate("/admin/login");
      return;
    }

    setUser(user);
    setUserRole(roles[0].role);
  };

  const fetchAspirations = async () => {
    try {
      const { data, error } = await supabase
        .from("aspirations")
        .select(`
          *,
          comments (
            id,
            comment_text,
            created_at,
            admin_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAspirations(data || []);
    } catch (error) {
      toast({
        title: "Gagal Memuat Data",
        description: "Tidak dapat memuat aspirasi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAspirations = () => {
    if (!searchQuery.trim()) {
      setFilteredAspirations(aspirations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = aspirations.filter(
      (asp) =>
        asp.student_name.toLowerCase().includes(query) ||
        asp.content.toLowerCase().includes(query) ||
        (asp.student_class && asp.student_class.toLowerCase().includes(query))
    );
    setFilteredAspirations(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout Berhasil",
      description: "Sampai jumpa!",
    });
    navigate("/");
  };

  const handleDownloadAll = async () => {
    try {
      const response = await supabase.functions.invoke("download-aspirations", {
        body: { type: "all" },
      });

      if (response.error) throw response.error;

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aspirasi-rekap-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Berhasil",
        description: "File rekap telah diunduh.",
      });
    } catch (error) {
      toast({
        title: "Download Gagal",
        description: "Tidak dapat mengunduh file.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <ThemeToggle />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                {userRole === "superadmin" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 mt-1 rounded-full bg-gradient-to-r from-secondary to-accent text-white text-xs font-bold shadow-lg animate-pulse">
                    <ShieldCheck className="w-3 h-3" />
                    SUPERADMIN ACCESS
                  </span>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-lg">Kelola dan pantau aspirasi siswa secara real-time</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {userRole === "superadmin" && (
              <Button
                onClick={() => setShowSuperAdminPanel(!showSuperAdminPanel)}
                variant="outline"
                className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Users className="mr-2 h-4 w-4" />
                {showSuperAdminPanel ? "Lihat Aspirasi" : "Kelola Admin"}
              </Button>
            )}
            <Button
              onClick={() => navigate("/admin/statistics")}
              variant="outline"
              className="border-2 border-accent text-accent hover:bg-accent hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Statistik
            </Button>
            <Button
              onClick={handleDownloadAll}
              className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Excel
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {userRole === "superadmin" && showSuperAdminPanel ? (
          <AdminUserManagement />
        ) : (
          <>
            <AspirationStats aspirations={aspirations} />

            <Card className="p-6 mb-6 shadow-xl border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm animate-fade-in">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-pulse" />
                <Input
                  placeholder="🔍 Cari berdasarkan nama, kelas, atau isi aspirasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-6 text-lg border-2 focus:border-primary transition-all duration-300"
                />
              </div>
            </Card>

            {filteredAspirations.length === 0 ? (
              <Card className="p-16 text-center shadow-2xl bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm animate-fade-in">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-primary animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {searchQuery ? "Hasil Tidak Ditemukan" : "Belum Ada Aspirasi"}
                </h3>
                <p className="text-muted-foreground text-lg">
                  {searchQuery
                    ? "Coba gunakan kata kunci lain untuk pencarian"
                    : "Aspirasi akan muncul di sini setelah siswa mengirimkan"}
                </p>
              </Card>
            ) : (
              <div className="space-y-5">
                {filteredAspirations.map((aspiration, index) => (
                  <div 
                    key={aspiration.id}
                    className="animate-fade-in hover:scale-[1.02] transition-transform duration-300"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <AspirationCard
                      aspiration={aspiration}
                      onUpdate={fetchAspirations}
                      delay={index * 0.05}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
