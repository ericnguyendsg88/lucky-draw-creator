// Casino Sound System with multiple sound packs

type SoundPack = 'arcade' | 'vegas' | 'retro' | 'modern';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private lastTickTime: number = 0;
  private tickInterval: number = 60; // increased from 40ms to reduce audio node creation
  private currentPack: SoundPack = 'vegas';
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setSoundPack(pack: SoundPack) {
    this.currentPack = pack;
  }

  getSoundPack(): SoundPack {
    return this.currentPack;
  }

  private resumeContext() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Rolling/tick sounds based on pack
  playRolling() {
    if (!this.audioContext) return;
    this.resumeContext();
    
    const now = Date.now();
    if (now - this.lastTickTime < this.tickInterval) return;
    this.lastTickTime = now;

    switch (this.currentPack) {
      case 'arcade': this.playArcadeTick(); break;
      case 'vegas': this.playVegasTick(); break;
      case 'retro': this.playRetroTick(); break;
      case 'modern': this.playModernTick(); break;
    }
  }

  // === ARCADE PACK - 8-bit style ===
  private playArcadeTick() {
    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext!.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, this.audioContext!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.audioContext!.currentTime + 0.03);
    
    gain.gain.setValueAtTime(0.12, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.03);
    
    osc.start();
    osc.stop(this.audioContext!.currentTime + 0.03);
  }

  // === VEGAS PACK - Classic slot machine ===
  private playVegasTick() {
    const osc1 = this.audioContext!.createOscillator();
    const osc2 = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();
    const filter = this.audioContext!.createBiquadFilter();
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext!.destination);
    
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(2000, this.audioContext!.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(600, this.audioContext!.currentTime + 0.02);
    
    osc2.type = 'sine';
    osc2.frequency.value = 300;
    
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 2;
    
    gain.gain.setValueAtTime(0.15, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.025);
    
    osc1.start();
    osc1.stop(this.audioContext!.currentTime + 0.025);
    osc2.start();
    osc2.stop(this.audioContext!.currentTime + 0.02);
  }

  // === RETRO PACK - Mechanical feel ===
  private playRetroTick() {
    const noise = this.audioContext!.createBufferSource();
    const buffer = this.audioContext!.createBuffer(1, 1200, 44100);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < 1200; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 150);
    }
    noise.buffer = buffer;
    
    const filter = this.audioContext!.createBiquadFilter();
    const gain = this.audioContext!.createGain();
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext!.destination);
    
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 5;
    
    gain.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.03);
    
    noise.start();
    noise.stop(this.audioContext!.currentTime + 0.03);
  }

  // === MODERN PACK - Smooth digital ===
  private playModernTick() {
    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();
    const filter = this.audioContext!.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext!.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.audioContext!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.audioContext!.currentTime + 0.02);
    
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    
    gain.gain.setValueAtTime(0.1, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.02);
    
    osc.start();
    osc.stop(this.audioContext!.currentTime + 0.02);
  }

  // Number landing sound
  playNumberLand() {
    if (!this.audioContext) return;
    this.resumeContext();

    switch (this.currentPack) {
      case 'arcade': this.playArcadeLand(); break;
      case 'vegas': this.playVegasLand(); break;
      case 'retro': this.playRetroLand(); break;
      case 'modern': this.playModernLand(); break;
    }
  }

  private playArcadeLand() {
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext!.destination);
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, this.audioContext!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.1);
        osc.start();
        osc.stop(this.audioContext!.currentTime + 0.1);
      }, i * 30);
    });
  }

  private playVegasLand() {
    // Bell-like chime
    const osc1 = this.audioContext!.createOscillator();
    const osc2 = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioContext!.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, this.audioContext!.currentTime);
    
    osc2.type = 'sine';
    osc2.frequency.value = 1320;
    
    gain.gain.setValueAtTime(0.25, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.3);
    
    osc1.start();
    osc1.stop(this.audioContext!.currentTime + 0.3);
    osc2.start();
    osc2.stop(this.audioContext!.currentTime + 0.2);
  }

  private playRetroLand() {
    // Mechanical thunk
    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext!.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.audioContext!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.audioContext!.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.4, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.audioContext!.currentTime + 0.15);
  }

  private playModernLand() {
    // Clean digital confirm
    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();
    const filter = this.audioContext!.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext!.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.audioContext!.currentTime);
    osc.frequency.setValueAtTime(900, this.audioContext!.currentTime + 0.05);
    
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    
    gain.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.audioContext!.currentTime + 0.15);
  }

  // Win celebration sound
  playWin(intensity: 'small' | 'medium' | 'large' = 'medium') {
    if (!this.audioContext) return;
    this.resumeContext();

    switch (this.currentPack) {
      case 'arcade': this.playArcadeWin(intensity); break;
      case 'vegas': this.playVegasWin(intensity); break;
      case 'retro': this.playRetroWin(intensity); break;
      case 'modern': this.playModernWin(intensity); break;
    }
  }

  private playArcadeWin(intensity: string) {
    const baseNotes = intensity === 'large' ? [262, 330, 392, 523, 659, 784, 1047] :
                      intensity === 'medium' ? [392, 523, 659, 784] : [523, 659];
    
    baseNotes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext!.destination);
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, this.audioContext!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.15);
        osc.start();
        osc.stop(this.audioContext!.currentTime + 0.15);
      }, i * 60);
    });
  }

  private playVegasWin(intensity: string) {
    const playChime = (freq: number, delay: number, dur: number = 0.5) => {
      setTimeout(() => {
        const osc = this.audioContext!.createOscillator();
        const osc2 = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioContext!.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2;
        gain.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + dur);
        osc.start();
        osc.stop(this.audioContext!.currentTime + dur);
        osc2.start();
        osc2.stop(this.audioContext!.currentTime + dur * 0.5);
      }, delay);
    };

    const playCoin = (delay: number) => {
      setTimeout(() => {
        const noise = this.audioContext!.createBufferSource();
        const buffer = this.audioContext!.createBuffer(1, 2000, 44100);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < 2000; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 300);
        noise.buffer = buffer;
        const filter = this.audioContext!.createBiquadFilter();
        const gain = this.audioContext!.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext!.destination);
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        gain.gain.setValueAtTime(0.1, this.audioContext!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.05);
        noise.start();
        noise.stop(this.audioContext!.currentTime + 0.05);
      }, delay);
    };

    if (intensity === 'large') {
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => playChime(f, i * 50, 0.8));
      for (let i = 0; i < 10; i++) playCoin(150 + i * 40);
    } else if (intensity === 'medium') {
      [659, 831, 1047].forEach((f, i) => playChime(f, i * 80, 0.6));
      for (let i = 0; i < 4; i++) playCoin(200 + i * 60);
    } else {
      playChime(784, 0, 0.4);
      playChime(1047, 60, 0.4);
    }
  }

  private playRetroWin(intensity: string) {
    const count = intensity === 'large' ? 8 : intensity === 'medium' ? 5 : 3;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext!.destination);
        osc.type = 'triangle';
        osc.frequency.value = 400 + i * 100;
        gain.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.2);
        osc.start();
        osc.stop(this.audioContext!.currentTime + 0.2);
      }, i * 100);
    }
  }

  private playModernWin(intensity: string) {
    const freqs = intensity === 'large' ? [400, 500, 600, 800, 1000] :
                  intensity === 'medium' ? [500, 700, 900] : [600, 800];
    
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        const filter = this.audioContext!.createBiquadFilter();
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext!.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        gain.gain.setValueAtTime(0.15, this.audioContext!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.25);
        osc.start();
        osc.stop(this.audioContext!.currentTime + 0.25);
      }, i * 80);
    });
  }

  // Click sound for UI
  playClick() {
    if (!this.audioContext) return;
    this.resumeContext();
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.03);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.03);
  }
}

export const soundManager = new SoundManager();
export type { SoundPack };
