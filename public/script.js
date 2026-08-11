/**
 * ==========================================================
 * نبرد با رذایل (Battle with Vices)
 * Pure Static HTML5 Canvas Space Shooter
 * Moral & Educational Game
 * ==========================================================
 */

// --- Web Audio API Sound Generator ---
// --- Web Audio API Sound & Music Synthesizer Engine ---
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmMuted = false;
    this.bgmGain = null;
    this.bgmTimer = null;
    this.bgmCurrentZone = null;
    this.bgmStep = 0;
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.bgmGain = this.ctx.createGain();
          this.bgmGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
          this.bgmGain.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {}
  }

  startBGM(zoneId = 1) {
    if (this.muted || this.bgmMuted) return;
    this.init();
    if (!this.ctx) return;

    if (this.bgmCurrentZone === zoneId && this.bgmTimer) {
      return;
    }

    this.stopBGM();
    this.bgmCurrentZone = zoneId;
    this.bgmStep = 0;

    const scheduleNextStep = () => {
      if (this.muted || this.bgmMuted || !this.ctx || gameState.activeScreen !== 'playing') {
        this.stopBGM();
        return;
      }

      this.playBGMStep(this.bgmCurrentZone, this.bgmStep);
      this.bgmStep = (this.bgmStep + 1) % 32;

      // Step intervals (ms) per sixteenth note based on Zone tempo & emotion:
      const zoneStepIntervals = [
        185, // Zone 1: Dark, Ominous Space (~81 BPM)
        160, // Zone 2: Emerald Hope (~93 BPM)
        140, // Zone 3: Cosmic Purple Wisdom (~107 BPM)
        120, // Zone 4: Ruby Battle Conflict (~125 BPM)
        125, // Zone 5: Sapphire Resilience (~120 BPM)
        135, // Zone 6: Triumphant Gold (~111 BPM)
        155, // Zone 7: Celestial Ascension (~96 BPM)
        240  // Zone 8: Sacred Serene Malakut (~62 BPM - slow, peaceful, meditative)
      ];

      const interval = zoneStepIntervals[this.bgmCurrentZone - 1] || 150;
      this.bgmTimer = setTimeout(scheduleNextStep, interval);
    };

    scheduleNextStep();
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  updateBGMForLevel(levelNumber) {
    const zoneId = Math.min(8, Math.max(1, Math.ceil((levelNumber || 1) / 10)));
    if (gameState.activeScreen === 'playing') {
      this.startBGM(zoneId);
    } else {
      this.stopBGM();
    }
  }

  playBGMNote(freq, type, duration, gainVal, filterFreq = 1200) {
    if (this.muted || this.bgmMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {}
  }

  playBGMPercussion(type, duration, gainVal) {
    if (this.muted || this.bgmMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (type === 'kick') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + duration);
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(this.bgmGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } else if (type === 'snare') {
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain || this.ctx.destination);
        noise.start(now);
      }
    } catch (e) {}
  }

  playBGMStep(zoneId, step) {
    switch (zoneId) {
      case 1: { // Zone 1: Dark, Ominous Space (مراحل ۱-۱۰)
        if (step % 8 === 0) {
          this.playBGMNote(65.41, 'sawtooth', 1.2, 0.12, 350); // Low C2 Drone
        }
        if (step % 4 === 0) {
          const darkArp = [130.81, 155.56, 207.65, 246.94]; // C3, Eb3, Ab3, B3
          const freq = darkArp[(step / 4) % 4];
          this.playBGMNote(freq, 'sawtooth', 0.25, 0.05, 600);
        }
        if (step === 12 || step === 28) {
          this.playBGMNote(523.25, 'sine', 0.5, 0.04, 1800); // Eerie high ping
        }
        break;
      }

      case 2: { // Zone 2: Emerald Hope & Awakening (مراحل ۱۱-۲۰)
        if (step % 8 === 0) {
          const bassNotes = [87.31, 103.83, 130.81, 103.83]; // F2, Ab2, C3, Ab2
          this.playBGMNote(bassNotes[(step / 8) % 4], 'triangle', 1.0, 0.10, 500);
        }
        if (step % 3 === 0) {
          const hopeScale = [349.23, 415.30, 523.25, 622.25, 783.99]; // F4, Ab4, C5, Eb5, G5
          const note = hopeScale[(step / 3) % hopeScale.length];
          this.playBGMNote(note, 'sine', 0.35, 0.05, 1400);
        }
        break;
      }

      case 3: { // Zone 3: Cosmic Purple Wisdom (مراحل ۲۱-۳۰)
        if (step % 2 === 0) {
          const doriBass = [73.42, 110.00, 130.81, 110.00, 146.83, 110.00, 130.81, 73.42]; // D2, A2, C3, A2, D3...
          const note = doriBass[(step / 2) % doriBass.length];
          this.playBGMNote(note, 'sawtooth', 0.18, 0.08, 800);
        }
        const wisdomArp = [293.66, 349.23, 440.00, 523.25, 587.33, 523.25, 440.00, 349.23]; // D4, F4, A4, C5, D5...
        this.playBGMNote(wisdomArp[step % wisdomArp.length], 'sine', 0.2, 0.04, 1600);
        break;
      }

      case 4: { // Zone 4: Ruby Volcano & Battle Conflict (مراحل ۳۱-۴۰)
        if (step % 4 === 0) {
          this.playBGMPercussion('kick', 0.18, 0.22);
        }
        if (step % 8 === 4) {
          this.playBGMPercussion('snare', 0.12, 0.08);
        }
        if (step % 2 === 0) {
          const phrygBass = [110.00, 116.54, 130.81, 146.83]; // A2, Bb2, C3, D3
          const bNote = phrygBass[(step / 2) % phrygBass.length];
          this.playBGMNote(bNote, 'sawtooth', 0.15, 0.09, 1000);
        }
        const battleArp = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00]; // A3, C4, D4, E4, G4, A4
        this.playBGMNote(battleArp[step % battleArp.length], 'square', 0.12, 0.03, 1200);
        break;
      }

      case 5: { // Zone 5: Sapphire Resilience & Synthwave (مراحل ۴۱-۵۰)
        if (step % 2 === 0) {
          const synthBass = (step / 2) % 2 === 0 ? 98.00 : 196.00; // G2 -> G3 Octave jump
          this.playBGMNote(synthBass, 'sawtooth', 0.14, 0.09, 900);
        }
        if (step % 8 === 0) {
          const chords = [196.00, 233.08, 293.66]; // G3, Bb3, D4 pad swell
          chords.forEach(f => this.playBGMNote(f, 'sine', 0.9, 0.04, 1500));
        }
        if (step % 4 === 2) {
          this.playBGMNote(587.33, 'sine', 0.25, 0.05, 2000); // D5 lead tip
        }
        break;
      }

      case 6: { // Zone 6: Golden Light & Triumphant Glory (مراحل ۵۱-۶۰)
        if (step % 8 === 0) {
          const brassChords = [
            [146.83, 185.00, 220.00], // D Major
            [220.00, 277.18, 329.63], // A Major
            [246.94, 293.66, 369.99], // B Minor
            [196.00, 246.94, 293.66]  // G Major
          ];
          const chord = brassChords[(step / 8) % brassChords.length];
          chord.forEach(f => this.playBGMNote(f, 'triangle', 0.8, 0.06, 1100));
        }
        if (step % 4 === 0) {
          const goldChimes = [369.99, 440.00, 554.37, 587.33]; // F#4, A4, C#5, D5
          const chime = goldChimes[(step / 4) % goldChimes.length];
          this.playBGMNote(chime, 'sine', 0.4, 0.05, 2200);
        }
        break;
      }

      case 7: { // Zone 7: Celestial Ascension & Sacred Night (مراحل ۶۱-۷۰)
        if (step % 16 === 0) {
          const orgBass = step === 0 ? 61.74 : 92.50; // B1 / F#2
          this.playBGMNote(orgBass, 'sine', 2.0, 0.12, 400);
          const organPads = [246.94, 293.66, 369.99, 440.00]; // B3, D4, F#4, A4
          organPads.forEach(f => this.playBGMNote(f, 'triangle', 1.8, 0.04, 900));
        }
        if (step % 4 === 2) {
          const crystalChimes = [739.99, 880.00, 1174.66, 1479.98]; // F#5, A5, D6, F#6
          const chime = crystalChimes[(step / 2) % crystalChimes.length];
          this.playBGMNote(chime, 'sine', 0.6, 0.04, 2500);
        }
        break;
      }

      case 8: { // Zone 8: Borders of Malakut & Divine Serenity (مراحل ۷۱-۸۰)
        if (step % 16 === 0) {
          // Deep Sacred Breathing Harmonic OM Drone
          [65.41, 98.00, 130.81, 196.00].forEach((f) => {
            this.playBGMNote(f, 'sine', 3.2, 0.035, 450);
          });
        }
        if (step % 4 === 0) {
          // Pure Tibetan / Crystal Bowl Sine Tones (Pentatonic Light)
          const malakutBowlNotes = [392.00, 523.25, 587.33, 783.99, 1046.50, 783.99, 587.33, 523.25];
          const note = malakutBowlNotes[(step / 4) % malakutBowlNotes.length];
          this.playBGMNote(note, 'sine', 1.2, 0.04, 3000);
        }
        break;
      }
    }
  }

  playLaser() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playExplosion(isBoss = false) {
    if (this.muted || !this.ctx) return;
    try {
      const duration = isBoss ? 0.6 : 0.25;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isBoss ? 400 : 800, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isBoss ? 0.4 : 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  }

  playPowerup() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.08);
      osc.frequency.setValueAtTime(900, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playWin() {
    if (this.muted || !this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime + idx * 0.1;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    } catch (e) {}
  }

  playLoss() {
    if (this.muted || !this.ctx) return;
    try {
      const notes = [400, 350, 300, 200];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime + idx * 0.12;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      });
    } catch (e) {}
  }
}

const audio = new AudioEngine();

// --- Bad Traits Data (رفتارهای بد - ۵۰ واژه کاملاً منحصر‌به‌فرد) ---
const badTraitsData = [
  { name: 'دروغ', hp: 1, color: '#f87171', speed: 1.0, type: 'normal' },
  { name: 'خیانت', hp: 2, color: '#ef4444', speed: 1.1, type: 'resistant' },
  { name: 'چاپلوسی', hp: 1, color: '#fb923c', speed: 1.2, type: 'normal' },
  { name: 'حسادت', hp: 2, color: '#f59e0b', speed: 1.0, type: 'resistant' },
  { name: 'غرور', hp: 3, color: '#b91c1c', speed: 0.9, type: 'hard' },
  { name: 'تنبلی', hp: 1, color: '#a855f7', speed: 0.7, type: 'normal' },
  { name: 'طمع', hp: 2, color: '#eab308', speed: 1.3, type: 'fast' },
  { name: 'کینه', hp: 3, color: '#dc2626', speed: 1.0, type: 'hard' },
  { name: 'خودخواهی', hp: 3, color: '#9333ea', speed: 1.1, type: 'hard' },
  { name: 'بی‌مسئولیتی', hp: 3, color: '#7c3aed', speed: 0.8, type: 'resistant' },
  { name: 'تمسخر', hp: 2, color: '#f43f5e', speed: 1.2, type: 'normal' },
  { name: 'عصبانیت', hp: 2, color: '#ff0000', speed: 1.4, type: 'explosive' },
  { name: 'بدقولی', hp: 2, color: '#d97706', speed: 1.0, type: 'normal' },
  { name: 'ریا', hp: 3, color: '#4c1d95', speed: 0.9, type: 'resistant' },
  { name: 'فریب', hp: 3, color: '#881337', speed: 1.1, type: 'hard' },
  { name: 'غیبت', hp: 2, color: '#c026d3', speed: 1.0, type: 'normal' },
  { name: 'ظلم', hp: 3, color: '#991b1b', speed: 1.2, type: 'hard' },
  { name: 'ناسپاسی', hp: 2, color: '#6b21a8', speed: 1.0, type: 'normal' },
  { name: 'ترس بی‌جا', hp: 1, color: '#38bdf8', speed: 1.5, type: 'fast' },
  { name: 'ناامیدی', hp: 2, color: '#475569', speed: 0.8, type: 'resistant' },
  { name: 'تهمت', hp: 2, color: '#be123c', speed: 1.1, type: 'normal' },
  { name: 'خست', hp: 2, color: '#854d0e', speed: 0.9, type: 'resistant' },
  { name: 'بدخواهی', hp: 3, color: '#9f1239', speed: 1.2, type: 'hard' },
  { name: 'فخرفروشی', hp: 2, color: '#a21caf', speed: 1.0, type: 'normal' },
  { name: 'بداخلاقی', hp: 2, color: '#b91c1c', speed: 1.3, type: 'fast' },
  { name: 'بی‌احترامی', hp: 1, color: '#fb7185', speed: 1.1, type: 'normal' },
  { name: 'بی‌وفایی', hp: 2, color: '#e11d48', speed: 1.0, type: 'resistant' },
  { name: 'شایعه‌سازی', hp: 2, color: '#d946ef', speed: 1.4, type: 'explosive' },
  { name: 'بی‌صبری', hp: 1, color: '#f97316', speed: 1.5, type: 'fast' },
  { name: 'پرخوری', hp: 2, color: '#65a30d', speed: 0.7, type: 'normal' },
  { name: 'اسراف', hp: 2, color: '#ca8a04', speed: 1.2, type: 'normal' },
  { name: 'زیاده‌خواهی', hp: 3, color: '#b45309', speed: 1.0, type: 'hard' },
  { name: 'خودبینی', hp: 2, color: '#7e22ce', speed: 1.1, type: 'normal' },
  { name: 'لجاجت', hp: 3, color: '#be185d', speed: 0.9, type: 'resistant' },
  { name: 'چشم‌هم‌چشمی', hp: 2, color: '#c084fc', speed: 1.2, type: 'normal' },
  { name: 'بی‌نظمی', hp: 1, color: '#64748b', speed: 1.3, type: 'fast' },
  { name: 'بدبینی', hp: 2, color: '#334155', speed: 0.8, type: 'resistant' },
  { name: 'تکبر', hp: 3, color: '#881337', speed: 1.0, type: 'hard' },
  { name: 'بی‌عدالتی', hp: 3, color: '#7f1d1d', speed: 1.1, type: 'hard' },
  { name: 'پیمان‌شکنی', hp: 2, color: '#991b1b', speed: 1.2, type: 'resistant' },
  { name: 'سخن‌چینی', hp: 2, color: '#d946ef', speed: 1.3, type: 'explosive' },
  { name: 'بی‌مبالاتی', hp: 1, color: '#f43f5e', speed: 1.2, type: 'normal' },
  { name: 'قساوت', hp: 3, color: '#450a0a', speed: 1.0, type: 'hard' },
  { name: 'خودشیفتگی', hp: 2, color: '#6b21a8', speed: 1.1, type: 'normal' },
  { name: 'بدزبانی', hp: 2, color: '#ef4444', speed: 1.4, type: 'explosive' },
  { name: 'بی‌تفاوتی', hp: 2, color: '#475569', speed: 0.8, type: 'normal' },
  { name: 'حریصی', hp: 2, color: '#a16207', speed: 1.3, type: 'fast' },
  { name: 'خودرایی', hp: 3, color: '#581c87', speed: 1.0, type: 'resistant' },
  { name: 'نمام‌کاری', hp: 2, color: '#9d174d', speed: 1.2, type: 'normal' },
  { name: 'حق‌پوشی', hp: 3, color: '#1e1b4b', speed: 0.9, type: 'hard' }
];

