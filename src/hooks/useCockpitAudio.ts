import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Audio cockpit synthétisé via WebAudio (pas de fichiers à charger).
 * - Bourdonnement de fond : oscillateur sinus 80 Hz + LFO modulant le volume
 * - Bip de saut         : enveloppe ADSR rapide sur 880 Hz → 1320 Hz
 *
 * Démarre au premier clic (autoplay policy).
 */
export function useCockpitAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const [enabled, setEnabled] = useState(false);

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    ctxRef.current = ctx;
    return ctx;
  }, []);

  const start = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx || humGainRef.current) return;

    // — Bourdonnement —
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 78;

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 117; // tierce

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.5);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.18;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;

    lfo.connect(lfoGain).connect(masterGain.gain);
    osc.connect(masterGain);
    osc2.connect(masterGain);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 240;
    masterGain.connect(filter).connect(ctx.destination);

    osc.start();
    osc2.start();
    lfo.start();

    humGainRef.current = masterGain;
    setEnabled(true);
  }, [ensureContext]);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    const gain = humGainRef.current;
    if (!ctx || !gain) return;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    setTimeout(() => {
      gain.disconnect();
      humGainRef.current = null;
    }, 350);
    setEnabled(false);
  }, []);

  const blip = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.07);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }, [ensureContext]);

  useEffect(() => {
    return () => {
      ctxRef.current?.close();
    };
  }, []);

  return { enabled, start, stop, blip };
}
