import os
import io
import uuid
import copy
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, Response, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import music21 as m21

BASE_DIR = Path(__file__).resolve().parent
SAMPLES_DIR = BASE_DIR / "samples"
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

app = FastAPI(title="MIDI2Notes - Sheet Music Generator with music21")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files if present
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Sample registry
SAMPLE_METADATA = [
    {
        "id": "gymnopedie_no_1.mid",
        "title": "Gymnopédie No. 1",
        "composer": "Erik Satie",
        "description": "Lent et douloureux in 3/4. Iconic atmospheric piano masterpiece.",
        "difficulty": "Beginner",
        "key": "D major"
    },
    {
        "id": "fur_elise_theme.mid",
        "title": "Für Elise (Theme)",
        "composer": "L. v. Beethoven",
        "description": "Iconic romantic piano theme in A minor with expressive arpeggiated phrasing.",
        "difficulty": "Intermediate",
        "key": "A minor"
    },
    {
        "id": "bach_prelude_c.mid",
        "title": "Prelude in C Major (BWV 846)",
        "composer": "J. S. Bach",
        "description": "Timeless polyphonic keyboard prelude with arpeggiated treble and walking bass staves.",
        "difficulty": "Easy/Intermediate",
        "key": "C major"
    },
    {
        "id": "ode_to_joy.mid",
        "title": "Ode to Joy (Symphony No. 9)",
        "composer": "L. v. Beethoven",
        "description": "Celebrated joyful choral anthem arranged with clear melodic lines in D major.",
        "difficulty": "Beginner",
        "key": "D major"
    }
]

# Session store backed by both memory and persistent disk cache
SCORE_CACHE: Dict[str, bytes] = {}
SESSION_CACHE_DIR = BASE_DIR / ".sessions"
SESSION_CACHE_DIR.mkdir(parents=True, exist_ok=True)

def save_session_midi(session_id: str, data: bytes) -> None:
    """Save MIDI bytes to in-memory cache and persistent disk cache."""
    SCORE_CACHE[session_id] = data
    try:
        (SESSION_CACHE_DIR / f"{session_id}.mid").write_bytes(data)
    except Exception as e:
        logger.warning(f"Failed to persist session to disk: {e}")

    # Prune old in-memory items if cache gets too large
    if len(SCORE_CACHE) > 100:
        oldest_key = next(iter(SCORE_CACHE))
        SCORE_CACHE.pop(oldest_key, None)

def get_session_midi(session_id: str) -> Optional[bytes]:
    """Retrieve MIDI bytes from memory or disk cache."""
    if session_id in SCORE_CACHE:
        return SCORE_CACHE[session_id]
    disk_file = SESSION_CACHE_DIR / f"{session_id}.mid"
    if disk_file.exists():
        try:
            data = disk_file.read_bytes()
            SCORE_CACHE[session_id] = data
            return data
        except Exception as e:
            logger.warning(f"Failed to read session from disk: {e}")
            return None
    return None



def simplify_score_notation(score: m21.stream.Score, quantize_mode: str = "smart") -> m21.stream.Score:
    """
    Cleans up transcription artifacts from unquantized human MIDI performances:
    - Recursively quantizes note offsets and durations across all parts & measures.
    - Strips absurd micro-tuplets (e.g. 12, 24, 48) created by 10ms human timing variations.
    - Preserves true musical triplets (3:2) while converting false micro-tuplets into clean binary notes.
    """
    if quantize_mode == "none":
        return score

    grid_map = {
        "smart": (4, 3, 2, 1),
        "16th": (4, 2, 1),
        "8th": (2, 1),
        "quarter": (1,),
        "triplet": (3, 6)
    }
    divisors = grid_map.get(quantize_mode, (4, 3, 2, 1))

    try:
        score = score.quantize(
            quarterLengthDivisors=divisors,
            processOffsets=True,
            processDurations=True,
            inPlace=False,
            recurse=True
        )
    except Exception as e:
        logger.warning(f"Score quantize fallback: {e}")

    # Strip unmusical / extreme tuplets (12, 24, 48, etc.) left over from raw MIDI ticks
    for el in score.recurse().notesAndRests:
        if el.duration and el.duration.tuplets:
            valid_tuplets = []
            for t in el.duration.tuplets:
                if t.numberNotesActual in (3, 5, 6) and quantize_mode in ("smart", "triplet"):
                    valid_tuplets.append(t)
            el.duration.tuplets = tuple(valid_tuplets)

            if not el.duration.tuplets:
                ql = float(el.duration.quarterLength)
                snapped = round(ql * 4) / 4  # Snap to 1/16th grid
                if snapped <= 0:
                    snapped = 0.25
                el.duration.quarterLength = snapped

    return score


