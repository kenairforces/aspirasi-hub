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

    // Stunning modern Instagram design
    const svg = `
      <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Enhanced gradients -->
          <linearGradient id="mainBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#667eea" />
            <stop offset="50%" stop-color="#764ba2" />
            <stop offset="100%" stop-color="#f093fb" />
          </linearGradient>
          
          <linearGradient id="overlay1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#fa709a" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#fee140" stop-opacity="0.3" />
          </linearGradient>
          
          <linearGradient id="overlay2" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stop-color="#30cfd0" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#330867" stop-opacity="0.25" />
          </linearGradient>
          
          <radialGradient id="glow1" cx="30%" cy="30%">
            <stop offset="0%" stop-color="#fff" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#fff" stop-opacity="0" />
          </radialGradient>
          
          <radialGradient id="glow2" cx="70%" cy="70%">
            <stop offset="0%" stop-color="#fff" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#fff" stop-opacity="0" />
          </radialGradient>
          
          <filter id="textGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="softShadow">
            <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.4"/>
          </filter>
          
          <!-- Patterns -->
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill="#fff" opacity="0.15"/>
          </pattern>
        </defs>

        <!-- Layered background -->
        <rect width="1080" height="1080" fill="url(#mainBg)" />
        <rect width="1080" height="1080" fill="url(#overlay1)" />
        <rect width="1080" height="1080" fill="url(#overlay2)" />
        <rect width="1080" height="1080" fill="url(#dots)" />
        
        <!-- Glowing orbs -->
        <circle cx="300" cy="250" r="350" fill="url(#glow1)" />
        <circle cx="780" cy="830" r="400" fill="url(#glow2)" />
        
        <!-- Decorative shapes -->
        <g opacity="0.08">
          <circle cx="150" cy="150" r="80" fill="#fff" />
          <circle cx="930" cy="180" r="100" fill="#fff" />
          <circle cx="120" cy="900" r="90" fill="#fff" />
          <circle cx="950" cy="920" r="110" fill="#fff" />
        </g>
        
        <!-- Floating particles -->
        <g opacity="0.4">
          <circle cx="200" cy="400" r="3" fill="#fff" />
          <circle cx="850" cy="350" r="4" fill="#fff" />
          <circle cx="300" cy="700" r="3.5" fill="#fff" />
          <circle cx="780" cy="650" r="3" fill="#fff" />
          <circle cx="450" cy="200" r="2.5" fill="#fff" />
          <circle cx="650" cy="880" r="3.5" fill="#fff" />
          <circle cx="180" cy="550" r="2" fill="#fff" />
          <circle cx="920" cy="500" r="3" fill="#fff" />
        </g>
        
        <!-- Content container with glass effect -->
        <rect x="80" y="${startY - lineHeight - 60}" width="920" height="${contentHeight + 120}" 
          rx="35" 
          fill="rgba(255, 255, 255, 0.08)" 
          stroke="rgba(255, 255, 255, 0.2)" 
          stroke-width="1.5"
          filter="url(#softShadow)" />
        
        <!-- Accent bars -->
        <rect x="80" y="${startY - lineHeight - 60}" width="920" height="6" rx="35" 
          fill="rgba(255, 255, 255, 0.4)" />
        <rect x="80" y="${startY + contentHeight + 54}" width="920" height="6" rx="35" 
          fill="rgba(255, 255, 255, 0.4)" />
        
        <!-- Quote decorations with glow -->
        <text x="130" y="${startY - 20}" 
          font-family="Georgia, serif" 
          font-size="140" 
          fill="#fff" 
          opacity="0.25" 
          font-weight="bold"
          filter="url(#textGlow)">"</text>
        <text x="950" y="${startY + contentHeight + 40}" 
          font-family="Georgia, serif" 
          font-size="140" 
          fill="#fff" 
          opacity="0.25" 
          font-weight="bold" 
          text-anchor="end"
          filter="url(#textGlow)">"</text>
        
        <!-- Main aspiration text -->
        <text x="540" y="${startY}" 
          text-anchor="middle" 
          font-family="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
          font-size="${fontSize}" 
          fill="#ffffff" 
          letter-spacing="0.3"
          filter="url(#textGlow)"
          font-weight="600"
          style="text-shadow: 0 2px 12px rgba(0,0,0,0.3);">
          ${tspans}
        </text>
        
        <!-- Bottom accent line -->
        <rect x="440" y="${startY + contentHeight + 80}" width="200" height="3" rx="1.5" 
          fill="rgba(255, 255, 255, 0.5)" />
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