// --- Good Virtue Rewards Data (واژه‌های خوب) ---
const goodRewardsData = [
  { name: 'صداقت', power: 'fastFire', desc: 'افزایش سرعت شلیک', color: '#38bdf8' },
  { name: 'مهربانی', power: 'shield', desc: 'سپر دفاعی نورانی', color: '#a7f3d0' },
  { name: 'شجاعت', power: 'powerBullet', desc: 'تیرهای لیزری قدرتمند', color: '#fbbf24' },
  { name: 'وفاداری', power: 'multiShot', desc: 'شلیک سه‌گانه همزمان', color: '#c084fc' },
  { name: 'امید', power: 'timeSlow', desc: 'کند شدن حرکت رذایل', color: '#818cf8' },
  { name: 'مسئولیت‌پذیری', power: 'radialExplosion', desc: 'انفجار پاک‌سازی شعاعی', color: '#f472b6' },
  { name: 'احترام', power: 'fastFire', desc: 'افزایش سرعت شلیک', color: '#67e8f9' },
  { name: 'عدالت', power: 'powerBullet', desc: 'تیرهای لیزری قدرتمند', color: '#fde047' },
  { name: 'بخشش', power: 'shield', desc: 'سپر دفاعی نورانی', color: '#6ee7b7' },
  { name: 'نظم', power: 'multiShot', desc: 'شلیک سه‌گانه همزمان', color: '#e879f9' }
];

// --- 80 Defined Levels Data (مراحل ۸۰‌گانه) ---
const levelsData = Array.from({ length: 80 }, (_, index) => {
  const lvl = index + 1;
  const bosses = [
    // 1 - 10
    'ابولهب', 'ابوجهل', 'قارون', 'نمرود', 'فرعون',
    'هامان', 'سامری', 'شداد', 'قابیل', 'فریبکاری بزرگ (غول فریب)',
    // 11 - 20
    'شبث بن ربعی', 'عمرو عاص', 'ابن‌ملجم', 'زیاد بن ابیه', 'مروان بن حکم',
    'یزید بن معاویه', 'عبیدالله بن زیاد', 'عمر بن سعد', 'شمر بن ذی‌الجوشن', 'غرور سرکش (غول غرور)',
    // 21 - 30
    'خولی بن یزید', 'سنان بن انس', 'حجاج بن یوسف', 'مامون عباسی', 'معتصم عباسی',
    'چنگیزخان', 'متوکل عباسی', 'منصور دوانیقی', 'اسکندر مقدونی', 'هیتلر (غول نژادپرستی و جنگ)',
    // 31 - 40
    'موسولینی (غول فاشیسم)', 'صدام حسین (غول تجاوز و نفاق)', 'ریگان (غول تحریم و حیله)', 'بوش پدر (بانی جنگ خلیج)', 'شارون (جنایتکار صبرا و شتیلا)',
    'بلر (هم‌پیمان افراط)', 'کیسینجر (معمار توطئه‌ها)', 'هولاکوخان (ویرانگر نیشابور و بغداد)', 'تیمور لنگ (قساوت بی‌رحم)', 'شیطنت مکّار (غول شیطنت)',
    // 41 - 50
    'سلطان محمود غزنوی', 'آقا محمدخان قاجار (سنگدل بی‌رحم)', 'محمدرضا پهلوی (استعمارزده مستبد)', 'رضاخان (سرکوبگر هویت)', 'ناصرالدین شاه (بی‌کفایتی و خودشیفتگی)',
    'فتحعلی شاه (وطن‌فروش معاهدات)', 'بلفور (معمار اشغالگری)', 'بن‌گوریون (بنیانگذار رژیم غاصب)', 'موشه دایان (فرمانده تجاوز)', 'استکبار جهانی (غول استکبار و نفوذ)',
    // 51 - 60
    'اسحاق رابین', 'مناخم بگین (طراح ترور و جنایت)', 'ایهود باراک', 'اولمرت (متجاوز جنگ ۳۳ روزه)', 'گالانت (جنایتکار جنگی)',
    'بوش پسر (بانی برافروختن جنگ‌ها)', 'جو بایدن (حامی بی‌قیدوشرط جنایت)', 'مایک پمپئو (طراح ترور بزدلانه)', 'جان بولتون (کاهن جنگ و تحریم)', 'صهیونیسم بین‌الملل (اختاپوس صهیونیسم)',
    // 61 - 70
    'هیلاری کلینتون (معمار گروه‌های تکفیری)', 'باراک اوباما (دستکش مخملین بر مشت چدنی)', 'ماری آنتوانت (تکبر و بی‌خبری)', 'نرون (آتش‌افروز ستمگر)', 'آتیلا (تازنده‌ی وحشت)',
    'ابوبکر بغدادی (سرکرده تکفیر)', 'ابومحمد جولانی (امیر خیانت)', 'عبدالمالک ریگی (تروریست قساوت)', 'استعمار کهن (دیو غارت ملل)', 'فتنه آخرالزمان (غول فتنه‌های سنگین)',
    // 71 - 80
    'تحریم ظالمانه (دیو فشار اقتصادی)', 'امپریالیسم نوین (غول هژمونی)', 'فتنه‌انگیزی نوپدید', 'خباثت الکترونیک (حملات سایبری)', 'جاهلیت مدرن (نقاب فریب)',
    'رسانه‌های مسموم (جنگ شناختی)', 'نفاق پیشرفته (حیله‌های پیچیده)', 'نتانیاهو (غول پیشرفته جنایت و شرارت)', 'ترامپ (غول فوق‌پیشرفته زره تاریک)', 'ابلیس نهایی و شیطان بزرگ (ابر غول سرنوشت‌ساز کل کهکشان)'
  ];

  const stories = [
    // 1-10
    'چند رفتار نادرست کوچک در کهکشان ظاهر شده‌اند و امنیت اخلاقی را تهدید می‌کنند.',
    'صفات نادرست مانند دروغ و بی‌مسئولیتی در حال گسترش هستند.',
    'موج جدیدی از رفتار بد به مسیر فضاپیما هجوم آورده‌اند.',
    'تاریکی در حال نفوذ است. نیازمند دقت بیشتر هستید.',
    'نبرد نخستین با رذایل ریشه‌دار آغاز می‌شود.',
    'رفتارهای فرار و سریع وارد میدان نبرد شده‌اند.',
    'حسادت و طمع فضایی را مسموم کرده‌اند.',
    'رذایل مقاوم‌تر شده‌اند و ضربات بیشتری می‌طلبند.',
    'موج‌های متراکم دشمنان اخلاق شکل گرفته است.',
    'مینی‌باس فریبکاری بزرگ با تمام قدرت ظاهر می‌شود!',
    // 11-20
    'حیله و بدقولی راه را بر شما بسته‌اند.',
    'کینه و ریا در حال حمله سازمان‌یافته هستند.',
    'سرعت نبرد افزایش یافته است؛ هوشیار باشید.',
    'صفوف دشمنان اخلاق فشرده‌تر و سرکش‌تر شده است.',
    'آزمایشی سخت برای سنجش پایداری و شجاعت.',
    'موج‌های ترکیبی از رذایل سنگین و سریع هجوم می‌آورند.',
    'بی‌مسئولیتی و غرور محیط را مسموم کرده‌اند.',
    'تنها با تقویت فضایل نیک می‌توانید پیروز شوید.',
    'نبرد شدیدی در جریان است. تیرهای خشمگین شلیک کنید.',
    'مینی‌باس غرور سرکش کهکشان را تهدید می‌کند!',
    // 21-30
    'موج‌های انفجاری و خطرناک فعال شده‌اند.',
    'رفتارهای بد در الگوهای پیچیده حرکت می‌کنند.',
    'استقامت و ایمان تنها کلید عبور از این منطقه است.',
    'تاریکی به اوج خود نزدیک می‌شود.',
    'آزمون بزرگ پیش از نبرد نهایی این بخش.',
    'سپاه رذایل با تمام قوا وارد میدان شده است.',
    'حملات سنگین دشمنان دین آغاز گردیده است.',
    'مقاومت بالای رفتارهای بد نیازمند شلیک‌های پی‌درپی است.',
    'تازندگان ویرانی وارد مدار شده‌اند. با اراده فولادین شلیک کن!',
    'نبرد با هیتلر، غول نژادپرستی و جنگ‌طلبی جهانی!',
    // 31-40
    'سایه‌های فاشیسم و خودخواهی در فضا رخنه کرده‌اند.',
    'تجاوز و نفاق مسیر کهکشان نور را مسدود کرده است.',
    'حیله‌های تحریم و فشار اقتصادی فضایی پدیدار شده‌اند.',
    'امواج متراکم بدخواهی به سمت فضاپیما هجوم می‌آورند.',
    'جنایتکاران تاریخ با خشم به میدان شتافته‌اند.',
    'افراط‌گرایی و نفاق لایه‌های جدید دفاعی تشکیل داده‌اند.',
    'توتئه‌های پیچیده سیاسی در کهکشان گسترش یافته است.',
    'ویرانگران علم و فرهنگ قصد انهدام نور را دارند.',
    'قساوت لنگان در مدار سیاره به حرکت درآمده است.',
    'نبرد با غول شیطنت مکّار در میان آتش و دود!',
    // 41-50
    'استبداد و طمع جاه‌طلبانه در آسمان زبانه می‌کشد.',
    'سنگدلی و بی‌رحمی راه عبور را بسته است.',
    'استعمارزدگی و تسلیم در برابر تاریکی ظهور کرده است.',
    'سرکوبگران هویت و اصالت وارد میدان شده‌اند.',
    'بی‌کفایتی و خودشیفتگی فضا را مسموم کرده است.',
    'معاهده‌های ننگین وطن‌فروشی سایه افکنده‌اند.',
    'معماران اشغالگری لشکری از رفتارهای بد گسیل داشته‌اند.',
    'اشغالگران سرزمین‌های نور در حال پیشروی هستند.',
    'فرماندهان قساوت به سمت فضاپیمای شما شلیک می‌کنند.',
    'نبرد حماسی با غول استکبار جهانی و نفوذ کهکشانی!',
    // 51-60
    'سرکوبگران قیام‌های حق‌طلبانه امواج حمله ساخته‌اند.',
    'طراحان ترور و جنایت از خفا بیرون آمده‌اند.',
    'نقشه‌های شوم و پیچیده تاریکی فعال گردیده‌اند.',
    'متجاوزان جنگ‌های ظالمانه سد راه شما شده‌اند.',
    'جنایتکاران نبرد و محاصره با تمام توان حمله می‌کنند.',
    'برافروزندگان آتش جنگ‌ها مدار را اشغال کرده‌اند.',
    'حامیان بی‌قیدوشرط جنایت وارد میدان نبرد شده‌اند.',
    'طراحان ترورهای بزدلانه موشک‌های مسموم شلیک می‌کنند.',
    'کاهنان جنگ و تحریم در حال مسموم‌سازی فضا هستند.',
    'نبرد با غول اختاپوس صهیونیسم بین‌الملل!',
    // 61-70
    'معماران گروه‌های تکفیری و تفرقه شلیک می‌کنند.',
    'دستکش‌های مخملین روی مشت‌های چدنی پدیدار شده‌اند.',
    'تکبر و بی‌خبری از درد مظلومان کهکشان را فراگرفته است.',
    'آتش‌افروزان ستمگر شهرها و مدارها را به آتش کشیده‌اند.',
    'تازندگان وحشت و ویرانی سرعت هجوم را مضاعف کرده‌اند.',
    'سرکرده‌های تکفیر و جاهلیت با قساوت حمله می‌کنند.',
    'امیران خیانت و تاریکی لایه‌های دفاعی ساخته‌اند.',
    'تروریست‌های خباثت موشک‌های انفجاری گسیل می‌دارند.',
    'دیو غارت منابع ملل در فضا خیمه زده است.',
    'نبرد سنگین با غول فتنه‌های عظیم آخرالزمان!',
    // 71-80
    'دیو فشار و تحریم‌های ظالمانه فضا را تنگ کرده است.',
    'امپریالیسم نوین با سلاح‌های پیشرفته وارد شده است.',
    'فتنه‌انگیزی‌های پیچیده و نوین مسیر نبرد را تاریک کرده‌اند.',
    'خباثت‌های الکترونیک و حملات سایبری رخنه کرده‌اند.',
    'جاهلیت مدرن با نقاب‌های فریبنده هجوم می‌آورد.',
    'امواج رسانه‌های مسموم حقیقت را هدف گرفته‌اند.',
    'نفاق پیشرفته با سپرها و حیلت‌های متعدد ظاهر شده است.',
    'نبرد سهمگین با نتانیاهو؛ غول پیشرفته جنایت و شرارت کهکشان!',
    'نبرد فوق‌العاده حماسی با ترامپ؛ غول زره‌پوش تاریکی با آتش‌بار سنگین!',
    'نبرد نهایی سرنوشت‌ساز، بی‌نهایت حماسی و با عظمت با ابلیس نهایی و شیطان بزرگ! کهکشان نور در انتظار فتح کامل شماست!'
  ];

  const isMini = lvl % 10 === 0 && lvl < 80;
  const isFinal = lvl >= 78;

  // Progressive Boss HP & difficulty scaling (challenging yet fully playable & beatable with powerups and missiles!)
  const bossHp = lvl === 80 ? 1800 : lvl === 79 ? 1350 : lvl === 78 ? 1050 : isMini ? Math.round(180 + lvl * 14) : Math.round(55 + lvl * 12);
  const targetKills = Math.min(16 + Math.floor(lvl * 1.1), 80);
  const speedMult = Math.min(2.4, 1.0 + (lvl - 1) * 0.018);
  const rewardChance = Math.min(0.55, 0.15 + lvl * 0.005);

  const levelTitle = lvl === 80 ? 'نبرد سرنوشت‌ساز نهایی با ابلیس' :
                     lvl === 79 ? 'نبرد با غول ترامپ' :
                     lvl === 78 ? 'نبرد با غول نتانیاهو' :
                     isMini ? `نبرد با غول منطقه ${lvl}` :
                     `پاک‌سازی منطقه ${lvl}`;

  return {
    id: lvl,
    title: `مرحله ${lvl}: ${levelTitle}`,
    story: stories[index],
    missionText: `${targetKills} رفتار بد را نابود کن و غول «${bosses[index]}» را شکست بده!`,
    targetKillCount: targetKills,
    speedMultiplier: speedMult,
    rewardChance: rewardChance,
    boss: {
      name: bosses[index],
      hp: bossHp,
      maxHp: bossHp,
      isMiniBoss: isMini,
      isFinalBoss: isFinal
    }
  };
});

