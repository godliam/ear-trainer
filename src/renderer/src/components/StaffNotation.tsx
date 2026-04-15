import { useRef, useEffect, useState } from 'react'
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Beam } from 'vexflow'

interface StaffNote {
  midi: number
  duration?: string // 'w' | 'h' | 'q' | '8' | '16', default 'w'
}

interface StaffNotationProps {
  notes?: StaffNote[][]  // Array of note groups (each group is a chord or single note)
  width?: number
}

const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function midiToVexKey(midi: number): { key: string; accidental?: string } {
  const pc = midi % 12
  const octave = Math.floor(midi / 12) - 1
  const name = NOTE_NAMES_SHARP[pc]

  if (name.length === 2) {
    return {
      key: `${name[0]}/${octave}`,
      accidental: '#'
    }
  }
  return { key: `${name}/${octave}` }
}

// Determine best clef based on note range
function pickClef(notes: StaffNote[][]): 'treble' | 'bass' {
  if (notes.length === 0) return 'treble'
  let sum = 0
  let count = 0
  for (const group of notes) {
    for (const n of group) {
      sum += n.midi
      count++
    }
  }
  if (count === 0) return 'treble'
  const avg = sum / count
  // Middle C = MIDI 60. If average is below B3 (59), use bass clef
  return avg < 59 ? 'bass' : 'treble'
}

export default function StaffNotation({ notes = [], width = 500 }: StaffNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(140)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const clef = pickClef(notes)

    // Calculate needed height: base 120 + extra for ledger lines
    let minMidi = 999
    let maxMidi = 0
    for (const group of notes) {
      for (const n of group) {
        if (n.midi < minMidi) minMidi = n.midi
        if (n.midi > maxMidi) maxMidi = n.midi
      }
    }

    // Estimate ledger lines needed
    let extraTop = 0
    let extraBottom = 0
    if (notes.length > 0) {
      if (clef === 'treble') {
        // Treble staff lines: E4(64) to F5(77). Above A5(81)+ needs space, below C4(60)- needs space
        if (maxMidi > 84) extraTop = Math.min(((maxMidi - 84) / 2) * 10, 50)
        if (minMidi < 57) extraBottom = Math.min(((57 - minMidi) / 2) * 10, 50)
      } else {
        // Bass staff lines: G2(43) to A3(57). Above D4(62)+ needs space, below E2(40)- needs space
        if (maxMidi > 62) extraTop = Math.min(((maxMidi - 62) / 2) * 10, 50)
        if (minMidi < 38) extraBottom = Math.min(((38 - minMidi) / 2) * 10, 50)
      }
    }

    const computedHeight = 160 + extraTop + extraBottom
    setHeight(computedHeight)

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG)
    renderer.resize(width, computedHeight)
    const context = renderer.getContext()
    context.setFont('Arial', 10)

    const staveY = 10 + extraTop
    const stave = new Stave(10, staveY, width - 30)
    stave.addClef(clef)
    stave.setContext(context).draw()

    if (notes.length === 0) return

    const staveNotes: StaveNote[] = []

    for (const noteGroup of notes) {
      if (noteGroup.length === 0) continue
      const duration = noteGroup[0].duration || 'w'

      const keys = noteGroup.map(n => midiToVexKey(n.midi))
      const staveNote = new StaveNote({
        keys: keys.map(k => k.key),
        duration,
        clef
      })
      keys.forEach((k, i) => {
        if (k.accidental) {
          staveNote.addModifier(new Accidental(k.accidental), i)
        }
      })
      staveNotes.push(staveNote)
    }

    const durationBeats: Record<string, number> = {
      'w': 4, 'h': 2, 'q': 1, '8': 0.5, '16': 0.25
    }

    try {
      const dur = notes[0]?.[0]?.duration || 'w'
      const numBeats = staveNotes.length * (durationBeats[dur] || 4)
      const voice = new Voice({ num_beats: numBeats, beat_value: 4 })
      voice.setStrict(false)
      voice.addTickables(staveNotes)

      new Formatter().joinVoices([voice]).format([voice], width - 80)

      // Auto-beam 8th and 16th notes
      if (dur === '8' || dur === '16') {
        try {
          const beams = Beam.generateBeams(staveNotes)
          voice.draw(context, stave)
          beams.forEach(b => b.setContext(context).draw())
        } catch {
          voice.draw(context, stave)
        }
      } else {
        voice.draw(context, stave)
      }
    } catch (e) {
      console.warn('VexFlow rendering error:', e)
    }
  }, [notes, width])

  return (
    <div
      ref={containerRef}
      style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '4px',
        minHeight: height,
        height
      }}
    />
  )
}
