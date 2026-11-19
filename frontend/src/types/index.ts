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

export interface PartInfo {
  index: number;
  name: string;
}

export interface ScoreMetadata {
  title: string;
  keySignature: string;
  timeSignature: string;
  tempoBpm: number;
  measureCount: number;
  noteCount: number;
  durationSeconds: number;
  pitchRange: string;
  parts: PartInfo[];
  pitchClassDistribution: Record<string, number>;
}

export interface ScoreData {
  sessionId: string;
  musicXml: string;
  metadata: ScoreMetadata;
  playbackEvents: PlaybackEvent[];
}

export interface SampleInfo {
  id: string;
  title: string;
  composer: string;
  description: string;
}