// --- Achievements System Data (سیستم دستاوردها و مدال‌های افتخار) ---
const achievementsList = [
  {
    id: 'first_victory',
    icon: '🛡️',
    title: 'نخستین قدم نور',
    desc: 'پیروزی در اولین مرحله نبرد و پاک‌سازی نخستین رذایل.',
    check: (s) => s.unlockedLevel > 1 || (s.starsEarned && s.starsEarned[1] > 0)
  },
  {
    id: 'first_boss',
    icon: '👹',
    title: 'شکست غول تاریکی',
    desc: 'نابودی حداقل یک غول سرکش و پاک‌سازی منطقه.',
    check: (s) => s.stats && s.stats.bossesDefeated >= 1
  },
  {
    id: 'flawless_boss',
    icon: '👑',
    title: 'نبرد بی‌نقص',
    desc: 'نابودی غول یک مرحله بدون کم شدن هیچ جان (❤️۳/۳).',
    check: (s) => s.stats && s.stats.flawlessBosses >= 1
  },
  {
    id: 'virtue_collector',
    icon: '✨',
    title: 'جامع فضایل',
    desc: 'جمع‌آوری ۵ جایزه نیک (فضایل اخلاقی) در یک مرحله.',
    check: (s) => s.stats && s.stats.goodDeedsInCurrentLevel >= 5
  },
  {
    id: 'quran_thunder',
    icon: '🚀',
    title: 'صاعقه قرآن',
    desc: 'استفاده از ۵ موشک قدرتمند صاعقه نورانی قرآن.',
    check: (s) => s.stats && s.stats.quranMissilesUsed >= 5
  },
  {
    id: 'ahlulbayt_shield',
    icon: '🛡️',
    title: 'سپر آل‌الله',
    desc: 'استفاده از ۵ سپر انهدام و حمایت اهل بیت (ع).',
    check: (s) => s.stats && s.stats.ahlulbaytMissilesUsed >= 5
  },
  {
    id: 'zone1_clear',
    icon: '🌌',
    title: 'فاتح کهکشان کهن',
    desc: 'پاک‌سازی کامل ۱۰ مرحله اول (اقلیم ۱).',
    check: (s) => s.unlockedLevel > 10
  },
  {
    id: 'zone4_clear',
    icon: '🌋',
    title: 'استوار در آتش‌فشان',
    desc: 'عبور از ۴۰ مرحله اول (اقلیم ۴).',
    check: (s) => s.unlockedLevel > 40
  },
  {
    id: 'hundred_kills',
    icon: '🎯',
    title: 'استاد تیراندازی',
    desc: 'نابودی حداقل ۱۰۰ رفتار بد و رذیله اخلاقی.',
    check: (s) => s.totalKills >= 100
  },
  {
    id: 'five_hundred_kills',
    icon: '💥',
    title: 'شکارچی بزرگ رذایل',
    desc: 'نابودی حداقل ۵۰۰ رفتار بد در طول بازی.',
    check: (s) => s.totalKills >= 500
  },
  {
    id: 'star_master',
    icon: '⭐',
    title: 'ستاره‌باران ملکوت',
    desc: 'کسب مجموع حداقل ۳۰ ستاره طلایی در مراحل.',
    check: (s) => {
      let total = 0;
      Object.values(s.starsEarned || {}).forEach(v => total += (v || 0));
      return total >= 30;
    }
  },
  {
    id: 'final_champion',
    icon: '🏆',
    title: 'قهرمان جاودان نور',
    desc: 'فتح کامل تمامی ۸۰ مرحله بازی و شکست ابلیس نهایی.',
    check: (s) => s.unlockedLevel > 80 || (s.starsEarned && s.starsEarned[80] > 0)
  }
];

// --- Game State ---
const gameState = {
  activeScreen: 'start', // 'start', 'playing', 'paused', 'win', 'loss', 'final'
  currentLevel: 1,
  unlockedLevel: 1,
  score: 0,
  levelKills: 0,
  totalKills: 0,
  totalRewardsCollected: 0,
  goodDeedsCount: 0,
  quranCharges: 1,
  ahlulbaytCharges: 1,
  lives: 3,
  gameLoopId: null,
  activePowerups: {},
  starsEarned: {},
  highScore: 0,
  bossActive: false,
  bossRef: null,
  unlockedAchievements: [],
  stats: {
    bossesDefeated: 0,
    flawlessBosses: 0,
    quranMissilesUsed: 0,
    ahlulbaytMissilesUsed: 0,
    goodDeedsInCurrentLevel: 0
  }
};

// Global Arrays
let bullets = [];
let enemyBullets = [];
let enemies = [];
let explosions = [];
let powerUps = [];

// Canvas setup
let gameCanvas, gameCtx, bgCanvas, bgCtx;
let stars = [];
let screenShake = 0;

// Player Object
const player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  width: 54,
  height: 64,
  speed: 9,
  acc: 1.3,
  friction: 0.86,
  tilt: 0,
  lastShot: 0,
  fireRate: 160, // ms - faster response!
  isMovingLeft: false,
  isMovingRight: false,
  isMovingUp: false,
  isMovingDown: false,
  isFiring: false,
  shieldActive: false
};

// --- Initialization ---
let splashTimer = null;
let splashSeconds = 5;

window.addEventListener('load', () => {
  gameCanvas = document.getElementById('gameCanvas');
  gameCtx = gameCanvas.getContext('2d');
  bgCanvas = document.getElementById('bgCanvas');
  bgCtx = bgCanvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  initStars();
  loadProgress();
  setupUIEventListeners();
  setupControls();

  requestAnimationFrame(drawBackground);
  initSplash();
});

function initSplash() {
  splashSeconds = 5;
  const countEl = document.getElementById('splashTimerCount');
  if (countEl) countEl.innerText = splashSeconds.toLocaleString('fa-IR');

  splashTimer = setInterval(() => {
    splashSeconds--;
    if (countEl) countEl.innerText = splashSeconds > 0 ? splashSeconds.toLocaleString('fa-IR') : '۰';
    if (splashSeconds <= 0) {
      clearInterval(splashTimer);
      launchGameFromSplash();
    }
  }, 1000);

  const skipBtn = document.getElementById('btnSkipSplash');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (splashTimer) clearInterval(splashTimer);
      launchGameFromSplash();
    });
  }
}

let splashExploding = false;

function launchGameFromSplash() {
  if (splashExploding) return;
  splashExploding = true;
  if (splashTimer) clearInterval(splashTimer);

  audio.init();
  audio.playExplosion(true);

  const splashEl = document.getElementById('splashScreen');
  const splashContent = document.getElementById('splashContent');
  const splashFlash = document.getElementById('splashFlash');

  if (splashEl) {
    splashEl.classList.add('blast-mode');
  }

  if (splashFlash) {
    splashFlash.classList.add('active');
    setTimeout(() => {
      splashFlash.classList.remove('active');
    }, 280);
  }

  if (splashContent) {
    splashContent.classList.add('exploding');
  }

  // Giant Cinematic Screen Explosion across canvas!
  const centerX = gameCanvas.width / 2;
  const centerY = gameCanvas.height / 2;
  screenShake = 50;

  createExplosion(centerX, centerY, '#ffffff', 90, 3.2);
  createExplosion(centerX, centerY, '#fde047', 100, 2.7);
  createExplosion(centerX, centerY, '#f97316', 80, 2.3);
  createExplosion(centerX, centerY, '#ef4444', 70, 2.0);
  createExplosion(centerX, centerY, '#a855f7', 60, 1.8);

  // Staggered secondary fireworks bursts across the screen
  for (let i = 0; i < 9; i++) {
    setTimeout(() => {
      const rx = Math.random() * gameCanvas.width;
      const ry = Math.random() * gameCanvas.height;
      audio.playExplosion(false);
      screenShake = 24;
      createExplosion(rx, ry, i % 2 === 0 ? '#fde047' : '#ef4444', 40, 1.8);
    }, i * 85);
  }

  // Animate explosion on gameCanvas
  const startTime = Date.now();
  function animateSplashExplosion() {
    const elapsed = Date.now() - startTime;
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    gameCtx.save();
    if (screenShake > 0) {
      screenShake *= 0.88;
      const dx = (Math.random() - 0.5) * screenShake;
      const dy = (Math.random() - 0.5) * screenShake;
      gameCtx.translate(dx, dy);
    }

    explosions.forEach(p => p.update());
    explosions = explosions.filter(p => p.alpha > 0);
    explosions.forEach(p => p.draw(gameCtx));
    gameCtx.restore();

    if (elapsed < 1100 || explosions.length > 0) {
      requestAnimationFrame(animateSplashExplosion);
    } else {
      if (splashEl) {
        splashEl.classList.add('hidden');
        splashEl.classList.remove('active');
      }
      showStartScreen();
    }
  }

  requestAnimationFrame(animateSplashExplosion);
}

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  gameCanvas.width = width;
  gameCanvas.height = height;
  bgCanvas.width = width;
  bgCanvas.height = height;

  if (gameState.activeScreen !== 'playing') {
    player.y = height - 160;
    if (player.x === 0 || player.x > width) player.x = width / 2;
  } else {
    clampPlayerPosition();
  }
}

// --- Dynamic Background Generation System (سیستم پس‌زمینه پویا برای ۸۰ مرحله) ---
const zonesData = [
  {
    id: 1,
    range: 'مراحل ۱ تا ۱۰',
    name: 'کهکشان کهن و تاریک',
    subtitle: 'اقلیم ۱: اعماق فضا و تاریکی اولیه',
    bgGrad: ['#03050c', '#090e1f', '#020308'],
    nebulaColors: ['rgba(30, 41, 59, 0.25)', 'rgba(15, 23, 42, 0.3)', 'rgba(30, 27, 75, 0.2)'],
    starColors: ['#ffffff', '#93c5fd', '#bfdbfe'],
    dustColor: 'rgba(147, 197, 253, 0.15)',
    hasRays: false,
    speedFactor: 0.85
  },
  {
    id: 2,
    range: 'مراحل ۱۱ تا ۲۰',
    name: 'سحابی زمردین امید',
    subtitle: 'اقلیم ۲: انوار سبز امید و بیداری',
    bgGrad: ['#022c22', '#064e3b', '#021812'],
    nebulaColors: ['rgba(16, 185, 129, 0.24)', 'rgba(5, 150, 105, 0.2)', 'rgba(52, 211, 153, 0.18)'],
    starColors: ['#ffffff', '#6ee7b7', '#a7f3d0', '#34d399'],
    dustColor: 'rgba(52, 211, 153, 0.25)',
    hasRays: false,
    speedFactor: 1.0
  },
  {
    id: 3,
    range: 'مراحل ۲۱ تا ۳۰',
    name: 'منظومه بنفش حکمت',
    subtitle: 'اقلیم ۳: تجلی انوار حکمت و بصیرت',
    bgGrad: ['#2e1065', '#3b0764', '#170530'],
    nebulaColors: ['rgba(168, 85, 247, 0.26)', 'rgba(192, 132, 252, 0.2)', 'rgba(147, 51, 234, 0.22)'],
    starColors: ['#ffffff', '#e9d5ff', '#c084fc', '#f0abfc'],
    dustColor: 'rgba(192, 132, 252, 0.28)',
    hasRays: false,
    speedFactor: 1.15
  },
  {
    id: 4,
    range: 'مراحل ۳۱ تا ۴۰',
    name: 'کهکشان یاقوت و آتش‌فشان فضایی',
    subtitle: 'اقلیم ۴: امواج یاقوتی نبرد و استقامت',
    bgGrad: ['#450a0a', '#581c87', '#1f0404'],
    nebulaColors: ['rgba(239, 68, 68, 0.24)', 'rgba(245, 158, 11, 0.22)', 'rgba(220, 38, 38, 0.2)'],
    starColors: ['#ffffff', '#fca5a5', '#fde047', '#f97316'],
    dustColor: 'rgba(251, 146, 60, 0.3)',
    hasRays: false,
    speedFactor: 1.3
  },
  {
    id: 5,
    range: 'مراحل ۴۱ تا ۵۰',
    name: 'سحابی نیلوفری استقامت',
    subtitle: 'اقلیم ۵: طوفان نیلوفری و دریاهای فضا',
    bgGrad: ['#075985', '#0c4a6e', '#032b42'],
    nebulaColors: ['rgba(14, 165, 233, 0.26)', 'rgba(56, 189, 248, 0.22)', 'rgba(2, 132, 199, 0.2)'],
    starColors: ['#ffffff', '#7dd3fc', '#bae6fd', '#38bdf8'],
    dustColor: 'rgba(56, 189, 248, 0.28)',
    hasRays: false,
    speedFactor: 1.45
  },
  {
    id: 6,
    range: 'مراحل ۵۱ تا ۶۰',
    name: 'اقلیم طلا و نور معرفت',
    subtitle: 'اقلیم ۶: تابش زرین عرفان و معرفت',
    bgGrad: ['#78350f', '#451a03', '#2a1002'],
    nebulaColors: ['rgba(245, 158, 11, 0.26)', 'rgba(251, 191, 36, 0.22)', 'rgba(217, 119, 6, 0.24)'],
    starColors: ['#ffffff', '#fef08a', '#fde047', '#fbbf24'],
    dustColor: 'rgba(251, 191, 36, 0.32)',
    hasRays: true,
    rayColor: 'rgba(251, 191, 36, 0.12)',
    speedFactor: 1.6
  },
  {
    id: 7,
    range: 'مراحل ۶۱ تا ۷۰',
    name: 'افق سجاده‌ی آسمانی و معراج',
    subtitle: 'اقلیم ۷: تجلی شب معراج و شبکه انوار مقدس',
    bgGrad: ['#312e81', '#4c1d95', '#1e1b4b'],
    nebulaColors: ['rgba(99, 102, 241, 0.28)', 'rgba(168, 85, 247, 0.24)', 'rgba(236, 72, 153, 0.2)'],
    starColors: ['#ffffff', '#c7d2fe', '#f472b6', '#a78bfa'],
    dustColor: 'rgba(192, 132, 252, 0.35)',
    hasRays: true,
    rayColor: 'rgba(168, 85, 247, 0.16)',
    speedFactor: 1.75
  },
  {
    id: 8,
    range: 'مراحل ۷۱ تا ۸۰',
    name: 'مرزهای ملکوت و عرش الهی',
    subtitle: 'اقلیم ۸: طلیعه عرش الهی و مرزهای ملکوت',
    bgGrad: ['#1e1b4b', '#065f46', '#31103f'],
    nebulaColors: ['rgba(253, 224, 71, 0.28)', 'rgba(52, 211, 153, 0.28)', 'rgba(192, 132, 252, 0.25)', 'rgba(56, 189, 248, 0.22)'],
    starColors: ['#ffffff', '#fef08a', '#6ee7b7', '#bae6fd', '#f0abfc'],
    dustColor: 'rgba(254, 240, 138, 0.45)',
    hasRays: true,
    rayColor: 'rgba(254, 240, 138, 0.24)',
    speedFactor: 2.0
  }
];

function getCurrentZone(levelNumber) {
  const lvl = levelNumber || gameState.currentLevel || 1;
  const zoneId = Math.min(8, Math.max(1, Math.ceil(lvl / 10)));
  return zonesData[zoneId - 1];
}

let nebulaClouds = [];
let cosmicDust = [];
let bgTime = 0;

function initStars() {
  stars = [];
  nebulaClouds = [];
  cosmicDust = [];

  const w = bgCanvas.width || window.innerWidth;
  const h = bgCanvas.height || window.innerHeight;

  // 1. Stars Generation
  const count = Math.floor((w * h) / 2800);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 2.2 + 0.4,
      alpha: Math.random() * 0.85 + 0.15,
      speed: Math.random() * 0.6 + 0.2,
      colorIdx: Math.floor(Math.random() * 5),
      pulseSpeed: Math.random() * 0.03 + 0.01
    });
  }

  // 2. Procedural Floating Nebula Clouds
  const nebulaCount = 7;
  for (let i = 0; i < nebulaCount; i++) {
    nebulaClouds.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 250 + 150,
      colorIdx: i % 4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: Math.random() * 0.2 + 0.1,
      scalePulse: Math.random() * Math.PI * 2
    });
  }

  // 3. Floating Light Motes / Sacred Particles
  const dustCount = 45;
  for (let i = 0; i < dustCount; i++) {
    cosmicDust.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 3.5 + 1.2,
      alpha: Math.random() * 0.6 + 0.2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: Math.random() * 0.8 + 0.3,
      pulse: Math.random() * Math.PI * 2
    });
  }
}

