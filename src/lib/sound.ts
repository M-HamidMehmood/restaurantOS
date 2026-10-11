/**
 * Web Audio API synthesizer for restaurant operations alerts.
 * Generates crystal-clear audio notifications with zero external asset dependencies.
 * Includes a 3-minute continuous repeating alert loop for high-urgency kitchen & floor orders.
 */

let isMuted = false;
let sharedAudioCtx: AudioContext | null = null;

export function setSoundMuted(muted: boolean) {
  isMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_sound_muted', muted ? 'true' : 'false');
  }
  if (muted) {
    stopContinuousAlert();
  }
}

export function getSoundMuted(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('admin_sound_muted');
    if (saved !== null) {
      isMuted = saved === 'true';
    }
  }
  return isMuted;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Generates a pleasant ascending chime when a new live order arrives.
 * Chord arpeggio: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
 */
export function playSingleOrderChime() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      // Smooth attack and exponential decay for pleasant bell tone
      gain.gain.setValueAtTime(0, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.24, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.4);
    });
  } catch (err) {
    console.warn('Could not play order chime:', err);
  }
}

/**
 * Generates an attention-grabbing dual-bell chime when a table calls for waiter assistance.
 * Two distinct high frequency pings (880Hz and 1318Hz)
 */
export function playSingleWaiterAlert() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Ping 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12);
    gain1.gain.setValueAtTime(0.32, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.52);

    // Ping 2 (Higher urgency)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.18);
    gain2.gain.setValueAtTime(0.3, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.72);
  } catch (err) {
    console.warn('Could not play waiter alert:', err);
  }
}

/**
 * Generates a clean single ding when dishes are marked ready for pass.
 */
export function playReadyChime() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5 note
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.62);
  } catch (err) {
    console.warn('Could not play ready chime:', err);
  }
}

/**
 * Generates a satisfying cashier checkout / settlement chime (harmonic register bell).
 */
export function playSettlementChime() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [659.25, 987.77, 1661.22];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.24, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.46);
    });
  } catch (err) {
    console.warn('Could not play settlement chime:', err);
  }
}

// =========================================================================
// Continuous Repeating Alert Engine (Rings for 3 minutes without stopping)
// =========================================================================

export const MAX_ALERT_DURATION_MS = 3 * 60 * 1000; // 3 minutes = 180 seconds
const REPEAT_CADENCE_MS = 2500; // Plays every 2.5 seconds

let alertIntervalTimer: ReturnType<typeof setInterval> | null = null;
let alertCountdownTimer: ReturnType<typeof setInterval> | null = null;
let alertHardStopTimer: ReturnType<typeof setTimeout> | null = null;

let isAlertRinging = false;
let activeAlertType: 'order' | 'waiter' | 'bill' = 'order';
let alertStartTime = 0;

type AlertListener = (isRinging: boolean, remainingSec: number) => void;
const alertListeners = new Set<AlertListener>();

function notifyAlertListeners() {
  const remainingSec = isAlertRinging
    ? Math.max(0, Math.ceil((MAX_ALERT_DURATION_MS - (Date.now() - alertStartTime)) / 1000))
    : 0;
  alertListeners.forEach((cb) => {
    try {
      cb(isAlertRinging, remainingSec);
    } catch {}
  });
}

function playByType(type: 'order' | 'waiter' | 'bill') {
  if (type === 'waiter') {
    playSingleWaiterAlert();
  } else {
    playSingleOrderChime();
  }
}

/**
 * Starts continuous repeating alert sound for up to 3 minutes.
 * Will loop every 2.5 seconds until:
 * - Admin acknowledges / accepts the ticket
 * - Admin dismisses the alert or clicks Silence Alarm
 * - Sound is muted
 * - 3 minutes elapse (timeout)
 */
export function startContinuousAlert(type: 'order' | 'waiter' | 'bill' = 'order') {
  if (isMuted) return;

  activeAlertType = type;
  alertStartTime = Date.now();
  isAlertRinging = true;

  // Clear previous intervals if any
  if (alertIntervalTimer) clearInterval(alertIntervalTimer);
  if (alertCountdownTimer) clearInterval(alertCountdownTimer);
  if (alertHardStopTimer) clearTimeout(alertHardStopTimer);

  // Play initial chime immediately
  playByType(type);
  notifyAlertListeners();

  // Repeating chime cadence every 2.5 seconds
  alertIntervalTimer = setInterval(() => {
    if (isMuted || !isAlertRinging) {
      stopContinuousAlert();
      return;
    }
    const elapsed = Date.now() - alertStartTime;
    if (elapsed >= MAX_ALERT_DURATION_MS) {
      stopContinuousAlert();
      return;
    }
    playByType(activeAlertType);
  }, REPEAT_CADENCE_MS);

  // 1-second countdown ticker for UI display (e.g., remaining seconds)
  alertCountdownTimer = setInterval(() => {
    if (!isAlertRinging) {
      if (alertCountdownTimer) clearInterval(alertCountdownTimer);
      return;
    }
    const elapsed = Date.now() - alertStartTime;
    if (elapsed >= MAX_ALERT_DURATION_MS) {
      stopContinuousAlert();
      return;
    }
    notifyAlertListeners();
  }, 1000);

  // Hard stop timeout at exactly 3 minutes
  alertHardStopTimer = setTimeout(() => {
    stopContinuousAlert();
  }, MAX_ALERT_DURATION_MS);
}

/**
 * Stops the continuous repeating alert chime immediately.
 */
export function stopContinuousAlert() {
  if (alertIntervalTimer) {
    clearInterval(alertIntervalTimer);
    alertIntervalTimer = null;
  }
  if (alertCountdownTimer) {
    clearInterval(alertCountdownTimer);
    alertCountdownTimer = null;
  }
  if (alertHardStopTimer) {
    clearTimeout(alertHardStopTimer);
    alertHardStopTimer = null;
  }

  if (isAlertRinging) {
    isAlertRinging = false;
    notifyAlertListeners();
  }
}

/**
 * Checks whether the continuous alarm is currently ringing.
 */
export function isContinuousAlertActive(): boolean {
  return isAlertRinging;
}

/**
 * Subscribes a React component to the alert state to receive live updates.
 */
export function subscribeToAlertState(callback: AlertListener): () => void {
  alertListeners.add(callback);
  const remainingSec = isAlertRinging
    ? Math.max(0, Math.ceil((MAX_ALERT_DURATION_MS - (Date.now() - alertStartTime)) / 1000))
    : 0;
  callback(isAlertRinging, remainingSec);
  return () => {
    alertListeners.delete(callback);
  };
}

/**
 * Backwards compatible helper: starts the 3-minute continuous alert for new orders.
 */
export function playOrderChime(single = false) {
  if (single) {
    playSingleOrderChime();
  } else {
    startContinuousAlert('order');
  }
}

/**
 * Backwards compatible helper: starts the 3-minute continuous alert for waiter assistance.
 */
export function playWaiterAlert(single = false) {
  if (single) {
    playSingleWaiterAlert();
  } else {
    startContinuousAlert('waiter');
  }
}
