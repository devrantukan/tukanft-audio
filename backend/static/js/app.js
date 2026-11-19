/**
 * MIDI2Notes Main Web Application Logic
 * Integrates music21 backend processing with OpenSheetMusicDisplay and Tone.js
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const loadingOverlay = document.getElementById("loading-overlay");
  const loadingText = document.getElementById("loading-text");
  const workspace = document.getElementById("workspace");
  const osmdContainer = document.getElementById("osmd-container");
  const samplesGrid = document.getElementById("samples-grid");

  // Toolbar & Player Controls
  const btnPlay = document.getElementById("btn-play");
  const btnStop = document.getElementById("btn-stop");
  const playbackTimer = document.getElementById("playback-timer");
  const selectSpeed = document.getElementById("select-speed");
  const volumeSlider = document.getElementById("volume-slider");
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnZoomReset = document.getElementById("btn-zoom-reset");
  const selectLayout = document.getElementById("select-layout");
  const btnPrint = document.getElementById("btn-print");
  const btnDownloadXml = document.getElementById("btn-download-xml");
  const btnDownloadMidi = document.getElementById("btn-download-midi");

  // Sidebar Controls
  const scoreTitle = document.getElementById("score-title");
  const metaKey = document.getElementById("meta-key");
  const metaTimeSig = document.getElementById("meta-timesig");
  const metaTempo = document.getElementById("meta-tempo");
  const metaMeasures = document.getElementById("meta-measures");
  const metaNotes = document.getElementById("meta-notes");
  const metaRange = document.getElementById("meta-range");
  const metaDuration = document.getElementById("meta-duration");
  const selectPart = document.getElementById("select-part");
  const selectQuantize = document.getElementById("select-quantize");
  const chkGrandStaff = document.getElementById("chk-grand-staff");
  const transposeSlider = document.getElementById("transpose-slider");
  const transposeVal = document.getElementById("transpose-val");
  const btnTransposeReset = document.getElementById("btn-transpose-reset");
  const histogramBars = document.getElementById("histogram-bars");

  // Theme toggle
  const btnTheme = document.getElementById("btn-theme");

  // State
  let osmd = null;
  let audioPlayer = new MidiAudioPlayer();
  let currentScoreData = null;
  let currentSessionId = null;
  let currentUploadedFile = null;
  let currentSampleId = null;
  let currentZoom = 1.0;
  let isReprocessing = false;

  // Initialize OSMD instance
  function initOSMD(drawingMode = "default") {
    if (typeof opensheetmusicdisplay === "undefined") {
      console.error("OpenSheetMusicDisplay library not loaded!");
      return null;
    }
    osmdContainer.innerHTML = "";
    const isEndless = selectLayout ? selectLayout.value === "endless" : false;

    osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmd-container", {
      autoResize: true,
      backend: "svg",
      drawTitle: true,
      drawSubtitle: false,
      drawComposer: false,
      drawLyricist: false,
      drawMetronomeMarks: true,
      drawPartNames: false,
      drawPartAbbreviations: false,
      drawMeasureNumbers: true,
      drawTimeSignatures: true,
      pageFormat: isEndless ? "Endless" : "A4_P",
      pageBackgroundColor: "#ffffff",
      drawingParameters: "default",
      alignRests: 1
    });

    return osmd;
  }

  // Load and Render MusicXML into OSMD
  async function renderScore(musicxmlStr) {
    if (!musicxmlStr) {
      console.error("renderScore called with empty musicxml string");
      return;
    }

    // Always create a clean OSMD instance bound to the active container
    initOSMD();
    if (!osmd) return;

    try {
      showLoading("Rendering sheet notation with OSMD...");
      await osmd.load(musicxmlStr);
      osmd.zoom = currentZoom;
      osmd.render();

      // Ensure all rendered SVG pages are visible and properly responsive
      const svgs = osmdContainer.querySelectorAll("svg");
      svgs.forEach(svg => {
        svg.style.maxWidth = "100%";
        svg.style.height = "auto";
        if (svg.getAttribute("width") === "0" || !svg.getAttribute("width")) {
          svg.setAttribute("width", "100%");
        }
      });

      // Hook up player to new OSMD instance
      window.osmd = osmd;
      window.audioPlayer = audioPlayer;
      if (currentScoreData && currentScoreData.playbackEvents) {
        audioPlayer.loadEvents(
          currentScoreData.playbackEvents,
          currentScoreData.metadata.durationSeconds,
          osmd,
          currentScoreData.metadata.tempoBpm || 120.0
        );
      }
    } catch (err) {
      console.error("OSMD render error:", err);
      showToast("Error rendering score: " + err.message, "danger");
      osmdContainer.innerHTML = `
        <div style="padding: 3rem 1.5rem; text-align: center; color: var(--text-main);">
          <div style="font-size: 2.2rem; margin-bottom: 0.75rem;">🎼</div>
          <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: #ef4444;">Notation Rendering Issue</h3>
          <p style="font-size: 0.875rem; color: var(--text-muted); max-width: 520px; margin: 0 auto 1.25rem;">
            OpenSheetMusicDisplay encountered an issue parsing this score: ${err.message || "Unknown error"}
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" id="btn-retry-render">Switch to Paginated Layout & Retry</button>
            <button class="btn btn-secondary btn-sm" id="btn-export-xml-fallback">Download MusicXML</button>
          </div>
        </div>
      `;
      document.getElementById("btn-retry-render")?.addEventListener("click", () => {
        if (selectLayout) selectLayout.value = "paged";
        renderScore(musicxmlStr);
      });
      document.getElementById("btn-export-xml-fallback")?.addEventListener("click", () => {
        btnDownloadXml?.click();
      });
    } finally {
      hideLoading();
    }
  }

  // Format seconds into mm:ss
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // Audio Player callbacks
  audioPlayer.onProgressCallback = (currentTime, totalDuration) => {
    playbackTimer.textContent = `${formatTime(currentTime)} / ${formatTime(totalDuration)}`;
  };

  audioPlayer.onStateChangeCallback = (state) => {
    if (state === "playing") {
      btnPlay.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
      btnPlay.setAttribute("title", "Pause");
    } else {
      btnPlay.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
      btnPlay.setAttribute("title", "Play");
    }
  };

  // Populate UI with score metadata
  function updateMetadataUI(metadata) {
    if (!metadata) return;

    if (scoreTitle) scoreTitle.textContent = metadata.title || "Score";
    if (metaKey) metaKey.textContent = metadata.key || "Unknown";
    if (metaTimeSig) metaTimeSig.textContent = metadata.timeSignature || "4/4";
    if (metaTempo) metaTempo.textContent = `${metadata.tempoBpm || 120} BPM`;
    if (metaMeasures) metaMeasures.textContent = `${metadata.measuresCount || 0} bars`;
    if (metaNotes) metaNotes.textContent = `${metadata.notesCount || 0} notes`;
    if (metaRange) metaRange.textContent = `${metadata.minPitch} - ${metadata.maxPitch}`;
    if (metaDuration) metaDuration.textContent = formatTime(metadata.durationSeconds);
    if (playbackTimer) playbackTimer.textContent = `0:00 / ${formatTime(metadata.durationSeconds)}`;

    // Populate Part selection
    if (selectPart && metadata.parts) {
      const currentSelected = selectPart.value;
      selectPart.innerHTML = '<option value="all">All Tracks / Parts (Full Score)</option>';
      metadata.parts.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.index;
        opt.textContent = `${p.name} (${p.notesCount} notes, ${p.clef} clef)`;
        selectPart.appendChild(opt);
      });
      if (currentSelected && selectPart.querySelector(`option[value="${currentSelected}"]`)) {
        selectPart.value = currentSelected;
      }
    }

    // Render pitch histogram
    renderHistogram(metadata.pitchDistribution);
  }

  // Render pitch class histogram
  function renderHistogram(dist) {
    if (!histogramBars) return;
    histogramBars.innerHTML = "";
    if (!dist) return;

    const pitchClasses = ["C", "D", "E", "F", "G", "A", "B"];
    const counts = pitchClasses.map(p => dist[p] || 0);
    const maxCount = Math.max(...counts, 1);

    pitchClasses.forEach((p, i) => {
      const count = counts[i];
      const heightPercent = Math.max(4, Math.round((count / maxCount) * 100));

      const barWrap = document.createElement("div");
      barWrap.className = "histogram-bar-wrap";
      barWrap.title = `${p}: ${count} notes`;

      const bar = document.createElement("div");
      bar.className = "histogram-bar";
      bar.style.height = `${heightPercent}%`;

      const label = document.createElement("div");
      label.className = "histogram-label";
      label.textContent = p;

      barWrap.appendChild(bar);
      barWrap.appendChild(label);
      histogramBars.appendChild(barWrap);
    });
  }

  // Handle Score Loading response
  async function handleScoreLoaded(data) {
    currentScoreData = data;
    currentSessionId = data.sessionId;

    // 1. Reveal workspace FIRST so #osmd-container has real pixel dimensions
    workspace.classList.add("active");

    // Force synchronous layout reflow and wait for next frame
    void workspace.offsetHeight;
    await new Promise(resolve => requestAnimationFrame(resolve));

    // 2. Update sidebar and metadata
    updateMetadataUI(data.metadata);

    // 3. Render MusicXML into OSMD
    await renderScore(data.musicxml);

    // 4. Smoothly scroll down to the score
    workspace.scrollIntoView({ behavior: "smooth" });

    showToast("Sheet generated successfully with music21!", "success");
  }

  // Reprocess score with modified parameters (transposition, quantization, parts, etc.)
  async function triggerReprocess() {
    if ((!currentSessionId && !currentUploadedFile && !currentSampleId) || isReprocessing) return;
    isReprocessing = true;
    showLoading("Applying musical transformations with music21...");

    const formData = new FormData();
    formData.append("session_id", currentSessionId || "");
    formData.append("transpose", transposeSlider.value);
    formData.append("quantize", selectQuantize.value);
    formData.append("split_grand_staff", chkGrandStaff.checked ? "true" : "false");
    formData.append("selected_part", selectPart.value);

    try {
      const resp = await fetch("/api/reprocess", {
        method: "POST",
        body: formData
      });
      if (!resp.ok) {
        // Auto-heal if session expired due to server restart or timeout
        if (resp.status === 404 && (currentUploadedFile || currentSampleId)) {
          console.warn("Session expired on server. Auto-restoring session...");
          isReprocessing = false;
          if (currentUploadedFile) {
            await uploadMidiFile(currentUploadedFile);
            return;
          } else if (currentSampleId) {
            await loadSample(currentSampleId);
            return;
          }
        }
        const errData = await resp.json();
        throw new Error(errData.detail || "Reprocessing failed");
      }
      const data = await resp.json();
      await handleScoreLoaded(data);
    } catch (err) {
      console.error(err);
      showToast("Transformation error: " + err.message, "danger");
    } finally {
      hideLoading();
      isReprocessing = false;
    }
  }

  // Load sample MIDI
  async function loadSample(sampleId) {
    currentSampleId = sampleId;
    currentUploadedFile = null;
    showLoading(`Loading and parsing ${sampleId} with music21...`);
    try {
      const formData = new FormData();
      formData.append("transpose", transposeSlider ? transposeSlider.value : "0");
      formData.append("quantize", selectQuantize ? selectQuantize.value : "smart");
      formData.append("split_grand_staff", chkGrandStaff ? (chkGrandStaff.checked ? "true" : "false") : "false");
      formData.append("selected_part", selectPart ? selectPart.value : "all");

      const resp = await fetch(`/api/sample/${sampleId}`, {
        method: "POST",
        body: formData
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || "Failed to load sample");
      }
      const data = await resp.json();
      await handleScoreLoaded(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load sample: " + err.message, "danger");
    } finally {
      hideLoading();
    }
  }

  // Upload user MIDI file
  async function uploadMidiFile(file) {
    if (!file) return;
    currentUploadedFile = file;
    currentSampleId = null;
    showLoading(`Parsing ${file.name} with music21...`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("transpose", transposeSlider ? transposeSlider.value : "0");
    formData.append("quantize", selectQuantize ? selectQuantize.value : "smart");
    formData.append("split_grand_staff", chkGrandStaff ? (chkGrandStaff.checked ? "true" : "false") : "false");
    formData.append("selected_part", selectPart ? selectPart.value : "all");

    try {
      const resp = await fetch("/api/convert", {
        method: "POST",
        body: formData
      });
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.detail || "Conversion failed");
      }
      const data = await resp.json();
      await handleScoreLoaded(data);
    } catch (err) {
      console.error(err);
      showToast("Error processing MIDI: " + err.message, "danger");
    } finally {
      hideLoading();
    }
  }

  // Fetch Samples List on load
  async function fetchSamples() {
    try {
      const resp = await fetch("/api/samples");
      if (!resp.ok) return;
      const data = await resp.json();
      if (data.samples && samplesGrid) {
        samplesGrid.innerHTML = "";
        data.samples.forEach(s => {
          const chip = document.createElement("button");
          chip.className = "sample-chip";
          chip.innerHTML = `
            <span class="chip-icon">🎵</span>
            <span><strong>${s.title}</strong></span>
            <span class="chip-key">${s.key}</span>
          `;
          chip.addEventListener("click", () => loadSample(s.id));
          samplesGrid.appendChild(chip);
        });
      }
    } catch (e) {
      console.warn("Could not fetch samples:", e);
    }
  }

  // Loading Overlay Helpers
  function showLoading(msg = "Processing with music21...") {
    if (loadingText) loadingText.textContent = msg;
    if (loadingOverlay) loadingOverlay.classList.add("active");
  }

  function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove("active");
  }

  // Toast Notification Helper
  function showToast(msg, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === "success" ? "✓" : type === "danger" ? "✕" : "ℹ"}</span>
      <span>${msg}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(50px)";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Drag and drop event listeners
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        uploadMidiFile(e.target.files[0]);
      }
    });

    ["dragenter", "dragover"].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add("drag-over");
      });
    });

    ["dragleave", "drop"].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-over");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      if (e.dataTransfer.files.length > 0) {
        uploadMidiFile(e.dataTransfer.files[0]);
      }
    });
  }

  // Playback Buttons
  if (btnPlay) {
    btnPlay.addEventListener("click", () => {
      if (audioPlayer.isPlaying) {
        audioPlayer.pause();
      } else {
        audioPlayer.play();
      }
    });
  }

  if (btnStop) {
    btnStop.addEventListener("click", () => {
      audioPlayer.stop();
    });
  }

  // Keyboard shortcut: Spacebar to toggle Play/Pause
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      if (btnPlay) btnPlay.click();
    }
  });

  // Speed selector
  if (selectSpeed) {
    selectSpeed.addEventListener("change", (e) => {
      audioPlayer.setSpeed(parseFloat(e.target.value));
    });
  }

  // Volume slider
  if (volumeSlider) {
    volumeSlider.addEventListener("input", (e) => {
      audioPlayer.setVolume(parseFloat(e.target.value));
    });
  }

  // Instrument sound preset selector
  const selectInstrument = document.getElementById("select-instrument");
  if (selectInstrument) {
    selectInstrument.addEventListener("change", async (e) => {
      const val = e.target.value;
      const label = e.target.options[e.target.selectedIndex]?.text || val;
      // If paused/stopped, play preview chime so user instantly hears the new timbre; if playing, switch seamlessly
      await audioPlayer.setInstrument(val, !audioPlayer.isPlaying);
      showToast(`Sound preset: ${label}`, "info");
    });
  }

  // Sustain pedal button
  const btnPedal = document.getElementById("btn-pedal");
  if (btnPedal) {
    btnPedal.addEventListener("click", () => {
      const nextState = !audioPlayer.sustainPedal;
      audioPlayer.setSustainPedal(nextState);
      btnPedal.textContent = nextState ? "🎹 Pedal: ON" : "🎹 Pedal: OFF";
      btnPedal.classList.toggle("btn-secondary", nextState);
      btnPedal.classList.toggle("btn-outline", !nextState);
    });
  }

  // Zoom controls
  if (btnZoomIn) {
    btnZoomIn.addEventListener("click", () => {
      currentZoom = Math.min(2.5, currentZoom + 0.15);
      if (osmd) {
        osmd.zoom = currentZoom;
        osmd.render();
      }
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener("click", () => {
      currentZoom = Math.max(0.4, currentZoom - 0.15);
      if (osmd) {
        osmd.zoom = currentZoom;
        osmd.render();
      }
    });
  }

  if (btnZoomReset) {
    btnZoomReset.addEventListener("click", () => {
      currentZoom = 1.0;
      if (osmd) {
        osmd.zoom = 1.0;
        osmd.render();
      }
    });
  }

  // Layout mode (Paged vs Endless)
  if (selectLayout) {
    selectLayout.addEventListener("change", () => {
      if (currentScoreData && currentScoreData.musicxml) {
        initOSMD();
        renderScore(currentScoreData.musicxml);
      }
    });
  }

  // Transposition Stepper / Slider
  if (transposeSlider && transposeVal) {
    transposeSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      transposeVal.textContent = val > 0 ? `+${val}` : `${val}`;
    });

    transposeSlider.addEventListener("change", () => {
      triggerReprocess();
    });
  }

  if (btnTransposeReset) {
    btnTransposeReset.addEventListener("click", () => {
      if (transposeSlider.value !== "0") {
        transposeSlider.value = "0";
        transposeVal.textContent = "0";
        triggerReprocess();
      }
    });
  }

  // Quantization selector
  if (selectQuantize) {
    selectQuantize.addEventListener("change", () => {
      triggerReprocess();
    });
  }

  // Grand staff toggle
  if (chkGrandStaff) {
    chkGrandStaff.addEventListener("change", () => {
      triggerReprocess();
    });
  }

  // Part selector
  if (selectPart) {
    selectPart.addEventListener("change", () => {
      triggerReprocess();
    });
  }

  // Print Sheet Music
  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      window.print();
    });
  }

  // Download MusicXML
  if (btnDownloadXml) {
    btnDownloadXml.addEventListener("click", () => {
      if (!currentScoreData || !currentScoreData.musicxml) return;
      const blob = new Blob([currentScoreData.musicxml], { type: "application/vnd.recordare.musicxml+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const title = currentScoreData.metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      a.download = `${title}.musicxml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Downloaded MusicXML file!", "success");
    });
  }

  // Download Transposed/Quantized MIDI
  if (btnDownloadMidi) {
    btnDownloadMidi.addEventListener("click", async () => {
      if (!currentSessionId) return;
      showLoading("Preparing processed MIDI...");
      try {
        const formData = new FormData();
        formData.append("session_id", currentSessionId);
        formData.append("transpose", transposeSlider ? transposeSlider.value : "0");
        formData.append("quantize", selectQuantize ? selectQuantize.value : "none");
        formData.append("selected_part", selectPart ? selectPart.value : "all");

        const resp = await fetch("/api/export/midi", {
          method: "POST",
          body: formData
        });
        if (!resp.ok) throw new Error("Failed to export MIDI");

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const title = currentScoreData.metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        a.download = `${title}_processed.mid`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast("Downloaded processed MIDI!", "success");
      } catch (e) {
        showToast("Error exporting MIDI: " + e.message, "danger");
      } finally {
        hideLoading();
      }
    });
  }

  // Theme toggle
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      const current = document.body.getAttribute("data-theme") || "dark";
      const nextTheme = current === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", nextTheme);
      btnTheme.textContent = nextTheme === "dark" ? "🌙" : "☀️";
    });
  }

  // Responsive window resize re-render
  let resizeTimeout = null;
  window.addEventListener("resize", () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (osmd && currentScoreData && currentScoreData.musicxml) {
        try {
          osmd.render();
        } catch (e) {
          console.warn("Resize render warning:", e);
        }
      }
    }, 250);
  });

  // Initialize samples list
  fetchSamples();

  // =========================================================
  // Lacuna Sidebar & Tools Integration
  // =========================================================
  const sidebar = document.getElementById("app-sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const btnSidebarToggle = document.getElementById("btn-sidebar-toggle");

  if (btnSidebarToggle && sidebar && sidebarBackdrop) {
    btnSidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      sidebarBackdrop.classList.toggle("active");
    });

    sidebarBackdrop.addEventListener("click", () => {
      sidebar.classList.remove("open");
      sidebarBackdrop.classList.remove("active");
    });
  }

  // Lacuna Feature Info Modal
  const lacunaModal = document.getElementById("lacuna-modal");
  const lacunaModalClose = document.getElementById("lacuna-modal-close");
  const lacunaModalBtn = document.getElementById("lacuna-modal-btn");
  const lacunaModalTitle = document.getElementById("lacuna-modal-title");
  const lacunaModalDesc = document.getElementById("lacuna-modal-desc");
  const lacunaModalBadge = document.getElementById("lacuna-modal-badge");
  const lacunaModalIcon = document.getElementById("lacuna-modal-icon");

  const TOOL_INFO = {
    "ai-midi": {
      title: "AI MIDI Generator",
      badge: "PRO FEATURE",
      icon: "✨",
      desc: "Generate multi-instrument polyphonic MIDI sequences, chord progressions, and melodies directly from natural language prompts using neural music transformers."
    },
    "mp3-to-midi": {
      title: "MP3 to MIDI Converter",
      badge: "AI AUDIO ENGINE",
      icon: "🎙️",
      desc: "Upload recorded audio files (.mp3, .wav, .m4a) to automatically transcribe vocal melodies, bass lines, and polyphonic piano chords into clean, edit-ready MIDI."
    },
    "sheet-to-midi": {
      title: "Sheet Music to MIDI (OMR)",
      badge: "OPTICAL RECOGNITION",
      icon: "🎼",
      desc: "Upload scanned sheet music PDFs or photos to convert printed staves into playable MIDI sequences using deep neural Optical Music Recognition."
    },
    "midi-editor": {
      title: "Interactive MIDI Editor",
      badge: "STUDIO TOOL",
      icon: "🎹",
      desc: "Comprehensive browser-based piano roll editor with velocity curve drawing, quantization grids, note duration stretching, and MIDI export."
    },
    "scanner": {
      title: "Sheet Music Scanner",
      badge: "CAMERA & MOBILE",
      icon: "📷",
      desc: "Snap a photo of any printed sheet music with your camera or phone to immediately hear it played back and export it as clean MIDI or MusicXML."
    },
    "all-tools": {
      title: "Lacuna Creative Suite",
      badge: "ECOSYSTEM",
      icon: "🧰",
      desc: "Discover all 12+ audio, MIDI, and sheet music production tools in the Lacuna suite, from stem separation to harmonic chord analysis."
    },
    "pricing": {
      title: "Lacuna Membership & Credits",
      badge: "FREE PLAN",
      icon: "💎",
      desc: "You are currently on the Free Tier with 80 of 120 monthly credits used. Upgrade to Lacuna Pro ($12/month) for unlimited MIDI conversions, batch processing, and 24-bit audio renders."
    },
    "feedback": {
      title: "Feedback & Community",
      badge: "SUPPORT",
      icon: "💬",
      desc: "Have ideas, feature requests, or bugs to report? We build Lacuna for musicians and producers. Send us your feedback!"
    },
    "account": {
      title: "Devran Tukan's Account",
      badge: "FREE TIER",
      icon: "👤",
      desc: "Account: Devran Tukan\nPlan: Free Member\nMonthly Usage: 80 / 120 credits used\nNext Reset: Dec 1, 2026\nCredit Pack: 0 Credits"
    }
  };

  function openLacunaModal(key) {
    const data = TOOL_INFO[key] || {
      title: "Lacuna Tool",
      badge: "STUDIO",
      icon: "🎵",
      desc: "This feature is part of the Lacuna audio and notation ecosystem."
    };

    if (lacunaModalTitle) lacunaModalTitle.textContent = data.title;
    if (lacunaModalBadge) lacunaModalBadge.textContent = data.badge;
    if (lacunaModalIcon) lacunaModalIcon.textContent = data.icon;
    if (lacunaModalDesc) lacunaModalDesc.textContent = data.desc;

    if (lacunaModal) lacunaModal.classList.add("active");
  }

  function closeLacunaModal() {
    if (lacunaModal) lacunaModal.classList.remove("active");
  }

  if (lacunaModalClose) lacunaModalClose.addEventListener("click", closeLacunaModal);
  if (lacunaModalBtn) lacunaModalBtn.addEventListener("click", closeLacunaModal);
  if (lacunaModal) {
    lacunaModal.addEventListener("click", (e) => {
      if (e.target === lacunaModal) closeLacunaModal();
    });
  }

  // Handle sidebar navigation clicks
  document.querySelectorAll(".sidebar-nav-item, .sidebar-link-btn").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tool = item.getAttribute("data-tool");

      if (tool === "midi-to-sheet") {
        // Our active tool! Keep active, scroll to main content
        document.querySelectorAll(".sidebar-nav-item").forEach(el => el.classList.remove("active"));
        item.classList.add("active");
        if (sidebar) sidebar.classList.remove("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.remove("active");

        if (workspace && workspace.classList.contains("active")) {
          workspace.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        openLacunaModal(tool);
      }
    });
  });

  const profileTrigger = document.getElementById("user-profile-trigger");
  if (profileTrigger) {
    profileTrigger.addEventListener("click", () => {
      openLacunaModal("account");
    });
  }
});