function drawBackground() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgTime += 0.02;

  const zone = getCurrentZone(gameState.currentLevel);

  // --- 1. Dynamic Zone Background Gradient ---
  const grad = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
  grad.addColorStop(0, zone.bgGrad[0]);
  grad.addColorStop(0.5, zone.bgGrad[1]);
  grad.addColorStop(1, zone.bgGrad[2]);
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

  // --- 2. Dynamic Procedural Nebula Clouds ---
  bgCtx.save();
  bgCtx.globalCompositeOperation = 'lighter';
  nebulaClouds.forEach((cloud) => {
    cloud.scalePulse += 0.008;
    const pulseRad = cloud.radius + Math.sin(cloud.scalePulse) * 25;
    const cloudColor = zone.nebulaColors[cloud.colorIdx % zone.nebulaColors.length];

    const radialGrad = bgCtx.createRadialGradient(
      cloud.x, cloud.y, 0,
      cloud.x, cloud.y, pulseRad
    );
    radialGrad.addColorStop(0, cloudColor);
    radialGrad.addColorStop(0.6, cloudColor.replace(/[\d\.]+\)$/, '0.08)'));
    radialGrad.addColorStop(1, 'transparent');

    bgCtx.fillStyle = radialGrad;
    bgCtx.beginPath();
    bgCtx.arc(cloud.x, cloud.y, pulseRad, 0, Math.PI * 2);
    bgCtx.fill();

    // Drift nebula cloud slowly
    cloud.x += cloud.vx;
    cloud.y += cloud.vy * zone.speedFactor * 0.5;

    if (cloud.y - pulseRad > bgCanvas.height) {
      cloud.y = -pulseRad;
      cloud.x = Math.random() * bgCanvas.width;
    }
  });
  bgCtx.restore();

  // --- 3. Shimmering Divine Rays of Light (Zone 6, 7 & 8) ---
  if (zone.hasRays) {
    bgCtx.save();
    bgCtx.globalCompositeOperation = 'lighter';
    const numRays = zone.id === 8 ? 7 : 5;
    for (let i = 0; i < numRays; i++) {
      const rayAngle = (i - numRays / 2) * 0.22 + Math.sin(bgTime * 0.5 + i) * 0.03;
      const rayWidth = 90 + Math.cos(bgTime + i) * 20;

      const rayGrad = bgCtx.createLinearGradient(
        bgCanvas.width / 2, 0,
        bgCanvas.width / 2 + Math.sin(rayAngle) * bgCanvas.height, bgCanvas.height
      );
      rayGrad.addColorStop(0, zone.rayColor);
      rayGrad.addColorStop(0.5, zone.rayColor.replace(/[\d\.]+\)$/, '0.06)'));
      rayGrad.addColorStop(1, 'transparent');

      bgCtx.fillStyle = rayGrad;
      bgCtx.beginPath();
      bgCtx.moveTo(bgCanvas.width / 2 - rayWidth / 2, 0);
      bgCtx.lineTo(bgCanvas.width / 2 + rayWidth / 2, 0);
      bgCtx.lineTo(bgCanvas.width / 2 + Math.sin(rayAngle) * bgCanvas.height + rayWidth * 2, bgCanvas.height);
      bgCtx.lineTo(bgCanvas.width / 2 + Math.sin(rayAngle) * bgCanvas.height - rayWidth * 2, bgCanvas.height);
      bgCtx.closePath();
      bgCtx.fill();
    }
    bgCtx.restore();
  }

  // --- 4. Celestial Sacred Ring (Zone 8 Malakut Special) ---
  if (zone.id === 8) {
    bgCtx.save();
    bgCtx.globalCompositeOperation = 'lighter';
    bgCtx.strokeStyle = 'rgba(254, 240, 138, 0.15)';
    bgCtx.lineWidth = 2;
    bgCtx.beginPath();
    bgCtx.arc(bgCanvas.width / 2, bgCanvas.height * 0.25, 180 + Math.sin(bgTime) * 15, 0, Math.PI * 2);
    bgCtx.stroke();

    bgCtx.strokeStyle = 'rgba(167, 243, 208, 0.12)';
    bgCtx.lineWidth = 1;
    bgCtx.beginPath();
    bgCtx.arc(bgCanvas.width / 2, bgCanvas.height * 0.25, 230 + Math.cos(bgTime) * 20, 0, Math.PI * 2);
    bgCtx.stroke();
    bgCtx.restore();
  }

  // --- 5. Layered Stars Rendering ---
  stars.forEach(star => {
    star.alpha += Math.sin(bgTime * 3 + star.x) * star.pulseSpeed;
    const alphaClamped = Math.max(0.1, Math.min(0.9, star.alpha));
    const starColor = zone.starColors[star.colorIdx % zone.starColors.length];

    bgCtx.save();
    bgCtx.globalAlpha = alphaClamped;
    bgCtx.fillStyle = starColor;
    bgCtx.beginPath();
    bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    bgCtx.fill();

    if (star.radius > 1.6) {
      bgCtx.shadowBlur = 8;
      bgCtx.shadowColor = starColor;
      bgCtx.fill();
    }
    bgCtx.restore();

    star.y += star.speed * zone.speedFactor;
    if (star.y > bgCanvas.height) {
      star.y = 0;
      star.x = Math.random() * bgCanvas.width;
    }
  });

  // --- 6. Drifting Light Motes / Sacred Cosmic Dust ---
  bgCtx.save();
  bgCtx.globalCompositeOperation = 'lighter';
  cosmicDust.forEach(dust => {
    dust.pulse += 0.03;
    const currentAlpha = Math.max(0.1, Math.min(0.8, dust.alpha + Math.sin(dust.pulse) * 0.25));

    bgCtx.globalAlpha = currentAlpha;
    bgCtx.fillStyle = zone.dustColor;
    bgCtx.beginPath();
    bgCtx.arc(dust.x, dust.y, dust.radius, 0, Math.PI * 2);
    bgCtx.fill();

    dust.x += dust.vx;
    dust.y += dust.vy * zone.speedFactor;

    if (dust.y > bgCanvas.height) {
      dust.y = 0;
      dust.x = Math.random() * bgCanvas.width;
    }
    if (dust.x < 0) dust.x = bgCanvas.width;
    if (dust.x > bgCanvas.width) dust.x = 0;
  });
  bgCtx.restore();

  requestAnimationFrame(drawBackground);
}

// --- Local Storage Progress ---
function saveProgress() {
  try {
    const data = {
      unlockedLevel: gameState.unlockedLevel,
      highScore: gameState.highScore,
      starsEarned: gameState.starsEarned,
      soundMuted: audio.muted,
      unlockedAchievements: gameState.unlockedAchievements || [],
      stats: gameState.stats || {},
      totalKills: gameState.totalKills || 0,
      goodDeedsCount: gameState.goodDeedsCount || 0
    };
    localStorage.setItem('nabard_razayel_save', JSON.stringify(data));
  } catch (e) {}
}

function loadProgress() {
  try {
    const saved = localStorage.getItem('nabard_razayel_save');
    if (saved) {
      const parsed = JSON.parse(saved);
      gameState.unlockedLevel = parsed.unlockedLevel || 1;
      gameState.highScore = parsed.highScore || 0;
      gameState.starsEarned = parsed.starsEarned || {};
      audio.muted = !!parsed.soundMuted;
      gameState.unlockedAchievements = parsed.unlockedAchievements || [];
      if (parsed.totalKills) gameState.totalKills = parsed.totalKills;
      if (parsed.goodDeedsCount) gameState.goodDeedsCount = parsed.goodDeedsCount;
      if (parsed.stats) {
        gameState.stats = {
          bossesDefeated: parsed.stats.bossesDefeated || 0,
          flawlessBosses: parsed.stats.flawlessBosses || 0,
          quranMissilesUsed: parsed.stats.quranMissilesUsed || 0,
          ahlulbaytMissilesUsed: parsed.stats.ahlulbaytMissilesUsed || 0,
          goodDeedsInCurrentLevel: parsed.stats.goodDeedsInCurrentLevel || 0
        };
      }

      updateSoundUI();
    }
  } catch (e) {}

  updateMenuUI();
}

// --- Achievement System Functions ---
let toastTimeout = null;
function showAchievementToast(ach) {
  const toastEl = document.getElementById('achievementToast');
  if (!toastEl) return;

  const iconEl = document.getElementById('toastAchievementIcon');
  const titleEl = document.getElementById('toastAchievementTitle');
  const descEl = document.getElementById('toastAchievementDesc');

  if (iconEl) iconEl.innerText = ach.icon;
  if (titleEl) titleEl.innerText = ach.title;
  if (descEl) descEl.innerText = ach.desc;

  try {
    audio.playWin();
  } catch (e) {}

  toastEl.classList.remove('hidden', 'hiding');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.add('hiding');
    setTimeout(() => {
      toastEl.classList.add('hidden');
      toastEl.classList.remove('hiding');
    }, 400);
  }, 3800);
}

function checkAchievements() {
  if (!gameState.unlockedAchievements) gameState.unlockedAchievements = [];
  if (!gameState.stats) {
    gameState.stats = {
      bossesDefeated: 0,
      flawlessBosses: 0,
      quranMissilesUsed: 0,
      ahlulbaytMissilesUsed: 0,
      goodDeedsInCurrentLevel: 0
    };
  }

  achievementsList.forEach(ach => {
    if (!gameState.unlockedAchievements.includes(ach.id)) {
      if (ach.check(gameState)) {
        gameState.unlockedAchievements.push(ach.id);
        saveProgress();
        showAchievementToast(ach);
      }
    }
  });
}

function renderAchievementsModal() {
  const container = document.getElementById('achievementsGrid');
  if (!container) return;
  container.innerHTML = '';

  const unlockedCount = (gameState.unlockedAchievements || []).length;
  const badgeEl = document.getElementById('achievementsProgressBadge');
  if (badgeEl) {
    badgeEl.innerText = `${unlockedCount.toLocaleString('fa-IR')} / ${achievementsList.length.toLocaleString('fa-IR')} آنلاک شده`;
  }

  achievementsList.forEach(ach => {
    const isUnlocked = (gameState.unlockedAchievements || []).includes(ach.id);
    const item = document.createElement('div');
    item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;

    item.innerHTML = `
      <div class="achievement-icon-box">${isUnlocked ? ach.icon : '🔒'}</div>
      <div class="achievement-info">
        <h4 class="achievement-title">
          <span>${ach.title}</span>
          <span class="achievement-status-tag">${isUnlocked ? 'کسب شده ✓' : 'قفل'}</span>
        </h4>
        <p class="achievement-desc">${ach.desc}</p>
      </div>
    `;

    container.appendChild(item);
  });
}

function updateMenuUI() {
  document.getElementById('menuHighScore').innerText = gameState.highScore.toLocaleString('fa-IR');
  document.getElementById('menuUnlockedLevel').innerText = gameState.unlockedLevel.toLocaleString('fa-IR');
}

// --- Event Listeners & UI Handlers ---
function setupUIEventListeners() {
  document.getElementById('btnStartGame').addEventListener('click', () => {
    audio.init();
    showMissionPanel(gameState.unlockedLevel);
  });

  document.getElementById('btnLevelSelect').addEventListener('click', () => {
    audio.init();
    renderLevelGrid();
    showModal('levelSelectModal');
  });

  document.getElementById('btnCloseLevelSelect').addEventListener('click', () => {
    hideModal('levelSelectModal');
  });

  const btnShowAchievements = document.getElementById('btnShowAchievements');
  if (btnShowAchievements) {
    btnShowAchievements.addEventListener('click', () => {
      audio.init();
      renderAchievementsModal();
      showModal('achievementsModal');
    });
  }

  const btnCloseAchievements = document.getElementById('btnCloseAchievements');
  if (btnCloseAchievements) {
    btnCloseAchievements.addEventListener('click', () => {
      hideModal('achievementsModal');
    });
  }

  const btnShowSettings = document.getElementById('btnShowSettings');
  if (btnShowSettings) {
    btnShowSettings.addEventListener('click', () => {
      audio.init();
      showModal('settingsModal');
    });
  }

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      audio.init();
      showModal('settingsModal');
    });
  }

  const btnCloseSettings = document.getElementById('btnCloseSettings');
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => {
      hideModal('settingsModal');
    });
  }

  const btnToggleSoundSettings = document.getElementById('btnToggleSoundSettings');
  if (btnToggleSoundSettings) {
    btnToggleSoundSettings.addEventListener('click', toggleSound);
  }

  document.getElementById('btnShowTutorial').addEventListener('click', () => {
    audio.init();
    showModal('tutorialModal');
  });

  document.getElementById('btnCloseTutorial').addEventListener('click', () => {
    hideModal('tutorialModal');
  });

  document.getElementById('btnStartMission').addEventListener('click', () => {
    audio.init();
    hideModal('missionPanel');
    startLevel(gameState.currentLevel);
  });

  document.getElementById('pauseBtn').addEventListener('click', () => {
    togglePause();
  });

  const exitBtn = document.getElementById('exitLevelBtn');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      if (gameState.activeScreen === 'playing') {
        togglePause();
      }
    });
  }

  document.getElementById('btnResume').addEventListener('click', () => {
    togglePause();
  });

  document.getElementById('btnRestartLevel').addEventListener('click', () => {
    hideModal('pauseModal');
    startLevel(gameState.currentLevel);
  });

  document.getElementById('btnQuitToMenu').addEventListener('click', () => {
    hideModal('pauseModal');
    showStartScreen();
  });

  const btnToggleSoundPause = document.getElementById('btnToggleSoundPause');
  if (btnToggleSoundPause) {
    btnToggleSoundPause.addEventListener('click', toggleSound);
  }

  document.getElementById('btnNextLevel').addEventListener('click', () => {
    hideModal('levelWinModal');
    if (gameState.currentLevel < levelsData.length) {
      showMissionPanel(gameState.currentLevel + 1);
    } else {
      showFinalVictory();
    }
  });

  document.getElementById('btnWinMenu').addEventListener('click', () => {
    hideModal('levelWinModal');
    showStartScreen();
  });

  document.getElementById('btnRetryLevel').addEventListener('click', () => {
    hideModal('gameOverModal');
    startLevel(gameState.currentLevel);
  });

  document.getElementById('btnLossMenu').addEventListener('click', () => {
    hideModal('gameOverModal');
    showStartScreen();
  });

  document.getElementById('btnFinalRestart').addEventListener('click', () => {
    hideModal('finalVictoryModal');
    showStartScreen();
  });

  // Special Missile Buttons Event Listeners with fast touch response
  const attachFastTap = (btn, action) => {
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      action();
    }, { passive: false });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      action();
    });
  };

  attachFastTap(document.getElementById('btnQuranMissile'), activateQuranMissile);
  attachFastTap(document.getElementById('btnAhlulbaytMissile'), activateAhlulbaytMissile);
  attachFastTap(document.getElementById('pauseBtn'), togglePause);
}

function updateSoundUI() {
  const icon = audio.muted ? '🔇' : '🔊';
  const text = audio.muted ? 'خاموش' : 'روشن';
  const statusText = audio.muted ? 'صدا: خاموش' : 'صدا: روشن';

  const settingsIcon = document.getElementById('settingsSoundIcon');
  if (settingsIcon) settingsIcon.innerText = icon;

  const settingsStatus = document.getElementById('settingsSoundStatus');
  if (settingsStatus) settingsStatus.innerText = statusText;

  const pauseStatus = document.getElementById('pauseSoundStatus');
  if (pauseStatus) pauseStatus.innerText = text;
}

