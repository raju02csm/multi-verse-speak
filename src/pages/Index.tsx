import { Link } from "react-router-dom";
import { ArrowRight, Globe2, Mic2, Sparkles, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Starfield } from "@/components/Starfield";
import { CosmicOrb } from "@/components/CosmicOrb";
import { LANGUAGES } from "@/lib/languages";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Starfield />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-cosmic glow-primary" />
          <span className="font-display text-2xl">Echoverse</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#voices" className="hover:text-foreground transition">Voices</a>
          <a href="#languages" className="hover:text-foreground transition">Languages</a>
          <a href="#how" className="hover:text-foreground transition">How it works</a>
        </nav>
        <Button asChild variant="default" className="bg-cosmic text-primary-foreground hover:opacity-90 glow-primary">
          <Link to={user ? "/studio" : "/auth"}>{user ? "Open Studio" : "Sign in"}</Link>
        </Button>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col justify-center animate-fade-up">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-primary-glow">
            <Sparkles className="h-3.5 w-3.5" /> Multilingual AI Voice Studio
          </div>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            Give your words a <span className="text-gradient italic">voice</span> in any tongue of the universe.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Echoverse turns text into expressive, natural speech across 12+ languages. Pick a voice, choose a tongue, and listen as your message echoes through the cosmos.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-cosmic text-primary-foreground hover:opacity-90 glow-primary">
              <Link to={user ? "/studio" : "/auth"}>
                Enter the Studio <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="glass border-primary/30 hover:bg-primary/10">
              <a href="#languages">Explore Languages</a>
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5 text-cyan" /> 12 languages</span>
            <span className="flex items-center gap-2"><Mic2 className="h-3.5 w-3.5 text-pink" /> 6 voices</span>
            <span className="flex items-center gap-2"><Waves className="h-3.5 w-3.5 text-primary-glow" /> Studio quality</span>
          </div>
        </div>

        <div className="flex items-center justify-center animate-fade-in">
          <CosmicOrb size={420} />
        </div>
      </section>

      {/* Languages strip */}
      <section id="languages" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary-glow">A universe of tongues</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">Speak twelve languages,<br/>one voice at a time.</h2>
          </div>
          <p className="max-w-md text-muted-foreground">From whispered Japanese to bold Spanish — every utterance preserves the rhythm and music of its native tongue.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANGUAGES.map((l, i) => (
            <div
              key={l.code}
              className="group glass rounded-2xl p-5 transition hover:border-primary/60 hover:bg-primary/5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{l.flag}</span>
                  <span className="font-display text-xl">{l.name}</span>
                </div>
                <span className="font-mono text-xs uppercase text-muted-foreground">{l.code}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground/90 italic">"{l.sample}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-primary-glow">How it works</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl sm:text-5xl">Three steps to a voice that travels.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Write your text", d: "Up to 4,000 characters in any language. Poetry, narration, dialogue — all welcome." },
            { n: "02", t: "Pick voice & tongue", d: "Choose from six expressive voices and a dozen languages. Mix and match freely." },
            { n: "03", t: "Listen & save", d: "Generate in seconds. Replay, download, or revisit from your personal history." },
          ].map((s) => (
            <div key={s.n} className="glass rounded-2xl p-8">
              <div className="font-mono text-sm text-primary-glow">{s.n}</div>
              <h3 className="mt-4 font-display text-2xl">{s.t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
        <CosmicOrb size={140} className="mx-auto mb-8" />
        <h2 className="font-display text-4xl sm:text-6xl">Your message, <span className="text-gradient italic">heard</span> everywhere.</h2>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">Sign in and start generating multilingual voiceovers in less than a minute.</p>
        <Button asChild size="lg" className="mt-10 bg-cosmic text-primary-foreground hover:opacity-90 glow-primary">
          <Link to={user ? "/studio" : "/auth"}>
            {user ? "Open the Studio" : "Begin your Echoverse"} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      <footer className="relative z-10 border-t border-border/50 py-8 text-center text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Echoverse · Built on Lovable Cloud
      </footer>
    </div>
  );
};

export default Index;
