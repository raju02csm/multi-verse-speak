import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Play, Pause, Loader2, Sparkles, Trash2, History, Volume2, FileUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LANGUAGES, VOICES } from "@/lib/languages";
import { speak, cancelSpeech, isSpeechSupported, getSpeechProgress } from "@/lib/speech";
import { extractTextFromFile, ACCEPT_ATTRIBUTE } from "@/lib/extractText";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Starfield } from "@/components/Starfield";
import { CosmicOrb } from "@/components/CosmicOrb";
import { toast } from "sonner";

interface Generation {
  id: string;
  text: string;
  language: string;
  voice: string;
  created_at: string;
}

const Studio = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [language, setLanguage] = useState<typeof LANGUAGES[number]["code"]>("en");
  const [voice, setVoice] = useState<typeof VOICES[number]["id"]>("Aurora");
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);
  const [username, setUsername] = useState<string>("");
  const [supported] = useState(() => isSpeechSupported());
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playingRef = useRef(false);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  const langName = useMemo(
    () => LANGUAGES.find((l) => l.code === language)?.name ?? "English",
    [language]
  );

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setUsername(data?.username ?? user.email ?? ""));
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    return () => cancelSpeech();
  }, []);

  const loadHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("generations")
      .select("id, text, language, voice, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return;
    setHistory(data ?? []);
  };

  const handleSpeak = async () => {
    if (!text.trim()) {
      toast.error("Write something to give voice to.");
      return;
    }
    if (!user) return;
    if (!supported) {
      toast.error("Voice synthesis isn't supported in this browser.");
      return;
    }

    await speak({
      text,
      language,
      voice,
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
      onError: () => {
        setPlaying(false);
        toast.error("Playback error.");
      },
    });

    // Save to history (text only — re-synthesizes on demand)
    const { error: insErr } = await supabase.from("generations").insert({
      user_id: user.id,
      text,
      language: langName,
      voice,
    });
    if (insErr) console.error(insErr);
    else loadHistory();
  };

  // Live-switch voice/language while speaking: restart from current position.
  const switchVoice = async (newVoice: typeof VOICES[number]["id"]) => {
    setVoice(newVoice);
    if (!playingRef.current) return;
    const { text: original, charIndex } = getSpeechProgress();
    const source = original || text;
    // Back up to the start of the current word so we don't cut mid-word.
    let start = Math.max(0, Math.min(charIndex, source.length));
    while (start > 0 && !/\s/.test(source[start - 1])) start--;
    const remaining = source.slice(start);
    if (!remaining) return;
    cancelSpeech();
    await speak({
      text: remaining,
      language,
      voice: newVoice,
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  };

  const switchLanguage = async (newLang: typeof LANGUAGES[number]["code"]) => {
    setLanguage(newLang);
    if (!playingRef.current) return;
    const { text: original, charIndex } = getSpeechProgress();
    const source = original || text;
    let start = Math.max(0, Math.min(charIndex, source.length));
    while (start > 0 && !/\s/.test(source[start - 1])) start--;
    const remaining = source.slice(start);
    if (!remaining) return;
    cancelSpeech();
    await speak({
      text: remaining,
      language: newLang,
      voice,
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  };

  const togglePlay = async () => {
    if (playing) {
      cancelSpeech();
      setPlaying(false);
    } else {
      await handleSpeak();
    }
  };

  const playHistory = async (g: Generation) => {
    setText(g.text);
    const lang = (LANGUAGES.find((l) => l.name === g.language)?.code ?? "en") as typeof LANGUAGES[number]["code"];
    const v = (VOICES.find((vv) => vv.id === g.voice)?.id ?? "Aurora") as typeof VOICES[number]["id"];
    setLanguage(lang);
    setVoice(v);
    await speak({
      text: g.text,
      language: lang,
      voice: v,
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  };

  const deleteHistory = async (id: string) => {
    const { error } = await supabase.from("generations").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete.");
      return;
    }
    setHistory((h) => h.filter((g) => g.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }
    setExtracting(true);
    try {
      const extracted = await extractTextFromFile(file);
      if (!extracted) {
        toast.error("No text found in this file.");
        return;
      }
      setText(extracted);
      toast.success(`Loaded ${file.name}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Couldn't read file.");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Starfield />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-cosmic glow-primary" />
          <span className="font-display text-2xl">Echoverse</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            <span className="font-mono text-xs uppercase tracking-widest text-primary-glow">·</span> {username}
          </span>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-4">
        <div className="mb-10 animate-fade-up">
          <p className="font-mono text-xs uppercase tracking-widest text-primary-glow">Studio</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">Compose your <span className="text-gradient italic">echo</span></h1>
          {!supported && (
            <p className="mt-3 text-sm text-destructive">Your browser doesn't support speech synthesis. Try Chrome, Edge, or Safari.</p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Composer */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              {/* Language */}
              <div className="mb-5">
                <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Language</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => switchLanguage(l.code)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                        language === l.code
                          ? "border-primary bg-primary/15 text-foreground glow-primary"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <span>{l.flag}</span> {l.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice */}
              <div className="mb-5">
                <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Voice</label>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => switchVoice(v.id)}
                      className={`group rounded-xl border p-3 text-left transition ${
                        voice === v.id
                          ? "border-primary bg-primary/10 glow-primary"
                          : "border-border/60 bg-muted/20 hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            v.color === "cyan" ? "bg-cyan glow-cyan" : v.color === "pink" ? "bg-pink glow-pink" : "bg-primary glow-primary"
                          }`}
                        />
                        <span className="font-display text-lg">{v.id}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Your text</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={extracting}
                      className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary-glow transition hover:text-primary disabled:opacity-50"
                    >
                      {extracting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileUp className="h-3 w-3" />
                      )}
                      {extracting ? "Reading…" : "Upload PDF/DOC"}
                    </button>
                    <span className="font-mono text-xs text-muted-foreground">{text.length} chars</span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_ATTRIBUTE}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={LANGUAGES.find((l) => l.code === language)?.sample}
                  rows={6}
                  className="resize-none bg-background/40 border-border/60 text-base"
                />
              </div>

              <Button
                onClick={togglePlay}
                disabled={!supported || !text.trim()}
                className="mt-6 w-full bg-cosmic text-primary-foreground hover:opacity-90 glow-primary"
                size="lg"
              >
                {playing ? (
                  <><Pause className="mr-2 h-4 w-4" /> Stop</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Speak Now</>
                )}
              </Button>
            </div>

            {/* Now-speaking visualizer */}
            {(playing || text.trim()) && (
              <div className="glass rounded-2xl p-6 animate-fade-in">
                <div className="flex items-center gap-5">
                  <CosmicOrb size={88} speaking={playing} />
                  <div className="flex-1">
                    <p className="font-mono text-xs uppercase tracking-widest text-primary-glow flex items-center gap-2">
                      <Volume2 className="h-3 w-3" /> {voice} · {langName}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{text}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={togglePlay} size="icon" disabled={!supported || !text.trim()} className="bg-cosmic text-primary-foreground glow-primary">
                      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History */}
          <aside className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary-glow" />
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Recent echoes</h2>
            </div>
            <div className="space-y-2">
              {history.length === 0 && (
                <div className="glass rounded-xl p-4 text-sm text-muted-foreground">
                  Your generated voices will appear here.
                </div>
              )}
              {history.map((g) => (
                <div key={g.id} className="glass group rounded-xl p-4 transition hover:border-primary/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 cursor-pointer" onClick={() => playHistory(g)}>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-primary-glow">
                        {g.voice} · {g.language}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-foreground/90">{g.text}</p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {new Date(g.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-60 group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => playHistory(g)}>
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteHistory(g.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Studio;