def get_session_midi(session_id: str) -> Optional[bytes]:
    """Retrieve MIDI bytes from memory or disk cache."""
    if session_id in SCORE_CACHE:
        return SCORE_CACHE[session_id]
    disk_file = SESSION_CACHE_DIR / f"{session_id}.mid"
    if disk_file.exists():
        try:
            data = disk_file.read_bytes()
            SCORE_CACHE[session_id] = data
            return data
        except Exception as e:
            logger.warning(f"Failed to read session from disk: {e}")
            return None
    return None



def simplify_score_notation(score: m21.stream.Score, quantize_mode: str = "smart") -> m21.stream.Score:
    """
    Cleans up transcription artifacts from unquantized human MIDI performances:
    - Recursively quantizes note offsets and durations across all parts & measures.
    - Strips absurd micro-tuplets (e.g. 12, 24, 48) created by 10ms human timing variations.
    - Preserves true musical triplets (3:2) while converting false micro-tuplets into clean binary notes.
    """
    if quantize_mode == "none":
        return score

    grid_map = {
        "smart": (4, 3, 2, 1),
        "16th": (4, 2, 1),
        "8th": (2, 1),
        "quarter": (1,),
        "triplet": (3, 6)
    }
    divisors = grid_map.get(quantize_mode, (4, 3, 2, 1))

    try:
        score = score.quantize(
            quarterLengthDivisors=divisors,
            processOffsets=True,
            processDurations=True,
            inPlace=False,
            recurse=True
        )
    except Exception as e:
        logger.warning(f"Score quantize fallback: {e}")

    # Strip unmusical / extreme tuplets (12, 24, 48, etc.) left over from raw MIDI ticks
    for el in score.recurse().notesAndRests:
        if el.duration and el.duration.tuplets:
            valid_tuplets = []
            for t in el.duration.tuplets:
                if t.numberNotesActual in (3, 5, 6) and quantize_mode in ("smart", "triplet"):
                    valid_tuplets.append(t)
            el.duration.tuplets = tuple(valid_tuplets)

            if not el.duration.tuplets:
                ql = float(el.duration.quarterLength)
                snapped = round(ql * 4) / 4  # Snap to 1/16th grid
                if snapped <= 0:
                    snapped = 0.25
                el.duration.quarterLength = snapped

    return score


