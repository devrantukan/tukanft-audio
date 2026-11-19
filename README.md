# 🎼 Tukanft Audio — Professional MIDI to Sheet Music Studio

An AI-ready music studio that converts MIDI files into engraved sheet music notation using Python's **music21** computational musicology library, **Next.js 16 (React 19)**, **OpenSheetMusicDisplay (OSMD)**, and a **Tone.js** multi-instrument synthesizer engine.

Built for deployment on **Coolify** to serve on `audio.tukanft.com`.

---

## 🏗️ Architecture

```
midi2notes/
├── docker-compose.yml       # Coolify orchestration for production
├── backend/                 # Container 1: Python FastAPI + music21
│   ├── Dockerfile           # Python 3.12-slim container on port 8088
│   ├── app.py               # MusicXML generation, session storage & analysis
│   ├── requirements.txt
│   └── samples/             # Preloaded MIDI samples (Gymnopédie No. 1, Bach, Beethoven)
└── frontend/                # Container 2: Next.js (React 19, TypeScript, Tailwind CSS)
    ├── Dockerfile           # Node 22-alpine standalone build on port 3000
    ├── next.config.ts       # Rewrites /api/* to http://api:8088/api/*
    ├── src/
    │   ├── app/             # Next.js App Router (page.tsx, layout.tsx, globals.css)
    │   ├── components/      # Sidebar (Lacuna style), Toolbar, ScoreViewer, Controls
    │   ├── lib/             # audioPlayer.ts (Tone.js 6-instrument synth engine)
    │   └── types/
    └── public/              # Tukanft brand logos & user avatars
```

---

## ✨ Features

- **Tukanft Audio Studio UI**:
  - Lacuna.fm-style dark studio sidebar with **Tukanft Audio** geometric logo and wordmark.
  - Active tool pill on "MIDI to Sheet Music" with feature preview modals for other tools.
  - User quota card with active monthly credit tracking.
- **Smart Notation Quantization**:
  - Cleans up real-time human performances.
  - Strips out micro-tuplets and snaps durations to readable 1/16th or 1/8th note values.
  - Auto-splitting of single-track piano performances into Treble and Bass staves at Middle C.
- **Tone.js Multi-Instrument Audio Engine**:
  - 6 distinct synthesizer voices: **Grand Piano**, **Rhodes E-Piano**, **Warm Strings**, **Church Organ**, **Celesta / Chime**, and **Retro Synth**.
  - Acoustic sustain pedal simulation with release dampening.
  - Synchronized cursor tracking that smoothly steps through measures and notes in real time.
- **Harmonic Analysis**:
  - Krumhansl-Schmuckler key signature detection.
  - Measure counts, note counts, pitch range, and chromatic pitch-class distribution histograms.
  - Real-time transposition from -12 to +12 semitones.
- **Multi-Format Export**:
  - **Print / PDF**: Clean paginated vector sheets.
  - **MusicXML**: Standard MusicXML 4.0 for MuseScore, Sibelius, Dorico, Finale.
  - **Transformed MIDI**: Export transposed/quantized MIDI files.

---

## 🚀 Deploying to Coolify (`audio.tukanft.com`)

1. **Push this repository to GitHub/GitLab**.
2. **In Coolify Dashboard**:
   - Click **+ New Resource** → **Docker Compose**.
   - Select your Git repository.
   - Set **Domain**: `https://audio.tukanft.com`.
   - Set **Target Port**: `3000` (points to the `web` service).
3. **Internal Networking**:
   - The compose file automatically connects `web` to `api:8088`.
   - Session data is persisted on Docker volume `sessions_data`.
4. Click **Deploy**!

---

## 💻 Local Development

### Running with Docker Compose:
```bash
docker compose up --build
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Manually:
```bash
# Terminal 1 - Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8088 --reload

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).
