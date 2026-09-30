export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export interface TTSProvider {
  speak(text: string, options?: SpeechOptions): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  isAvailable(): boolean;
  isMuted(): boolean;
  setMuted(muted: boolean): void;
}

export type SpeechService = TTSProvider;

export class BrowserSpeechService implements TTSProvider {
  private muted: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(initialMuted: boolean = false) {
    this.muted = initialMuted;
  }

  public isAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.speechSynthesis?.speak === 'function'
    );
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stop();
    }
  }

  public stop(): void {
    if (this.currentUtterance) {
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
    }
    if (this.isAvailable()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore errors during cancel
      }
    }
    this.currentUtterance = null;
  }

  public pause(): void {
    if (this.isAvailable()) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // Ignore
      }
    }
  }

  public resume(): void {
    if (this.isAvailable() && !this.muted) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // Ignore
      }
    }
  }

  public async speak(text: string, options: SpeechOptions = {}): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) {
      options.onEnd?.();
      return;
    }

    if (this.muted || !this.isAvailable()) {
      options.onStart?.();
      options.onEnd?.();
      return;
    }

    return new Promise<void>((resolve) => {
      try {
        this.stop();

        // Resume if browser suspended speechSynthesis
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(trimmed);
        utterance.rate = options.rate ?? 0.95;
        utterance.pitch = options.pitch ?? 1.0;
        utterance.volume = options.volume ?? 1.0;
        utterance.lang = options.lang ?? 'en-US';

        // Select the most natural sounding English voice available
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const naturalVoice = voices.find(
            (v) =>
              (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel') || v.name.includes('Guy') || v.name.includes('Jenny') || v.name.includes('Aria'))) ||
              (v.lang.startsWith('en-US') && !v.name.includes('Zira') && !v.name.includes('David'))
          ) || voices.find((v) => v.lang.startsWith('en'));
          if (naturalVoice) {
            utterance.voice = naturalVoice;
          }
        }

        this.currentUtterance = utterance;

        let hasResolved = false;
        const finalize = () => {
          if (!hasResolved) {
            hasResolved = true;
            this.currentUtterance = null;
            options.onEnd?.();
            resolve();
          }
        };

        utterance.onstart = () => {
          options.onStart?.();
        };

        utterance.onend = () => {
          finalize();
        };

        utterance.onerror = (event) => {
          options.onError?.(event);
          finalize();
        };

        const timeoutMs = Math.max(4000, trimmed.length * 150);
        setTimeout(() => {
          finalize();
        }, timeoutMs);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        options.onError?.(err);
        options.onEnd?.();
        this.currentUtterance = null;
        resolve();
      }
    });
  }
}

export interface ElevenLabsVoice {
  id: string;
  name: string;
  description: string;
}

export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm & Professional' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Clear & Deep' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Dynamic & Warm' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Engaging & Expressive' },
];

export class ElevenLabsSpeechService implements TTSProvider {
  private browserFallback: BrowserSpeechService;
  private currentAudio: HTMLAudioElement | null = null;
  private muted: boolean = false;
  private voiceId: string = 'pNInz6obpgDQGcFmaJgB'; // Default Adam voice for Erwin
  private audioCache: Map<string, string> = new Map();

  constructor(voiceId?: string, initialMuted: boolean = false) {
    this.browserFallback = new BrowserSpeechService(initialMuted);
    this.muted = initialMuted;
    if (voiceId) {
      this.voiceId = voiceId;
    } else if (typeof window !== 'undefined') {
      const storedVoice = localStorage.getItem('qualution_elevenlabs_voice_id');
      if (storedVoice) this.voiceId = storedVoice.trim();
    }
  }

  public getVoiceId(): string {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qualution_elevenlabs_voice_id');
      if (stored) return stored.trim();
    }
    return this.voiceId;
  }

  public setVoiceId(id: string): void {
    this.voiceId = id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('qualution_elevenlabs_voice_id', id);
    }
  }

  public getApiKey(): string | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qualution_elevenlabs_api_key');
      if (stored && stored.trim()) return stored.trim();
      const winKey = (window as any).ELEVENLABS_API_KEY;
      if (winKey && String(winKey).trim()) return String(winKey).trim();
    }
    const envKey = (import.meta as any).env?.VITE_ELEVENLABS_API_KEY;
    return envKey ? envKey.trim() : null;
  }

  public setApiKey(key: string): void {
    if (typeof window !== 'undefined') {
      if (key && key.trim()) {
        localStorage.setItem('qualution_elevenlabs_api_key', key.trim());
      } else {
        localStorage.removeItem('qualution_elevenlabs_api_key');
      }
    }
  }

  public hasApiKey(): boolean {
    return Boolean(this.getApiKey());
  }

  public isAvailable(): boolean {
    return Boolean(this.getApiKey()) || this.browserFallback.isAvailable();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.browserFallback.setMuted(muted);
    if (muted) {
      this.stop();
    }
  }

  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.browserFallback.stop();
  }

  public pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
    } else {
      this.browserFallback.pause();
    }
  }

  public resume(): void {
    if (this.muted) return;
    if (this.currentAudio) {
      this.currentAudio.play().catch(() => {});
    } else {
      this.browserFallback.resume();
    }
  }

  public async speak(text: string, options: SpeechOptions = {}): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || this.muted) {
      options.onStart?.();
      options.onEnd?.();
      return;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      // Gracefully fall back to browser speech synthesis
      return this.browserFallback.speak(trimmed, options);
    }

    try {
      this.stop();
      options.onStart?.();

      const activeVoiceId = this.getVoiceId();
      const cacheKey = `${activeVoiceId}:${trimmed}`;
      let audioUrl = this.audioCache.get(cacheKey);

      if (!audioUrl) {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${activeVoiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: trimmed,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });

        if (!response.ok) {
          console.warn(`[ElevenLabs] API returned status ${response.status}. Falling back to browser speech synthesis.`);
          return this.browserFallback.speak(trimmed, options);
        }

        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        this.audioCache.set(cacheKey, audioUrl);
      }

      const audio = new Audio(audioUrl);
      if (options.rate && options.rate !== 1.0) {
        audio.playbackRate = options.rate;
      }
      this.currentAudio = audio;

      return new Promise<void>((resolve) => {
        let finished = false;
        const finalize = () => {
          if (!finished) {
            finished = true;
            this.currentAudio = null;
            options.onEnd?.();
            resolve();
          }
        };

        audio.onended = finalize;
        audio.onerror = (e) => {
          console.warn('[ElevenLabs] Audio playback error:', e);
          finalize();
        };

        audio.play().catch((err) => {
          console.warn('[ElevenLabs] Play prevented or failed:', err);
          finalize();
        });
      });
    } catch (err) {
      console.warn('[ElevenLabs] Fetch failed, falling back to browser speech:', err);
      return this.browserFallback.speak(trimmed, options);
    }
  }
}

export const defaultSpeechService = new ElevenLabsSpeechService();