function toggleSound() {
  audio.init();
  audio.muted = !audio.muted;
  updateSoundUI();
  if (audio.muted) {
    audio.stopBGM();
  } else if (gameState.activeScreen === 'playing') {
    audio.updateBGMForLevel(gameState.currentLevel);
  }
  saveProgress();
}

function showModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function renderLevelGrid() {
  const container = document.getElementById('levelGrid');
  container.innerHTML = '';

  for (let i = 1; i <= levelsData.length; i++) {
    const item = document.createElement('div');
    const isUnlocked = i <= gameState.unlockedLevel;
    item.className = `level-item ${isUnlocked ? 'unlocked' : 'locked'}`;

    const starsCount = gameState.starsEarned[i] || 0;
    const starsText = isUnlocked ? '⭐'.repeat(starsCount) : '🔒';

    item.innerHTML = `
      <span class="level-num">${i.toLocaleString('fa-IR')}</span>
      <span class="stars-count">${starsText}</span>
    `;

    if (isUnlocked) {
      item.addEventListener('click', () => {
        hideModal('levelSelectModal');
        showMissionPanel(i);
      });
    }

    container.appendChild(item);
  }
}

function showMissionPanel(levelNumber) {
  gameState.currentLevel = levelNumber;
  const data = levelsData[levelNumber - 1];
  const zone = getCurrentZone(levelNumber);

  document.getElementById('missionLevelBadge').innerText = `مرحله ${data.id}`;
  const zoneBadgeEl = document.getElementById('missionZoneBadge');
  if (zoneBadgeEl) {
    zoneBadgeEl.innerText = `${zone.subtitle} (${zone.range})`;
  }

  document.getElementById('missionTitle').innerText = data.title;
  document.getElementById('missionStory').innerText = data.story;
  document.getElementById('missionTargetText').innerText = data.missionText;
  document.getElementById('missionBossText').innerText = `${data.boss.name} (${data.boss.hp} HP)`;
  document.getElementById('missionRewardText').innerText = 'دریافت صفات نیک و پاورآپ‌های قدرتمند';

  hideAllScreens();
  showModal('missionPanel');
}

function hideAllScreens() {
  document.querySelectorAll('.overlay-screen').forEach(el => el.classList.add('hidden'));
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('touchControls').classList.add('hidden');
  const missileBar = document.getElementById('specialMissilesBar');
  if (missileBar) missileBar.classList.add('hidden');
}

function showStartScreen() {
  cancelAnimationFrame(gameState.gameLoopId);
  gameState.activeScreen = 'start';
  audio.stopBGM();
  hideAllScreens();
  updateMenuUI();
  document.getElementById('startScreen').classList.remove('hidden');
}

// --- Controls (Keyboard & Touch) ---
function setupControls() {
  window.addEventListener('keydown', e => {
    if (gameState.activeScreen !== 'playing') return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      player.isMovingLeft = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      player.isMovingRight = true;
    }
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      player.isMovingUp = true;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      player.isMovingDown = true;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
      fireBullet();
    }
    if (e.key === '1' || e.key === 'q' || e.key === 'Q') {
      activateQuranMissile();
    }
    if (e.key === '2' || e.key === 'e' || e.key === 'E') {
      activateAhlulbaytMissile();
    }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      togglePause();
    }
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      player.isMovingLeft = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      player.isMovingRight = false;
    }
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      player.isMovingUp = false;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      player.isMovingDown = false;
    }
  });

  // Prevent context menus on mobile long-press
  window.addEventListener('contextmenu', e => e.preventDefault());

  // Touch button controls (Bottom corner steer buttons)
  const btnLeft = document.getElementById('btnMoveLeft');
  const btnRight = document.getElementById('btnMoveRight');

  const addTouchEvents = (element, startFn, endFn) => {
    if (!element) return;
    element.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); startFn(); }, { passive: false });
    element.addEventListener('touchend', e => { e.stopPropagation(); e.preventDefault(); endFn(); }, { passive: false });
    element.addEventListener('mousedown', startFn);
    element.addEventListener('mouseup', endFn);
  };

  if (btnLeft && btnRight) {
    addTouchEvents(btnLeft, () => { player.isMovingLeft = true; }, () => { player.isMovingLeft = false; });
    addTouchEvents(btnRight, () => { player.isMovingRight = true; }, () => { player.isMovingRight = false; });
  }

  // Screen Tap & Touch / Click Firing anywhere on Canvas!
  // Offset target Y upwards by 45px so player finger sits comfortably BELOW the ship
  const handleTouchMove = (e) => {
    if (gameState.activeScreen !== 'playing') return;
    const touch = e.touches ? e.touches[0] : e;
    const rect = gameCanvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    const fingerOffsetY = 45; // Ships sits 45px above finger on mobile
    const targetY = touchY - fingerOffsetY;

    player.x += (touchX - player.x) * 0.42;
    player.y += (targetY - player.y) * 0.42;
    clampPlayerPosition();
    player.isFiring = true;
  };

  gameCanvas.addEventListener('touchstart', e => {
    if (gameState.activeScreen !== 'playing') return;
    e.preventDefault();
    player.isFiring = true;
    handleTouchMove(e);
    fireBullet();
  }, { passive: false });

  gameCanvas.addEventListener('touchmove', e => {
    if (gameState.activeScreen !== 'playing') return;
    e.preventDefault();
    handleTouchMove(e);
  }, { passive: false });

  gameCanvas.addEventListener('touchend', e => {
    if (!e.touches || e.touches.length === 0) {
      player.isFiring = false;
    }
  });

  gameCanvas.addEventListener('touchcancel', () => { player.isFiring = false; });

  gameCanvas.addEventListener('mousedown', e => {
    if (gameState.activeScreen !== 'playing') return;
    player.isFiring = true;
    fireBullet();
  });

  window.addEventListener('mouseup', () => {
    player.isFiring = false;
  });
}

function clampPlayerPosition() {
  if (player.x < player.width / 2) { player.x = player.width / 2; player.vx = 0; }
  if (player.x > gameCanvas.width - player.width / 2) { player.x = gameCanvas.width - player.width / 2; player.vx = 0; }

  // Allow wide vertical movement on mobile/desktop, keeping safe margin above bottom buttons
  const minY = 90;
  const maxY = gameCanvas.height - 100;
  if (player.y < minY) { player.y = minY; player.vy = 0; }
  if (player.y > maxY) { player.y = maxY; player.vy = 0; }
}

// --- Game Engine Core ---
function startLevel(levelNumber) {
  audio.init();
  gameState.currentLevel = levelNumber;
  gameState.activeScreen = 'playing';
  gameState.lives = 3;
  gameState.levelKills = 0;
  gameState.bossActive = false;
  gameState.bossRef = null;
  gameState.activePowerups = {};
  if (gameState.stats) gameState.stats.goodDeedsInCurrentLevel = 0;
  checkAchievements();

  // Start Dynamic Music Engine for this Zone
  audio.updateBGMForLevel(levelNumber);

  // Recharge 1 missile use for both at the beginning of each level
  gameState.quranCharges = Math.max(1, (gameState.quranCharges || 0) + 1);
  gameState.ahlulbaytCharges = Math.max(1, (gameState.ahlulbaytCharges || 0) + 1);

  bullets = [];
  enemyBullets = [];
  enemies = [];
  explosions = [];
  powerUps = [];

  player.x = gameCanvas.width / 2;
  player.y = gameCanvas.height - 160;
  player.shieldActive = false;

  hideAllScreens();
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('touchControls').classList.remove('hidden');
  const missileBar = document.getElementById('specialMissilesBar');
  if (missileBar) missileBar.classList.remove('hidden');

  updateHUD();
  updateMissileUI();
  spawnWave();

  if (gameState.gameLoopId) cancelAnimationFrame(gameState.gameLoopId);
  gameState.gameLoopId = requestAnimationFrame(gameLoop);
}

function spawnWave() {
  if (gameState.bossActive) return;

  const currentLevelData = levelsData[gameState.currentLevel - 1];
  const count = 4 + Math.floor(gameState.currentLevel * 0.4);

  // Collect names of enemies currently active on screen to guarantee NO duplicates!
  const existingNames = new Set(enemies.map(e => e.name));

  // Filter available traits that are not active on screen
  let availableTraits = badTraitsData.filter(t => !existingNames.has(t.name));
  
  // Shuffle available traits
  availableTraits.sort(() => Math.random() - 0.5);

  for (let i = 0; i < count; i++) {
    if (availableTraits.length === 0) {
      availableTraits = [...badTraitsData].sort(() => Math.random() - 0.5);
    }
    const trait = availableTraits.pop();
    existingNames.add(trait.name);

    const x = Math.random() * (gameCanvas.width - 120) + 60;
    const y = -Math.random() * 300 - 50;

    enemies.push(new Enemy(x, y, trait, currentLevelData.speedMultiplier));
  }
}

function spawnBoss() {
  if (gameState.bossActive) return;

  gameState.bossActive = true;
  const currentLevelData = levelsData[gameState.currentLevel - 1];
  const bossData = currentLevelData.boss;

  const boss = new Boss(
    gameCanvas.width / 2,
    -120,
    bossData.name,
    bossData.hp,
    bossData.isMiniBoss,
    bossData.isFinalBoss
  );

  gameState.bossRef = boss;
  enemies.push(boss);

  if (boss.isAblys) {
    screenShake = 45;
    audio.playExplosion(true);
    showFloatingMessage('👑 ابر غول نهایی کل کهکشان «ابلیس و شیطان بزرگ» وارد شد! تمام نیروهای نور را آزاد کن!');
  } else if (boss.isTrump) {
    screenShake = 35;
    audio.playExplosion(true);
    showFloatingMessage('🔥 غول فوق‌پیشرفته زره‌پوش «ترامپ» وارد شد! از تمامی موشک‌های قرآن و اهل بیت استفاده کن!');
  } else if (boss.isNetanyahu) {
    screenShake = 25;
    audio.playExplosion(true);
    showFloatingMessage('⚡ غول شرارت و جنایت «نتانیاهو» وارد شد! نبرد حماسی و آتشین آغاز گردید!');
  } else {
    showFloatingMessage(`👿 غول ${bossData.name} وارد میدان شد!`);
  }
}

// --- Bullet Firing ---
function fireBullet() {
  if (gameState.activeScreen !== 'playing') return;

  const now = Date.now();
  const fireDelay = gameState.activePowerups.fastFire ? player.fireRate / 2 : player.fireRate;
  if (now - player.lastShot < fireDelay) return;

  player.lastShot = now;
  audio.playLaser();

  const isPower = !!gameState.activePowerups.powerBullet;
  const isMulti = !!gameState.activePowerups.multiShot;

  if (isMulti) {
    // 5-way barrage
    bullets.push(new Bullet(player.x - 24, player.y - 10, -3.5, -11, isPower));
    bullets.push(new Bullet(player.x - 12, player.y - 25, -1.8, -12, isPower));
    bullets.push(new Bullet(player.x, player.y - 32, 0, -13, isPower));
    bullets.push(new Bullet(player.x + 12, player.y - 25, 1.8, -12, isPower));
    bullets.push(new Bullet(player.x + 24, player.y - 10, 3.5, -11, isPower));
  } else {
    // Twin booster laser cannons
    bullets.push(new Bullet(player.x - 16, player.y - 20, 0, -12, isPower));
    bullets.push(new Bullet(player.x + 16, player.y - 20, 0, -12, isPower));
  }
}

// --- Classes ---

