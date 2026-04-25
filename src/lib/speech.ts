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

export const speak = async (opts: SpeakOptions): Promise<SpeechSynthesisUtterance> => {
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = await loadVoices();
  const preset = VOICE_PRESETS[opts.voice];
  const utter = new SpeechSynthesisUtterance(opts.text);
  utter.lang = LANG_TAG[opts.language];
  const v = pickVoice(voices, opts.language, preset);
  if (v) utter.voice = v;
  utter.pitch = preset.pitch;
  utter.rate = preset.rate;
  utter.volume = 1;
  if (opts.onStart) utter.onstart = opts.onStart;
  if (opts.onEnd) utter.onend = opts.onEnd;
  if (opts.onError) utter.onerror = opts.onError;
  synth.speak(utter);
  return utter;
};

export const cancelSpeech = () => window.speechSynthesis.cancel();

export const isSpeechSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

export { LANGUAGES, VOICES };