def split_single_part_to_grand_staff(score: m21.stream.Score, split_midi: int = 60) -> m21.stream.Score:
    """
    If a score has a single part spanning both treble and bass registers,
    intelligently split it into a grand staff (Treble + Bass).
    """
    if len(score.parts) != 1:
        return score

    orig_part = score.parts[0]
    all_notes = orig_part.flatten().notes
    has_low = any(
        (n.isNote and n.pitch.midi < split_midi) or 
        (n.isChord and any(p.midi < split_midi for p in n.pitches))
        for n in all_notes
    )
    has_high = any(
        (n.isNote and n.pitch.midi >= split_midi) or 
        (n.isChord and any(p.midi >= split_midi for p in n.pitches))
        for n in all_notes
    )

    if not (has_low and has_high):
        return score

    new_score = m21.stream.Score()
    if score.metadata:
        new_score.metadata = copy.deepcopy(score.metadata)

    part_name = orig_part.partName or "Piano"
    p_rh = m21.stream.Part()
    p_rh.id = "RH"
    p_rh.partName = "Right Hand"
    p_rh.append(m21.clef.TrebleClef())

    p_lh = m21.stream.Part()
    p_lh.id = "LH"
    p_lh.partName = "Left Hand"
    p_lh.append(m21.clef.BassClef())

    # Copy initial metadata & directives
    for elem in orig_part.flatten().getElementsByClass([m21.meter.TimeSignature, m21.key.Key, m21.tempo.MetronomeMark]):
        p_rh.insert(elem.offset, copy.deepcopy(elem))
        p_lh.insert(elem.offset, copy.deepcopy(elem))

    for el in orig_part.flatten().notesAndRests:
        offset = el.offset
        dur = el.quarterLength
        if el.isRest:
            p_rh.insert(offset, copy.deepcopy(el))
            p_lh.insert(offset, copy.deepcopy(el))
        elif el.isChord:
            high_pitches = [p for p in el.pitches if p.midi >= split_midi]
            low_pitches = [p for p in el.pitches if p.midi < split_midi]
            if high_pitches:
                p_rh.insert(offset, m21.chord.Chord(high_pitches, quarterLength=dur))
            if low_pitches:
                p_lh.insert(offset, m21.chord.Chord(low_pitches, quarterLength=dur))
        elif el.isNote:
            if el.pitch.midi >= split_midi:
                p_rh.insert(offset, copy.deepcopy(el))
            else:
                p_lh.insert(offset, copy.deepcopy(el))

    p_rh.makeMeasures(inPlace=True)
    p_lh.makeMeasures(inPlace=True)
    new_score.insert(0.0, p_rh)
    new_score.insert(0.0, p_lh)

    # Add piano brace connecting RH and LH
    staff_group = m21.layout.StaffGroup([p_rh, p_lh], symbol="brace", barTogether=True)
    new_score.insert(0, staff_group)

    return new_score


