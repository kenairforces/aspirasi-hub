import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { type, aspirationId } = await req.json();

    if (type === 'all') {
      // Download all aspirations as CSV
      const { data: aspirations, error } = await supabaseClient
        .from('aspirations')
        .select(`
          *,
          comments (
            comment_text,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Generate CSV
      let csv = 'No,Tanggal & Waktu,Nama Siswa,Kelas,Aspirasi,Jumlah Komentar,Status\n';
      
      aspirations.forEach((asp, index) => {
        const date = new Date(asp.created_at).toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const escapedContent = `"${asp.content.replace(/"/g, '""')}"`;
        const kelas = asp.student_class || '-';
        const commentCount = asp.comments?.length || 0;
        
        csv += `${index + 1},${date},${asp.student_name},${kelas},${escapedContent},${commentCount},${asp.status}\n`;
      });

      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="aspirasi-rekap-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (type === 'single' && aspirationId) {
      // Download single aspiration as formatted text/PDF
      const { data: aspiration, error } = await supabaseClient
        .from('aspirations')
        .select(`
          *,
          comments (
            comment_text,
            created_at
          )
        `)
        .eq('id', aspirationId)
        .single();

      if (error) throw error;

      // Generate formatted document
      const date = new Date(aspiration.created_at).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      let document = `
╔════════════════════════════════════════════════════════════╗
║          PORTAL ASPIRASI SISWA - DETAIL ASPIRASI          ║
╚════════════════════════════════════════════════════════════╝

───────────────────────────────────────────────────────────────
INFORMASI SISWA
───────────────────────────────────────────────────────────────

Nama          : ${aspiration.student_name}
Kelas         : ${aspiration.student_class || '-'}
Tanggal       : ${date}
Status        : ${aspiration.status}

───────────────────────────────────────────────────────────────
ISI ASPIRASI
───────────────────────────────────────────────────────────────

${aspiration.content}

`;

      if (aspiration.comments && aspiration.comments.length > 0) {
        document += `
───────────────────────────────────────────────────────────────
KOMENTAR ADMIN (${aspiration.comments.length})
───────────────────────────────────────────────────────────────

`;
        aspiration.comments.forEach((comment: any, index: number) => {
          const commentDate = new Date(comment.created_at).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          document += `${index + 1}. [${commentDate}]
   ${comment.comment_text}

`;
        });
      }

      document += `
───────────────────────────────────────────────────────────────
Dokumen ini dihasilkan secara otomatis oleh Portal Aspirasi
Tanggal Unduh: ${new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}
───────────────────────────────────────────────────────────────
`;

      return new Response(document, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="aspirasi-${aspiration.student_name}-${new Date(aspiration.created_at).toISOString().split('T')[0]}.txt"`,
        },
      });
    }

    throw new Error('Invalid request type');
  } catch (error) {
    console.error('Error in download-aspirations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
