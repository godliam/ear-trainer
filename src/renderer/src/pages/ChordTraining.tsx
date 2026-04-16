import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PianoKeyboard from '../components/PianoKeyboard'
import StaffNotation from '../components/StaffNotation'
import KeySelector from '../components/KeySelector'
import OctaveRangeSelector from '../components/OctaveRangeSelector'
import TrainingSidebar from '../components/TrainingSidebar'
import { useTrainingStore } from '../store/useTrainingStore'
import { getDiatonicTriads, midiToNoteName, getOctaveGroupRange } from '../utils/music'
import { initAudio, playChord, playTrainingSequence, stopAll } from '../utils/audio'
import { recognizeChord } from '../utils/chordRecognition'

export default function ChordTraining() {
  const { t } = useTranslation()
  const store = useTrainingStore()
  const s = store.chord
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
    store.stopChordTraining()
  }, [])

  const startQuestion = useCallback(() => {
    if (cancelRef.current) { cancelRef.current(); cancelRef.current = null }
    if (autoNextRef.current) { clearTimeout(autoNextRef.current); autoNextRef.current = null }

    // Get the octave range from selected groups
    const { min: minMidi, max: maxMidi } = getOctaveGroupRange(s.octaveGroups)

    const parts = s.keySignature.split(' ')
    const keyName = parts[1] === 'minor' ? parts[0] + 'm' : parts[0]
    const triads = getDiatonicTriads(keyName, minMidi, maxMidi)
    if (triads.length === 0) return

    const randomTriad = triads[Math.floor(Math.random() * triads.length)]
    store.setChordQuestion(randomTriad.notes, randomTriad.name)

    cancelRef.current = playTrainingSequence(randomTriad.notes, () => {
      store.setChordPhase('waiting')
    })
  }, [s.instrument, s.keySignature, s.octaveGroups])

  const handleReplay = useCallback(() => {
    if (s.currentCorrectMidi.length === 0) return
    if (cancelRef.current) cancelRef.current()

    store.setChordPhase('playing')
    cancelRef.current = playTrainingSequence(s.currentCorrectMidi, () => {
      store.setChordPhase('waiting')
    })
  }, [s.currentCorrectMidi])

  const handleKeyClick = useCallback((midi: number) => {
    if (s.phase !== 'waiting') return
    store.toggleChordSelection(midi)
  }, [s.phase])

  const handleSubmit = useCallback(() => {
    if (s.userSelectedMidi.length !== 3) return

    // Recognize user's chord
    const userChord = recognizeChord(s.userSelectedMidi)
    const userChordName = userChord ? userChord.name : '—'

    store.submitChordAnswer(userChordName)

    setTimeout(() => {
      playChord(s.currentCorrectMidi, '2n')
    }, 300)

    autoNextRef.current = setTimeout(() => {
      store.nextChordQuestion()
      setTimeout(() => startQuestion(), 300)
    }, 3000)
  }, [s.userSelectedMidi, s.currentCorrectMidi, startQuestion])

  // Highlights
  const highlights: { midi: number; color: string }[] = []
  if (s.phase === 'answered') {
    s.currentCorrectMidi.forEach(m => highlights.push({ midi: m, color: 'green' }))
    if (!s.isCurrentCorrect) {
      s.userSelectedMidi.forEach(m => {
        if (!s.currentCorrectMidi.includes(m)) {
          highlights.push({ midi: m, color: 'red' })
        }
      })
    }
  } else if (s.phase === 'waiting') {
    s.userSelectedMidi.forEach(m => highlights.push({ midi: m, color: 'blue' }))
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
            onChange={store.setChordKey}
            disabled={isTraining}
            showRandom={false}
          />
          <OctaveRangeSelector
            selectedGroups={s.octaveGroups}
            onChange={store.setChordOctaveGroups}
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
                  disabled={s.phase === 'playing'}>
                  {t('training.replay')}
                </button>
                {s.phase === 'waiting' && (
                  <button className="btn-primary" onClick={handleSubmit}
                    disabled={s.userSelectedMidi.length !== 3}>
                    {t('training.submit')} ({s.userSelectedMidi.length}/3)
                  </button>
                )}
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
            <span style={{ color: 'var(--accent)', fontSize: '14px' }}>
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
              {' — '}
              <span style={{ color: 'var(--text-primary)' }}>
                {s.currentChordName}
              </span>
              {!s.isCurrentCorrect && (
                <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>
                  ({s.currentCorrectMidi.map(m => midiToNoteName(m)).join(', ')})
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
            selectedKeys={s.phase === 'waiting' ? s.userSelectedMidi : []}
            disabled={s.phase !== 'waiting'}
            selectableRange={{ min: selectableMin, max: selectableMax }}
          />
        </div>
      </div>

      <TrainingSidebar
        totalQuestions={s.questionNumber}
        correctCount={s.correctCount}
        history={s.history}
        onClearHistory={store.clearChordHistory}
      />
    </div>
  )
}