def process_midi_data(
    midi_bytes: bytes,
    transpose_semitones: int = 0,
    quantize_mode: str = "none",
    split_grand_staff: bool = False,
    selected_part: str = "all",
    custom_title: Optional[str] = None
) -> Dict[str, Any]:
    """
    Parses MIDI bytes using music21, applies musical transformations,
    extracts rich metadata and audio playback events, and renders MusicXML.
    """
    if hasattr(transpose_semitones, "default"):
        transpose_semitones = transpose_semitones.default
    if hasattr(quantize_mode, "default"):
        quantize_mode = quantize_mode.default
    if hasattr(split_grand_staff, "default"):
        split_grand_staff = split_grand_staff.default
    if hasattr(selected_part, "default"):
        selected_part = selected_part.default

    try:
        transpose_semitones = int(transpose_semitones)
    except (TypeError, ValueError):
        transpose_semitones = 0
    quantize_mode = str(quantize_mode or "none")
    split_grand_staff = bool(split_grand_staff)
    selected_part = str(selected_part or "all")

    try:
        score = m21.converter.parse(midi_bytes, format="midi")
    except Exception as e:
        raise ValueError(f"Failed to parse MIDI file: {str(e)}")

    # 1. Part Isolation if requested
    if selected_part != "all":
        try:
            part_idx = int(selected_part)
            if 0 <= part_idx < len(score.parts):
                new_score = m21.stream.Score()
                if score.metadata:
                    new_score.metadata = copy.deepcopy(score.metadata)
                new_score.append(copy.deepcopy(score.parts[part_idx]))
                score = new_score
        except (ValueError, IndexError):
            pass

    # 2. Grand Staff split if requested OR auto-detected for wide-register single tracks
    all_flat_notes = score.flatten().notes
    has_wide_range = False
    if all_flat_notes:
        pitches_midi = [p.midi for n in all_flat_notes for p in (n.pitches if n.isChord else [n.pitch])]
        if pitches_midi:
            has_wide_range = min(pitches_midi) < 60 and max(pitches_midi) >= 60

    if split_grand_staff or (len(score.parts) == 1 and has_wide_range):
        score = split_single_part_to_grand_staff(score, split_midi=60)

    # 3. Quantization and Notation Simplification
    score = simplify_score_notation(score, quantize_mode=quantize_mode)

    # 4. Transposition if requested
    if transpose_semitones != 0:
        try:
            score = score.transpose(int(transpose_semitones))
        except Exception as e:
            raise ValueError(f"Failed to transpose score: {str(e)}")

    # 5. Metadata extraction
    # Key analysis
    key_name = "C major"
    key_confidence = 0.5
    try:
        analyzed_key = score.analyze("key")
        key_name = analyzed_key.name
        key_confidence = round(float(analyzed_key.correlationCoefficient), 2)
    except Exception:
        pass

    # Tempo / BPM
    bpm = 120.0
    tempos = score.flatten().getElementsByClass(m21.tempo.MetronomeMark)
    if tempos and tempos[0].number:
        bpm = round(float(tempos[0].number), 1)

    # Time signature
    time_sig_str = "4/4"
    time_sigs = score.flatten().getElementsByClass(m21.meter.TimeSignature)
    if time_sigs:
        time_sig_str = time_sigs[0].ratioString

    # Note list and pitch analysis
    notes_flat = list(score.flatten().notes)
    try:
        mf_check = m21.midi.MidiFile()
        mf_check.readstr(midi_bytes)
        raw_note_strikes = sum(1 for tr in mf_check.tracks for ev in tr.events if ev.type == 0x90 or ev.type == "NOTE_ON")
        notes_count = raw_note_strikes if raw_note_strikes > 0 else sum(len(n.pitches) if n.isChord else 1 for n in notes_flat)
    except Exception:
        notes_count = sum(len(n.pitches) if n.isChord else 1 for n in notes_flat)

    all_midi_pitches = []
    pitch_distribution: Dict[str, int] = {}

    for n in notes_flat:
        if n.isChord:
            for p in n.pitches:
                all_midi_pitches.append(p.midi)
                step = p.step
                pitch_distribution[step] = pitch_distribution.get(step, 0) + 1
        elif n.isNote:
            all_midi_pitches.append(n.pitch.midi)
            step = n.pitch.step
            pitch_distribution[step] = pitch_distribution.get(step, 0) + 1

    min_pitch_str = m21.pitch.Pitch(midi=min(all_midi_pitches)).nameWithOctave if all_midi_pitches else "N/A"
    max_pitch_str = m21.pitch.Pitch(midi=max(all_midi_pitches)).nameWithOctave if all_midi_pitches else "N/A"

    # Measures count
    measures_count = 0
    if score.parts:
        measures_count = max(len(p.getElementsByClass(m21.stream.Measure)) for p in score.parts)
    if measures_count == 0:
        flat_measures = score.flatten().getElementsByClass(m21.stream.Measure)
        measures_count = len(flat_measures)

    # Duration calculation across parallel tracks/staves (accounting for tempo marks)
    duration_seconds = 0.0
    max_quarter_length = max((float(p.highestTime) for p in score.parts), default=0.0) if score.parts else float(score.highestTime)
    try:
        boundaries = score.metronomeMarkBoundaries()
        if boundaries and len(boundaries) > 0:
            for idx, (start, end, mm) in enumerate(boundaries):
                b = float(mm.number) if (mm and mm.number) else bpm
                if end is None or end > max_quarter_length or idx == len(boundaries) - 1:
                    end = max_quarter_length
                span = max(0.0, float(end - start))
                duration_seconds += span * (60.0 / b)
            duration_seconds = round(duration_seconds, 2)
    except Exception:
        pass

    if duration_seconds == 0.0:
        duration_seconds = round(max_quarter_length * (60.0 / bpm), 2) if bpm > 0 else 0.0

    # Parts information
    parts_info = []
    for idx, p in enumerate(score.parts):
        name_str = str(p.partName) if p.partName else ""
        if not name_str or name_str.startswith("Instr. P") or (name_str.startswith("P") and len(name_str) > 8) or name_str.isdigit():
            if len(score.parts) == 1:
                clean_name = "Piano"
            elif len(score.parts) == 2 and p.id == "RH":
                clean_name = "Right Hand (Treble)"
            elif len(score.parts) == 2 and p.id == "LH":
                clean_name = "Left Hand (Bass)"
            else:
                clean_name = f"Track {idx + 1}"
            p.partName = clean_name
        else:
            clean_name = name_str

        p_notes = len(p.flatten().notes)
        clefs = [c.name for c in p.flatten().getElementsByClass(m21.clef.Clef)]
        primary_clef = clefs[0] if clefs else "treble"
        parts_info.append({
            "index": idx,
            "name": clean_name,
            "notesCount": p_notes,
            "clef": primary_clef
        })

    # Title handling
    title = custom_title if isinstance(custom_title, str) and custom_title.strip() else None
    if not title:
        # Check track names in MIDI
        try:
            mf_title = m21.midi.MidiFile()
            mf_title.readstr(midi_bytes)
            for tr in mf_title.tracks:
                for ev in tr.events:
                    if ev.type == 3 and isinstance(ev.data, (bytes, str)):
                        t_str = ev.data.decode("utf-8", "ignore") if isinstance(ev.data, bytes) else ev.data
                        if t_str and not t_str.lower().startswith("track"):
                            title = t_str.replace("_", " ").replace("-", " ").title()
                            break
                if title:
                    break
        except Exception:
            pass

    if not title:
        if score.metadata and score.metadata.title:
            title = score.metadata.title
        else:
            title = "Untitled Score"

    # Set metadata title for MusicXML
    if not score.metadata:
        score.metadata = m21.metadata.Metadata()
    score.metadata.title = title
    if not score.metadata.composer or score.metadata.composer == "Music21":
        score.metadata.composer = ""
    score.metadata.movementName = ""

    # 6. Render MusicXML
    try:
        exporter = m21.musicxml.m21ToXml.GeneralObjectExporter()
        musicxml_str = exporter.parse(score).decode("utf-8")
    except Exception as e:
        raise ValueError(f"Failed to generate MusicXML: {str(e)}")

    # 7. Extract audio playback events for Tone.js
    # Timestamps in seconds based on BPM
    # Timestamps in seconds based on BPM, preserving actual velocities
    playback_events = []
    seconds_per_quarter = 60.0 / bpm if bpm > 0 else 0.5
    for n in notes_flat:
        start_sec = round(float(n.offset) * seconds_per_quarter, 3)
        dur_sec = round(float(n.quarterLength) * seconds_per_quarter, 3)
        vel = 80
        if hasattr(n, "volume") and n.volume and n.volume.velocity is not None:
            vel = int(n.volume.velocity)

        if n.isChord:
            for p in n.pitches:
                p_vel = vel
                if hasattr(p, "volume") and p.volume and p.volume.velocity is not None:
                    p_vel = int(p.volume.velocity)
                playback_events.append({
                    "time": start_sec,
                    "duration": dur_sec,
                    "midi": p.midi,
                    "name": p.nameWithOctave,
                    "velocity": p_vel
                })
        elif n.isNote:
            playback_events.append({
                "time": start_sec,
                "duration": dur_sec,
                "midi": n.pitch.midi,
                "name": n.pitch.nameWithOctave,
                "velocity": vel
            })

    # Sort events chronologically
    playback_events.sort(key=lambda x: (x["time"], x["midi"]))

    pitch_range_str = f"{min_pitch_str} - {max_pitch_str}" if min_pitch_str != "N/A" else "N/A"

    return {
        "musicxml": musicxml_str,
        "musicXml": musicxml_str,
        "metadata": {
            "title": title,
            "key": key_name,
            "keySignature": key_name,
            "keyConfidence": key_confidence,
            "tempoBpm": bpm,
            "timeSignature": time_sig_str,
            "measuresCount": measures_count,
            "measureCount": measures_count,
            "notesCount": notes_count,
            "noteCount": notes_count,
            "minPitch": min_pitch_str,
            "maxPitch": max_pitch_str,
            "pitchRange": pitch_range_str,
            "durationSeconds": duration_seconds,
            "parts": parts_info,
            "pitchDistribution": pitch_distribution,
            "pitchClassDistribution": pitch_distribution,
            "transposition": transpose_semitones,
            "quantization": quantize_mode
        },
        "playbackEvents": playback_events
    }


