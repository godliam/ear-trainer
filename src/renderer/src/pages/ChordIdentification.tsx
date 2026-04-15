import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import PianoKeyboard from '../components/PianoKeyboard'
import StaffNotation from '../components/StaffNotation'
import { useTrainingStore } from '../store/useTrainingStore'
import type { ChordIdDirection } from '../store/useTrainingStore'
import { midiToNoteName } from '../utils/music'
import { initAudio, setInstrument, playChord, stopAll, playNoteSequence } from '../utils/audio'
import { recognizeChord } from '../utils/chordRecognition'

type Voicing = 'block' | 'arp-quarter' | 'arp-eighth' | 'arp-sixteenth'

function voicingToNoteValue(voicing: Voicing): string {
  switch (voicing) {
    case 'arp-quarter': return '4n'
    case 'arp-eighth': return '8n'
    case 'arp-sixteenth': return '16n'
    default: return '4n'
  }
}

// Fill notes to meet minimum for one measure in 4/4
function fillNotesForMeasure(
  notes: number[],
  voicing: Voicing,
  direction: ChordIdDirection
): number[] {
  if (voicing === 'block' || notes.length === 0) return notes

  let needed: number
  switch (voicing) {
    case 'arp-quarter': needed = 4; break
    case 'arp-eighth': needed = 8; break
    case 'arp-sixteenth': needed = 16; break
    default: needed = 4
  }

  const isRoundTrip = direction === 'asc-desc' || direction === 'desc-asc'
  const primaryDir = direction === 'ascending' || direction === 'asc-desc' ? 'asc' : 'desc'

  // Sort for primary direction
  const sorted = [...notes].sort((a, b) => primaryDir === 'asc' ? a - b : b - a)

  if (isRoundTrip) {
    // For round-trip: build ascending then descending (or vice versa)
    // We need at least `needed` notes total for one measure
    const forward = [...sorted]
    const backward = [...sorted].reverse().slice(1) // skip duplicate at peak

    // Extend forward with octave duplication if needed
    const extended = [...forward]
    let octaveShift = 0
    while (extended.length < Math.ceil(needed / 2) + 1) {
      octaveShift += (primaryDir === 'asc' ? 12 : -12)
      for (const note of forward) {
        const shifted = note + octaveShift
        if (shifted >= 21 && shifted <= 108 && extended.length < Math.ceil(needed / 2) + 1) {
          extended.push(shifted)
        }
      }
      if (Math.abs(octaveShift) > 48) break
    }

    // Build reverse of extended (skip first = peak)
    const extReverse = [...extended].reverse().slice(1)

    // Combine and trim
    const combined = [...extended, ...extReverse]
    return combined.slice(0, needed)
  } else {
    // Simple direction
    const filled = [...sorted]
    let octaveShift = 0
    while (filled.length < needed) {
      octaveShift += (primaryDir === 'asc' ? 12 : -12)
      for (const note of sorted) {
        const shifted = note + octaveShift
        if (shifted >= 21 && shifted <= 108 && filled.length < needed) {
          filled.push(shifted)
        }
      }
      if (Math.abs(octaveShift) > 48) break
    }
    return filled
  }
}

function durationForVoicing(voicing: Voicing): string {
  switch (voicing) {
    case 'block': return 'w'
    case 'arp-quarter': return 'q'
    case 'arp-eighth': return '8'
    case 'arp-sixteenth': return '16'
    default: return 'w'
  }
}

