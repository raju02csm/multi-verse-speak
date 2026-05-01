import { LANGUAGES, type LanguageCode, type VoiceId, VOICES } from "./languages";

/** Map our app language codes to BCP-47 tags Web Speech expects. */
export const LANG_TAG: Record<LanguageCode, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  hi: "hi-IN",
  ar: "ar-SA",
  ru: "ru-RU",
};

/** Cosmic voice presets — map to pitch/rate variations on top of any system voice. */
export const VOICE_PRESETS: Record<VoiceId, { pitch: number; rate: number; preferFemale?: boolean }> = {
  Aurora: { pitch: 1.15, rate: 1.0, preferFemale: true },
  Nova:   { pitch: 1.05, rate: 0.95, preferFemale: true },
  Orion:  { pitch: 0.7, rate: 0.95 },
  Lyra:   { pitch: 1.25, rate: 0.9, preferFemale: true },
  Vega:   { pitch: 1.0, rate: 1.05 },
  Cassio: { pitch: 0.9, rate: 1.15 },
};

let voicesCache: SpeechSynthesisVoice[] = [];

export const loadVoices = (): Promise<SpeechSynthesisVoice[]> =>
  new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length) {
      voicesCache = existing;
      return resolve(existing);
    }
    const onChange = () => {
      voicesCache = synth.getVoices();
      synth.removeEventListener("voiceschanged", onChange);
      resolve(voicesCache);
    };
    synth.addEventListener("voiceschanged", onChange);
    // Safari fallback
    setTimeout(() => {
      if (!voicesCache.length) {
        voicesCache = synth.getVoices();
        resolve(voicesCache);
      }
    }, 600);
  });

export const pickVoice = (
  voices: SpeechSynthesisVoice[],
  langCode: LanguageCode,
  preset: { preferFemale?: boolean }
): SpeechSynthesisVoice | undefined => {
  const tag = LANG_TAG[langCode];
  const lang2 = tag.split("-")[0];
  const matches = voices.filter((v) => v.lang.toLowerCase().startsWith(lang2));
  if (!matches.length) return voices[0];
  if (preset.preferFemale) {
    const female = matches.find((v) => /female|samantha|victoria|karen|fiona|tessa|moira|amelie|amélie|google.*female/i.test(v.name));
    if (female) return female;
  }
  // Prefer exact tag, then Google/Microsoft natural voices
  const exact = matches.find((v) => v.lang.toLowerCase() === tag.toLowerCase());
  return exact ?? matches.find((v) => /google|microsoft|natural|neural/i.test(v.name)) ?? matches[0];
};

export interface SpeakOptions {
  text: string;
  language: LanguageCode;
  voice: VoiceId;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: SpeechSynthesisErrorEvent) => void;
}

/** Split long text into sentence-ish chunks (browsers fail/cut off >~200 chars). */
const chunkText = (text: string, maxLen = 180): string[] => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];
  const parts: string[] = [];
  // Split on sentence boundaries first, then on commas, then hard-wrap.
  const sentences = clean.match(/[^.!?。！？]+[.!?。！？]+|\S[^.!?。！？]*$/g) ?? [clean];
  for (const s of sentences) {
    const t = s.trim();
    if (t.length <= maxLen) { parts.push(t); continue; }
    const sub = t.split(/,\s+/);
    let buf = "";
    for (const piece of sub) {
      const next = buf ? `${buf}, ${piece}` : piece;
      if (next.length > maxLen) {
        if (buf) parts.push(buf);
        if (piece.length > maxLen) {
          // Hard wrap on spaces
          const words = piece.split(" ");
          let cur = "";
          for (const w of words) {
            if ((cur + " " + w).trim().length > maxLen) {
              if (cur) parts.push(cur.trim());
              cur = w;
            } else {
              cur = cur ? cur + " " + w : w;
            }
          }
          if (cur) parts.push(cur.trim());
          buf = "";
        } else {
          buf = piece;
        }
      } else {
        buf = next;
      }
    }
    if (buf) parts.push(buf);
  }
  return parts.filter(Boolean);
};

let cancelled = false;
let activeUtter: SpeechSynthesisUtterance | null = null;

// Progress tracking: which character of the ORIGINAL input text is currently being spoken.
let currentOriginalText = "";
let currentChunkOffset = 0; // start index of current chunk inside original text
let currentCharInChunk = 0; // boundary index within current chunk

export const getSpeechProgress = (): { text: string; charIndex: number } => ({
  text: currentOriginalText,
  charIndex: currentChunkOffset + currentCharInChunk,
});

const waitForCancel = () =>
  new Promise<void>((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth.speaking && !synth.pending) return resolve();
    let tries = 0;
    const tick = () => {
      tries++;
      if (!synth.speaking && !synth.pending) return resolve();
      if (tries > 20) return resolve();
      setTimeout(tick, 50);
    };
    tick();
  });

export const speak = async (opts: SpeakOptions): Promise<void> => {
  const synth = window.speechSynthesis;
  cancelled = true;
  synth.cancel();
  await waitForCancel();
  cancelled = false;

  const voices = await loadVoices();
  const preset = VOICE_PRESETS[opts.voice];
  const v = pickVoice(voices, opts.language, preset);
  const chunks = chunkText(opts.text);
  if (!chunks.length) return;

  let started = false;
  currentOriginalText = opts.text;
  currentChunkOffset = 0;
  currentCharInChunk = 0;
  let cursor = 0;

  for (let i = 0; i < chunks.length; i++) {
    if (cancelled) return;
    const chunk = chunks[i];
    // Find this chunk in the original text starting from cursor
    const idx = opts.text.indexOf(chunk, cursor);
    currentChunkOffset = idx >= 0 ? idx : cursor;
    cursor = currentChunkOffset + chunk.length;
    currentCharInChunk = 0;
    await new Promise<void>((resolve) => {
      const utter = new SpeechSynthesisUtterance(chunk);
      utter.lang = LANG_TAG[opts.language];
      if (v) utter.voice = v;
      utter.pitch = preset.pitch;
      utter.rate = preset.rate;
      utter.volume = 1;
      activeUtter = utter;

      utter.onstart = () => {
        if (!started && opts.onStart) {
          started = true;
          opts.onStart();
        }
      };
      utter.onboundary = (e) => {
        if (typeof e.charIndex === "number") currentCharInChunk = e.charIndex;
      };
      utter.onend = () => {
        activeUtter = null;
        resolve();
      };
      utter.onerror = (e) => {
        activeUtter = null;
        // 'interrupted' and 'canceled' are normal when user stops playback.
        if (e.error === "interrupted" || e.error === "canceled") {
          cancelled = true;
          return resolve();
        }
        if (opts.onError) opts.onError(e);
        cancelled = true;
        resolve();
      };

      try {
        synth.speak(utter);
      } catch {
        resolve();
      }
    });
  }

  if (opts.onEnd) opts.onEnd();
};

export const cancelSpeech = () => {
  cancelled = true;
  activeUtter = null;
  try { window.speechSynthesis.cancel(); } catch { /* noop */ }
};

export const isSpeechSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

export { LANGUAGES, VOICES };