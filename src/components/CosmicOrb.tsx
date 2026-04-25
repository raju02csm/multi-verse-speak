import { cn } from "@/lib/utils";

interface CosmicOrbProps {
  className?: string;
  size?: number;
  speaking?: boolean;
}

/** Animated gradient orb — Echoverse hero element. */
export const CosmicOrb = ({ className, size = 320, speaking = false }: CosmicOrbProps) => {
  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div className="absolute inset-0 rounded-full bg-cosmic blur-3xl opacity-60 animate-pulse-orb" />
      <div className="absolute inset-4 rounded-full bg-cosmic glow-primary animate-pulse-orb" />
      <div className="absolute inset-10 rounded-full glass" />
      <div className="absolute inset-0 rounded-full border border-primary/30 animate-spin-slow" />
      <div
        className="absolute inset-6 rounded-full border border-cyan/20 animate-spin-slow"
        style={{ animationDirection: "reverse", animationDuration: "20s" }}
      />
      {speaking && (
        <div className="absolute inset-0 flex items-center justify-center gap-1">
          {[0.1, 0.3, 0.5, 0.7, 0.9, 0.7, 0.5, 0.3, 0.1].map((d, i) => (
            <span
              key={i}
              className="audio-bar w-1 h-12 bg-primary-foreground rounded-full"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
