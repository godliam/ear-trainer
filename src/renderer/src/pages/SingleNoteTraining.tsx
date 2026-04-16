import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PianoKeyboard from '../components/PianoKeyboard'
import StaffNotation from '../components/StaffNotation'
import KeySelector from '../components/KeySelector'
import OctaveRangeSelector from '../components/OctaveRangeSelector'
import TrainingSidebar from '../components/TrainingSidebar'
import { useTrainingStore } from '../store/useTrainingStore'
import { useAppStore } from '../store/useAppStore'
import { getScaleNotes, midiToNoteName, getOctaveGroupRange } from '../utils/music'
import { initAudio, playNote, playTrainingSequence, stopAll } from '../utils/audio'

export default function SingleNoteTraining() {
  const { t } = useTranslation()
  const store = useTrainingStore()
  const s = store.singleNote
  const { instrument: globalInstrument } = useAppStore()
  const cancelRef = useRef<(() => void) | null>(null)
  const autoNextRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [audioReady, setAudioReady] = useState(false)

  useEffect(() => {
    return () => {
      if (cancelRef.current) cancelRef.current()
      if (autoNextRef.current) clearTimeout(autoNextRef.current)
    }
  }, [])

  const handleInit = useCallback(async () => {
    await initAudio()
    setAudioReady(true)
  }, [])

  const stopTraining = useCallback(() => {
    if (cancelRef.current) { cancelRef.current(); cancelRef.current = null }
    if (autoNextRef.current) { clearTimeout(autoNextRef.current); autoNextRef.current = null }
    stopAll()
    store.stopSingleNoteTraining()
  }, [])

  const startQuestion = useCallback(() => {
    if (cancelRef.current) { cancelRef.current(); cancelRef.current = null }
    if (autoNextRef.current) { clearTimeout(autoNextRef.current); autoNextRef.current = null }

    // Get the octave range from selected groups
    const { min: minMidi, max: maxMidi } = getOctaveGroupRange(s.octaveGroups)

    let notes: number[]
    if (s.keySignature === 'random') {
      notes = []
      for (let m = minMidi; m <= maxMidi; m++) notes.push(m)
    } else {
      const parts = s.keySignature.split(' ')
      const keyName = parts[1] === 'minor' ? parts[0] + 'm' : parts[0]
      notes = getScaleNotes(keyName, minMidi, maxMidi)
    }
    if (notes.length === 0) return

    const randomNote = notes[Math.floor(Math.random() * notes.length)]
    store.setSingleNoteQuestion([randomNote])

    cancelRef.current = playTrainingSequence([randomNote], () => {
      store.setSingleNotePhase('waiting')
    })
  }, [s.instrument, s.keySignature, s.octaveGroups])

  const handleReplay = useCallback(() => {
    if (s.currentCorrectMidi.length === 0) return
    if (cancelRef.current) cancelRef.current()

    store.setSingleNotePhase('playing')
    cancelRef.current = playTrainingSequence(s.currentCorrectMidi, () => {
      store.setSingleNotePhase('waiting')
    })
  }, [s.currentCorrectMidi])

  const handleKeyClick = useCallback((midi: number) => {
    if (s.phase !== 'waiting' && s.phase !== 'playing') return
    store.addSingleNoteSelection(midi)
    store.submitSingleNoteAnswer()

    setTimeout(() => {
      playNote(s.currentCorrectMidi[0], '2n')
    }, 300)

    autoNextRef.current = setTimeout(() => {
      store.nextSingleNoteQuestion()
      setTimeout(() => startQuestion(), 300)
    }, 2500)
  }, [s.phase, s.currentCorrectMidi, startQuestion])

  // Highlights
  const highlights: { midi: number; color: string }[] = []
  if (s.phase === 'answered') {
    s.currentCorrectMidi.forEach(m => highlights.push({ midi: m, color: 'green' }))
    if (!s.isCurrentCorrect && s.userSelectedMidi.length > 0) {
      s.userSelectedMidi.forEach(m => {
        if (!s.currentCorrectMidi.includes(m)) {
          highlights.push({ midi: m, color: 'red' })
        }
      })
    }
  }

  const staffNotes = s.phase === 'answered' && s.currentCorrectMidi.length > 0
    ? [s.currentCorrectMidi.map(m => ({ midi: m }))]
    : []

  const isTraining = s.phase !== 'idle'

  // Get selectable range from octave groups
  const { min: selectableMin, max: selectableMax } = getOctaveGroupRange(s.octaveGroups)

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Settings bar */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          background: 'var(--bg-secondary)'
        }}>
          <KeySelector
            value={s.keySignature}
            onChange={store.setSingleNoteKey}
            disabled={isTraining}
            showRandom={true}
          />
          <OctaveRangeSelector
            selectedGroups={s.octaveGroups}
            onChange={store.setSingleNoteOctaveGroups}
            disabled={isTraining}
          />

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
            {!audioReady ? (
              <button className="btn-primary" onClick={handleInit}>
                {t('training.start')}
              </button>
            ) : !isTraining ? (
              <button className="btn-primary" onClick={startQuestion}>
                {t('training.start')}
              </button>
            ) : (
              <>
                <button className="btn-secondary" onClick={handleReplay}
                  disabled={s.phase === 'playing' || s.phase === 'answered'}>
                  {t('training.replay')}
                </button>
                <button
                  className="btn-secondary"
                  style={{ color: 'var(--error)' }}
                  onClick={stopTraining}
                >
                  {t('training.stop')}
                </button>
              </>
            )}
          </div>

          {/* Status */}
          {s.phase === 'playing' && (
            <span style={{ color: 'var(--warning)', fontSize: '14px', fontWeight: 600 }}>
              {t('training.playing')}
            </span>
          )}
          {s.phase === 'waiting' && (
            <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 600 }}>
              {t('training.waiting')}
            </span>
          )}
          {s.phase === 'answered' && (
            <span style={{
              color: s.isCurrentCorrect ? 'var(--success)' : 'var(--error)',
              fontSize: '14px',
              fontWeight: 600
            }}>
              {s.isCurrentCorrect ? t('training.correct') : t('training.incorrect')}
              {!s.isCurrentCorrect && s.currentCorrectMidi.length > 0 && (
                <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>
                  {t('training.correctAnswer')}: {midiToNoteName(s.currentCorrectMidi[0])}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Staff */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center' }}>
          <StaffNotation notes={staffNotes} width={400} />
        </div>

        {/* Piano */}
        <div style={{ padding: '0 24px 16px', flexShrink: 0 }}>
          <PianoKeyboard
            onKeyClick={handleKeyClick}
            highlightedKeys={highlights}
            disabled={s.phase === 'idle' || s.phase === 'answered'}
            selectableRange={{ min: selectableMin, max: selectableMax }}
          />
        </div>
      </div>

      <TrainingSidebar
        totalQuestions={s.questionNumber}
        correctCount={s.correctCount}
        history={s.history}
        onClearHistory={store.clearSingleNoteHistory}
      />
    </div>
  )
}
