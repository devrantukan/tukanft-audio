export interface ExportNote {
  midi: number;
  startTick: number;
  durationTick: number;
  velocity?: number;
}

export function encodeVLQ(val: number): number[] {
  let v = Math.max(0, Math.round(val));
  const bytes = [v & 0x7f];
  while (v >= 0x80) {
    v >>= 7;
    bytes.unshift((v & 0x7f) | 0x80);
  }
  return bytes;
}

export function generateMidiBytes(
  notes: ExportNote[],
  bpm: number = 120,
  ppq: number = 480
): Uint8Array {
  interface RawEvent {
    tick: number;
    type: number;
    note: number;
    vel: number;
  }

  const events: RawEvent[] = [];
  for (const n of notes) {
    const vel = Math.max(1, Math.min(127, n.velocity || 90));
    events.push({ tick: Math.max(0, Math.round(n.startTick)), type: 0x90, note: n.midi, vel });
    events.push({
      tick: Math.max(0, Math.round(n.startTick + n.durationTick)),
      type: 0x80,
      note: n.midi,
      vel: 0,
    });
  }

  // Sort chronologically; for identical tick, note-off (0x80) before note-on (0x90)
  events.sort((a, b) => a.tick - b.tick || a.type - b.type);

  const trackBytes: number[] = [];

  // Track Name meta event: 00 FF 03 [len] "Piano Roll"
  const trackName = "Piano Roll Track";
  const nameBytes = Array.from(trackName).map((c) => c.charCodeAt(0));
  trackBytes.push(0x00, 0xff, 0x03, nameBytes.length, ...nameBytes);

  // Time Signature: 4/4 (00 FF 58 04 04 02 18 08)
  trackBytes.push(0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

  // Tempo meta event: FF 51 03 (microsec per beat)
  const safeBpm = Math.max(30, Math.min(300, bpm || 120));
  const mpq = Math.round(60000000 / safeBpm);
  trackBytes.push(
    0x00,
    0xff,
    0x51,
    0x03,
    (mpq >> 16) & 0xff,
    (mpq >> 8) & 0xff,
    mpq & 0xff
  );

  let lastTick = 0;
  for (const ev of events) {
    const delta = Math.max(0, ev.tick - lastTick);
    lastTick = ev.tick;
    trackBytes.push(...encodeVLQ(delta));
    trackBytes.push(ev.type, ev.note, ev.vel);
  }

  // End of track meta event: 00 FF 2F 00
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  // MThd Header
  const header = [
    0x4d, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // length 6
    0x00, 0x00,             // format 0 (single track)
    0x00, 0x01,             // 1 track
    (ppq >> 8) & 0xff, ppq & 0xff // division / PPQ
  ];

  // MTrk Header
  const trackLen = trackBytes.length;
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
    (trackLen >> 24) & 0xff,
    (trackLen >> 16) & 0xff,
    (trackLen >> 8) & 0xff,
    trackLen & 0xff
  ];

  return new Uint8Array([...header, ...trackHeader, ...trackBytes]);
}

export function downloadMidiFile(bytes: Uint8Array, filename: string = "piano_roll.mid") {
  const blob = new Blob([bytes as any], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".mid") ? filename : `${filename}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
