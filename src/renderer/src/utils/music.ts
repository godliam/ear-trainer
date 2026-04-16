// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Instrument = 'piano' | 'guitar' | 'piccolo'

export type KeySignature = {
  name: string
  displayName: string
  type: 'major' | 'minor'
  pitchClasses: number[]
}

export type Triad = {
  root: number
  notes: number[]
  type: 'major' | 'minor' | 'diminished' | 'augmented'
  inversion: 0 | 1 | 2
  name: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const NOTE_NAMES_SHARP = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const

export const NOTE_NAMES_FLAT = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B',
] as const

/** Middle‑C (C3) expressed as a MIDI note number. */
export const MIDI_C3 = 48
export const MIDI_C6 = 84


// Triad interval patterns (semitones from root)
const TRIAD_PATTERNS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
} as const

// Major scale interval pattern (whole/half steps in semitones)
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]

// Natural minor scale interval pattern
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10]

// Diatonic triad qualities for major keys: I ii iii IV V vi vii°
const MAJOR_DIATONIC_QUALITIES: Triad['type'][] = [
  'major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished',
]

// Diatonic triad qualities for natural minor keys: i ii° III iv v VI VII
const MINOR_DIATONIC_QUALITIES: Triad['type'][] = [
  'minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major',
]

// Keys that should use flat notation for display
const FLAT_KEYS = new Set([
  'F', 'Bb', 'Eb', 'Ab', 'Db',
  'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm',
])

// ---------------------------------------------------------------------------
// Helper: parse note name to pitch class
// ---------------------------------------------------------------------------

const NOTE_NAME_TO_PC: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
}

// ---------------------------------------------------------------------------
// Core helper functions
// ---------------------------------------------------------------------------

/**
 * Returns the pitch class (0–11) for a MIDI note number.
 * 0 = C, 1 = C#/Db, … 11 = B.
 */
export function midiToPitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12
}

/**
 * Converts a MIDI note number to a human‑readable note name with octave.
 *
 * @param midi    MIDI note number (e.g. 60)
 * @param useFlats  When `true`, use flat names (Db instead of C#).
 * @returns e.g. `"C4"`, `"Db4"`
 */
export function midiToNoteName(midi: number, useFlats = false): string {
  const pc = midiToPitchClass(midi)
  // Octave convention: MIDI 48 = C3, so octave = floor(midi / 12) - 1.
  const octave = Math.floor(midi / 12) - 1
  const names = useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP
  return `${names[pc]}${octave}`
}

/**
 * Parses a note name string (e.g. `"C#4"`, `"Db3"`) into a MIDI note number.
 *
 * @throws if the note name cannot be parsed.
 */
export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-Ga-g][#b]?)(-?\d+)$/)
  if (!match) {
    throw new Error(`Invalid note name: "${name}"`)
  }

  const notePart = match[1].charAt(0).toUpperCase() + match[1].slice(1)
  const octave = parseInt(match[2], 10)

  const pc = NOTE_NAME_TO_PC[notePart]
  if (pc === undefined) {
    throw new Error(`Unknown note: "${notePart}"`)
  }

  // octave offset: C4 = MIDI 60  ->  (octave + 1) * 12 + pc
  return (octave + 1) * 12 + pc
}

/**
 * Returns `true` when the given MIDI note falls on a black piano key.
 */
export function isBlackKey(midi: number): boolean {
  const pc = midiToPitchClass(midi)
  // Black keys are pitch classes 1, 3, 6, 8, 10
  return [1, 3, 6, 8, 10].includes(pc)
}

// ---------------------------------------------------------------------------
// Key signatures
// ---------------------------------------------------------------------------

function buildPitchClasses(rootPc: number, intervals: number[]): number[] {
  return intervals.map((i) => (rootPc + i) % 12)
}

function rootPcFromName(keyName: string): number {
  // Strip trailing 'm' for minor keys to isolate the root note name
  const rootName = keyName.endsWith('m') ? keyName.slice(0, -1) : keyName
  const pc = NOTE_NAME_TO_PC[rootName]
  if (pc === undefined) {
    throw new Error(`Unknown key root: "${rootName}" (from key "${keyName}")`)
  }
  return pc
}

