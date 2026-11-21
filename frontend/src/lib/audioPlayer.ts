import * as Tone from "tone";

export interface PlaybackEvent {
  _id?: number;
  time: number;
  duration: number;
  midi: number;
  velocity: number;
  noteName?: string;
  partIndex?: number;
}

export type InstrumentType = "piano" | "epiano" | "strings" | "organ" | "celesta" | "synth";

export class MidiAudioPlayer {
  synth: Tone.PolySynth<any> | null = null;
  reverb: Tone.Freeverb | null = null;
  instrumentFx: any = null;
  events: PlaybackEvent[] = [];
  isPlaying: boolean = false;
  isPaused: boolean = false;
  currentTime: number = 0;
  duration: number = 0;
  bpm: number = 120.0;
  speed: number = 1.0;
  volume: number = 0.85;
  instrument: InstrumentType = "piano";
  sustainPedal: boolean = true;
  scheduledNoteIds: Set<number> = new Set();
  schedulerTimer: NodeJS.Timeout | null = null;
  visualAnimFrame: number | null = null;
  startTime: number | null = null;
  onProgressCallback: ((curr: number, dur: number) => void) | null = null;
  onStateChangeCallback: ((state: "playing" | "paused" | "stopped") => void) | null = null;
  osmd: any = null;
  currentCursorIndex: number = 0;
  cursorTimestamps: number[] = [];

  async initAudio(): Promise<void> {
    if (this.synth) return;
    await Tone.start();

    // Stereo Concert Hall Reverb
    this.reverb = new Tone.Freeverb({
      roomSize: 0.65,
      dampening: 2800,
    }).toDestination();
    this.reverb.wet.value = 0.22;

    this._buildInstrumentSynth();
    this.setVolume(this.volume);
  }

  _buildInstrumentSynth(): void {
    if (this.synth) {
      try {
        this.synth.releaseAll();
        this.synth.dispose();
      } catch (e) {}
      this.synth = null;
    }

    if (this.instrumentFx) {
      try {
        if (Array.isArray(this.instrumentFx)) {
          this.instrumentFx.forEach((fx) => fx.dispose());
        } else {
          this.instrumentFx.dispose();
        }
      } catch (e) {}
      this.instrumentFx = null;
    }

    if (!this.reverb) return;
    const releaseTime = this.sustainPedal ? 1.8 : 0.6;

    switch (this.instrument) {
      case "epiano": {
        // Lush Rhodes Stage 73 FM Bell chime + Tremolo
        const tremolo = new Tone.Tremolo({
          frequency: 3.5,
          depth: 0.35,
        });
        tremolo.start();

        const synth = new Tone.PolySynth(Tone.FMSynth);
        synth.set({
          harmonicity: 3.5,
          modulationIndex: 2.8,
          oscillator: { type: "sine" },
          envelope: {
            attack: 0.005,
            decay: 1.8,
            sustain: 0.28,
            release: releaseTime + 0.3,
          },
          modulation: { type: "triangle" },
          modulationEnvelope: {
            attack: 0.003,
            decay: 0.6,
            sustain: 0.12,
            release: 0.8,
          },
        });

        synth.connect(tremolo);
        tremolo.connect(this.reverb);
        this.instrumentFx = tremolo;
        this.synth = synth;
        break;
      }

      case "strings": {
        // Warm Orchestral Strings: 4-voice detuned ensemble + lowpass wood resonance
        const filter = new Tone.Filter({
          frequency: 1500,
          type: "lowpass",
          rolloff: -24,
        });

        const synth = new Tone.PolySynth(Tone.Synth);
        synth.set({
          oscillator: {
            type: "fatsawtooth",
            count: 4,
            spread: 28,
          },
          envelope: {
            attack: 0.16,
            decay: 0.8,
            sustain: 0.85,
            release: releaseTime + 0.8,
          },
        });

        synth.connect(filter);
        filter.connect(this.reverb);
        this.instrumentFx = filter;
        this.synth = synth;
        break;
      }

      case "organ": {
        // Church / Pipe Organ: multi-octave harmonic drawbars with full continuous sustain
        const synth = new Tone.PolySynth(Tone.Synth);
        synth.set({
          oscillator: {
            type: "sine8",
          },
          envelope: {
            attack: 0.015,
            decay: 0.0,
            sustain: 1.0,
            release: 0.2,
          },
        });

        synth.connect(this.reverb);
        this.synth = synth;
        break;
      }

      case "celesta": {
        // Crystalline Celesta / Bell: Pure metallic high chime + highpass filter
        const filter = new Tone.Filter({
          frequency: 950,
          type: "highpass",
        });

        const synth = new Tone.PolySynth(Tone.AMSynth);
        synth.set({
          harmonicity: 6.0,
          oscillator: { type: "sine" },
          envelope: {
            attack: 0.001,
            decay: 2.2,
            sustain: 0.01,
            release: 2.0,
          },
          modulation: { type: "sine" },
        });

        synth.connect(filter);
        filter.connect(this.reverb);
        this.instrumentFx = filter;
        this.synth = synth;
        break;
      }

      case "synth": {
        // Retro 80s Analog Synth: Resonant lowpass filter
        const filter = new Tone.Filter({
          frequency: 2400,
          type: "lowpass",
          Q: 2.5,
        });

        const synth = new Tone.PolySynth(Tone.Synth);
        synth.set({
          oscillator: {
            type: "sawtooth",
          },
          envelope: {
            attack: 0.02,
            decay: 0.4,
            sustain: 0.4,
            release: 0.6,
          },
        });

        synth.connect(filter);
        filter.connect(this.reverb);
        this.instrumentFx = filter;
        this.synth = synth;
        break;
      }

      case "piano":
      default: {
        // Acoustic Grand Piano: Felt-hammer transient, acoustic body resonance lowpass filter
        const filter = new Tone.Filter({
          frequency: 3400,
          type: "lowpass",
          rolloff: -12,
        });

        const synth = new Tone.PolySynth(Tone.Synth);
        synth.set({
          oscillator: {
            type: "triangle8",
          },
          envelope: {
            attack: 0.003,
            decay: 1.6,
            sustain: 0.18,
            release: releaseTime,
          },
        });

        synth.connect(filter);
        filter.connect(this.reverb);
        this.instrumentFx = filter;
        this.synth = synth;
        break;
      }
    }

    if (this.synth) {
      this.synth.volume.value = Tone.gainToDb(this.volume);
    }
  }

