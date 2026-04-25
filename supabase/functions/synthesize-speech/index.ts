import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text, language, voice } = await req.json();
    if (!text || typeof text !== "string" || text.length > 4000) {
      return new Response(JSON.stringify({ error: "Invalid text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const langName = language || "English";
    const voiceName = voice || "Aurora";

    // Use Gemini TTS-capable model
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        modalities: ["audio"],
        audio: { voice: voiceName, format: "mp3" },
        messages: [
          {
            role: "system",
            content: `You are a multilingual voice. Read the user's text aloud naturally in ${langName}. Do not add commentary.`,
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("AI gateway error", resp.status, errText);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Workspace credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Voice synthesis failed", detail: errText }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    // Audio is returned in the message; check common shapes
    const msg = data?.choices?.[0]?.message;
    const audioB64: string | undefined =
      msg?.audio?.data ||
      (Array.isArray(msg?.content)
        ? msg.content.find((c: any) => c?.type === "audio" || c?.type === "output_audio")?.audio?.data ||
          msg.content.find((c: any) => c?.type === "audio" || c?.type === "output_audio")?.data
        : undefined);

    if (!audioB64) {
      console.error("No audio payload", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "Model returned no audio" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ audio: audioB64, mime: "audio/mpeg" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("synthesize-speech error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});