function buildKeySignature(
  name: string,
  displayName: string,
  type: 'major' | 'minor',
): KeySignature {
  const rootPc = rootPcFromName(name)
  const intervals = type === 'major' ? MAJOR_SCALE_INTERVALS : MINOR_SCALE_INTERVALS
  return {
    name,
    displayName,
    type,
    pitchClasses: buildPitchClasses(rootPc, intervals),
  }
}

// prettier-ignore
export const ALL_KEY_SIGNATURES: KeySignature[] = [
  // Major keys
  buildKeySignature('C',   'C Major',   'major'),
  buildKeySignature('G',   'G Major',   'major'),
  buildKeySignature('D',   'D Major',   'major'),
  buildKeySignature('A',   'A Major',   'major'),
  buildKeySignature('E',   'E Major',   'major'),
  buildKeySignature('B',   'B Major',   'major'),
  buildKeySignature('F#',  'F# Major',  'major'),
  buildKeySignature('Gb',  'Gb Major',  'major'),
  buildKeySignature('F',   'F Major',   'major'),
  buildKeySignature('Bb',  'Bb Major',  'major'),
  buildKeySignature('Eb',  'Eb Major',  'major'),
  buildKeySignature('Ab',  'Ab Major',  'major'),
  buildKeySignature('Db',  'Db Major',  'major'),

  // Minor keys
  buildKeySignature('Am',  'A Minor',   'minor'),
  buildKeySignature('Em',  'E Minor',   'minor'),
  buildKeySignature('Bm',  'B Minor',   'minor'),
  buildKeySignature('F#m', 'F# Minor',  'minor'),
  buildKeySignature('C#m', 'C# Minor',  'minor'),
  buildKeySignature('G#m', 'G# Minor',  'minor'),
  buildKeySignature('Dm',  'D Minor',   'minor'),
  buildKeySignature('Gm',  'G Minor',   'minor'),
  buildKeySignature('Cm',  'C Minor',   'minor'),
  buildKeySignature('Fm',  'F Minor',   'minor'),
  buildKeySignature('Bbm', 'Bb Minor',  'minor'),
  buildKeySignature('Ebm', 'Eb Minor',  'minor'),
]

// Fast lookup by key name
const KEY_SIG_MAP = new Map<string, KeySignature>(
  ALL_KEY_SIGNATURES.map((k) => [k.name, k]),
)

function getKeySignature(keyName: string): KeySignature {
  const ks = KEY_SIG_MAP.get(keyName)
  if (!ks) {
    throw new Error(`Unknown key signature: "${keyName}"`)
  }
  return ks
}

// ---------------------------------------------------------------------------
// Scale generation
// ---------------------------------------------------------------------------

/**
 * Returns an ascending array of MIDI note numbers that belong to the given
 * key's scale within the specified range (inclusive).
 *
 * @param keyName  Key name string, e.g. `"C"`, `"Am"`, `"Bb"`, `"F#m"`.
 * @param minMidi  Lowest MIDI note to include (default `MIDI_C3` = 48).
 * @param maxMidi  Highest MIDI note to include (default `MIDI_C6` = 84).
 */
