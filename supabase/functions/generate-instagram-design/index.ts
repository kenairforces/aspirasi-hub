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

    const { aspirationId } = await req.json();

    const { data: aspiration, error } = await supabaseClient
      .from('aspirations')
      .select('*')
      .eq('id', aspirationId)
      .single();

    if (error) throw error;

    const date = new Date(aspiration.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Create SVG design for Instagram (1080x1080)
    const svg = `
      <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(59, 130, 246);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(147, 51, 234);stop-opacity:1" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="1080" height="1080" fill="url(#bgGradient)"/>
        
        <!-- Decorative circles -->
        <circle cx="100" cy="100" r="150" fill="white" opacity="0.1"/>
        <circle cx="980" cy="980" r="200" fill="white" opacity="0.1"/>
        
        <!-- Main content card -->
        <rect x="80" y="120" width="920" height="840" rx="30" fill="white" filter="url(#shadow)"/>
        
        <!-- Header -->
        <text x="540" y="220" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#3B82F6">
          Portal Aspirasi Siswa
        </text>
        
        <!-- Decorative line -->
        <line x1="200" y1="250" x2="880" y2="250" stroke="#9333EA" stroke-width="3"/>
        
        <!-- Student info -->
        <text x="140" y="320" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="#1F2937">
          📝 ${aspiration.student_name}
        </text>
        <text x="140" y="370" font-family="Arial, sans-serif" font-size="24" fill="#6B7280">
          ${aspiration.student_class || 'Anonim'}
        </text>
        <text x="140" y="420" font-family="Arial, sans-serif" font-size="22" fill="#9CA3AF">
          📅 ${date}
        </text>
        
        <!-- Content box -->
        <rect x="120" y="460" width="840" height="400" rx="20" fill="#F3F4F6"/>
        <foreignObject x="140" y="480" width="800" height="360">
          <div xmlns="http://www.w3.org/1999/xhtml" style="
            font-family: Arial, sans-serif;
            font-size: 26px;
            line-height: 1.6;
            color: #1F2937;
            padding: 20px;
            overflow: hidden;
            text-align: left;
          ">
            ${aspiration.content.length > 300 ? aspiration.content.substring(0, 300) + '...' : aspiration.content}
          </div>
        </foreignObject>
        
        <!-- Footer -->
        <text x="540" y="920" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#6B7280">
          ✨ Suara Anda Sangat Berarti ✨
        </text>
      </svg>
    `;

    // Convert SVG to PNG using a canvas approach
    // Since Deno doesn't have native canvas, we'll return SVG and let client convert
    // or use an external service
    
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
      },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