export default function ChordIdentification() {
  const { t } = useTranslation()
  const store = useTrainingStore()
  const ci = store.chordId
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [audioReady, setAudioReady] = useState(false)

  // Auto-init audio on first key click
  const ensureAudio = useCallback(async () => {
    if (!audioReady) {
      await initAudio()
      setInstrument('piano')
      setAudioReady(true)
    }
  }, [audioReady])

  const chordResult = useMemo(() => {
    if (ci.selectedKeys.length < 3) return null
    return recognizeChord(ci.selectedKeys)
  }, [ci.selectedKeys])

  const handleKeyClick = useCallback(async (midi: number) => {
    await ensureAudio()
    store.toggleChordIdKey(midi)
  }, [ensureAudio])

  const handlePlay = useCallback(async () => {
    if (ci.selectedKeys.length === 0) return
    await ensureAudio()
    stopAll()

    if (ci.voicing === 'block') {
      playChord(ci.selectedKeys, '2n')
    } else {
      const filled = fillNotesForMeasure(ci.selectedKeys, ci.voicing, ci.direction)
      // Use playNoteSequence to play notes in the exact order provided by fillNotesForMeasure
      const noteValue = voicingToNoteValue(ci.voicing)
      playNoteSequence(filled, noteValue)
    }

    if (chordResult) {
      store.addChordIdHistory(ci.selectedKeys, chordResult.name)
    }
  }, [ci.selectedKeys, ci.voicing, ci.direction, chordResult, ensureAudio])

  const handleReset = useCallback(() => {
    stopAll()
    store.resetChordIdKeys()
  }, [])

  // Staff notes
  const staffNotes = useMemo(() => {
    if (ci.selectedKeys.length === 0) return []

    if (ci.voicing === 'block') {
      return [ci.selectedKeys.map(m => ({ midi: m }))]
    } else {
      const filled = fillNotesForMeasure(ci.selectedKeys, ci.voicing, ci.direction)
      const dur = durationForVoicing(ci.voicing)
      return filled.map(m => [{ midi: m, duration: dur }])
    }
  }, [ci.selectedKeys, ci.voicing, ci.direction])

  const highlights = ci.selectedKeys.map(m => ({ midi: m, color: 'blue' as const }))

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Controls bar */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          background: 'var(--bg-secondary)'
        }}>
          {/* Chord name display */}
          <div style={{
            padding: '6px 16px',
            background: 'var(--bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            minWidth: '160px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {t('chordId.chordName')}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
              {ci.selectedKeys.length < 3
                ? t('chordId.noSelection')
                : chordResult
                  ? chordResult.name
                  : t('chordId.unknown')}
            </div>
          </div>

          {ci.selectedKeys.length > 0 && (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {t('chordId.selectedNotes')}: {ci.selectedKeys.map(m => midiToNoteName(m)).join(', ')}
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Voicing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('chordId.voicing')}</label>
              <select
                value={ci.voicing}
                onChange={e => store.setChordIdVoicing(e.target.value as Voicing)}
              >
                <option value="block">{t('chordId.block')}</option>
                <option value="arp-quarter">{t('chordId.arpQuarter')}</option>
                <option value="arp-eighth">{t('chordId.arpEighth')}</option>
                <option value="arp-sixteenth">{t('chordId.arpSixteenth')}</option>
              </select>
            </div>

            {/* Direction (for arpeggio) */}
            {ci.voicing !== 'block' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('chordId.direction')}</label>
                <select
                  value={ci.direction}
                  onChange={e => store.setChordIdDirection(e.target.value as ChordIdDirection)}
                >
                  <option value="ascending">{t('chordId.ascending')}</option>
                  <option value="descending">{t('chordId.descending')}</option>
                  <option value="asc-desc">{t('chordId.ascDesc')}</option>
                  <option value="desc-asc">{t('chordId.descAsc')}</option>
                </select>
              </div>
            )}

            <button className="btn-primary" onClick={handlePlay}
              disabled={ci.selectedKeys.length === 0}>
              {t('chordId.play')}
            </button>
            <button className="btn-secondary" onClick={handleReset}>
              {t('chordId.reset')}
            </button>
          </div>
        </div>

        {/* Staff */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center' }}>
          <StaffNotation notes={staffNotes} width={500} />
        </div>

        {/* Piano */}
        <div style={{ padding: '0 24px 16px', flexShrink: 0 }}>
          <PianoKeyboard
            onKeyClick={handleKeyClick}
            highlightedKeys={highlights}
            selectedKeys={ci.selectedKeys}
          />
        </div>
      </div>

      {/* Sidebar */}
      {sidebarCollapsed ? (
        <div
          style={{
            width: '36px',
            background: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '16px',
            cursor: 'pointer',
            flexShrink: 0
          }}
          onClick={() => setSidebarCollapsed(false)}
        >
          <span style={{ fontSize: '18px', transform: 'rotate(180deg)' }}>›</span>
        </div>
      ) : (
        <div style={{
          width: 'var(--sidebar-width)',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{t('chordId.history')}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {ci.history.length > 0 && (
                <button
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '12px', color: 'var(--error)' }}
                  onClick={store.clearChordIdHistory}
                >
                  {t('sidebar.clear')}
                </button>
              )}
              <button
                className="btn-secondary"
                style={{ padding: '2px 8px', fontSize: '12px' }}
                onClick={() => setSidebarCollapsed(true)}
              >
                {t('sidebar.collapse')} ›
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
            {ci.history.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '8px 0' }}>
                {t('training.noRecords')}
              </div>
            ) : (
              ci.history.map((record, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 10px',
                    marginBottom: '6px',
                    background: 'var(--bg-card)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '14px' }}>
                    {record.chordName}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {record.notes.map(m => midiToNoteName(m)).join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}