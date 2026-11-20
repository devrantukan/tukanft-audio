"""AI Music Generation Engine using music21.
Generates genuine multi-voice MIDI musical compositions across genres and keys.
"""

import io
import math
import random
from typing import Tuple, Dict, Any
import music21 as m21


def parse_key_str(key_str: str) -> Tuple[str, str]:
    """Parse user key like 'Eb Major', 'A Minor', 'C Major' into (tonic, mode)."""
    if not key_str:
        return "C", "major"
    parts = key_str.strip().split()
    tonic = parts[0]
    mode = "major"
    if len(parts) >= 2:
        mode = parts[1].lower()
    tonic = tonic.replace("b", "-").replace("♯", "#")
    return tonic, mode


def build_chord_pitches(root_pitch: m21.pitch.Pitch, chord_type: str) -> list:
    """Build pitches for chords like maj7, maj9, m7, m9, 7, 9, 11, etc."""
    intervals_map = {
        "maj": ["P1", "M3", "P5"],
        "min": ["P1", "m3", "P5"],
        "maj7": ["P1", "M3", "P5", "M7"],
        "min7": ["P1", "m3", "P5", "m7"],
        "dom7": ["P1", "M3", "P5", "m7"],
        "maj9": ["P1", "M3", "P5", "M7", "M9"],
        "min9": ["P1", "m3", "P5", "m7", "M9"],
        "dom9": ["P1", "M3", "P5", "m7", "M9"],
        "min11": ["P1", "m3", "P5", "m7", "M9", "P11"],
        "dim7": ["P1", "m3", "d5", "d7"],
        "sus4": ["P1", "P4", "P5"],
        "7sus4": ["P1", "P4", "P5", "m7"],
    }
    intervals = intervals_map.get(chord_type, ["P1", "M3", "P5"])
    pitches = []
    for int_str in intervals:
        i = m21.interval.Interval(int_str)
        p = i.transposePitch(root_pitch)
        pitches.append(p)
    return pitches


