export const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧", sample: "The cosmos hums with infinite voices." },
  { code: "es", name: "Spanish", flag: "🇪🇸", sample: "El cosmos zumba con voces infinitas." },
  { code: "fr", name: "French", flag: "🇫🇷", sample: "Le cosmos vibre de voix infinies." },
  { code: "de", name: "German", flag: "🇩🇪", sample: "Der Kosmos summt mit unendlichen Stimmen." },
  { code: "it", name: "Italian", flag: "🇮🇹", sample: "Il cosmo vibra di voci infinite." },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", sample: "O cosmos vibra com vozes infinitas." },
  { code: "ja", name: "Japanese", flag: "🇯🇵", sample: "宇宙は無限の声で響いている。" },
  { code: "ko", name: "Korean", flag: "🇰🇷", sample: "우주는 무한한 목소리로 울려퍼진다." },
  { code: "zh", name: "Chinese", flag: "🇨🇳", sample: "宇宙以无尽的声音回响。" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", sample: "ब्रह्मांड अनंत स्वरों से गूँजता है।" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", sample: "الكون يضج بأصوات لا نهائية." },
  { code: "ru", name: "Russian", flag: "🇷🇺", sample: "Космос звучит бесконечными голосами." },
] as const;

export const VOICES = [
  { id: "Aurora", desc: "Bright, ethereal", color: "primary" },
  { id: "Nova", desc: "Warm, expressive", color: "pink" },
  { id: "Orion", desc: "Deep, grounded", color: "cyan" },
  { id: "Lyra", desc: "Soft, intimate", color: "primary" },
  { id: "Vega", desc: "Crisp, narrator", color: "cyan" },
  { id: "Cassio", desc: "Playful, animated", color: "pink" },
] as const;

export type LanguageCode = typeof LANGUAGES[number]["code"];
export type VoiceId = typeof VOICES[number]["id"];
