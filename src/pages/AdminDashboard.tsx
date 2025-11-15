import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Download, Search, MessageSquare, Users, ShieldCheck, FileText, BarChart3 } from "lucide-react";
import AspirationCard from "@/components/AspirationCard";
import AspirationStats from "@/components/AspirationStats";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { ThemeToggle } from "@/components/ThemeToggle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const handleDownloadExcel = async () => {
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
        title: "Download Excel Berhasil",
        description: "File Excel telah diunduh.",
      });
    } catch (error) {
      toast({
        title: "Download Gagal",
        description: "Tidak dapat mengunduh file.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Membuat PDF...",
        description: "Mohon tunggu, dokumen sedang dibuat",
      });

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("REKAP ASPIRASI SISWA", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 105, 28, { align: "center" });
      
      // Table data
      const tableData = filteredAspirations.map((asp, index) => [
        (index + 1).toString(),
        asp.student_name,
        asp.student_class || "-",
        asp.content.length > 100 ? asp.content.substring(0, 100) + "..." : asp.content,
        new Date(asp.created_at).toLocaleDateString("id-ID"),
        asp.status,
        asp.comments.length.toString()
      ]);

      autoTable(doc, {
        startY: 35,
        head: [["No", "Nama", "Kelas", "Aspirasi", "Tanggal", "Status", "Komentar"]],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 70 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 15 },
        },
      });

      doc.save(`aspirasi-rekap-${new Date().toISOString().split("T")[0]}.pdf`);

      toast({
        title: "Download PDF Berhasil! 📄",
        description: "File PDF telah diunduh.",
      });
    } catch (error) {
      toast({
        title: "Download Gagal",
        description: "Tidak dapat membuat PDF.",
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
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <ThemeToggle />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 animate-fade-in">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-xl opacity-50 animate-pulse" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary shadow-2xl">
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-fade-in">
                  Dashboard Admin
                </h1>
                {userRole === "superadmin" && (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 mt-2 rounded-full bg-gradient-to-r from-secondary to-accent text-white text-sm font-bold shadow-xl animate-pulse">
                    <ShieldCheck className="w-4 h-4" />
                    SUPERADMIN ACCESS
                  </span>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-xl ml-24 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Kelola dan pantau aspirasi siswa secara real-time ✨
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {userRole === "superadmin" && (
              <Button
                onClick={() => setShowSuperAdminPanel(!showSuperAdminPanel)}
                variant="outline"
                className="group border-2 border-secondary/50 bg-background/50 backdrop-blur-sm text-secondary hover:bg-secondary hover:text-white hover:border-secondary transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-secondary/50"
              >
                <Users className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                {showSuperAdminPanel ? "Lihat Aspirasi" : "Kelola Admin"}
              </Button>
            )}
            <Button
              onClick={() => navigate("/admin/statistics")}
              variant="outline"
              className="group border-2 border-accent/50 bg-background/50 backdrop-blur-sm text-accent hover:bg-accent hover:text-white hover:border-accent transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-accent/50"
            >
              <BarChart3 className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Statistik
            </Button>
            <Button
              onClick={handleDownloadExcel}
              className="group bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              <Download className="mr-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
              Download Excel
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="group bg-gradient-to-r from-accent to-secondary text-white hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              <FileText className="mr-2 h-5 w-5 group-hover:rotate-6 transition-transform" />
              Download PDF
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="group border-2 border-destructive/50 bg-background/50 backdrop-blur-sm text-destructive hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-destructive/50"
            >
              <LogOut className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              Logout
            </Button>
          </div>
        </div>

        {userRole === "superadmin" && showSuperAdminPanel ? (
          <AdminUserManagement />
        ) : (
          <>
            <AspirationStats aspirations={aspirations} />

            <Card className="group relative p-8 mb-8 shadow-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card/80 to-primary/5 backdrop-blur-sm animate-fade-in hover:shadow-3xl hover:border-primary/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <Search className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <Input
                  placeholder="🔍 Cari berdasarkan nama siswa, kelas, atau isi aspirasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 pr-6 py-7 text-lg border-2 border-primary/20 focus:border-primary bg-background/50 backdrop-blur-sm rounded-xl transition-all duration-300 hover:shadow-lg focus:shadow-xl"
                />
              </div>
            </Card>

            {filteredAspirations.length === 0 ? (
              <Card className="p-20 text-center shadow-3xl border-2 border-primary/20 bg-gradient-to-br from-card via-muted/10 to-accent/5 backdrop-blur-lg animate-fade-in hover:shadow-4xl transition-all duration-500">
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <MessageSquare className="w-16 h-16 text-primary animate-pulse" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  {searchQuery ? "Hasil Tidak Ditemukan" : "Belum Ada Aspirasi"}
                </h3>
                <p className="text-muted-foreground text-xl max-w-md mx-auto">
                  {searchQuery
                    ? "Coba gunakan kata kunci lain untuk pencarian Anda"
                    : "Aspirasi siswa akan muncul di sini setelah mereka mengirimkan 📝"}
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredAspirations.map((aspiration, index) => (
                  <div 
                    key={aspiration.id}
                    className="animate-fade-in hover:scale-[1.01] transition-all duration-300"
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
