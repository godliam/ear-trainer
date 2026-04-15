import * as Tone from 'tone'
import type { Instrument } from './music'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentInstrument: Instrument = 'piano'
let synth: Tone.PolySynth | Tone.PluckSynth | Tone.Synth | null = null

// ---------------------------------------------------------------------------
// Synth builders
// ---------------------------------------------------------------------------

function buildPianoSynth(): Tone.PolySynth {
  return new Tone.PolySynth(Tone.AMSynth, {
    harmonicity: 2,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.01,
      decay: 0.6,
      sustain: 0.3,
      release: 1.2
    },
    modulation: { type: 'square' },
    modulationEnvelope: {
      attack: 0.01,
      decay: 0.5,
      sustain: 0.2,
      release: 0.8
    }
  }).toDestination()
}

function buildGuitarSynth(): Tone.PluckSynth {
  return new Tone.PluckSynth({
    attackNoise: 1.2,
    dampening: 3000,
    resonance: 0.97
  }).toDestination()
}

function buildPiccoloSynth(): Tone.Synth {
  const synth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: {
      attack: 0.05,
      decay: 0.3,
      sustain: 0.6,
      release: 0.8
    }
  }).toDestination()

  // Slight vibrato for a flute-like quality
  const vibrato = new Tone.Vibrato({ frequency: 5, depth: 0.1 }).toDestination()
  synth.connect(vibrato)

  return synth
}

function createSynth(instrument: Instrument): Tone.PolySynth | Tone.PluckSynth | Tone.Synth {
  switch (instrument) {
    case 'piano':
      return buildPianoSynth()
    case 'guitar':
      return buildGuitarSynth()
    case 'piccolo':
      return buildPiccoloSynth()
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function midiToFreq(midi: number): number {
  return Tone.Frequency(midi, 'midi').toFrequency()
}

function ensureSynth(): void {
  if (!synth) {
    synth = createSynth(currentInstrument)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Ensure Tone.js audio context is started (call on first user interaction). */
export async function initAudio(): Promise<void> {
  await Tone.start()
}

/** Set the current instrument. Disposes the previous synth. */
export function setInstrument(instrument: Instrument): void {
  if (instrument === currentInstrument && synth) return

  if (synth) {
    synth.dispose()
    synth = null
  }

  currentInstrument = instrument
  synth = createSynth(currentInstrument)
}

/** Play a single note by MIDI number. */
export function playNote(midi: number, duration: string = '4n'): void {
  ensureSynth()
  const freq = midiToFreq(midi)
  const now = Tone.now()

  if (synth instanceof Tone.PolySynth) {
    synth.triggerAttackRelease(freq, duration, now)
  } else if (synth instanceof Tone.PluckSynth) {
    synth.triggerAttackRelease(freq, duration, now)
  } else if (synth instanceof Tone.Synth) {
    synth.triggerAttackRelease(freq, duration, now)
  }
}

/** Play a chord (all notes at once for block chord). */
export function playChord(midiNotes: number[], duration: string = '2n'): void {
  ensureSynth()
  const freqs = midiNotes.map(midiToFreq)
  const now = Tone.now()

  if (synth instanceof Tone.PolySynth) {
    // PolySynth can play multiple notes at once
    synth.triggerAttackRelease(freqs, duration, now)
  } else if (synth instanceof Tone.PluckSynth) {
    // PluckSynth is monophonic — stagger notes ~30ms apart (strum effect)
    freqs.forEach((freq, i) => {
      synth!.triggerAttackRelease(freq as any, duration, now + i * 0.03)
    })
  } else if (synth instanceof Tone.Synth) {
    // Monophonic Synth — stagger notes slightly
    freqs.forEach((freq, i) => {
      synth!.triggerAttackRelease(freq, duration, now + i * 0.03)
    })
  }
}

/**
 * Play note(s) 3 times with 1.5s interval (for training mode).
 * Returns a cancel function.
 */
export function playTrainingSequence(
  midiNotes: number[],
  onComplete?: () => void
): () => void {
  let cancelled = false
  const timers: ReturnType<typeof setTimeout>[] = []

  const play = (): void => {
    if (midiNotes.length === 1) {
      playNote(midiNotes[0])
    } else {
      playChord(midiNotes)
    }
  }

  // Play immediately (1st)
  play()

  // Play after 1.5s (2nd)
  timers.push(
    setTimeout(() => {
      if (cancelled) return
      play()
    }, 1500)
  )

  // Play after 3.0s (3rd)
  timers.push(
    setTimeout(() => {
      if (cancelled) return
      play()

      // Notify completion a short time after the last play
      timers.push(
        setTimeout(() => {
          if (!cancelled && onComplete) onComplete()
        }, 500)
      )
    }, 3000)
  )

  // Return cancel function
  return () => {
    cancelled = true
    timers.forEach(clearTimeout)
    stopAll()
  }
}

/**
 * Play a sequence of notes in the exact order provided (no sorting).
 * Used for complex arpeggio patterns like round-trip.
 * @param noteValue - Tone.js duration string ('4n', '8n', '16n')
 */
export function playNoteSequence(
  midiNotes: number[],
  noteValue: string = '8n'
): void {
  ensureSynth()

  const durationSec = Tone.Time(noteValue).toSeconds()
  const now = Tone.now()

  midiNotes.forEach((midi, i) => {
    const freq = midiToFreq(midi)
    const time = now + i * durationSec

    if (synth instanceof Tone.PolySynth) {
      synth.triggerAttackRelease(freq, noteValue, time)
    } else if (synth instanceof Tone.PluckSynth) {
      synth!.triggerAttackRelease(freq as any, noteValue, time)
    } else if (synth instanceof Tone.Synth) {
      synth!.triggerAttackRelease(freq, noteValue, time)
    }
  })
}

/** Stop all sounds and release all held notes. */
export function stopAll(): void {
  if (!synth) return

  if (synth instanceof Tone.PolySynth) {
    synth.releaseAll()
  } else if (synth instanceof Tone.Synth) {
    synth.triggerRelease()
  }
  // PluckSynth has no triggerRelease / releaseAll — it decays naturally
}