  async setInstrument(name: InstrumentType, playPreview: boolean = false): Promise<void> {
    this.instrument = name;
    if (this.synth) {
      this._buildInstrumentSynth();
      if (this.isPlaying) {
        const cur = this.currentTime;
        for (const ev of this.events) {
          if (ev.time >= cur && ev._id !== undefined) {
            this.scheduledNoteIds.delete(ev._id);
          }
        }
      }
    }
    if (playPreview) {
      await this.previewInstrument(name);
    }
  }

  async previewInstrument(name: InstrumentType): Promise<void> {
    await this.initAudio();
    if (!this.synth) return;
    try {
      const now = Tone.now() + 0.05;
      if (name === "celesta") {
        this.synth.triggerAttackRelease("C6", 0.45, now, 0.75);
        this.synth.triggerAttackRelease("E6", 0.45, now + 0.14, 0.8);
      } else if (name === "strings") {
        this.synth.triggerAttackRelease("G3", 0.85, now, 0.6);
        this.synth.triggerAttackRelease("D4", 0.85, now + 0.08, 0.65);
        this.synth.triggerAttackRelease("B4", 0.85, now + 0.16, 0.7);
      } else if (name === "organ") {
        this.synth.triggerAttackRelease("C3", 0.55, now, 0.7);
        this.synth.triggerAttackRelease("G3", 0.55, now, 0.7);
        this.synth.triggerAttackRelease("C4", 0.55, now, 0.7);
      } else if (name === "epiano") {
        this.synth.triggerAttackRelease("E4", 0.65, now, 0.7);
        this.synth.triggerAttackRelease("G#4", 0.65, now + 0.1, 0.72);
        this.synth.triggerAttackRelease("B4", 0.65, now + 0.2, 0.75);
      } else if (name === "synth") {
        this.synth.triggerAttackRelease("D4", 0.35, now, 0.65);
        this.synth.triggerAttackRelease("A4", 0.35, now + 0.12, 0.7);
      } else {
        // Grand Piano
        this.synth.triggerAttackRelease("C4", 0.55, now, 0.75);
        this.synth.triggerAttackRelease("G4", 0.55, now + 0.1, 0.8);
      }
    } catch (e) {
      console.warn("Instrument preview warning:", e);
    }
  }

  setSustainPedal(enabled: boolean): void {
    this.sustainPedal = Boolean(enabled);
    if (this.synth) {
      this._buildInstrumentSynth();
    }
  }

