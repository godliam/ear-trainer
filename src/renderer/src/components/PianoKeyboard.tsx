import { useRef, useEffect, useCallback } from 'react'

interface KeyHighlight {
  midi: number
  color: string // 'green' | 'red' | 'blue' | 'orange'
}

interface PianoKeyboardProps {
  onKeyClick?: (midi: number) => void
  highlightedKeys?: KeyHighlight[]
  selectedKeys?: number[]
  disabled?: boolean
  selectableRange?: { min: number; max: number }
}

const WHITE_KEY_WIDTH = 24
const WHITE_KEY_HEIGHT = 120
const BLACK_KEY_WIDTH = 16
const BLACK_KEY_HEIGHT = 76

// Piano has 88 keys: A0 (21) to C8 (108)
const FIRST_MIDI = 21 // A0
const LAST_MIDI = 108 // C8

// Which pitch classes are white keys: C=0, D=2, E=4, F=5, G=7, A=9, B=11
const WHITE_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11]
const BLACK_PITCH_CLASSES = [1, 3, 6, 8, 10]

function isBlackKey(midi: number): boolean {
  return BLACK_PITCH_CLASSES.includes(midi % 12)
}

// Note names for display
const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function midiToLabel(midi: number): string {
  const pc = midi % 12
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES_SHARP[pc]}${octave}`
}

// Get all white keys in range
function getWhiteKeys(): number[] {
  const keys: number[] = []
  for (let m = FIRST_MIDI; m <= LAST_MIDI; m++) {
    if (!isBlackKey(m)) keys.push(m)
  }
  return keys
}

// Get all black keys in range
function getBlackKeys(): number[] {
  const keys: number[] = []
  for (let m = FIRST_MIDI; m <= LAST_MIDI; m++) {
    if (isBlackKey(m)) keys.push(m)
  }
  return keys
}

// Calculate the x position of a white key by its index among white keys
function whiteKeyX(whiteIndex: number): number {
  return whiteIndex * WHITE_KEY_WIDTH
}

// Calculate the x position of a black key based on the white keys around it
function blackKeyX(midi: number, whiteKeys: number[]): number {
  // Find the white key just below this black key
  const lowerWhite = midi - 1
  const lowerIdx = whiteKeys.indexOf(lowerWhite)
  if (lowerIdx === -1) {
    // Edge case for A#0 (midi 22): lower white is A0 (midi 21)
    const closest = whiteKeys.findIndex(w => w > midi)
    return closest * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2
  }
  return (lowerIdx + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2
}

function getHighlightColor(midi: number, highlights: KeyHighlight[]): string | null {
  const h = highlights.find(h => h.midi === midi)
  return h ? h.color : null
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  green: '#2ecc71',
  red: '#e74c3c',
  blue: '#3498db',
  orange: '#f39c12'
}

export default function PianoKeyboard({
  onKeyClick,
  highlightedKeys = [],
  selectedKeys = [],
  disabled = false,
  selectableRange
}: PianoKeyboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const whiteKeys = getWhiteKeys()
  const blackKeys = getBlackKeys()
  const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH

  // Scroll to center on C3-C5 area on mount
  useEffect(() => {
    if (containerRef.current) {
      // C4 = MIDI 60, white key index roughly at position of C4
      const c4WhiteIdx = whiteKeys.indexOf(60)
      if (c4WhiteIdx >= 0) {
        const targetX = c4WhiteIdx * WHITE_KEY_WIDTH - containerRef.current.clientWidth / 2
        containerRef.current.scrollLeft = Math.max(0, targetX)
      }
    }
  }, [])

  const handleClick = useCallback((midi: number) => {
    if (disabled) return
    if (selectableRange && (midi < selectableRange.min || midi > selectableRange.max)) return
    onKeyClick?.(midi)
  }, [disabled, selectableRange, onKeyClick])

  const isSelectable = (midi: number) => {
    if (disabled) return false
    if (selectableRange && (midi < selectableRange.min || midi > selectableRange.max)) return false
    return true
  }

  return (
    <div
      ref={containerRef}
      style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        position: 'relative',
        height: WHITE_KEY_HEIGHT + 24,
        border: '1px solid var(--border)',
        borderRadius: '0 0 8px 8px',
        background: '#2a2a3a'
      }}
    >
      <div style={{ position: 'relative', width: totalWidth, height: WHITE_KEY_HEIGHT }}>
        {/* White keys */}
        {whiteKeys.map((midi, idx) => {
          const highlight = getHighlightColor(midi, highlightedKeys)
          const isSelected = selectedKeys.includes(midi)
          const selectable = isSelectable(midi)
          const label = midiToLabel(midi)
          const isC = midi % 12 === 0

          return (
            <div
              key={midi}
              onClick={() => handleClick(midi)}
              title={label}
              style={{
                position: 'absolute',
                left: whiteKeyX(idx),
                top: 0,
                width: WHITE_KEY_WIDTH - 1,
                height: WHITE_KEY_HEIGHT,
                background: highlight
                  ? HIGHLIGHT_COLORS[highlight]
                  : isSelected
                    ? '#6c9bd2'
                    : 'var(--white-key)',
                border: '1px solid #bbb',
                borderRadius: '0 0 4px 4px',
                cursor: selectable ? 'pointer' : 'default',
                opacity: selectable ? 1 : 0.6,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '4px',
                fontSize: '9px',
                color: highlight || isSelected ? '#fff' : '#888',
                fontWeight: isC ? 600 : 400,
                userSelect: 'none',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => {
                if (selectable && !highlight && !isSelected) {
                  e.currentTarget.style.background = 'var(--white-key-hover)'
                }
              }}
              onMouseLeave={e => {
                if (!highlight && !isSelected) {
                  e.currentTarget.style.background = 'var(--white-key)'
                }
              }}
            >
              {isC ? label : ''}
            </div>
          )
        })}

        {/* Black keys */}
        {blackKeys.map(midi => {
          const highlight = getHighlightColor(midi, highlightedKeys)
          const isSelected = selectedKeys.includes(midi)
          const selectable = isSelectable(midi)
          const x = blackKeyX(midi, whiteKeys)

          return (
            <div
              key={midi}
              onClick={() => handleClick(midi)}
              title={midiToLabel(midi)}
              style={{
                position: 'absolute',
                left: x,
                top: 0,
                width: BLACK_KEY_WIDTH,
                height: BLACK_KEY_HEIGHT,
                background: highlight
                  ? HIGHLIGHT_COLORS[highlight]
                  : isSelected
                    ? '#5b8abf'
                    : 'var(--black-key)',
                border: '1px solid #222',
                borderRadius: '0 0 3px 3px',
                cursor: selectable ? 'pointer' : 'default',
                opacity: selectable ? 1 : 0.5,
                zIndex: 2,
                userSelect: 'none',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => {
                if (selectable && !highlight && !isSelected) {
                  e.currentTarget.style.background = 'var(--black-key-hover)'
                }
              }}
              onMouseLeave={e => {
                if (!highlight && !isSelected) {
                  e.currentTarget.style.background = 'var(--black-key)'
                }
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
