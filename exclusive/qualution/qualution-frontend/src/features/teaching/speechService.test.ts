import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserSpeechService } from './speechService';

describe('SpeechService (TTS Abstraction)', () => {
  let originalSpeechSynthesis: typeof window.speechSynthesis;

  beforeEach(() => {
    originalSpeechSynthesis = window.speechSynthesis;
  });

  afterEach(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: originalSpeechSynthesis,
      configurable: true,
      writable: true,
    });
  });

  it('gracefully handles missing speechSynthesis without throwing or blocking', async () => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const service = new BrowserSpeechService();
    expect(service.isAvailable()).toBe(false);

    let ended = false;
    await service.speak('Welcome to quantum computing', {
      onEnd: () => {
        ended = true;
      },
    });

    expect(ended).toBe(true);
  });

  it('mutes and unmutes audio cleanly', async () => {
    const service = new BrowserSpeechService(true);
    expect(service.isMuted()).toBe(true);

    let ended = false;
    await service.speak('This should be muted', {
      onEnd: () => {
        ended = true;
      },
    });
    expect(ended).toBe(true);

    service.setMuted(false);
    expect(service.isMuted()).toBe(false);
  });

  it('handles simulated speechSynthesis errors without rejecting promise or crashing', async () => {
    const mockSpeak = vi.fn((utterance: SpeechSynthesisUtterance) => {
      // Simulate asynchronous error event from browser TTS engine
      setTimeout(() => {
        utterance.onerror?.(new Event('error') as any);
      }, 5);
    });

    const mockCancel = vi.fn();

    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        pause: vi.fn(),
        resume: vi.fn(),
      },
      configurable: true,
      writable: true,
    });

    const service = new BrowserSpeechService();
    expect(service.isAvailable()).toBe(true);

    let errorHandled = false;
    let ended = false;

    await expect(
      service.speak('Superposition test', {
        onError: () => {
          errorHandled = true;
        },
        onEnd: () => {
          ended = true;
        },
      })
    ).resolves.toBeUndefined();

    expect(errorHandled).toBe(true);
    expect(ended).toBe(true);
  });

  describe('ElevenLabsSpeechService', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('stores and retrieves custom API keys and voice selections in localStorage', async () => {
      const { ElevenLabsSpeechService, ELEVENLABS_VOICES } = await import('./speechService');
      const service = new ElevenLabsSpeechService();

      expect(service.getApiKey()).toBeNull();
      service.setApiKey('test-xi-api-key');
      expect(service.getApiKey()).toBe('test-xi-api-key');
      expect(localStorage.getItem('qualution_elevenlabs_api_key')).toBe('test-xi-api-key');

      const adamVoice = ELEVENLABS_VOICES.find((v) => v.name === 'Adam')!;
      service.setVoiceId(adamVoice.id);
      expect(service.getVoiceId()).toBe(adamVoice.id);
      expect(localStorage.getItem('qualution_elevenlabs_voice_id')).toBe(adamVoice.id);
    });

    it('falls back to browser speech synthesis when no ElevenLabs API key is configured', async () => {
      const { ElevenLabsSpeechService } = await import('./speechService');
      const service = new ElevenLabsSpeechService();

      let ended = false;
      await service.speak('Testing fallback without key', {
        onEnd: () => {
          ended = true;
        },
      });
      expect(ended).toBe(true);
    });
  });
});