@app.get("/")
async def get_root():
    return JSONResponse(content={"status": "ok", "service": "tukanft-audio-backend-api", "version": "2.0.0"})


@app.get("/api/samples")
async def get_samples():
    return JSONResponse(content={"samples": SAMPLE_METADATA})


@app.post("/api/convert")
async def convert_midi(
    file: UploadFile = File(...),
    transpose: int = Form(0),
    quantize: str = Form("smart"),
    split_grand_staff: bool = Form(False),
    selected_part: str = Form("all")
):
    if not (file.filename.lower().endswith(".mid") or file.filename.lower().endswith(".midi")):
        raise HTTPException(status_code=400, detail="Uploaded file must be a MIDI file (.mid or .midi)")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    session_id = str(uuid.uuid4())
    save_session_midi(session_id, contents)

    stem_title = Path(file.filename).stem.replace("_", " ").title()

    try:
        result = process_midi_data(
            midi_bytes=contents,
            transpose_semitones=transpose,
            quantize_mode=quantize,
            split_grand_staff=split_grand_staff,
            selected_part=selected_part,
            custom_title=stem_title
        )
        result["sessionId"] = session_id
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/sample/{sample_id}")
async def load_sample(
    sample_id: str,
    transpose: int = Form(0),
    quantize: str = Form("smart"),
    split_grand_staff: bool = Form(False),
    selected_part: str = Form("all")
):
    sample_path = SAMPLES_DIR / sample_id
    if not sample_path.exists():
        raise HTTPException(status_code=404, detail="Sample not found")

    contents = sample_path.read_bytes()
    session_id = str(uuid.uuid4())
    save_session_midi(session_id, contents)

    sample_info = next((s for s in SAMPLE_METADATA if s["id"] == sample_id), None)
    title = sample_info["title"] if sample_info else sample_path.stem.replace("_", " ").title()

    try:
        result = process_midi_data(
            midi_bytes=contents,
            transpose_semitones=transpose,
            quantize_mode=quantize,
            split_grand_staff=split_grand_staff,
            selected_part=selected_part,
            custom_title=title
        )
        result["sessionId"] = session_id
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/reprocess")
async def reprocess_score(
    session_id: str = Form(...),
    transpose: int = Form(0),
    quantize: str = Form("none"),
    split_grand_staff: bool = Form(False),
    selected_part: str = Form("all"),
    title: Optional[str] = Form(None)
):
    contents = get_session_midi(session_id)
    if not contents:
        raise HTTPException(status_code=404, detail="Session expired or not found. Please re-upload MIDI.")

    try:
        result = process_midi_data(
            midi_bytes=contents,
            transpose_semitones=transpose,
            quantize_mode=quantize,
            split_grand_staff=split_grand_staff,
            selected_part=selected_part,
            custom_title=title
        )
        result["sessionId"] = session_id
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/export/midi")
async def export_midi(
    session_id: str = Form(...),
    transpose: int = Form(0),
    quantize: str = Form("none"),
    selected_part: str = Form("all")
):
    contents = get_session_midi(session_id)
    if not contents:
        raise HTTPException(status_code=404, detail="Session not found")

    # If no transformations requested, return the pristine original uploaded MIDI
    # (preserving original microtiming, human velocity layers, and sustain pedal CC64)
    if transpose == 0 and quantize == "none" and selected_part == "all":
        return Response(
            content=contents,
            media_type="audio/midi",
            headers={"Content-Disposition": "attachment; filename=original_score.mid"}
        )

    score = m21.converter.parse(contents, format="midi")

    if selected_part != "all":
        try:
            part_idx = int(selected_part)
            if 0 <= part_idx < len(score.parts):
                new_score = m21.stream.Score()
                new_score.append(score.parts[part_idx])
                score = new_score
        except Exception:
            pass

    if quantize != "none":
        grid_map = {"smart": (4, 3, 2, 1), "16th": (4, 2), "8th": (2, 1), "quarter": (1,), "triplet": (3, 6)}
        divisors = grid_map.get(quantize)
        if divisors:
            try:
                score = score.quantize(divisors, processOffsets=True, processDurations=True, inPlace=False)
            except Exception:
                pass

    if transpose != 0:
        score = score.transpose(int(transpose))

    # Export to MIDI bytes
    mf = m21.midi.translate.streamToMidiFile(score)
    midi_bytes = mf.writestr()

    return Response(
        content=midi_bytes,
        media_type="audio/midi",
        headers={"Content-Disposition": "attachment; filename=score_transposed.mid"}
    )


@app.get("/api/health")
async def health():
    return {"status": "ok", "music21_version": m21.__version__}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8088, reload=True)