class Bullet {
  constructor(x, y, vx, vy, isPower = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = isPower ? 8 : 4;
    this.damage = isPower ? 3 : 1;
    this.color = isPower ? '#fbbf24' : '#38bdf8';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(1, this.radius - 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class EnemyBullet {
  constructor(x, y, vx, vy, isHeavy = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = isHeavy ? 8 : 6;
    this.color = isHeavy ? '#dc2626' : '#f97316';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bright inner core for glowing plasma effect
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(2, this.radius - 3), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Enemy {
  constructor(x, y, trait, speedMult) {
    this.x = x;
    this.y = y;
    this.name = trait.name;
    this.hp = trait.hp;
    this.maxHp = trait.hp;
    this.color = trait.color;
    this.radius = 28 + trait.hp * 4;
    this.speed = (trait.speed * 1.2 * speedMult);
    this.type = trait.type;
    this.isBoss = false;
    this.wobble = Math.random() * Math.PI * 2;
    this.rot = 0;
    this.lastShot = Date.now() + Math.random() * 2500;
  }

  update() {
    const timeMult = gameState.activePowerups.timeSlow ? 0.4 : 1.0;
    this.y += this.speed * timeMult;

    if (this.type === 'fast') {
      this.wobble += 0.08;
      this.x += Math.sin(this.wobble) * 2.5;
    }
    this.rot += 0.03;

    // From Level 5 onwards, enemy alien spaceships fire plasma lasers!
    if (gameState.currentLevel >= 5) {
      const now = Date.now();
      const shootInterval = Math.max(1300, 3500 - (gameState.currentLevel * 85));
      if (now - this.lastShot > shootInterval && this.y > 40 && this.y < gameCanvas.height - 120) {
        this.lastShot = now;
        this.shoot();
      }
    }
  }

  shoot() {
    audio.playLaser();
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const bSpeed = 4.0 + (gameState.currentLevel - 5) * 0.15;
    enemyBullets.push(new EnemyBullet(this.x, this.y + this.radius * 0.5, (dx / dist) * bSpeed, (dy / dist) * bSpeed));
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.shadowBlur = 14;
    ctx.shadowColor = this.color;

    const r = this.radius;

    // --- Draw Hyper-Realistic Alien Spaceship Body according to Type ---
    const flicker = Math.random() * 6;

    if (this.type === 'fast') {
      // 🚀 Sleek Needle Fighter (Fast Interceptor)
      // 1. Rear Engine Exhaust Thruster Flames pointing UP (-y)
      [-0.3, 0.3].forEach(ex => {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(r * (ex - 0.1), -r * 0.65);
        ctx.lineTo(r * ex, -r * (0.95 + flicker * 0.04));
        ctx.lineTo(r * (ex + 0.1), -r * 0.65);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(r * (ex - 0.05), -r * 0.65);
        ctx.lineTo(r * ex, -r * (0.8 + flicker * 0.03));
        ctx.lineTo(r * (ex + 0.05), -r * 0.65);
        ctx.closePath();
        ctx.fill();
      });

      // 2. Twin Metallic Side Booster Cylinders
      [-0.55, 0.55].forEach(bx => {
        const bGrad = ctx.createLinearGradient(r * (bx - 0.15), 0, r * (bx + 0.15), 0);
        bGrad.addColorStop(0, '#334155');
        bGrad.addColorStop(0.5, '#cbd5e1');
        bGrad.addColorStop(1, '#0f172a');

        ctx.fillStyle = bGrad;
        ctx.fillRect(r * bx - r * 0.15, -r * 0.6, r * 0.3, r * 0.7);

        // Booster Nose Cap
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(r * bx, r * 0.1, r * 0.15, 0, Math.PI);
        ctx.fill();
      });

      // 3. Main Central Needle Fuselage
      const bodyGrad = ctx.createLinearGradient(0, -r * 0.7, 0, r * 1.1);
      bodyGrad.addColorStop(0, '#0f172a');
      bodyGrad.addColorStop(0.4, this.color);
      bodyGrad.addColorStop(1, '#ffffff');

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(0, r * 1.15); // Nose pointing DOWN (+y)
      ctx.lineTo(-r * 0.35, r * 0.3);
      ctx.lineTo(-r * 0.95, -r * 0.35); // Swept wing left
      ctx.lineTo(-r * 0.25, -r * 0.7);
      ctx.lineTo(0, -r * 0.45);
      ctx.lineTo(r * 0.25, -r * 0.7);
      ctx.lineTo(r * 0.95, -r * 0.35); // Swept wing right
      ctx.lineTo(r * 0.35, r * 0.3);
      ctx.closePath();
      ctx.fill();

      // Wing Metallic Edge Trim
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 4. Forward Needle Cannon Tip Glow
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, r * 1.15, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Glossy Glass Cockpit Canopy Visor
      const domeGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.35);
      domeGrad.addColorStop(0, '#ffffff');
      domeGrad.addColorStop(0.6, '#38bdf8');
      domeGrad.addColorStop(1, '#0284c7');

      ctx.fillStyle = domeGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.2, r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'resistant' || this.type === 'hard') {
      // 🛡️ Heavy Armored Battleship (High HP Destroyer)
      // 1. Triple Heavy Thruster Exhausts pointing UP (-y)
      [-0.45, 0, 0.45].forEach(ex => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(r * (ex - 0.12), -r * 0.7);
        ctx.lineTo(r * ex, -r * (1.0 + flicker * 0.05));
        ctx.lineTo(r * (ex + 0.12), -r * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(r * (ex - 0.06), -r * 0.7);
        ctx.lineTo(r * ex, -r * (0.85 + flicker * 0.03));
        ctx.lineTo(r * (ex + 0.06), -r * 0.7);
        ctx.closePath();
        ctx.fill();
      });

      // 2. Heavy Armored Hull Body with Metallic Bevel Gradient
      const grad = ctx.createLinearGradient(-r, 0, r, 0);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.25, '#334155');
      grad.addColorStop(0.5, this.color);
      grad.addColorStop(0.75, '#334155');
      grad.addColorStop(1, '#0f172a');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, r * 1.05);          // Heavy Nose (+y)
      ctx.lineTo(-r * 0.6, r * 0.7);
      ctx.lineTo(-r * 1.05, 0);         // Left Shoulder Cannon Pod
      ctx.lineTo(-r * 0.85, -r * 0.75);
      ctx.lineTo(-r * 0.35, -r * 0.9);
      ctx.lineTo(0, -r * 0.55);
      ctx.lineTo(r * 0.35, -r * 0.9);
      ctx.lineTo(r * 0.85, -r * 0.75);
      ctx.lineTo(r * 1.05, 0);          // Right Shoulder Cannon Pod
      ctx.lineTo(r * 0.6, r * 0.7);
      ctx.closePath();
      ctx.fill();

      // Armor Outer Rim & Panel Lines
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Side Gun Cannon Barrels pointing DOWN (+y)
      [-0.95, 0.95].forEach(gx => {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(r * gx - 3, -r * 0.2, 6, r * 0.95);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(r * gx - 2, r * 0.75, 4, 5);
      });

      // 3. Menacing Alien Core Eye Lens
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, -r * 0.05, r * 0.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -r * 0.05, r * 0.15, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'explosive') {
      // 💥 Pulsating Plasma Doom Mine / Saucer Frigate
      // Dual Rear Engine Thrusters (-y)
      [-0.35, 0.35].forEach(ex => {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(r * ex, -r * 0.75, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
      });

      // Outer Rotating Spiked Alloy Shield
      ctx.save();
      ctx.rotate(this.rot);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      const spikes = 10;
      for (let i = 0; i < spikes; i++) {
        const angle = (i * Math.PI * 2) / spikes;
        const dist = i % 2 === 0 ? r * 1.1 : r * 0.75;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.fill();
      ctx.restore();

      // Volatile Plasma Core
      const plasGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.65);
      plasGrad.addColorStop(0, '#ffffff');
      plasGrad.addColorStop(0.4, '#f59e0b');
      plasGrad.addColorStop(1, '#ef4444');

      ctx.fillStyle = plasGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // 🛸 Standard Alien Stealth Space Fighter (Realistic Dual-Booster Jet)
      // 1. Dual Rear Jet Thruster Flames pointing UP (-y)
      [-0.28, 0.28].forEach(ex => {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(r * (ex - 0.1), -r * 0.6);
        ctx.lineTo(r * ex, -r * (0.95 + flicker * 0.05));
        ctx.lineTo(r * (ex + 0.1), -r * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(r * (ex - 0.05), -r * 0.6);
        ctx.lineTo(r * ex, -r * (0.8 + flicker * 0.03));
        ctx.lineTo(r * (ex + 0.05), -r * 0.6);
        ctx.closePath();
        ctx.fill();
      });

      // 2. Twin Side Booster Cylinders (White/Silver metallic)
      [-0.55, 0.55].forEach(bx => {
        const bGrad = ctx.createLinearGradient(r * (bx - 0.15), 0, r * (bx + 0.15), 0);
        bGrad.addColorStop(0, '#94a3b8');
        bGrad.addColorStop(0.5, '#ffffff');
        bGrad.addColorStop(1, '#475569');

        ctx.fillStyle = bGrad;
        ctx.fillRect(r * bx - r * 0.15, -r * 0.5, r * 0.3, r * 0.7);

        // Metallic Ring
        ctx.fillStyle = '#334155';
        ctx.fillRect(r * bx - r * 0.16, -r * 0.1, r * 0.32, r * 0.08);

        // Wing Fin at base
        const dir = bx < 0 ? -1 : 1;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(r * bx, -r * 0.2);
        ctx.lineTo(r * bx + dir * r * 0.35, -r * 0.5);
        ctx.lineTo(r * bx, -r * 0.45);
        ctx.closePath();
        ctx.fill();
      });

      // 3. Central Metallic Fuselage Body facing DOWN (+y)
      const sGrad = ctx.createLinearGradient(0, -r, 0, r);
      sGrad.addColorStop(0, '#1e1b4b');
      sGrad.addColorStop(0.4, this.color);
      sGrad.addColorStop(0.85, '#cbd5e1');
      sGrad.addColorStop(1, '#ffffff');

      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.moveTo(0, r * 1.05);           // Front Nose Tip (+y)
      ctx.lineTo(-r * 0.45, r * 0.4);
      ctx.lineTo(-r * 0.85, -r * 0.3);
      ctx.lineTo(-r * 0.3, -r * 0.7);   // Left wing top
      ctx.lineTo(0, -r * 0.45);          // Rear center
      ctx.lineTo(r * 0.3, -r * 0.7);    // Right wing top
      ctx.lineTo(r * 0.85, -r * 0.3);
      ctx.lineTo(r * 0.45, r * 0.4);
      ctx.closePath();
      ctx.fill();

      // Metallic Contour Stroke
      ctx.strokeStyle = '#a5b4fc';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Wing-tip Cannon Nozzles facing DOWN (+y)
      [-0.85, 0.85].forEach(cx => {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(r * cx - 2, -r * 0.3, 4, r * 0.6);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(r * cx - 1.5, r * 0.3, 3, 3);
      });

      // 4. Glowing Cockpit Glass Dome
      const domeGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.32);
      domeGrad.addColorStop(0, '#ffffff');
      domeGrad.addColorStop(0.6, '#38bdf8');
      domeGrad.addColorStop(1, '#0284c7');

      ctx.fillStyle = domeGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.32, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // White shine highlight on canopy glass
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.08, -r * 0.06, r * 0.12, r * 0.07, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // --- High-Contrast Vice Badge Banner ---
    ctx.save();
    ctx.font = 'bold 15px Vazirmatn, Tahoma, sans-serif';
    const textMetrics = ctx.measureText(this.name);
    const badgeW = Math.max(textMetrics.width + 22, 64);
    const badgeH = 26;
    const badgeX = this.x - badgeW / 2;
    const badgeY = this.y + Math.max(this.radius, 22) + 6;

    // Dark container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    const cr = 13;
    ctx.moveTo(badgeX + cr, badgeY);
    ctx.arcTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeH, cr);
    ctx.arcTo(badgeX + badgeW, badgeY + badgeH, badgeX, badgeY + badgeH, cr);
    ctx.arcTo(badgeX, badgeY + badgeH, badgeX, badgeY, cr);
    ctx.arcTo(badgeX, badgeY, badgeX + badgeW, badgeY, cr);
    ctx.closePath();
    ctx.fill();

    // Illuminated border matching vice color
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.stroke();

    // Crisp White Persian Vice Name Text
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.name, this.x, badgeY + badgeH / 2);

    // Health Bar if HP > 1
    if (this.maxHp > 1) {
      const barW = Math.max(badgeW, 50);
      const barH = 4;
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 12, barW, barH);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 12, barW * pct, barH);
    }

    ctx.restore();
  }
}

class Boss {
  constructor(x, y, name, hp, isMiniBoss = false, isFinalBoss = false) {
    this.x = x;
    this.y = y;
    this.targetY = 120;
    this.name = name;
    this.hp = hp;
    this.maxHp = hp;
    this.isAblys = name.includes('ابلیس');
    this.isTrump = name.includes('ترامپ');
    this.isNetanyahu = name.includes('نتانیاهو');
    this.isFinalBoss = isFinalBoss || this.isAblys || this.isTrump;
    this.isMiniBoss = isMiniBoss || this.isNetanyahu;

    this.radius = this.isAblys ? 94 : this.isTrump ? 86 : this.isNetanyahu ? 76 : isFinalBoss ? 72 : isMiniBoss ? 60 : 50;
    this.color = this.isAblys ? '#7e22ce' : this.isTrump ? '#dc2626' : this.isNetanyahu ? '#e11d48' : isFinalBoss ? '#dc2626' : isMiniBoss ? '#a855f7' : '#ea580c';
    this.isBoss = true;
    this.angle = 0;
    this.lastShot = 0;
    this.shotCount = 0;
  }

  update() {
    const hpPct = Math.max(0, this.hp / this.maxHp);

    // As health decreases (hpPct < 0.6), boss moves forward down into the screen (from y=120 down to y=270)
    let desiredY = 120;
    if (hpPct < 0.6) {
      desiredY = 120 + ((0.6 - hpPct) / 0.6) * 150; // Advances down towards center of screen
    }
    this.targetY = desiredY;

    // Smooth movement towards target Y
    if (Math.abs(this.y - this.targetY) > 1) {
      this.y += (this.targetY - this.y) * 0.06;
    } else {
      this.y = this.targetY;
    }

    // Horizontal swaying gets wider & faster when health is low (enraged)
    const enragedMult = hpPct < 0.3 ? 1.5 : 1.0;
    this.angle += ((this.isAblys || this.isTrump || this.isNetanyahu) ? 0.048 : 0.038) * enragedMult;
    const moveWidth = ((this.isAblys || this.isTrump || this.isNetanyahu) ? 0.44 : 0.38) * (hpPct < 0.4 ? 1.15 : 1.0);
    this.x = (gameCanvas.width / 2) + Math.sin(this.angle) * (gameCanvas.width * moveWidth);

    // Boss Firing Pattern (fires faster when enraged)
    const now = Date.now();
    let interval = this.isAblys ? 290 : this.isTrump ? 320 : this.isNetanyahu ? 360 : this.isFinalBoss ? 380 : this.isMiniBoss ? 550 : 700;
    if (hpPct < 0.3) interval = Math.floor(interval * 0.75); // Enraged firing rate

    if (now - this.lastShot > interval) {
      this.lastShot = now;
      this.shoot();
    }
  }

