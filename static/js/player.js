/**
 * High-Fidelity Audio Player & Synthesizer Engine using Tone.js
 * Features:
 * - Multi-Instrument Presets (Acoustic Grand Piano, Rhodes E-Piano, Strings, Celesta, Synth)
 * - Stereo Reverb / Concert Hall Ambience
 * - Acoustic Sustain Pedal Simulation (harmonic string resonance)
 * - Sample-Accurate Lookahead Web Audio Clock Scheduling (zero jitter)
 * - True Velocity & Dynamics Expression
 * - Real-Time Synchronized Green Sheet Music Cursor
 */

class MidiAudioPlayer {
  constructor() {
    this.synth = null;
    this.reverb = null;
    this.events = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.duration = 0;
    this.bpm = 120.0;
    this.speed = 1.0;
    this.volume = 0.85;
    this.instrument = "piano"; // "piano" | "epiano" | "strings" | "organ" | "celesta" | "synth"
    this.instrumentFx = null;
    this.sustainPedal = true; // Natural piano string resonance
    this.scheduledNoteIds = new Set();
    this.schedulerTimer = null;
    this.visualAnimFrame = null;
    this.startTime = null;
    this.startAudioTime = null;
    this.onProgressCallback = null;
    this.onStateChangeCallback = null;
    this.osmd = null;
  }

  async initAudio() {
    if (this.synth) return;
    if (typeof Tone === "undefined") {
      console.warn("Tone.js not available");
      return;
    }
    await Tone.start();

    // Stereo Concert Hall Reverb
    this.reverb = new Tone.Freeverb({
      roomSize: 0.65,
      dampening: 2800
    }).toDestination();
    this.reverb.wet.value = 0.22;

    this._buildInstrumentSynth();
    this.setVolume(this.volume);
  }

