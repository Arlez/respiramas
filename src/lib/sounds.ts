let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq: number, duration = 400) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.linearRampToValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.linearRampToValueAtTime(0.001, now + duration / 1000);

    osc.start(now);
    osc.stop(now + duration / 1000 + 0.02);
  } catch (err) {
    // silencioso en caso de error
    // console.warn('No se pudo reproducir sonido', err);
  }
}

export function ensureAudioUnlocked() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch (e) {
    // ignore
  }
}

export function playStartSound() {
  // sonido distinto para iniciar ejercicio
  playTone(880, 300);
  setTimeout(() => playTone(1320, 180), 160);
}

export function playRestSound() {
  // sonido distinto para iniciar descanso
  playTone(440, 350);
  setTimeout(() => playTone(330, 220), 200);
}

export default {
  ensureAudioUnlocked,
  playStartSound,
  playRestSound,
};
