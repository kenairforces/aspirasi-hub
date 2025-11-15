import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Download, Search, MessageSquare } from "lucide-react";
import AspirationCard from "@/components/AspirationCard";
import AspirationStats from "@/components/AspirationStats";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard Admin</h1>
            <p className="text-muted-foreground">Kelola aspirasi siswa</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadAll}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Semua
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <AspirationStats aspirations={aspirations} />

        <Card className="p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama, kelas, atau isi aspirasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {filteredAspirations.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Belum Ada Aspirasi</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Tidak ada hasil yang sesuai dengan pencarian"
                : "Belum ada aspirasi yang masuk"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAspirations.map((aspiration, index) => (
              <AspirationCard
                key={aspiration.id}
                aspiration={aspiration}
                onUpdate={fetchAspirations}
                delay={index * 0.05}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