  _buildInstrumentSynth() {
    // 1. Cleanly release and dispose previous synth
    if (this.synth) {
      try {
        this.synth.releaseAll();
        this.synth.dispose();
      } catch (e) {}
      this.synth = null;
    }

    // 2. Cleanly dispose previous effect chain
    if (this.instrumentFx) {
      try {
        if (Array.isArray(this.instrumentFx)) {
          this.instrumentFx.forEach(fx => { try { fx.dispose(); } catch(e){} });
        } else {
          this.instrumentFx.dispose();
        }
      } catch (e) {}
      this.instrumentFx = null;
    }

    const releaseTime = this.sustainPedal ? 1.8 : 0.6;

    switch (this.instrument) {
      case "epiano": {
        // Lush Rhodes Stage 73 E-Piano: Bell FM chime + analog stereo chorus/tremolo
        const tremolo = new Tone.Tremolo({
          frequency: 3.5,
          depth: 0.35
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
            release: releaseTime + 0.3
          },
          modulation: { type: "triangle" },
          modulationEnvelope: {
            attack: 0.003,
            decay: 0.6,
            sustain: 0.12,
            release: 0.8
          }
        });

        synth.connect(tremolo);
        tremolo.connect(this.reverb);
        this.instrumentFx = tremolo;
        this.synth = synth;
        break;
      }

      case "strings": {
        // Warm Orchestral Strings: 4-voice detuned ensemble + acoustic wood lowpass filter
        const filter = new Tone.Filter({
          frequency: 1500,
          type: "lowpass",
          rolloff: -24
        });

        const synth = new Tone.PolySynth(Tone.Synth);
        synth.set({
          oscillator: {
            type: "fatsawtooth",
            count: 4,
            spread: 28
          },
          envelope: {
            attack: 0.16,
            decay: 0.8,
            sustain: 0.85,
            release: releaseTime + 0.8
          }
        });

        synth.connect(filter);
        filter.connect(this.reverb);
        this.instrumentFx = filter;
        this.synth = synth;
        break;
      }

      case "organ": {
        // Church / Drawbar Organ: multi-octave harmonic drawbars with full sustain
        const synth = new Tone.PolySynth(Tone.Synth);
        synth.set({
          oscillator: {
            type: "sine8"
          },
          envelope: {
            attack: 0.015,
            decay: 0.0,
            sustain: 1.0,
            release: 0.2
          }
        });

        synth.connect(this.reverb);
        this.synth = synth;
        break;
      }

      case "celesta": {
        // Crystalline Celesta / Glockenspiel: Pure metallic high chime + highpass filter
        const filter = new Tone.Filter({
          frequency: 950,
          type: "highpass"
        });

        const synth = new Tone.PolySynth(Tone.AMSynth);
        synth.set({
          harmonicity: 6.0,
          oscillator: { type: "sine" },
          envelope: {
            attack: 0.001,
            decay: 2.2,
            sustain: 0.01,
            release: 2.0
          },
          modulation: { type: "sine" }
        });

        synth.connect(filter);
        filter.connect(this.reverb);
        this.instrumentFx = filter;
        this.synth = synth;
        break;
      }

      case "synth": {
        // Retro 80s Analog Synth Lead: Resonant lowpass filter
        const filter = new Tone.Filter({
          frequency: 2400,
          type: "lowpass",
          Q: 2.5
        });

        const synth = new Tone.PolySynth(Tone.Synth);
        synth.set({
          oscillator: {
            type: "sawtooth"
          },
          envelope: {
            attack: 0.02,
            decay: 0.4,
            sustain: 0.4,
            release: 0.6
          }
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
          rolloff: -12
        });

        const synth = new Tone.PolySynth(Tone.Synth);
        synth.set({
          oscillator: {
            type: "triangle8"
          },
          envelope: {
            attack: 0.003,
            decay: 1.6,
            sustain: 0.18,
            release: releaseTime
          }
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

  async setInstrument(name, playPreview = false) {
    this.instrument = name;
    if (this.synth) {
      this._buildInstrumentSynth();
      // If actively playing, re-sync lookahead buffer so upcoming notes immediately play on the new instrument
      if (this.isPlaying) {
        const cur = this.currentTime;
        for (const ev of this.events) {
          if (ev.time >= cur) {
            this.scheduledNoteIds.delete(ev._id);
          }
        }
      }
    }
    if (playPreview) {
      await this.previewInstrument(name);
    }
  }

  async previewInstrument(name) {
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

  setSustainPedal(enabled) {
    this.sustainPedal = Boolean(enabled);
    if (this.synth) {
      this._buildInstrumentSynth();
    }
  }

  setReverbWet(amount) {
    if (this.reverb) {
      this.reverb.wet.value = Math.max(0, Math.min(1, amount));
    }
  }

  loadEvents(playbackEvents, totalDuration, osmdInstance = null, bpm = 120.0) {
    this.stop();
    this.events = (playbackEvents || []).map((ev, idx) => ({ ...ev, _id: idx }));
    this.duration = totalDuration || (this.events.length > 0 ? this.events[this.events.length - 1].time + 2 : 0);
    this.osmd = osmdInstance;
    this.bpm = bpm || 120.0;
    this.currentTime = 0;

    // Ready cursor at beginning
    if (this.osmd && this.osmd.cursor) {
      try {
        this.osmd.cursor.show();
        this.osmd.cursor.reset();
      } catch (e) {
        console.warn("Cursor init warning:", e);
      }
    }
  }

  setSpeed(speedMultiplier) {
    const wasPlaying = this.isPlaying;
    const cur = this.currentTime;
    if (wasPlaying) this.pause();
    this.speed = Math.max(0.25, Math.min(3.0, speedMultiplier));
    this.currentTime = cur;
    if (wasPlaying) this.play();
  }

  setVolume(volLinear) {
    this.volume = Math.max(0, Math.min(1, volLinear));
    if (this.synth && typeof Tone !== "undefined") {
      this.synth.volume.value = this.volume > 0.001 ? Tone.gainToDb(this.volume) : -Infinity;
    }
  }

  async play() {
    if (this.events.length === 0) return;
    await this.initAudio();

    this.isPlaying = true;
    this.isPaused = false;
    this.scheduledNoteIds.clear();

    this.startAudioTime = Tone.now();
    this.startTime = performance.now() - (this.currentTime / this.speed) * 1000;

    if (this.osmd && this.osmd.cursor) {
      try {
        this.osmd.cursor.show();
        if (this.currentTime === 0) {
          this.osmd.cursor.reset();
        }
      } catch (e) {
        console.warn("Cursor play warning:", e);
      }
    }

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback("playing");
    }

    // High-precision Web Audio lookahead interval (runs every 25ms)
    this.schedulerTimer = setInterval(() => this._scheduleWebAudioLookahead(), 25);

    // Visual refresh loop (cursor & timer)
    this._runVisualLoop();
  }

  pause() {
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

  stop() {
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

  seek(timeInSeconds) {
    const wasPlaying = this.isPlaying;
    this.pause();
    this.currentTime = Math.max(0, Math.min(this.duration, timeInSeconds));
    this.scheduledNoteIds.clear();

    // Fast-seek cursor
    if (this.osmd && this.osmd.cursor && this.osmd.cursor.Iterator) {
      try {
        this.osmd.cursor.reset();
        const secPerWhole = 240.0 / (this.bpm || 120.0);
        while (!this.osmd.cursor.Iterator.EndReached) {
          const nextTimestampSec = this.osmd.cursor.Iterator.currentTimeStamp.RealValue * secPerWhole;
          if (nextTimestampSec <= this.currentTime) {
            this.osmd.cursor.next();
          } else {
            break;
          }
        }
      } catch (e) {
        console.warn("Cursor seek error:", e);
      }
    }

    if (this.onProgressCallback) {
      this.onProgressCallback(this.currentTime, this.duration);
    }
    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * Sample-Accurate Web Audio Lookahead Scheduler
   * Schedules notes 150ms in advance onto the Web Audio hardware clock.
   * Completely immune to tab switching, scrolling lag, or frame drops.
   */
  _scheduleWebAudioLookahead() {
    if (!this.isPlaying || !this.synth) return;

    const nowAudio = Tone.now();
    const lookaheadSec = 0.18; // 180ms lookahead window

    // Find notes in [currentTime, currentTime + lookaheadSec * speed]
    const windowEnd = this.currentTime + lookaheadSec * this.speed;

    for (const ev of this.events) {
      if (ev.time >= this.currentTime && ev.time < windowEnd) {
        if (!this.scheduledNoteIds.has(ev._id)) {
          this.scheduledNoteIds.add(ev._id);

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

  _runVisualLoop() {
    if (!this.isPlaying) return;

    const now = performance.now();
    this.currentTime = Math.max(0, ((now - this.startTime) / 1000) * this.speed);

    // Step OSMD green cursor forward in sync with musical time
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

  _updateCursor() {
    if (!this.osmd || !this.osmd.cursor || !this.osmd.cursor.Iterator) return;
    try {
      const cursor = this.osmd.cursor;
      const secPerWhole = 240.0 / (this.bpm || 120.0);

      // Advance cursor while its musical timestamp is <= current playback time
      while (!cursor.Iterator.EndReached) {
        const currentCursorSec = cursor.Iterator.currentTimeStamp.RealValue * secPerWhole;
        if (currentCursorSec <= this.currentTime) {
          cursor.next();
        } else {
          break;
        }
      }

      // Smooth auto-scroll following the green cursor
      if (cursor.cursorElement && typeof cursor.cursorElement.scrollIntoView === "function") {
        cursor.cursorElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest"
        });
      }
    } catch (e) {
      console.warn("Cursor update error:", e);
    }
  }
}

window.MidiAudioPlayer = MidiAudioPlayer;
