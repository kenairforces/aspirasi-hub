import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeXML(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? current + " " + w : w;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      if (w.length > maxChars) {
        const chunks = w.match(new RegExp(`.{1,${maxChars}}`, "g")) || [w];
        lines.push(...chunks.slice(0, -1));
        current = chunks[chunks.length - 1];
      } else {
        current = w;
      }
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } }
    );

    const { aspirationId } = await req.json();
    if (!aspirationId) throw new Error("aspirationId is required");

    const { data: aspiration, error } = await supabase
      .from("aspirations")
      .select("id, content, created_at")
      .eq("id", aspirationId)
      .single();

    if (error) throw error;
    if (!aspiration?.content) throw new Error("Aspiration not found or empty");

    const raw = String(aspiration.content).trim();
    const safe = escapeXML(raw);

    // Dynamic font size based on content length
    let fontSize = 42;
    if (safe.length > 500) fontSize = 26;
    else if (safe.length > 360) fontSize = 30;
    else if (safe.length > 220) fontSize = 34;
    else if (safe.length > 120) fontSize = 38;

    const maxChars = Math.max(20, Math.floor(920 / (fontSize * 0.5)));
    let lines = wrapText(safe, maxChars);

    const maxLines = 18;
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      const last = lines[lines.length - 1];
      lines[lines.length - 1] = last.replace(/\.*$/, "").slice(0, Math.max(0, maxChars - 3)) + "...";
    }

    const lineHeight = Math.floor(fontSize * 1.4);
    const contentHeight = lineHeight * lines.length;
    const startY = 540 - Math.floor(contentHeight / 2) + lineHeight;

    const tspans = lines
      .map((line, i) => `<tspan x="540" dy="${i === 0 ? 0 : lineHeight}" xml:space="preserve">${line}</tspan>`)
      .join("");

    // NGL-style clean Instagram design with pointing character
    const svg = `
      <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Simple gradients ala NGL -->
          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FF6B6B" />
            <stop offset="100%" stop-color="#4ECDC4" />
          </linearGradient>
          
          <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="100%" stop-color="#F8F9FA" />
          </linearGradient>
          
          <filter id="softShadow">
            <feDropShadow dx="0" dy="10" stdDeviation="20" flood-color="#000" flood-opacity="0.15"/>
          </filter>
        </defs>

        <!-- Background gradient -->
        <rect width="1080" height="1080" fill="url(#bg)" />
        
        <!-- Decorative circles -->
        <circle cx="150" cy="150" r="100" fill="#FFE66D" opacity="0.3" />
        <circle cx="930" cy="200" r="120" fill="#FF6B6B" opacity="0.25" />
        <circle cx="100" cy="900" r="90" fill="#4ECDC4" opacity="0.3" />
        <circle cx="950" cy="880" r="110" fill="#95E1D3" opacity="0.25" />
        
        <!-- Floating emoji decorations -->
        <text x="180" y="250" font-size="50" opacity="0.6">💭</text>
        <text x="850" y="280" font-size="45" opacity="0.6">✨</text>
        <text x="120" y="820" font-size="48" opacity="0.6">💫</text>
        <text x="900" y="850" font-size="52" opacity="0.6">🌟</text>
        <text x="300" y="180" font-size="40" opacity="0.5">💡</text>
        <text x="750" y="900" font-size="42" opacity="0.5">🎯</text>
        
        <!-- Main content card -->
        <rect x="80" y="200" width="920" height="${contentHeight + 200}" 
          rx="40" 
          fill="url(#cardBg)" 
          filter="url(#softShadow)" />
        
        <!-- Header bar -->
        <rect x="80" y="200" width="920" height="100" rx="40" fill="#FF6B6B" />
        <text x="540" y="265" 
          font-family="'Inter', 'SF Pro Display', Arial, sans-serif" 
          font-size="38" 
          font-weight="800"
          fill="#FFFFFF" 
          text-anchor="middle">💬 ASPIRASI SISWA</text>
        
        <!-- Pointing character illustration (left side) -->
        <g transform="translate(100, ${startY + Math.floor(contentHeight / 2) - 80})">
          <!-- Person body -->
          <ellipse cx="0" cy="80" rx="35" ry="45" fill="#FFE66D" />
          <!-- Head -->
          <circle cx="0" cy="20" r="28" fill="#FFD93D" />
          <!-- Eyes -->
          <circle cx="-8" cy="18" r="3" fill="#333" />
          <circle cx="8" cy="18" r="3" fill="#333" />
          <!-- Smile -->
          <path d="M -10 26 Q 0 32 10 26" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
          <!-- Pointing arm -->
          <path d="M 35 60 L 80 60 L 85 55 L 90 60 L 85 65 L 80 60" fill="#FFCB74" stroke="#FFB84D" stroke-width="2"/>
          <!-- Exclamation marks -->
          <text x="50" y="30" font-size="24" fill="#FF6B6B">!</text>
          <text x="65" y="25" font-size="20" fill="#FF6B6B">!</text>
        </g>
        
        <!-- Pointing character illustration (right side) -->
        <g transform="translate(980, ${startY + Math.floor(contentHeight / 2) + 40}) scale(-1, 1)">
          <!-- Person body -->
          <ellipse cx="0" cy="80" rx="35" ry="45" fill="#95E1D3" />
          <!-- Head -->
          <circle cx="0" cy="20" r="28" fill="#4ECDC4" />
          <!-- Eyes -->
          <circle cx="-8" cy="18" r="3" fill="#333" />
          <circle cx="8" cy="18" r="3" fill="#333" />
          <!-- Smile -->
          <path d="M -10 26 Q 0 32 10 26" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
          <!-- Pointing arm -->
          <path d="M 35 60 L 80 60 L 85 55 L 90 60 L 85 65 L 80 60" fill="#81D8D0" stroke="#4ECDC4" stroke-width="2"/>
          <!-- Exclamation marks -->
          <text x="50" y="35" font-size="22" fill="#4ECDC4">!</text>
          <text x="65" y="30" font-size="18" fill="#4ECDC4">!</text>
        </g>
        
        <!-- Arrow pointing to text -->
        <g opacity="0.7">
          <path d="M 150 ${startY - 50} L 180 ${startY - 20}" stroke="#FF6B6B" stroke-width="4" stroke-linecap="round"/>
          <path d="M 180 ${startY - 20} L 175 ${startY - 35}" stroke="#FF6B6B" stroke-width="4" stroke-linecap="round"/>
          <path d="M 180 ${startY - 20} L 165 ${startY - 25}" stroke="#FF6B6B" stroke-width="4" stroke-linecap="round"/>
          
          <path d="M 930 ${startY - 50} L 900 ${startY - 20}" stroke="#4ECDC4" stroke-width="4" stroke-linecap="round"/>
          <path d="M 900 ${startY - 20} L 905 ${startY - 35}" stroke="#4ECDC4" stroke-width="4" stroke-linecap="round"/>
          <path d="M 900 ${startY - 20} L 915 ${startY - 25}" stroke="#4ECDC4" stroke-width="4" stroke-linecap="round"/>
        </g>
        
        <!-- Quote decoration -->
        <text x="150" y="${startY - 10}" 
          font-family="Georgia, serif" 
          font-size="80" 
          fill="#FF6B6B" 
          opacity="0.2" 
          font-weight="bold">"</text>
        
        <!-- Main aspiration text (clean, no glow) -->
        <text x="540" y="${startY}" 
          text-anchor="middle" 
          font-family="'Inter', 'SF Pro Display', -apple-system, Arial, sans-serif"
          font-size="${fontSize}" 
          fill="#2D3436" 
          letter-spacing="0.3"
          font-weight="600">
          ${tspans}
        </text>
        
        <!-- Quote decoration -->
        <text x="930" y="${startY + contentHeight + 50}" 
          font-family="Georgia, serif" 
          font-size="80" 
          fill="#4ECDC4" 
          opacity="0.2" 
          font-weight="bold" 
          text-anchor="end">"</text>
        
        <!-- Bottom decorative elements -->
        <g transform="translate(540, ${startY + contentHeight + 120})">
          <circle cx="-30" cy="0" r="5" fill="#FF6B6B" />
          <circle cx="0" cy="0" r="5" fill="#FFE66D" />
          <circle cx="30" cy="0" r="5" fill="#4ECDC4" />
        </g>
        
        <!-- Floating stars around -->
        <text x="250" y="${startY - 80}" font-size="35" opacity="0.6">⭐</text>
        <text x="830" y="${startY - 70}" font-size="30" opacity="0.6">✨</text>
        <text x="200" y="${startY + contentHeight + 140}" font-size="32" opacity="0.6">💫</text>
        <text x="880" y="${startY + contentHeight + 150}" font-size="35" opacity="0.6">🌟</text>
      </svg>
    `;

    return new Response(svg, {
      headers: { ...corsHeaders, "Content-Type": "image/svg+xml" },
    });
  } catch (error: any) {
    console.error("generate-instagram-design error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
