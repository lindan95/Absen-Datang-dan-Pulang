// Audio and Speech Synthesis utilities for Terminal Absensi

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playBeep(freq = 880, type: OscillatorType = 'sine', duration = 0.08) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.start(now);
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    osc.stop(now + duration);
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

export function playSuccessBeep() {
  playBeep(1046.5, 'sine', 0.12);
}

export function playLateBeep() {
  playBeep(440, 'sawtooth', 0.22);
}

export function playWarningBeep() {
  playBeep(300, 'sawtooth', 0.18);
}

export function playErrorBeep() {
  playBeep(200, 'square', 0.3);
}

export function sanitizeNameForSpeech(name: string): string {
  if (!name) return '';
  return name
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function speakText(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }
}