def generate_ai_composition(
    prompt: str = "",
    key_str: str = "Eb Major",
    bpm: int = 84,
    genre: str = "Neo-Soul",
    measures_count: int = 8
) -> bytes:
    """Generate authentic multi-track / grand staff MIDI score bytes."""
    tonic_str, mode = parse_key_str(key_str)
    key_obj = m21.key.Key(tonic_str, mode)

    score = m21.stream.Score()
    
    rh_part = m21.stream.Part(id="P1")
    rh_part.partName = "Piano (Right Hand)"
    rh_part.append(m21.clef.TrebleClef())
    rh_part.append(m21.tempo.MetronomeMark(number=float(bpm)))
    rh_part.append(m21.meter.TimeSignature("4/4"))
    rh_part.append(m21.key.Key(tonic_str, mode))

    lh_part = m21.stream.Part(id="P2")
    lh_part.partName = "Piano (Left Hand)"
    lh_part.append(m21.clef.BassClef())
    lh_part.append(m21.meter.TimeSignature("4/4"))
    lh_part.append(m21.key.Key(tonic_str, mode))

    # Scale degrees mapping based on mode
    # Root pitch in octave 3 for LH, octave 4 for RH
    root_pitch_lh = m21.pitch.Pitch(tonic_str + "2")
    root_pitch_rh = m21.pitch.Pitch(tonic_str + "4")

    # Define genre progression formulas (Roman numeral scale degrees & chord types)
    # Each entry: (scale_degree_semitones_from_tonic, chord_type, lh_pattern, rh_pattern)
    norm_genre = genre.lower()
    
    if "neo" in norm_genre or "soul" in norm_genre or "r&b" in norm_genre:
        # Lush 2-5-1-6, 4-3-2-1 turnaround
        # e.g., in major: ii9 -> V13 -> Imaj9 -> VI7(alt) -> IVmaj9 -> iii7 -> ii9 -> Imaj9
        progression = [
            (2, "min9", "root_fifth", "syncopated_voicing"),
            (7, "dom9", "root_octave", "swing_accent"),
            (0, "maj9", "root_fifth", "laidback_voicing"),
            (9, "dom7", "walking", "blues_fill"),
            (5, "maj9", "root_fifth", "syncopated_voicing"),
            (4, "min7", "root_octave", "arpeggiate_up"),
            (2, "min9", "walking", "swing_accent"),
            (0, "maj9", "sustained", "lush_chord"),
        ]
    elif "lofi" in norm_genre:
        # Muted jazzy 7ths, gentle rhodes chords
        progression = [
            (0, "maj7", "root_fifth", "laidback_voicing"),
            (9, "min7", "root_octave", "syncopated_voicing"),
            (2, "min7", "root_fifth", "laidback_voicing"),
            (7, "dom7", "root_octave", "swing_accent"),
            (5, "maj7", "root_fifth", "laidback_voicing"),
            (4, "min7", "root_octave", "syncopated_voicing"),
            (2, "min9", "root_fifth", "blues_fill"),
            (0, "maj9", "sustained", "lush_chord"),
        ]
    elif "cinematic" in norm_genre:
        # Deep dramatic octaves, rising arpeggios, epic cadence
        progression = [
            (0, "min" if mode == "minor" else "maj", "octaves_pedal", "arpeggiate_up"),
            (8 if mode == "minor" else 9, "maj", "octaves_pedal", "arpeggiate_up"),
            (3 if mode == "minor" else 5, "maj", "octaves_pedal", "arpeggiate_soaring"),
            (10 if mode == "minor" else 7, "maj", "octaves_pedal", "heroic_chords"),
            (0, "min" if mode == "minor" else "maj", "octaves_pedal", "arpeggiate_up"),
            (8 if mode == "minor" else 5, "maj", "octaves_pedal", "heroic_chords"),
            (10 if mode == "minor" else 7, "dom7", "driving_eighths", "soaring_lead"),
            (0, "min" if mode == "minor" else "maj", "sustained", "lush_chord"),
        ]
    elif "classical" in norm_genre:
        # Baroque / Classical Alberti bass & counterpoint (I - IV - V - I)
        progression = [
            (0, "maj" if mode == "major" else "min", "alberti", "melody_flow"),
            (5, "maj", "alberti", "melody_flow"),
            (2, "min", "alberti", "melody_ornament"),
            (7, "dom7", "alberti", "melody_flow"),
            (9 if mode == "major" else 8, "min" if mode == "major" else "maj", "alberti", "melody_ornament"),
            (5, "maj", "alberti", "melody_flow"),
            (7, "dom7", "dominant_cadence", "trill_cadence"),
            (0, "maj" if mode == "major" else "min", "sustained", "final_cadence"),
        ]
    elif "synthwave" in norm_genre:
        # Driving 80s bassline, retro neon arps
        progression = [
            (0, "min" if mode == "minor" else "maj", "synth_pulse", "neon_lead"),
            (8 if mode == "minor" else 5, "maj", "synth_pulse", "neon_lead"),
            (10 if mode == "minor" else 7, "maj", "synth_pulse", "neon_lead"),
            (0, "min" if mode == "minor" else "maj", "synth_pulse", "neon_arps"),
            (8 if mode == "minor" else 5, "maj", "synth_pulse", "neon_arps"),
            (10 if mode == "minor" else 7, "maj", "synth_pulse", "neon_lead"),
            (7, "dom7", "synth_pulse", "neon_lead"),
            (0, "min" if mode == "minor" else "maj", "sustained", "lush_chord"),
        ]
    else:  # Jazz or general
        progression = [
            (2, "min7", "walking", "swing_accent"),
            (7, "dom7", "walking", "swing_accent"),
            (0, "maj7", "walking", "syncopated_voicing"),
            (9, "dom7", "walking", "blues_fill"),
            (5, "maj7", "walking", "syncopated_voicing"),
            (4, "min7", "walking", "swing_accent"),
            (2, "min9", "walking", "blues_fill"),
            (0, "maj9", "sustained", "lush_chord"),
        ]

    # Generate each measure
    for measure_idx in range(measures_count):
        deg_semi, chord_type, lh_style, rh_style = progression[measure_idx % len(progression)]
        
        # Determine chord root
        root_lh = root_pitch_lh.transpose(deg_semi)
        root_rh = root_pitch_rh.transpose(deg_semi)
        
        chord_pitches = build_chord_pitches(root_rh, chord_type)
        
        # 1. Left Hand pattern (4 beats per measure)
        if lh_style == "alberti":
            # Alberti: Low - High - Mid - High (4 eighth notes or 8 sixteenths)
            p_low = root_lh
            p_fifth = root_lh.transpose(7)
            p_third = chord_pitches[1].transpose(-12)
            alberti_seq = [p_low, p_fifth, p_third, p_fifth] * 2
            for p in alberti_seq:
                n = m21.note.Note(p)
                n.quarterLength = 0.5
                n.volume.velocity = 68
                lh_part.append(n)
        elif lh_style == "synth_pulse":
            # 8 eighth notes: Root - Octave alternating
            p_low = root_lh
            p_high = root_lh.transpose(12)
            for i in range(8):
                p = p_low if (i % 2 == 0) else p_high
                n = m21.note.Note(p)
                n.quarterLength = 0.5
                n.volume.velocity = 82 if (i % 2 == 0) else 74
                lh_part.append(n)
        elif lh_style == "walking":
            # 4 quarter notes: root, 3rd, 5th, chromatic approach
            approach = root_lh.transpose(deg_semi + (1 if measure_idx % 2 == 0 else -1))
            walk_pitches = [root_lh, chord_pitches[1].transpose(-12), root_lh.transpose(7), approach]
            for p in walk_pitches:
                n = m21.note.Note(p)
                n.quarterLength = 1.0
                n.volume.velocity = 75
                lh_part.append(n)
        elif lh_style == "octaves_pedal":
            # Root octave half notes
            for _ in range(2):
                c = m21.chord.Chord([root_lh, root_lh.transpose(12)])
                c.quarterLength = 2.0
                c.volume.velocity = 85
                lh_part.append(c)
        elif lh_style == "root_fifth":
            # Beat 1-2: root, Beat 3-4: fifth
            n1 = m21.note.Note(root_lh)
            n1.quarterLength = 2.0
            n1.volume.velocity = 76
            lh_part.append(n1)
            n2 = m21.note.Note(root_lh.transpose(7))
            n2.quarterLength = 2.0
            n2.volume.velocity = 72
            lh_part.append(n2)
        elif lh_style == "root_octave":
            n1 = m21.note.Note(root_lh)
            n1.quarterLength = 2.0
            n1.volume.velocity = 76
            lh_part.append(n1)
            n2 = m21.note.Note(root_lh.transpose(12))
            n2.quarterLength = 2.0
            n2.volume.velocity = 74
            lh_part.append(n2)
        else: # sustained / final
            c = m21.chord.Chord([root_lh, root_lh.transpose(7), root_lh.transpose(12)])
            c.quarterLength = 4.0
            c.volume.velocity = 80
            lh_part.append(c)

        # 2. Right Hand pattern (4 beats per measure)
        if rh_style == "syncopated_voicing":
            # Beat 1: Chord dotted quarter (1.5), Beat 2.5: eighth (0.5), Beat 3: half (2.0)
            c1 = m21.chord.Chord(chord_pitches[:4])
            c1.quarterLength = 1.5
            c1.volume.velocity = 82
            rh_part.append(c1)

            # Lead melody note
            top_note = chord_pitches[-1].transpose(12 if len(chord_pitches) < 4 else 0)
            n1 = m21.note.Note(top_note)
            n1.quarterLength = 0.5
            n1.volume.velocity = 88
            rh_part.append(n1)

            c2 = m21.chord.Chord(chord_pitches[:3])
            c2.quarterLength = 2.0
            c2.volume.velocity = 78
            rh_part.append(c2)

        elif rh_style == "arpeggiate_up":
            # 8 eighth notes rolling up chord pitches
            arp = chord_pitches * 2
            for i in range(8):
                p = arp[i % len(arp)]
                n = m21.note.Note(p)
                n.quarterLength = 0.5
                n.volume.velocity = 72 + (i * 2)
                rh_part.append(n)

        elif rh_style == "swing_accent":
            # Quarter rest/chord then syncopated chords
            c1 = m21.chord.Chord(chord_pitches[:4])
            c1.quarterLength = 1.0
            c1.volume.velocity = 78
            rh_part.append(c1)

            n_rest = m21.note.Rest(quarterLength=0.5)
            rh_part.append(n_rest)

            c2 = m21.chord.Chord(chord_pitches[:4])
            c2.quarterLength = 1.5
            c2.volume.velocity = 88
            rh_part.append(c2)

            n_fill = m21.note.Note(chord_pitches[-1])
            n_fill.quarterLength = 1.0
            n_fill.volume.velocity = 80
            rh_part.append(n_fill)

        elif rh_style == "melody_flow":
            # Classical cantabile melody: quarter, two eighths, quarter, quarter
            n1 = m21.note.Note(chord_pitches[-1])
            n1.quarterLength = 1.0
            n1.volume.velocity = 85
            rh_part.append(n1)

            n2 = m21.note.Note(chord_pitches[1])
            n2.quarterLength = 0.5
            n2.volume.velocity = 78
            rh_part.append(n2)

            n3 = m21.note.Note(chord_pitches[2])
            n3.quarterLength = 0.5
            n3.volume.velocity = 82
            rh_part.append(n3)

            c_mid = m21.chord.Chord(chord_pitches[:3])
            c_mid.quarterLength = 2.0
            c_mid.volume.velocity = 80
            rh_part.append(c_mid)

        elif rh_style == "neon_lead":
            # Synth lead: 16th arps and punchy stabs
            c_stab = m21.chord.Chord(chord_pitches[:3])
            c_stab.quarterLength = 1.5
            c_stab.volume.velocity = 90
            rh_part.append(c_stab)

            top_p = chord_pitches[-1]
            for i in range(5):
                n = m21.note.Note(top_p.transpose((i % 3) * 2))
                n.quarterLength = 0.5
                n.volume.velocity = 84
                rh_part.append(n)

        elif rh_style == "blues_fill":
            # Neo-soul blues fill
            c_start = m21.chord.Chord(chord_pitches[:3])
            c_start.quarterLength = 2.0
            c_start.volume.velocity = 80
            rh_part.append(c_start)

            # 4 sixteenth notes descending + half resolution
            p_top = chord_pitches[-1]
            for diff in [3, 2, 0, -2]:
                n = m21.note.Note(p_top.transpose(diff))
                n.quarterLength = 0.25
                n.volume.velocity = 86
                rh_part.append(n)

            n_res = m21.note.Note(p_top.transpose(-5))
            n_res.quarterLength = 1.0
            n_res.volume.velocity = 82
            rh_part.append(n_res)

        else: # lush_chord / final
            c_final = m21.chord.Chord(chord_pitches)
            c_final.quarterLength = 4.0
            c_final.volume.velocity = 82
            rh_part.append(c_final)

    score.append(rh_part)
    score.append(lh_part)

    mf = m21.midi.translate.music21ObjectToMidiFile(score)
    return mf.writestr()
