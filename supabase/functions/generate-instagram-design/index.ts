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

    // Create beautiful Instagram design (1080x1080) with aspiration content centered
    const svg = `
      <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(99, 102, 241);stop-opacity:1" />
            <stop offset="50%" style="stop-color:rgb(139, 92, 246);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(168, 85, 247);stop-opacity:1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.25"/>
          </filter>
        </defs>
        
        <!-- Background with gradient -->
        <rect width="1080" height="1080" fill="url(#bgGradient)"/>
        
        <!-- Decorative elements -->
        <circle cx="150" cy="150" r="200" fill="white" opacity="0.08"/>
        <circle cx="930" cy="930" r="250" fill="white" opacity="0.08"/>
        <circle cx="900" cy="180" r="120" fill="white" opacity="0.05"/>
        <circle cx="180" cy="900" r="150" fill="white" opacity="0.05"/>
        
        <!-- Main content card -->
        <rect x="90" y="90" width="900" height="900" rx="40" fill="white" filter="url(#shadow)" opacity="0.98"/>
        
        <!-- Decorative top accent -->
        <rect x="90" y="90" width="900" height="8" rx="40" fill="url(#bgGradient)"/>
        
        <!-- Header -->
        <text x="540" y="180" font-family="Arial, sans-serif" font-size="42" font-weight="bold" text-anchor="middle" fill="#6366F1" filter="url(#glow)">
          Aspirasi Siswa
        </text>
        
        <!-- Decorative line -->
        <line x1="240" y1="210" x2="840" y2="210" stroke="#A78BFA" stroke-width="2" opacity="0.5"/>
        
        <!-- Content area with better spacing -->
        <foreignObject x="140" y="260" width="800" height="640">
          <div xmlns="http://www.w3.org/1999/xhtml" style="
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            font-family: 'Arial', sans-serif;
            text-align: center;
            padding: 40px;
          ">
            <div style="
              font-size: 32px;
              line-height: 1.8;
              color: #1F2937;
              font-weight: 500;
              max-height: 100%;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 12;
              -webkit-box-orient: vertical;
            ">
              ${(aspiration.content.length > 400 ? aspiration.content.substring(0, 400) + '...' : aspiration.content).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}
            </div>
          </div>
        </foreignObject>
        
        <!-- Footer info -->
        <text x="540" y="940" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#6B7280" opacity="0.8">
          📅 ${date}
        </text>
        <text x="540" y="965" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#9CA3AF" opacity="0.7">
          Portal Aspirasi Siswa
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
