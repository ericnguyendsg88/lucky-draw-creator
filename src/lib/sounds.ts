// Sound utility using Web Audio API for casino-style sound effects

class SoundManager {
  private audioContext: AudioContext | null = null;
  
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

  // Play rolling/spinning sound (like slot machine reels)
  playRolling() {
    if (!this.audioContext) return;
    
    const noise = this.audioContext.createBufferSource();
    const buffer = this.audioContext.createBuffer(1, 4410, 44100);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < 4410; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    const gainNode = this.audioContext.createGain();
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 5;
    
    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.03);
    
    noise.start(this.audioContext.currentTime);
    noise.stop(this.audioContext.currentTime + 0.03);
  }

  // Play number landing sound (each number that appears)
  playNumberLand() {
    if (!this.audioContext) return;
    
    // Create "ka-chunk" sound with two components
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    osc1.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.08);
    osc1.type = 'square';
    
    osc2.frequency.value = 150;
    osc2.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
    
    osc1.start(this.audioContext.currentTime);
    osc1.stop(this.audioContext.currentTime + 0.08);
    osc2.start(this.audioContext.currentTime);
    osc2.stop(this.audioContext.currentTime + 0.04);
  }

  // Play winning fanfare sound
  playWin(intensity: 'small' | 'medium' | 'large' = 'medium') {
    if (!this.audioContext) return;
    
    // Bell-like chime sounds
    const playBell = (freq: number, delay: number, duration: number = 0.6) => {
      setTimeout(() => {
        const osc = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();
        const filter = this.audioContext!.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        filter.type = 'peaking';
        filter.frequency.value = freq * 2;
        filter.Q.value = 10;
        filter.gain.value = 10;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext!.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + duration);
        
        osc.start(this.audioContext!.currentTime);
        osc.stop(this.audioContext!.currentTime + duration);
      }, delay);
    };
    
    if (intensity === 'large') {
      // Big jackpot sound - rapid ascending bells
      [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50].forEach((freq, i) => {
        playBell(freq, i * 80, 0.8);
      });
    } else if (intensity === 'medium') {
      // Medium win - classic win chime
      [659.25, 783.99, 1046.50].forEach((freq, i) => {
        playBell(freq, i * 120, 0.6);
      });
    } else {
      // Small win - quick double chime
      playBell(659.25, 0, 0.4);
      playBell(783.99, 100, 0.4);
    }
  }

  // Play continuous rolling sound (for long animations)
  startContinuousRolling() {
    if (!this.audioContext) return null;
    
    // Create mechanical whirring sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    
    // Setup LFO for wobble effect
    lfo.frequency.value = 30;
    lfoGain.gain.value = 30;
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 100;
    
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    filter.Q.value = 3;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, this.audioContext.currentTime + 0.1);
    
    oscillator.start(this.audioContext.currentTime);
    lfo.start(this.audioContext.currentTime);
    
    return {
      stop: () => {
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + 0.15);
        oscillator.stop(this.audioContext!.currentTime + 0.2);
        lfo.stop(this.audioContext!.currentTime + 0.2);
      }
    };
  }
}

export const soundManager = new SoundManager();
