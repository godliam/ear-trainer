// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export type ChordType =
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'sus2' | 'sus4'
  | 'dom7' | 'maj7' | 'min7' | 'dim7' | 'hdim7' | 'aug7' | 'minMaj7'
  | '6' | 'm6'
  | 'dom9' | 'maj9' | 'min9'
  | 'add9' | 'madd9'
  | 'dom11' | 'add11'
  | '7sus4'
  | 'power'
  | 'unknown'

export interface ChordResult {
  name: string
  root: string
  type: ChordType
  bass: string
  inversion: number
  notes: string[]
  partial: boolean  // true if some chord tones were missing from input
}

// ---------------------------------------------------------------------------
// Chord pattern database
// ---------------------------------------------------------------------------

interface ChordPattern {
  intervals: number[]  // semitone intervals from root
  type: ChordType
  suffix: string       // display suffix (e.g., "m", "7", "add9")
  priority: number     // lower = more common, preferred in ambiguous cases
  omittable: number[]  // intervals that can be omitted (e.g., 5th in 7th chords)
}

// Ordered by priority (most common first)
const CHORD_PATTERNS: ChordPattern[] = [
  // Triads
  { intervals: [0, 4, 7],    type: 'major',      suffix: '',       priority: 1,  omittable: [] },
  { intervals: [0, 3, 7],    type: 'minor',      suffix: 'm',      priority: 2,  omittable: [] },
  { intervals: [0, 7],       type: 'power',      suffix: '5',      priority: 3,  omittable: [] },
  { intervals: [0, 3, 6],    type: 'diminished', suffix: 'dim',    priority: 4,  omittable: [] },
  { intervals: [0, 4, 8],    type: 'augmented',  suffix: 'aug',    priority: 5,  omittable: [] },
  { intervals: [0, 2, 7],    type: 'sus2',       suffix: 'sus2',   priority: 6,  omittable: [] },
  { intervals: [0, 5, 7],    type: 'sus4',       suffix: 'sus4',   priority: 7,  omittable: [] },

  // Seventh chords (5th is omittable)
  { intervals: [0, 4, 7, 10], type: 'dom7',     suffix: '7',      priority: 10, omittable: [7] },
  { intervals: [0, 4, 7, 11], type: 'maj7',     suffix: 'maj7',   priority: 11, omittable: [7] },
  { intervals: [0, 3, 7, 10], type: 'min7',     suffix: 'm7',     priority: 12, omittable: [7] },
  { intervals: [0, 3, 6, 9],  type: 'dim7',     suffix: 'dim7',   priority: 13, omittable: [] },
  { intervals: [0, 3, 6, 10], type: 'hdim7',    suffix: 'm7b5',   priority: 14, omittable: [] },
  { intervals: [0, 4, 8, 10], type: 'aug7',     suffix: 'aug7',   priority: 15, omittable: [] },
  { intervals: [0, 3, 7, 11], type: 'minMaj7',  suffix: 'mM7',    priority: 16, omittable: [7] },
  { intervals: [0, 5, 7, 10], type: '7sus4',    suffix: '7sus4',  priority: 17, omittable: [7] },

  // Sixth chords
  { intervals: [0, 4, 7, 9],  type: '6',        suffix: '6',      priority: 20, omittable: [7] },
  { intervals: [0, 3, 7, 9],  type: 'm6',       suffix: 'm6',     priority: 21, omittable: [7] },

  // Add chords
  { intervals: [0, 4, 7, 14], type: 'add9',     suffix: 'add9',   priority: 25, omittable: [] },
  { intervals: [0, 3, 7, 14], type: 'madd9',    suffix: 'madd9',  priority: 26, omittable: [] },
  { intervals: [0, 4, 7, 17], type: 'add11',    suffix: 'add11',  priority: 27, omittable: [] },

  // Ninth chords (5th omittable)
  { intervals: [0, 4, 7, 10, 14], type: 'dom9',  suffix: '9',     priority: 30, omittable: [7] },
  { intervals: [0, 4, 7, 11, 14], type: 'maj9',  suffix: 'maj9',  priority: 31, omittable: [7] },
  { intervals: [0, 3, 7, 10, 14], type: 'min9',  suffix: 'm9',    priority: 32, omittable: [7] },

  // Eleventh chord
  { intervals: [0, 4, 7, 10, 14, 17], type: 'dom11', suffix: '11', priority: 35, omittable: [4, 7, 14] },
]

