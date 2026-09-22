// Synthesized Web Audio API sound engine (zero external audio assets)
// Creates rich, non-intrusive harmonic chimes directly via the Web Audio API oscillator

export function playNotificationChime(type: 'message' | 'doubt' | 'milestone' = 'message') {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === 'milestone') {
      // Sales Milestone celebration: Ascending triumphant major arpeggio
      // C5 (523.25 Hz) -> E5 (659.25 Hz) -> G5 (783.99 Hz) -> C6 (1046.50 Hz)
      const notes = [
        { freq: 523.25, time: 0, duration: 0.35, gain: 0.18 },
        { freq: 659.25, time: 0.08, duration: 0.35, gain: 0.18 },
        { freq: 783.99, time: 0.16, duration: 0.4, gain: 0.2 },
        { freq: 1046.50, time: 0.24, duration: 0.55, gain: 0.22 },
      ];

      notes.forEach(({ freq, time, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gainNode.gain.setValueAtTime(0, now + time);
        gainNode.gain.linearRampToValueAtTime(gain, now + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });
    } else if (type === 'doubt') {
      // Doubts & Updates: Clean alert two-tone chime
      // D5 (587.33 Hz) -> F#5 (739.99 Hz)
      const notes = [
        { freq: 587.33, time: 0, duration: 0.25, gain: 0.15 },
        { freq: 739.99, time: 0.1, duration: 0.35, gain: 0.16 },
      ];

      notes.forEach(({ freq, time, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gainNode.gain.setValueAtTime(0, now + time);
        gainNode.gain.linearRampToValueAtTime(gain, now + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });
    } else {
      // Chat & Voice message: Warm, soft dual-bell chime
      // E5 (659.25 Hz) -> B5 (987.77 Hz)
      const notes = [
        { freq: 659.25, time: 0, duration: 0.22, gain: 0.14 },
        { freq: 987.77, time: 0.09, duration: 0.32, gain: 0.14 },
      ];

      notes.forEach(({ freq, time, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gainNode.gain.setValueAtTime(0, now + time);
        gainNode.gain.linearRampToValueAtTime(gain, now + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });
    }
  } catch (err) {
    // Gracefully handle browser policy where audio hasn't had user interaction yet
    console.debug('Web Audio chime playback info:', err);
  }
}