  playNote(midi: number, velocity: number = 0.8): void {
    if (!this.synth) {
      this.initAudio().then(() => {
        if (this.synth) {
          const freq = Tone.Frequency(midi, "midi").toFrequency();
          this.synth.triggerAttack(freq, Tone.now(), Math.max(0.1, Math.min(1.0, velocity)));
        }
      });
      return;
    }
    try {
      const freq = Tone.Frequency(midi, "midi").toFrequency();
      this.synth.triggerAttack(freq, Tone.now(), Math.max(0.1, Math.min(1.0, velocity)));
    } catch (e) {}
  }

  releaseNote(midi: number): void {
    if (!this.synth) return;
    try {
      const freq = Tone.Frequency(midi, "midi").toFrequency();
      this.synth.triggerRelease([freq], Tone.now());
    } catch (e) {}
  }

  setOsmd(osmdInstance: any, bpm: number = 120.0): void {
    this.osmd = osmdInstance;
    this.bpm = bpm || 120.0;
    this.currentCursorIndex = 0;
    this.cursorTimestamps = [];

    if (this.osmd && this.osmd.cursor) {
      try {
        const cursor = this.osmd.cursor;
        cursor.reset();
        cursor.show();

        const iterator = cursor.iterator || cursor.Iterator;
        if (iterator) {
          const secPerWhole = 240.0 / (this.bpm || 120.0);
          let count = 0;
          while (!iterator.endReached && !iterator.EndReached && count < 3000) {
            count++;
            const ts = iterator.currentTimeStamp;
            const realVal = ts
              ? typeof ts.realValue === "number"
                ? ts.realValue
                : typeof ts.RealValue === "number"
                ? ts.RealValue
                : 0
              : 0;
            this.cursorTimestamps.push(realVal * secPerWhole);
            cursor.next();
          }
          cursor.reset();
          cursor.show();
        }
      } catch (e) {
        console.warn("Error mapping cursor timestamps:", e);
      }
    }
  }

  loadEvents(playbackEvents: PlaybackEvent[], totalDuration: number, osmdInstance: any = null, bpm: number = 120.0): void {
    this.stop();
    this.events = (playbackEvents || []).map((ev, idx) => ({ ...ev, _id: idx }));
    this.duration = totalDuration || (this.events.length > 0 ? this.events[this.events.length - 1].time + 2 : 0);
    this.bpm = bpm || 120.0;
    this.currentTime = 0;
    this.currentCursorIndex = 0;

    if (osmdInstance) {
      this.setOsmd(osmdInstance, this.bpm);
    } else if (this.osmd) {
      this.setOsmd(this.osmd, this.bpm);
    }
  }

  setSpeed(speedMultiplier: number): void {
    const wasPlaying = this.isPlaying;
    const cur = this.currentTime;
    if (wasPlaying) this.pause();
    this.speed = Math.max(0.25, Math.min(3.0, speedMultiplier));
    this.currentTime = cur;
    if (wasPlaying) this.play();
  }

  setVolume(volLinear: number): void {
    this.volume = Math.max(0, Math.min(1, volLinear));
    if (this.synth) {
      this.synth.volume.value = this.volume > 0.001 ? Tone.gainToDb(this.volume) : -Infinity;
    }
  }

  async play(): Promise<void> {
    if (this.events.length === 0) return;
    await this.initAudio();

    this.isPlaying = true;
    this.isPaused = false;
    this.scheduledNoteIds.clear();

    this.startTime = performance.now() - (this.currentTime / this.speed) * 1000;

    if (this.currentTime === 0) {
      this.currentCursorIndex = 0;
      if (this.osmd && this.osmd.cursor) {
        try {
          this.osmd.cursor.reset();
          this.osmd.cursor.show();
        } catch (e) {
          console.warn("Cursor play warning:", e);
        }
      }
    } else if (this.osmd && this.osmd.cursor) {
      try {
        this.osmd.cursor.show();
      } catch (e) {}
    }

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback("playing");
    }