  shoot() {
    audio.playLaser();
    this.shotCount++;
    const bx = this.x;
    const by = this.y + this.radius * 0.6;

    if (this.isAblys) {
      // 👑 ABLYS (LEVEL 80 ULTIMATE BOSS): 25-Way Arc Barrage + 8 Homing Dark Plasma Torpedoes
      screenShake = Math.max(screenShake, 15);
      for (let i = -12; i <= 12; i++) {
        enemyBullets.push(new EnemyBullet(bx, by, i * 1.4, 5.8, true));
      }

      // 8 Heavy Homing Torpedoes
      const dx = player.x - bx;
      const dy = player.y - by;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = 7.2;
      [-50, -35, -20, -8, 8, 20, 35, 50].forEach(offset => {
        enemyBullets.push(new EnemyBullet(bx + offset, by, (dx / dist) * speed, (dy / dist) * speed, true));
      });

      // Every 2nd shot -> 32-bullet 360-degree Full Nova Ring Burst
      if (this.shotCount % 2 === 0) {
        const bulletsInRing = 32;
        for (let r = 0; r < bulletsInRing; r++) {
          const rang = (r * Math.PI * 2) / bulletsInRing;
          enemyBullets.push(new EnemyBullet(bx, by, Math.cos(rang) * 5.0, Math.sin(rang) * 5.0, true));
        }
      }

      // Every 3rd shot -> 24-bullet Double Rotating Spiral Cannon
      if (this.shotCount % 3 === 0) {
        for (let r = 0; r < 24; r++) {
          const rang = (r * Math.PI * 2) / 24 + this.angle;
          enemyBullets.push(new EnemyBullet(bx, by, Math.cos(rang) * 4.6, Math.sin(rang) * 4.6, true));
        }
      }

    } else if (this.isTrump) {
      // 🔥 TRAMP (FINAL BOSS): Ultra-Dense 21-Way Arc Barrage + 6 Heavy Homing Torpedoes
      screenShake = Math.max(screenShake, 12);
      for (let i = -10; i <= 10; i++) {
        enemyBullets.push(new EnemyBullet(bx, by, i * 1.5, 5.5, true));
      }

      // 6 Heavy Homing Torpedoes aimed at player position
      const dx = player.x - bx;
      const dy = player.y - by;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = 7.0;
      [-45, -25, -10, 10, 25, 45].forEach(offset => {
        enemyBullets.push(new EnemyBullet(bx + offset, by, (dx / dist) * speed, (dy / dist) * speed, true));
      });

      // Every 2nd shot -> 28-bullet 360-degree Full Nova Ring Burst
      if (this.shotCount % 2 === 0) {
        const bulletsInRing = 28;
        for (let r = 0; r < bulletsInRing; r++) {
          const rang = (r * Math.PI * 2) / bulletsInRing;
          const rvx = Math.cos(rang) * 4.8;
          const rvy = Math.sin(rang) * 4.8;
          enemyBullets.push(new EnemyBullet(bx, by, rvx, rvy, true));
        }
      }

      // Every 3rd shot -> 20-bullet Rotating Double Spiral Cannon
      if (this.shotCount % 3 === 0) {
        for (let r = 0; r < 20; r++) {
          const rang = (r * Math.PI * 2) / 20 + this.angle;
          enemyBullets.push(new EnemyBullet(bx, by, Math.cos(rang) * 4.4, Math.sin(rang) * 4.4, true));
        }
      }

    } else if (this.isNetanyahu) {
      // ⚡ NETANYAHU (LEVEL 29 BOSS): 17-Way Arc Spread + 4 Heavy Target Homing Torpedoes
      screenShake = Math.max(screenShake, 9);
      for (let i = -8; i <= 8; i++) {
        enemyBullets.push(new EnemyBullet(bx, by, i * 1.6, 5.2, true));
      }

      const dx = player.x - bx;
      const dy = player.y - by;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = 6.8;
      [-35, -12, 12, 35].forEach(offset => {
        enemyBullets.push(new EnemyBullet(bx + offset, by, (dx / dist) * speed, (dy / dist) * speed, true));
      });

      // Every 2nd shot -> 24-bullet Full Nova Ring Burst
      if (this.shotCount % 2 === 0) {
        const bulletsInRing = 24;
        for (let r = 0; r < bulletsInRing; r++) {
          const rang = (r * Math.PI * 2) / bulletsInRing;
          enemyBullets.push(new EnemyBullet(bx, by, Math.cos(rang) * 4.5, Math.sin(rang) * 4.5, true));
        }
      }

    } else if (this.isFinalBoss) {
      // 💥 Other Final Bosses: 15-Way Arc Barrage + 4 Heavy Homing Plasma Torpedoes
      for (let i = -7; i <= 7; i++) {
        enemyBullets.push(new EnemyBullet(bx, by, i * 1.6, 5.2));
      }

      const dx = player.x - bx;
      const dy = player.y - by;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = 6.5;
      [-35, -12, 12, 35].forEach(offset => {
        enemyBullets.push(new EnemyBullet(bx + offset, by, (dx / dist) * speed, (dy / dist) * speed, true));
      });

      if (this.shotCount % 2 === 0) {
        for (let r = 0; r < 20; r++) {
          const rang = (r * Math.PI * 2) / 20;
          enemyBullets.push(new EnemyBullet(bx, by, Math.cos(rang) * 4.5, Math.sin(rang) * 4.5, true));
        }
      }

    } else if (this.isMiniBoss) {
      // ⚡ Mini Boss: 11-Way Fan Spread + Double Heavy Side Cannons
      for (let i = -5; i <= 5; i++) {
        enemyBullets.push(new EnemyBullet(bx, by, i * 1.5, 4.8));
      }
      enemyBullets.push(new EnemyBullet(bx - 40, by, -1.2, 5.2, true));
      enemyBullets.push(new EnemyBullet(bx + 40, by, 1.2, 5.2, true));

      if (this.shotCount % 3 === 0) {
        for (let r = 0; r < 16; r++) {
          const rang = (r * Math.PI * 2) / 16 + this.angle;
          enemyBullets.push(new EnemyBullet(bx, by, Math.cos(rang) * 4.2, Math.sin(rang) * 4.2, true));
        }
      }

    } else {
      // 🚀 Regular Boss: 7-Way Plasma Fan Spread + Direct Target Shot
      for (let i = -3; i <= 3; i++) {
        enemyBullets.push(new EnemyBullet(bx, by, i * 1.8, 4.5));
      }
      const dx = player.x - bx;
      const dy = player.y - by;
      const dist = Math.hypot(dx, dy) || 1;
      enemyBullets.push(new EnemyBullet(bx, by, (dx / dist) * 5.5, (dy / dist) * 5.5, true));

      if (this.shotCount % 3 === 0) {
        for (let r = 0; r < 12; r++) {
          const rang = (r * Math.PI * 2) / 12;
          enemyBullets.push(new EnemyBullet(bx, by, Math.cos(rang) * 4.0, Math.sin(rang) * 4.0, true));
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const r = this.radius;
    const hpPct = Math.max(0, this.hp / this.maxHp);
    const isEnraged = hpPct < 0.4;

    // Glowing Threat Plasma Aura Rings around Boss
    const auraColor = isEnraged ? '#ef4444' : this.color;
    ctx.strokeStyle = auraColor;
    ctx.lineWidth = isEnraged ? 5 : 3;
    ctx.shadowBlur = isEnraged ? 45 : 30;
    ctx.shadowColor = auraColor;
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.15 + Math.sin(Date.now() * (isEnraged ? 0.018 : 0.005)) * (isEnraged ? 0.15 : 0.08)), 0, Math.PI * 2);
    ctx.stroke();

    if (isEnraged) {
      // Extra inner danger ring when low HP and advancing forward
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Boss Dreadnought Flagship Hull
    const grad = ctx.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, this.color);
    grad.addColorStop(1, '#000000');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.9);
    ctx.lineTo(-r * 0.7, r * 0.4);
    ctx.lineTo(-r * 1.1, -r * 0.2);
    ctx.lineTo(-r * 0.6, -r * 0.8);
    ctx.lineTo(0, -r * 0.4);
    ctx.lineTo(r * 0.6, -r * 0.8);
    ctx.lineTo(r * 1.1, -r * 0.2);
    ctx.lineTo(r * 0.7, r * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isEnraged ? '#ef4444' : '#fbbf24';
    ctx.lineWidth = isEnraged ? 4 : 3;
    ctx.stroke();

    // Central Boss Plasma Core
    ctx.fillStyle = isEnraged ? '#ef4444' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, r * (isEnraged ? 0.4 : 0.3), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Boss Illuminated Name Badge
    ctx.save();
    ctx.font = 'bold 17px Vazirmatn, Tahoma, sans-serif';
    const badgeText = isEnraged ? `🚨 ${this.name} (خشمگین!)` : `👿 ${this.name}`;
    const textMetrics = ctx.measureText(badgeText);
    const badgeW = textMetrics.width + 30;
    const badgeH = 30;
    const badgeX = this.x - badgeW / 2;
    const badgeY = this.y + this.radius + 10;

    ctx.fillStyle = isEnraged ? 'rgba(153, 27, 27, 0.95)' : 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    const cr = 15;
    ctx.moveTo(badgeX + cr, badgeY);
    ctx.arcTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeH, cr);
    ctx.arcTo(badgeX + badgeW, badgeY + badgeH, badgeX, badgeY + badgeH, cr);
    ctx.arcTo(badgeX, badgeY + badgeH, badgeX, badgeY, cr);
    ctx.arcTo(badgeX, badgeY, badgeX + badgeW, badgeY, cr);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isEnraged ? '#fde047' : '#fbbf24';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = isEnraged ? '#fde047' : '#fbbf24';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, this.x, badgeY + badgeH / 2);

    // Top Screen Health Bar
    const barW = Math.min(gameCanvas.width * 0.7, 400);
    const barH = 14;
    const barX = (gameCanvas.width - barW) / 2;
    const barY = 65;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = isEnraged ? '#ef4444' : this.color;
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.font = 'bold 12px Vazirmatn, Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`سلامتی غول (${this.name}): ${this.hp} / ${this.maxHp}`, gameCanvas.width / 2, barY - 8);

    ctx.restore();
  }
}

class PowerUp {
  constructor(x, y, reward) {
    this.x = x;
    this.y = y;
    this.name = reward.name;
    this.power = reward.power;
    this.color = reward.color;
    this.radius = 22;
    this.vy = 2;
  }

  update() {
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Vazirmatn, Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.name, this.x, this.y);

    ctx.restore();
  }
}

class Particle {
  constructor(x, y, color, scale = 1) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8 * scale;
    this.vy = (Math.random() - 0.5) * 8 * scale;
    this.radius = (Math.random() * 3.5 + 1) * scale;
    this.color = color;
    this.alpha = 1;
    this.decay = (Math.random() * 0.025 + 0.015) / scale;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function createExplosion(x, y, color, count = 20, scale = 1) {
  for (let i = 0; i < count; i++) {
    explosions.push(new Particle(x, y, color, scale));
  }
}

function triggerBossExplosion(x, y, color, onComplete) {
  // Ensure explosion coordinates are centered visibly inside the game screen
  const expX = Math.max(70, Math.min(gameCanvas.width - 70, x));
  const expY = Math.max(120, Math.min(gameCanvas.height - 160, y));

  screenShake = 48;
  audio.playExplosion(true);

  // Big initial supernova shockwave bursts right inside the screen
  createExplosion(expX, expY, '#ffffff', 90, 3.2);
  createExplosion(expX, expY, color, 110, 2.6);
  createExplosion(expX, expY, '#ef4444', 80, 2.2);
  createExplosion(expX, expY, '#fde047', 80, 2.2);

  showFloatingMessage('💥 غول در آتش انفجار نابود شد!');

  // Staggered secondary explosion waves spread across the boss area inside the screen
  let burstCount = 0;
  const burstInterval = setInterval(() => {
    burstCount++;
    const rx = expX + (Math.random() - 0.5) * 130;
    const ry = expY + (Math.random() - 0.5) * 130;
    screenShake = 28;
    audio.playExplosion(false);
    createExplosion(rx, ry, Math.random() < 0.5 ? '#fde047' : (Math.random() < 0.5 ? '#ef4444' : color), 45, 1.8);

    if (burstCount >= 8) {
      clearInterval(burstInterval);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
    }
  }, 130);
}

// --- Main Game Loop ---
function gameLoop() {
  if (gameState.activeScreen !== 'playing') return;

  updateGame();
  drawGame();

  gameState.gameLoopId = requestAnimationFrame(gameLoop);
}

function updateGame() {
  // Screen shake decay
  if (screenShake > 0) screenShake *= 0.85;

  // Move Player with smooth velocity & acceleration (Maneuverability)
  if (player.isMovingLeft) player.vx -= player.acc;
  if (player.isMovingRight) player.vx += player.acc;
  if (player.isMovingUp) player.vy -= player.acc;
  if (player.isMovingDown) player.vy += player.acc;

  player.vx *= player.friction;
  player.vy *= player.friction;

  player.x += player.vx;
  player.y += player.vy;

  // Dynamic Banking Tilt
  player.tilt = player.vx * 0.035;

  clampPlayerPosition();

  // Continuous Shooting on touch/mouse hold
  if (player.isFiring) {
    fireBullet();
  }

  // Update Bullets
  bullets.forEach(b => b.update());
  bullets = bullets.filter(b => b.y > -20);

  // Update Enemy Bullets
  enemyBullets.forEach(eb => eb.update());
  enemyBullets = enemyBullets.filter(eb => eb.y < gameCanvas.height + 20);

  // Update Powerups
  powerUps.forEach(p => p.update());
  powerUps = powerUps.filter(p => p.y < gameCanvas.height + 40);

  // Update Particles
  explosions.forEach(p => p.update());
  explosions = explosions.filter(p => p.alpha > 0);

  // Update Enemies & Boss
  enemies.forEach(e => e.update());

  // Check if waves need spawning
  if (enemies.length === 0 && !gameState.bossActive) {
    const currentLvlData = levelsData[gameState.currentLevel - 1];
    if (gameState.levelKills >= currentLvlData.targetKillCount) {
      spawnBoss();
    } else {
      spawnWave();
    }
  }

  checkCollisions();
  updatePowerupTimers();
}

function checkCollisions() {
  const levelData = levelsData[gameState.currentLevel - 1];

  // 1. Bullet vs Enemy/Boss
  for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
    const bullet = bullets[bIdx];

    for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
      const enemy = enemies[eIdx];

      const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
      if (dist < bullet.radius + enemy.radius) {
        bullets.splice(bIdx, 1);
        enemy.hp -= bullet.damage;
        createExplosion(bullet.x, bullet.y, '#ffffff', 5);

        if (enemy.hp <= 0) {
          enemies.splice(eIdx, 1);

          if (enemy.isBoss) {
            enemyBullets = []; // Clear remaining enemy bullets during victory fireworks
            gameState.bossActive = false;
            gameState.score += 500;
            if (!gameState.stats) gameState.stats = {};
            gameState.stats.bossesDefeated = (gameState.stats.bossesDefeated || 0) + 1;
            if (gameState.lives >= 3) {
              gameState.stats.flawlessBosses = (gameState.stats.flawlessBosses || 0) + 1;
            }
            checkAchievements();
            
            triggerBossExplosion(enemy.x, enemy.y, enemy.color, () => {
              triggerLevelWin();
            });
          } else {
            audio.playExplosion(false);
            createExplosion(enemy.x, enemy.y, enemy.color, 25);
            gameState.score += 20 * enemy.maxHp;
            gameState.levelKills++;
            gameState.totalKills++;
            checkAchievements();

            // Every 20 total kills -> spawn guaranteed Virtue Power-up
            if (gameState.totalKills % 20 === 0 || Math.random() < levelData.rewardChance) {
              const reward = goodRewardsData[Math.floor(Math.random() * goodRewardsData.length)];
              powerUps.push(new PowerUp(enemy.x, enemy.y, reward));
            }
          }

          updateHUD();
        }
        break;
      }
    }
  }

  // 2. Player vs Enemy/Boss / Bottom Danger line
  for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
    const enemy = enemies[eIdx];

    // Enemy touches player or reaches bottom danger zone
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    const hitBottom = !enemy.isBoss && enemy.y > gameCanvas.height - 70;

    if (dist < player.width / 2 + enemy.radius || hitBottom) {
      if (!hitBottom) {
        createExplosion(enemy.x, enemy.y, enemy.color, 20);
        enemies.splice(eIdx, 1);
      } else {
        createExplosion(enemy.x, gameCanvas.height - 50, '#ef4444', 15);
        enemies.splice(eIdx, 1);
      }

      takeDamage();
    }
  }

  // 3. Player vs Enemy Bullets
  for (let ebIdx = enemyBullets.length - 1; ebIdx >= 0; ebIdx--) {
    const eb = enemyBullets[ebIdx];
    const dist = Math.hypot(player.x - eb.x, player.y - eb.y);
    if (dist < player.width / 2 + eb.radius) {
      enemyBullets.splice(ebIdx, 1);
      createExplosion(eb.x, eb.y, '#ef4444', 10);
      takeDamage();
    }
  }

  // 4. Player vs PowerUp
  for (let pIdx = powerUps.length - 1; pIdx >= 0; pIdx--) {
    const p = powerUps[pIdx];
    const dist = Math.hypot(player.x - p.x, player.y - p.y);
    if (dist < player.width / 2 + p.radius) {
      audio.playPowerup();
      applyReward(p);
      powerUps.splice(pIdx, 1);
    }
  }
}

function takeDamage() {
  if (gameState.activePowerups.shield) return; // Invincible shield active

  screenShake = 15;
  gameState.lives--;
  audio.playLoss();
  updateHUD();

  if (gameState.lives <= 0) {
    triggerGameOver();
  }
}

function applyReward(powerup) {
  gameState.totalRewardsCollected++;
  gameState.goodDeedsCount = (gameState.goodDeedsCount || 0) + 1;
  if (!gameState.stats) gameState.stats = {};
  gameState.stats.goodDeedsInCurrentLevel = (gameState.stats.goodDeedsInCurrentLevel || 0) + 1;
  checkAchievements();
  audio.playPowerup();

  // Every 20 Good Deeds -> Recharge 1 additional missile for Quran & Ahl al-Bayt
  if (gameState.goodDeedsCount % 20 === 0) {
    gameState.quranCharges = (gameState.quranCharges || 0) + 1;
    gameState.ahlulbaytCharges = (gameState.ahlulbaytCharges || 0) + 1;
    setTimeout(() => {
      showFloatingMessage('✨ ۲۰ کار خوب دریافت شد! موشک‌های قرآن و اهل بیت شارژ شدند!');
    }, 400);
  }

  if (powerup.power === 'radialExplosion') {
    createExplosion(player.x, player.y, '#38bdf8', 60);
    enemies.forEach(e => {
      if (!e.isBoss) {
        e.hp = 0;
        createExplosion(e.x, e.y, e.color, 20);
        gameState.score += 20;
        gameState.levelKills++;
        gameState.totalKills++;
      } else {
        e.hp -= 10;
      }
    });
    enemies = enemies.filter(e => e.hp > 0);
  } else {
    gameState.activePowerups[powerup.power] = Date.now() + 8000; // 8 seconds duration
  }

  showFloatingMessage(`✨ ${powerup.name}: ${goodRewardsData.find(g => g.name === powerup.name)?.desc || ''}`);
  updateHUD();
  updateMissileUI();
}

