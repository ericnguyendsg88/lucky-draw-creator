// Sound utility using Web Audio API for casino-style sound effects

class SoundManager {
  private audioContext: AudioContext | null = null;
  private lastTickTime: number = 0;
  private tickInterval: number = 50; // Minimum ms between tick sounds
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Play a click sound
  playClick() {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = 1200;
    oscillator.type = 'square';
    
    filter.type = 'highpass';
    filter.frequency.value = 800;
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  // Play casino slot machine tick sound - quick mechanical click
  playSlotTick() {
    if (!this.audioContext) return;
    
    const now = Date.now();
    if (now - this.lastTickTime < this.tickInterval) return;
    this.lastTickTime = now;
    
    // Mechanical click with metallic resonance
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // High pitched click
    osc1.frequency.setValueAtTime(2500, this.audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.02);
    osc1.type = 'square';
    
    // Lower metallic resonance
    osc2.frequency.value = 400;
    osc2.type = 'triangle';
    
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 3;
    
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.03);
    
    osc1.start(this.audioContext.currentTime);
    osc1.stop(this.audioContext.currentTime + 0.03);
    osc2.start(this.audioContext.currentTime);
    osc2.stop(this.audioContext.currentTime + 0.02);
  }

  // Play rolling/spinning sound - casino wheel style
  playRolling() {
    if (!this.audioContext) return;
    this.playSlotTick();
  }

  // Play number landing sound - dramatic reveal
  playNumberLand() {
    if (!this.audioContext) return;
    
    // Dramatic "thunk" with reverb-like decay
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const osc3 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(gainNode);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Heavy thunk
    osc1.frequency.setValueAtTime(300, this.audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);
    osc1.type = 'sine';
    
    // Metallic impact
    osc2.frequency.setValueAtTime(800, this.audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
    osc2.type = 'square';
    
    // Bright accent
    osc3.frequency.value = 1200;
    osc3.type = 'sine';
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc1.start(this.audioContext.currentTime);
    osc1.stop(this.audioContext.currentTime + 0.15);
    osc2.start(this.audioContext.currentTime);
    osc2.stop(this.audioContext.currentTime + 0.1);
    osc3.start(this.audioContext.currentTime);
    osc3.stop(this.audioContext.currentTime + 0.05);
  }

  // Play winning fanfare sound - casino jackpot style
  playWin(intensity: 'small' | 'medium' | 'large' = 'medium') {
    if (!this.audioContext) return;
    
    // Casino bell/chime sounds with harmonics
    const playChime = (freq: number, delay: number, duration: number = 0.8, volume: number = 0.3) => {
      setTimeout(() => {
        const osc = this.audioContext!.createOscillator();
        const osc2 = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();
        const filter = this.audioContext!.createBiquadFilter();
        
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        // Add harmonic
        osc2.frequency.value = freq * 2.5;
        osc2.type = 'sine';
        
        filter.type = 'peaking';
        filter.frequency.value = freq * 3;
        filter.Q.value = 5;
        filter.gain.value = 8;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext!.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + duration);
        
        osc.start(this.audioContext!.currentTime);
        osc.stop(this.audioContext!.currentTime + duration);
        osc2.start(this.audioContext!.currentTime);
        osc2.stop(this.audioContext!.currentTime + duration * 0.5);
      }, delay);
    };
    
    // Play coin sounds for jackpot feel
    const playCoinDrop = (delay: number) => {
      setTimeout(() => {
        const noise = this.audioContext!.createBufferSource();
        const buffer = this.audioContext!.createBuffer(1, 2205, 44100);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < 2205; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 400);
        }
        noise.buffer = buffer;
        
        const filter = this.audioContext!.createBiquadFilter();
        const gainNode = this.audioContext!.createGain();
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);
        
        filter.type = 'bandpass';
        filter.frequency.value = 8000;
        filter.Q.value = 3;
        
        gainNode.gain.setValueAtTime(0.15, this.audioContext!.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.08);
        
        noise.start(this.audioContext!.currentTime);
        noise.stop(this.audioContext!.currentTime + 0.08);
      }, delay);
    };
    
    if (intensity === 'large') {
      // Big jackpot - ascending fanfare with coin cascade
      [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((freq, i) => {
        playChime(freq, i * 70, 1.0, 0.35);
      });
      // Coin cascade
      for (let i = 0; i < 12; i++) {
        playCoinDrop(200 + i * 50);
      }
    } else if (intensity === 'medium') {
      // Medium win - triumphant chord
      [659.25, 830.61, 1046.50].forEach((freq, i) => {
        playChime(freq, i * 100, 0.7, 0.3);
      });
      // A few coins
      for (let i = 0; i < 5; i++) {
        playCoinDrop(250 + i * 80);
      }
    } else {
      // Small win - quick double ding
      playChime(783.99, 0, 0.5, 0.25);
      playChime(1046.50, 80, 0.5, 0.25);
      playCoinDrop(150);
    }
  }

  // Play continuous rolling sound - exciting casino wheel
  startContinuousRolling() {
    if (!this.audioContext) return null;
    
    // Create exciting mechanical whirring with casino feel
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    
    // Tremolo LFO for spinning feel
    lfo.frequency.value = 25;
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 120;
    
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 2;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.15);
    
    oscillator.start(this.audioContext.currentTime);
    lfo.start(this.audioContext.currentTime);
    
    // Add subtle high-pitched whine for excitement
    const whine = this.audioContext.createOscillator();
    const whineGain = this.audioContext.createGain();
    const whineFilter = this.audioContext.createBiquadFilter();
    
    whine.connect(whineFilter);
    whineFilter.connect(whineGain);
    whineGain.connect(this.audioContext.destination);
    
    whine.type = 'sine';
    whine.frequency.value = 2000;
    
    whineFilter.type = 'highpass';
    whineFilter.frequency.value = 1500;
    
    whineGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    whineGain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 0.2);
    
    whine.start(this.audioContext.currentTime);
    
    return {
      stop: () => {
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + 0.2);
        whineGain.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + 0.15);
        oscillator.stop(this.audioContext!.currentTime + 0.25);
        lfo.stop(this.audioContext!.currentTime + 0.25);
        whine.stop(this.audioContext!.currentTime + 0.2);
      }
    };
  }
}

export const soundManager = new SoundManager();
