// Pager alert tone — synthesised with the Web Audio API so we don't need to
// ship any audio file. Works identically in mobile browsers and inside the
// Capacitor Android WebView.
//
// Pattern: classic two-tone "pager" beep — alternating 1000 Hz / 1400 Hz
// square-ish tones, 250 ms on / 80 ms off, total duration 5 seconds.

let ctx = null;
let unlocked = false;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/**
 * Browsers / WebViews block audio playback until the user interacts with the
 * page at least once. Call this from any user-initiated handler (e.g. the
 * Login button) so the AudioContext is allowed to make sound later when an
 * alert is received.
 */
export async function unlockAudio() {
  if (unlocked) return;
  const c = getCtx();
  if (!c) return;
  try {
    if (c.state === "suspended") await c.resume();
    // Play a 1-sample silent buffer to fully unlock on iOS-style policies.
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
    unlocked = true;
  } catch (_) {}
}

/**
 * Play the pager alert tone. Total duration: 5 s.
 * Volume tapers slightly at the end so it doesn't click.
 */
export async function playPagerAlert(durationSec = 5) {
  const c = getCtx();
  if (!c) return;
  try {
    if (c.state === "suspended") await c.resume();
  } catch (_) {}

  const start = c.currentTime + 0.02;
  const beepLen = 0.25;   // each beep
  const gap = 0.08;       // silence between beeps
  const cycle = beepLen + gap;
  const totalCycles = Math.floor(durationSec / cycle);

  // master gain w/ small fade-in & fade-out to avoid pops
  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, start);
  master.gain.exponentialRampToValueAtTime(0.55, start + 0.05);
  master.gain.setValueAtTime(0.55, start + durationSec - 0.15);
  master.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);
  master.connect(c.destination);

  for (let i = 0; i < totalCycles; i++) {
    const t = start + i * cycle;
    const freq = i % 2 === 0 ? 1000 : 1400; // alternating two-tone pager
    const osc = c.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, t);

    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(1.0, t + 0.01);
    env.gain.setValueAtTime(1.0, t + beepLen - 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, t + beepLen);

    osc.connect(env);
    env.connect(master);
    osc.start(t);
    osc.stop(t + beepLen + 0.01);
  }
}

/** Vibration burst for Android (silent on browsers without vibrate API). */
export function vibrateAlert() {
  try {
    if (navigator.vibrate) navigator.vibrate([300, 120, 300, 120, 300, 120, 600]);
  } catch (_) {}
}
