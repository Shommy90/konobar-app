let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

/** Call from a click handler to satisfy browsers' audio-autoplay gesture requirement. */
export function unlockNotificationSound(): void {
  const context = getAudioContext();
  if (context?.state === "suspended") {
    void context.resume();
  }
}

/** Generates a short two-tone chime - no audio file asset needed. */
export function playNotificationSound(): void {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") {
    void context.resume();
  }

  const now = context.currentTime;
  [880, 1320].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    const start = now + index * 0.15;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.2);
  });
}
