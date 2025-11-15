import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const aspirationSchema = z.object({
  studentName: z.string().trim().min(1, "Nama tidak boleh kosong").max(100, "Nama terlalu panjang"),
  studentClass: z.string().trim().max(50, "Kelas terlalu panjang").optional(),
  content: z.string().trim().min(10, "Aspirasi minimal 10 karakter").max(2000, "Aspirasi maksimal 2000 karakter"),
});

const SubmitAspiration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    studentClass: "",
    content: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = aspirationSchema.parse(formData);
      setIsSubmitting(true);

      const { error } = await supabase.from("aspirations").insert({
        student_name: validated.studentName,
        student_class: validated.studentClass || null,
        content: validated.content,
      });

      if (error) throw error;

      toast({
        title: "Aspirasi Terkirim!",
        description: "Terima kasih telah menyampaikan aspirasi Anda.",
      });

      setFormData({ studentName: "", studentClass: "", content: "" });
      setTimeout(() => navigate("/"), 2000);
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
          title: "Gagal Mengirim",
          description: "Terjadi kesalahan. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 hover:bg-muted"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <Card className="p-8 animate-fade-in shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Kirim Aspirasi</h1>
            <p className="text-muted-foreground">
              Sampaikan pendapat, saran, atau keluhan Anda dengan jujur
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="studentName">
                Nama <span className="text-destructive">*</span>
              </Label>
              <Input
                id="studentName"
                placeholder="Masukkan nama Anda"
                value={formData.studentName}
                onChange={(e) =>
                  setFormData({ ...formData, studentName: e.target.value })
                }
                className={errors.studentName ? "border-destructive" : ""}
              />
              {errors.studentName && (
                <p className="text-sm text-destructive">{errors.studentName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentClass">Kelas (Opsional)</Label>
              <Input
                id="studentClass"
                placeholder="Contoh: XII IPA 1"
                value={formData.studentClass}
                onChange={(e) =>
                  setFormData({ ...formData, studentClass: e.target.value })
                }
                className={errors.studentClass ? "border-destructive" : ""}
              />
              {errors.studentClass && (
                <p className="text-sm text-destructive">{errors.studentClass}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Aspirasi <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="Tuliskan aspirasi Anda di sini..."
                rows={8}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className={errors.content ? "border-destructive" : ""}
              />
              <p className="text-sm text-muted-foreground">
                {formData.content.length}/2000 karakter
              </p>
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Mengirim..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Kirim Aspirasi
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SubmitAspiration;
