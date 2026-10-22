/**
 * Web Audio API Ambient Music Synthesizer & Sound Engine
 * Generates soothing background chords, ambient pads, and calm study soundscapes 
 * directly in the browser with 0% network dependency and 100% offline reliability.
 */

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;
  private timerId: any = null;

  // Soothing chord progression frequencies (Hz) for C Major 9 / Am 9 study chords
  private chords = [
    [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
    [110.00, 130.81, 164.81, 196.00, 220.00], // Am9
    [174.61, 220.00, 261.63, 329.63, 349.23], // Fmaj9
    [146.83, 174.61, 220.00, 261.63, 293.66]  // Dm9
  ];

  private currentChordIndex = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.25; // Gentle volume
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play() {
    this.initCtx();
    if (this.isPlaying) return;
    this.isPlaying = true;

    this.playNextChord();
    this.timerId = setInterval(() => {
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
      this.playNextChord();
    }, 6000); // Change ambient chord every 6 seconds
  }

  private playNextChord() {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;

    // Fade out previous oscillators gently
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop(this.ctx!.currentTime + 1.5);
      } catch (e) {
        // Ignore stop errors
      }
    });
    this.activeOscillators = [];

    const freqs = this.chords[this.currentChordIndex];
    const now = this.ctx.currentTime;

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft sine + triangle warmth
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Lowpass filter for smooth, warm ambient tone
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + idx * 100, now);

      // Gentle fade in and fade out
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08 / freqs.length, now + 2); // 2s attack
      gain.gain.linearRampToValueAtTime(0, now + 5.8); // release

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 6);
      this.activeOscillators.push(osc);
    });
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol * 0.3)), this.ctx.currentTime);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.activeOscillators = [];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const ambientEngine = new AmbientAudioEngine();