export function getScaleNotes(
  keyName: string,
  minMidi: number = MIDI_C3,
  maxMidi: number = MIDI_C6,
): number[] {
  const ks = getKeySignature(keyName)
  const pcSet = new Set(ks.pitchClasses)
  const result: number[] = []

  for (let midi = minMidi; midi <= maxMidi; midi++) {
    if (pcSet.has(midiToPitchClass(midi))) {
      result.push(midi)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Triad helpers
// ---------------------------------------------------------------------------

/**
 * Builds a single triad (root position) from a root MIDI note and a quality.
 */
function buildTriadRootPosition(
  rootMidi: number,
  type: Triad['type'],
): number[] {
  const pattern = TRIAD_PATTERNS[type]
  return pattern.map((interval) => rootMidi + interval)
}

/**
 * Applies an inversion to a set of three ascending MIDI note numbers.
 *
 * - Inversion 0: root position (no change)
 * - Inversion 1: shift the lowest note up one octave
 * - Inversion 2: shift the two lowest notes up one octave
 */
function applyInversion(notes: number[], inversion: 0 | 1 | 2): number[] {
  const sorted = [...notes].sort((a, b) => a - b)
  if (inversion >= 1) {
    sorted[0] += 12
    sorted.sort((a, b) => a - b)
  }
  if (inversion >= 2) {
    sorted[0] += 12
    sorted.sort((a, b) => a - b)
  }
  return sorted
}

/**
 * Returns the display name for a triad, e.g. `"C Major (root)"`, `"Am (1st inv)"`.
 */
function triadDisplayName(
  rootMidi: number,
  type: Triad['type'],
  inversion: 0 | 1 | 2,
  useFlats: boolean,
): string {
  const rootName = midiToNoteName(rootMidi, useFlats).replace(/\d+$/, '') // strip octave
  const typeLabel =
    type === 'major'
      ? 'Major'
      : type === 'minor'
        ? 'Minor'
        : type === 'diminished'
          ? 'Dim'
          : 'Aug'
  const invLabel =
    inversion === 0 ? 'root' : inversion === 1 ? '1st inv' : '2nd inv'
  return `${rootName} ${typeLabel} (${invLabel})`
}

// ---------------------------------------------------------------------------
// Diatonic triads
// ---------------------------------------------------------------------------

/**
 * Returns every diatonic triad (root position + both inversions) that fits
 * entirely within the given MIDI range for the specified key.
 *
 * Each scale degree produces one triad quality (determined by the key type).
 * For every root note instance in the range, root position and both inversions
 * are generated. Only triads whose every note falls within `[minMidi, maxMidi]`
 * are included in the result.
 *
 * @param keyName  Key name string, e.g. `"C"`, `"Am"`.
 * @param minMidi  Lowest allowed MIDI note (default `MIDI_C3`).
 * @param maxMidi  Highest allowed MIDI note (default `MIDI_C6`).
 */
export function getDiatonicTriads(
  keyName: string,
  minMidi: number = MIDI_C3,
  maxMidi: number = MIDI_C6,
): Triad[] {
  const ks = getKeySignature(keyName)
  const useFlats = FLAT_KEYS.has(keyName)
  const qualities =
    ks.type === 'major' ? MAJOR_DIATONIC_QUALITIES : MINOR_DIATONIC_QUALITIES

  const result: Triad[] = []

  // For every scale degree …
  for (let degree = 0; degree < 7; degree++) {
    const rootPc = ks.pitchClasses[degree]
    const quality = qualities[degree]

    // … find every instance of that root pitch class in the range …
    for (let midi = minMidi; midi <= maxMidi; midi++) {
      if (midiToPitchClass(midi) !== rootPc) continue

      const rootPos = buildTriadRootPosition(midi, quality)

      // … and emit root position + both inversions when they fit.
      for (const inv of [0, 1, 2] as const) {
        const notes = applyInversion(rootPos, inv)
        const allInRange = notes.every((n) => n >= minMidi && n <= maxMidi)
        if (!allInRange) continue

        result.push({
          root: midi,
          notes,
          type: quality,
          inversion: inv,
          name: triadDisplayName(midi, quality, inv, useFlats),
        })
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// A-based octave groups (标准音 A 至 A)
// ---------------------------------------------------------------------------

export interface OctaveGroup {
  group: number
  minMidi: number
  maxMidi: number
  label: string
}

export const OCTAVE_GROUPS: OctaveGroup[] = [
  { group: 0, minMidi: 21, maxMidi: 33, label: 'A0–A1' },
  { group: 1, minMidi: 33, maxMidi: 45, label: 'A1–A2' },
  { group: 2, minMidi: 45, maxMidi: 57, label: 'A2–A3' },
  { group: 3, minMidi: 57, maxMidi: 69, label: 'A3–A4' },
  { group: 4, minMidi: 69, maxMidi: 81, label: 'A4–A5' },
  { group: 5, minMidi: 81, maxMidi: 93, label: 'A5–A6' },
  { group: 6, minMidi: 93, maxMidi: 105, label: 'A6–A7' },
  { group: 7, minMidi: 105, maxMidi: 108, label: 'A7–C8' },
]

export const DEFAULT_OCTAVE_GROUPS = [3]

export function getOctaveGroupRange(groups: number[]): { min: number; max: number } {
  if (groups.length === 0) return { min: 57, max: 80 }
  const selected = OCTAVE_GROUPS.filter(g => groups.includes(g.group))
  return {
    min: Math.min(...selected.map(g => g.minMidi)),
    max: Math.max(...selected.map(g => g.maxMidi))
  }
}