    if (this.schedulerTimer) clearInterval(this.schedulerTimer);
    this.schedulerTimer = setInterval(() => this._scheduleWebAudioLookahead(), 25);
    this._runVisualLoop();
  }

  pause(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.isPaused = true;

    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.visualAnimFrame) {
      cancelAnimationFrame(this.visualAnimFrame);
      this.visualAnimFrame = null;
    }
    if (this.synth) {
      try {
        this.synth.releaseAll();
      } catch (e) {}
    }
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback("paused");
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.scheduledNoteIds.clear();

    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.visualAnimFrame) {
      cancelAnimationFrame(this.visualAnimFrame);
      this.visualAnimFrame = null;
    }
    if (this.synth) {
      try {
        this.synth.releaseAll();
      } catch (e) {}
    }
    if (this.osmd && this.osmd.cursor) {
      try {
        this.osmd.cursor.reset();
        this.osmd.cursor.show();
      } catch (e) {
        console.warn("Cursor stop warning:", e);
      }
    }
    if (this.onProgressCallback) {
      this.onProgressCallback(0, this.duration);
    }
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback("stopped");
    }
  }

  _scheduleWebAudioLookahead(): void {
    if (!this.isPlaying || !this.synth) return;

    const nowAudio = Tone.now();
    const lookaheadSec = 0.18;
    const windowEnd = this.currentTime + lookaheadSec * this.speed;

    for (const ev of this.events) {
      if (ev.time >= this.currentTime && ev.time < windowEnd) {
        const id = ev._id ?? 0;
        if (!this.scheduledNoteIds.has(id)) {
          this.scheduledNoteIds.add(id);

          try {
            const timeDelta = (ev.time - this.currentTime) / this.speed;
            const targetAudioTime = nowAudio + Math.max(0, timeDelta);

            const freq = Tone.Frequency(ev.midi, "midi").toFrequency();
            const dur = Math.max(0.12, (ev.duration / this.speed) * (this.sustainPedal ? 1.3 : 1.0));
            const vel = Math.max(0.12, Math.min(1.0, (ev.velocity || 80) / 127.0));

            this.synth.triggerAttackRelease(freq, dur, targetAudioTime, vel);
          } catch (err) {
            console.error("Playback scheduling error:", err);
          }
        }
      }
    }
  }

  _runVisualLoop(): void {
    if (!this.isPlaying) return;

    const now = performance.now();
    if (this.startTime !== null) {
      this.currentTime = Math.max(0, ((now - this.startTime) / 1000) * this.speed);
    }

    this._updateCursor();

    if (this.onProgressCallback) {
      this.onProgressCallback(this.currentTime, this.duration);
    }

    if (this.currentTime >= this.duration) {
      this.stop();
      return;
    }

    this.visualAnimFrame = requestAnimationFrame(() => this._runVisualLoop());
  }

  _updateCursor(): void {
    if (!this.osmd || !this.osmd.cursor) return;
    try {
      const cursor = this.osmd.cursor;

      // If we don't have pre-cached timestamps, advance dynamically
      if (!this.cursorTimestamps || this.cursorTimestamps.length === 0) {
        const iterator = cursor.iterator || cursor.Iterator;
        if (!iterator) return;
        const secPerWhole = 240.0 / (this.bpm || 120.0);

        let hasStepped = false;
        while (!iterator.endReached && !iterator.EndReached) {
          const ts = iterator.currentTimeStamp;
          if (!ts) break;
          const realVal =
            typeof ts.realValue === "number"
              ? ts.realValue
              : typeof ts.RealValue === "number"
              ? ts.RealValue
              : 0;
          if (realVal * secPerWhole <= this.currentTime) {
            cursor.next();
            hasStepped = true;
          } else {
            break;
          }
        }
        if (hasStepped) {
          const cursorEl = cursor.cursorElement || (cursor as any).cursorElement;
          if (cursorEl && typeof cursorEl.scrollIntoView === "function") {
            cursorEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
          }
        }
        return;
      }

      // Step-indexed navigation based on pre-mapped timestamps
      const targetTime = this.currentTime;
      let targetIdx = 0;
      for (let i = this.cursorTimestamps.length - 1; i >= 0; i--) {
        if (targetTime >= this.cursorTimestamps[i] - 0.03) {
          targetIdx = i;
          break;
        }
      }

      if (targetIdx < this.currentCursorIndex) {
        cursor.reset();
        cursor.show();
        this.currentCursorIndex = 0;
      }

      let hasStepped = false;
      const iterator = cursor.iterator || cursor.Iterator;
      while (
        this.currentCursorIndex < targetIdx &&
        iterator &&
        !iterator.endReached &&
        !iterator.EndReached
      ) {
        cursor.next();
        this.currentCursorIndex++;
        hasStepped = true;
      }

      if (hasStepped) {
        const cursorEl = cursor.cursorElement || (cursor as any).cursorElement;
        if (cursorEl && typeof cursorEl.scrollIntoView === "function") {
          cursorEl.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }
      }
    } catch (e) {
      console.warn("Cursor update error:", e);
    }
  }
}