// Normalize intervals to pitch classes (mod 12), return sorted unique set
function intervalsToPitchClassSet(root: number, intervals: number[]): Set<number> {
  const s = new Set<number>()
  for (const i of intervals) {
    s.add((root + i) % 12)
  }
  return s
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pcName(pc: number): string {
  return NOTE_NAMES[((pc % 12) + 12) % 12]
}

function midiToNoteName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[pc]}${octave}`
}

function midiToPc(midi: number): number {
  return ((midi % 12) + 12) % 12
}

// ---------------------------------------------------------------------------
// Main recognition
// ---------------------------------------------------------------------------

interface Candidate {
  root: number
  pattern: ChordPattern
  inversion: number
  missing: number  // how many chord tones are missing
  patternIdx: number
}

/**
 * Recognize a chord from MIDI note numbers.
 * Supports exact matches and partial matches (omitted 5ths, rootless voicings, etc.)
 */
export function recognizeChord(midiNotes: number[]): ChordResult | null {
  if (midiNotes.length < 2) return null

  // Collect unique pitch classes
  const inputPcs = new Set<number>()
  for (const midi of midiNotes) {
    inputPcs.add(midiToPc(midi))
  }

  if (inputPcs.size < 2) return null

  const sortedMidi = [...midiNotes].sort((a, b) => a - b)
  const bassMidi = sortedMidi[0]
  const bassPc = midiToPc(bassMidi)
  const bassName = pcName(bassPc)
  const noteNames = sortedMidi.map(midiToNoteName)

  const candidates: Candidate[] = []

  // Try every root (0-11) against every pattern
  for (let root = 0; root < 12; root++) {
    for (let pi = 0; pi < CHORD_PATTERNS.length; pi++) {
      const pattern = CHORD_PATTERNS[pi]

      // Full pitch class set of this chord
      const chordPcs = intervalsToPitchClassSet(root, pattern.intervals)

      // Check: are ALL input notes contained in this chord?
      let allInputInChord = true
      for (const pc of Array.from(inputPcs)) {
        if (!chordPcs.has(pc)) {
          allInputInChord = false
          break
        }
      }
      if (!allInputInChord) continue

      // How many chord tones are missing from input?
      let missing = 0
      for (const pc of Array.from(chordPcs)) {
        if (!inputPcs.has(pc)) missing++
      }

      // Check if missing notes are in the omittable set
      const missingIntervals: number[] = []
      for (const interval of pattern.intervals) {
        const pc = (root + interval) % 12
        if (!inputPcs.has(pc)) {
          missingIntervals.push(interval)
        }
      }

      // Allow omission only for marked omittable intervals
      // Plus: root can be omitted for 7th+ chords (rootless voicings) if 3+ notes present
      const isSeventhOrMore = pattern.intervals.length >= 4
      const allowedOmissions = [...pattern.omittable]
      if (isSeventhOrMore && inputPcs.size >= 3) {
        allowedOmissions.push(0) // root can be omitted
      }

      const hasDisallowedOmission = missingIntervals.some(
        mi => !allowedOmissions.includes(mi)
      )

      // For exact matches (nothing missing) always accept
      // For partial matches, only accept if all missing notes are in allowed omissions
      if (missing > 0 && hasDisallowedOmission) continue

      // Don't accept matches where more than half the chord is missing
      if (missing > Math.floor(pattern.intervals.length / 2)) continue

      // Determine inversion
      const sortedIntervals = [...pattern.intervals].sort((a, b) => a - b)
      const bassInterval = ((bassPc - root) % 12 + 12) % 12
      const inversionIdx = sortedIntervals.findIndex(i => i % 12 === bassInterval)
      const inversion = inversionIdx >= 0 ? inversionIdx : 0

      candidates.push({
        root,
        pattern,
        inversion,
        missing,
        patternIdx: pi
      })
    }
  }

  if (candidates.length === 0) {
    // Unknown
    return {
      name: noteNames.join('–'),
      root: bassName,
      type: 'unknown',
      bass: bassName,
      inversion: 0,
      notes: noteNames,
      partial: false
    }
  }

  // Sort candidates:
  // 1. Fewer missing notes (exact > partial)
  // 2. Root position preferred
  // 3. Lower priority number (simpler chords preferred)
  candidates.sort((a, b) => {
    if (a.missing !== b.missing) return a.missing - b.missing
    if (a.inversion === 0 && b.inversion !== 0) return -1
    if (a.inversion !== 0 && b.inversion === 0) return 1
    return a.pattern.priority - b.pattern.priority
  })

  const best = candidates[0]
  const rootName = pcName(best.root)
  const suffix = best.pattern.suffix

  let name = `${rootName}${suffix}`
  if (best.inversion > 0) {
    name = `${name}/${bassName}`
  }

  return {
    name,
    root: rootName,
    type: best.pattern.type,
    bass: bassName,
    inversion: best.inversion,
    notes: noteNames,
    partial: best.missing > 0
  }
}