function updateMissileUI() {
  const quranCountEl = document.getElementById('quranBadgeCount');
  const ahlulbaytCountEl = document.getElementById('ahlulbaytBadgeCount');
  const goodDeedsProgressEl = document.getElementById('goodDeedsProgress');

  const quranBtn = document.getElementById('btnQuranMissile');
  const ahlulbaytBtn = document.getElementById('btnAhlulbaytMissile');

  const qCount = gameState.quranCharges || 0;
  const aCount = gameState.ahlulbaytCharges || 0;
  const gdCount = (gameState.goodDeedsCount || 0) % 20;

  if (quranCountEl) quranCountEl.innerText = qCount.toLocaleString('fa-IR');
  if (ahlulbaytCountEl) ahlulbaytCountEl.innerText = aCount.toLocaleString('fa-IR');
  if (goodDeedsProgressEl) goodDeedsProgressEl.innerText = `${gdCount.toLocaleString('fa-IR')} / ۲۰`;

  if (quranBtn) {
    quranBtn.disabled = qCount <= 0;
    if (qCount <= 0) quranBtn.classList.add('empty');
    else quranBtn.classList.remove('empty');
  }

  if (ahlulbaytBtn) {
    ahlulbaytBtn.disabled = aCount <= 0;
    if (aCount <= 0) ahlulbaytBtn.classList.add('empty');
    else ahlulbaytBtn.classList.remove('empty');
  }
}

function activateQuranMissile() {
  if (gameState.activeScreen !== 'playing') return;
  if (!gameState.quranCharges || gameState.quranCharges <= 0) return;

  gameState.quranCharges--;
  updateMissileUI();
  if (gameState.stats) gameState.stats.quranMissilesUsed = (gameState.stats.quranMissilesUsed || 0) + 1;
  checkAchievements();

  screenShake = 55;
  audio.playExplosion(true);

  // Clear all enemy bullets on screen instantly
  enemyBullets = [];

  // Radiant Golden Divine Beam of Holy Quran
  createExplosion(gameCanvas.width / 2, gameCanvas.height / 2, '#34d399', 140, 3.5);
  createExplosion(gameCanvas.width / 2, gameCanvas.height / 3, '#fde047', 100, 2.8);
  createExplosion(gameCanvas.width / 2, (gameCanvas.height * 2) / 3, '#10b981', 100, 2.8);

  enemies.forEach(e => {
    if (!e.isBoss) {
      e.hp -= 70;
    } else {
      e.hp -= 140;
    }
    createExplosion(e.x, e.y, e.color, 35);
  });

  enemies = enemies.filter(e => {
    if (e.hp <= 0) {
      if (e.isBoss) {
        gameState.bossActive = false;
        gameState.score += 600;
        triggerBossExplosion(e.x, e.y, e.color, () => triggerLevelWin());
        return false;
      }
      audio.playExplosion(false);
      gameState.score += 25 * e.maxHp;
      gameState.levelKills++;
      gameState.totalKills++;
      return false;
    }
    return true;
  });

  showFloatingMessage('📖 صاعقه نورانی قرآن کریم نفوذ کرد! (انهدام گلوله‌ها & آسیب شدید)');
  updateHUD();
}

function activateAhlulbaytMissile() {
  if (gameState.activeScreen !== 'playing') return;
  if (!gameState.ahlulbaytCharges || gameState.ahlulbaytCharges <= 0) return;

  gameState.ahlulbaytCharges--;
  updateMissileUI();
  if (gameState.stats) gameState.stats.ahlulbaytMissilesUsed = (gameState.stats.ahlulbaytMissilesUsed || 0) + 1;
  checkAchievements();

  screenShake = 50;
  audio.playExplosion(true);

  // Clear all enemy bullets on screen instantly
  enemyBullets = [];

  // Grant 10 Seconds Divine Invulnerability Shield
  gameState.activePowerups.shield = Date.now() + 10000;

  // 360 Radial Celestial Shockwave of Ahl al-Bayt
  createExplosion(player.x, player.y, '#c084fc', 160, 4.0);
  createExplosion(player.x, player.y, '#f59e0b', 120, 3.0);
  createExplosion(gameCanvas.width / 2, gameCanvas.height / 2, '#a855f7', 100, 2.5);

  enemies.forEach(e => {
    if (!e.isBoss) {
      e.hp = 0;
    } else {
      e.hp -= 180;
    }
    createExplosion(e.x, e.y, e.color, 40);
  });

  enemies = enemies.filter(e => {
    if (e.hp <= 0) {
      if (e.isBoss) {
        gameState.bossActive = false;
        gameState.score += 600;
        triggerBossExplosion(e.x, e.y, e.color, () => triggerLevelWin());
        return false;
      }
      audio.playExplosion(false);
      gameState.score += 25 * e.maxHp;
      gameState.levelKills++;
      gameState.totalKills++;
      return false;
    }
    return true;
  });

  showFloatingMessage('✨ عنایت و حمایت اهل بیت (ع)! (سپر الهی ۱۰ ثانیه‌ای & انهدام دشمنان)');
  updateHUD();
}

function showFloatingMessage(msg) {
  const container = document.getElementById('powerupContainer');
  const badge = document.createElement('div');
  badge.className = 'powerup-badge';
  badge.innerText = msg;
  container.appendChild(badge);

  setTimeout(() => {
    badge.remove();
  }, 3000);
}

function updatePowerupTimers() {
  const now = Date.now();
  for (const key in gameState.activePowerups) {
    if (gameState.activePowerups[key] < now) {
      delete gameState.activePowerups[key];
    }
  }
}

function updateHUD() {
  document.getElementById('hudLevel').innerText = gameState.currentLevel.toLocaleString('fa-IR');
  document.getElementById('hudScore').innerText = gameState.score.toLocaleString('fa-IR');
  document.getElementById('hudKills').innerText = gameState.totalKills.toLocaleString('fa-IR');

  const zone = getCurrentZone(gameState.currentLevel);
  const zoneHudEl = document.getElementById('hudZoneName');
  if (zoneHudEl) {
    zoneHudEl.innerText = `🌌 ${zone.name}`;
  }

  const hearts = '❤️'.repeat(Math.max(0, gameState.lives));
  document.getElementById('hudLives').innerText = hearts;

  const currentLevelData = levelsData[gameState.currentLevel - 1];
  const pct = Math.min(100, (gameState.levelKills / currentLevelData.targetKillCount) * 100);
  document.getElementById('levelProgressBar').style.width = `${pct}%`;
}

// --- Draw Canvas ---
function drawGame() {
  gameCtx.save();

  // Handle Screen Shake
  if (screenShake > 0) {
    const rx = (Math.random() - 0.5) * screenShake;
    const ry = (Math.random() - 0.5) * screenShake;
    gameCtx.translate(rx, ry);
  }

  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  // Draw Player
  drawPlayer(gameCtx);

  // Draw Bullets
  bullets.forEach(b => b.draw(gameCtx));
  enemyBullets.forEach(eb => eb.draw(gameCtx));

  // Draw Enemies & Boss
  enemies.forEach(e => e.draw(gameCtx));

  // Draw Powerups
  powerUps.forEach(p => p.draw(gameCtx));

  // Draw Explosions
  explosions.forEach(p => p.draw(gameCtx));

  gameCtx.restore();
}

function drawPlayer(ctx) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.tilt);

  // --- 1. Celestial Emerald & Gold Plasma Thruster Exhaust Flames ---
  const flicker = Math.random() * 8;

  // Center main thruster flame (Golden-Emerald glow)
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(-8, 26);
  ctx.lineTo(0, 48 + flicker);
  ctx.lineTo(8, 26);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(-5, 26);
  ctx.lineTo(0, 38 + flicker * 0.5);
  ctx.lineTo(5, 26);
  ctx.closePath();
  ctx.fill();

  // Side booster thruster flames (Golden Red)
  [-18, 18].forEach(bx => {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(bx - 3, 24);
    ctx.lineTo(bx, 35 + flicker * 0.6);
    ctx.lineTo(bx + 3, 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(bx, 24, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- 2. Aerodynamic Swept Wings with Iranian Flag Tricolor (Green, White, Red) ---
  // Left Wing (-x) & Right Wing (+x)
  [-1, 1].forEach(side => {
    ctx.save();
    ctx.scale(side, 1);

    // Green Top Wing Panel
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.moveTo(10, -18);
    ctx.lineTo(28, -6);
    ctx.lineTo(22, 2);
    ctx.lineTo(10, -4);
    ctx.closePath();
    ctx.fill();

    // White Middle Wing Panel
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(10, -4);
    ctx.lineTo(22, 2);
    ctx.lineTo(20, 14);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();

    // Red Bottom Wing Panel
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(20, 14);
    ctx.lineTo(15, 24);
    ctx.lineTo(10, 20);
    ctx.closePath();
    ctx.fill();

    // Wingtip Golden Cannon Mount & Laser Tip
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(24, -12, 3, 16);
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(25.5, -13, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Silver Metallic Wing Rim Outline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, -18);
    ctx.lineTo(28, -6);
    ctx.lineTo(15, 24);
    ctx.lineTo(10, 20);
    ctx.stroke();

    ctx.restore();
  });

  // --- 3. Side Boosters (Metallic Chrome Cylinders) ---
  [-18, 18].forEach(bx => {
    const bGrad = ctx.createLinearGradient(bx - 5, 0, bx + 5, 0);
    bGrad.addColorStop(0, '#94a3b8');
    bGrad.addColorStop(0.5, '#ffffff');
    bGrad.addColorStop(1, '#64748b');

    ctx.fillStyle = bGrad;
    ctx.fillRect(bx - 5, -8, 10, 32);

    // Booster Top Cap (Emerald Green Dome)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(bx, -8, 5, Math.PI, 0);
    ctx.fill();

    // Metallic Ring
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(bx - 5.5, 8, 11, 3);
  });

  // --- 4. Main Fuselage Body (Iranian Flag Tricolor Gradient & Emblem) ---
  ctx.shadowBlur = 16;
  ctx.shadowColor = '#10b981';

  // Nose (Top Front - Emerald Green)
  const noseGrad = ctx.createLinearGradient(0, -38, 0, -12);
  noseGrad.addColorStop(0, '#047857');
  noseGrad.addColorStop(0.5, '#10b981');
  noseGrad.addColorStop(1, '#34d399');

  ctx.fillStyle = noseGrad;
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.quadraticCurveTo(11, -26, 11, -12);
  ctx.lineTo(-11, -12);
  ctx.quadraticCurveTo(-11, -26, 0, -38);
  ctx.closePath();
  ctx.fill();

  // Nose Cone Tip (Golden Alloy)
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, -36, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // White Middle Body Section
  const midGrad = ctx.createLinearGradient(-11, 0, 11, 0);
  midGrad.addColorStop(0, '#e2e8f0');
  midGrad.addColorStop(0.3, '#ffffff');
  midGrad.addColorStop(0.7, '#ffffff');
  midGrad.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = midGrad;
  ctx.fillRect(-11, -12, 22, 22);

  // Red Rear Body Section
  const rearGrad = ctx.createLinearGradient(0, 10, 0, 26);
  rearGrad.addColorStop(0, '#ef4444');
  rearGrad.addColorStop(0.7, '#dc2626');
  rearGrad.addColorStop(1, '#991b1b');

  ctx.fillStyle = rearGrad;
  ctx.beginPath();
  ctx.moveTo(-11, 10);
  ctx.lineTo(11, 10);
  ctx.lineTo(11, 24);
  ctx.quadraticCurveTo(0, 28, -11, 24);
  ctx.closePath();
  ctx.fill();

  // Golden Geometric Border Stripes (Separator Lines)
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-11.5, -13, 23, 2.5);
  ctx.fillRect(-11.5, 9, 23, 2.5);

  // Outer Ship Hull Metallic Trim
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.lineTo(11, -12);
  ctx.lineTo(11, 24);
  ctx.lineTo(-11, 24);
  ctx.lineTo(-11, -12);
  ctx.closePath();
  ctx.stroke();

  // --- 5. Cockpit Canopy & Golden Emblem of Iran ---
  // Glass Cockpit (Cyan-Gold Visor)
  const domeGrad = ctx.createRadialGradient(0, -6, 1, 0, -6, 8);
  domeGrad.addColorStop(0, '#ffffff');
  domeGrad.addColorStop(0.5, '#fbbf24');
  domeGrad.addColorStop(1, '#0284c7');

  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.ellipse(0, -6, 6, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Golden Sacred Emblem in center of White section
  ctx.save();
  ctx.translate(0, 0);
  ctx.fillStyle = '#da291c';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#fbbf24';

  // Central Emblem Crescent Crescent motif
  ctx.beginPath();
  ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- 6. Shield Powerup Ring (Golden Green & White Protection Forcefield) ---
  if (gameState.activePowerups.shield) {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.5;
    ctx.shadowBlur = 24;
    ctx.shadowColor = '#fde047';
    ctx.beginPath();
    ctx.arc(0, -3, 44, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -3, 47, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// --- Game Over / Level Win / Pause Logic ---
function togglePause() {
  if (gameState.activeScreen === 'playing') {
    gameState.activeScreen = 'paused';
    audio.stopBGM();
    showModal('pauseModal');
  } else if (gameState.activeScreen === 'paused') {
    gameState.activeScreen = 'playing';
    hideModal('pauseModal');
    audio.updateBGMForLevel(gameState.currentLevel);
    gameState.gameLoopId = requestAnimationFrame(gameLoop);
  }
}

function triggerLevelWin() {
  audio.stopBGM();
  audio.playWin();
  gameState.activeScreen = 'win';
  cancelAnimationFrame(gameState.gameLoopId);

  // Calculate Stars
  const stars = gameState.lives === 3 ? 3 : gameState.lives === 2 ? 2 : 1;
  gameState.starsEarned[gameState.currentLevel] = Math.max(
    gameState.starsEarned[gameState.currentLevel] || 0,
    stars
  );

  // Unlock next level (all 80 levels)
  if (gameState.currentLevel >= gameState.unlockedLevel && gameState.unlockedLevel < levelsData.length) {
    gameState.unlockedLevel = gameState.currentLevel + 1;
  }

  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
  }

  checkAchievements();
  saveProgress();

  document.getElementById('winScore').innerText = gameState.score.toLocaleString('fa-IR');
  document.getElementById('winKills').innerText = gameState.levelKills.toLocaleString('fa-IR');
  document.getElementById('winRewardsCount').innerText = gameState.totalRewardsCollected.toLocaleString('fa-IR');

  const starElements = document.querySelectorAll('.win-stars .star');
  starElements.forEach((el, idx) => {
    el.style.opacity = idx < stars ? '1' : '0.2';
  });

  showModal('levelWinModal');
}

function triggerGameOver() {
  audio.stopBGM();
  audio.playLoss();
  gameState.activeScreen = 'loss';
  cancelAnimationFrame(gameState.gameLoopId);

  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
  }
  saveProgress();

  document.getElementById('lossScore').innerText = gameState.score.toLocaleString('fa-IR');
  document.getElementById('lossLevel').innerText = gameState.currentLevel.toLocaleString('fa-IR');

  showModal('gameOverModal');
}

function showFinalVictory() {
  audio.stopBGM();
  gameState.activeScreen = 'final';
  audio.playWin();

  let earnedStars = 0;
  for (let i = 1; i <= levelsData.length; i++) {
    earnedStars += (gameState.starsEarned[i] || 0);
  }
  const maxStars = levelsData.length * 3;

  document.getElementById('finalScore').innerText = gameState.score.toLocaleString('fa-IR');
  document.getElementById('finalKills').innerText = gameState.totalKills.toLocaleString('fa-IR');
  document.getElementById('finalRewards').innerText = gameState.totalRewardsCollected.toLocaleString('fa-IR');

  const starsEl = document.getElementById('finalStars');
  if (starsEl) {
    starsEl.innerText = `${earnedStars.toLocaleString('fa-IR')} / ${maxStars.toLocaleString('fa-IR')}`;
  }

  showModal('finalVictoryModal');
}
