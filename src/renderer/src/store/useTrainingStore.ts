import { create } from 'zustand'
import type { Instrument } from '../utils/music'
import { DEFAULT_OCTAVE_GROUPS } from '../utils/music'

type TrainingPhase = 'idle' | 'playing' | 'waiting' | 'answered'

interface HistoryRecord {
  questionNumber: number
  isCorrect: boolean
  correctAnswer: string
  correctMidi: number[]
  userAnswer: string
  userMidi: number[]
  correctChordName?: string
  userChordName?: string
}

interface TrainingModuleState {
  instrument: Instrument
  keySignature: string
  octaveGroups: number[]
  phase: TrainingPhase
  questionNumber: number
  correctCount: number
  history: HistoryRecord[]

  currentCorrectMidi: number[]
  currentChordName: string
  userSelectedMidi: number[]
  isCurrentCorrect: boolean | null
}

interface ChordIdHistoryRecord {
  notes: number[]
  chordName: string
  timestamp: number
}

export type ChordIdDirection = 'ascending' | 'descending' | 'asc-desc' | 'desc-asc'

interface ChordIdState {
  selectedKeys: number[]
  voicing: 'block' | 'arp-quarter' | 'arp-eighth' | 'arp-sixteenth'
  direction: ChordIdDirection
  history: ChordIdHistoryRecord[]
}

interface TrainingStore {
  singleNote: TrainingModuleState
  chord: TrainingModuleState
  chordId: ChordIdState

  // Single note actions
  setSingleNoteInstrument: (instrument: Instrument) => void
  setSingleNoteKey: (key: string) => void
  setSingleNoteOctaveGroups: (groups: number[]) => void
  setSingleNotePhase: (phase: TrainingPhase) => void
  setSingleNoteQuestion: (correctMidi: number[]) => void
  addSingleNoteSelection: (midi: number) => void
  submitSingleNoteAnswer: () => void
  nextSingleNoteQuestion: () => void
  stopSingleNoteTraining: () => void
  clearSingleNoteHistory: () => void

  // Chord training actions
  setChordInstrument: (instrument: Instrument) => void
  setChordKey: (key: string) => void
  setChordOctaveGroups: (groups: number[]) => void
  setChordPhase: (phase: TrainingPhase) => void
  setChordQuestion: (correctMidi: number[], chordName: string) => void
  toggleChordSelection: (midi: number) => void
  submitChordAnswer: (userChordName: string) => void
  nextChordQuestion: () => void
  stopChordTraining: () => void
  clearChordHistory: () => void

  // Chord ID actions
  toggleChordIdKey: (midi: number) => void
  resetChordIdKeys: () => void
  setChordIdVoicing: (voicing: ChordIdState['voicing']) => void
  setChordIdDirection: (direction: ChordIdDirection) => void
  addChordIdHistory: (notes: number[], chordName: string) => void
  clearChordIdHistory: () => void
}

const defaultModuleState: TrainingModuleState = {
  instrument: 'piano',
  keySignature: 'C major',
  octaveGroups: DEFAULT_OCTAVE_GROUPS,
  phase: 'idle',
  questionNumber: 0,
  correctCount: 0,
  history: [],
  currentCorrectMidi: [],
  currentChordName: '',
  userSelectedMidi: [],
  isCurrentCorrect: null
}

function midiToNoteName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`
}

export const useTrainingStore = create<TrainingStore>((set) => ({
  singleNote: { ...defaultModuleState },
  chord: { ...defaultModuleState },
  chordId: {
    selectedKeys: [],
    voicing: 'block',
    direction: 'ascending',
    history: []
  },

  // Single note
  setSingleNoteInstrument: (instrument) =>
    set(s => ({ singleNote: { ...s.singleNote, instrument } })),
  setSingleNoteKey: (keySignature) =>
    set(s => ({ singleNote: { ...s.singleNote, keySignature } })),
  setSingleNoteOctaveGroups: (octaveGroups) =>
    set(s => ({ singleNote: { ...s.singleNote, octaveGroups } })),
  setSingleNotePhase: (phase) =>
    set(s => ({ singleNote: { ...s.singleNote, phase } })),
  setSingleNoteQuestion: (correctMidi) =>
    set(s => ({
      singleNote: {
        ...s.singleNote,
        currentCorrectMidi: correctMidi,
        userSelectedMidi: [],
        isCurrentCorrect: null,
        phase: 'playing',
        questionNumber: s.singleNote.questionNumber + 1
      }
    })),
  addSingleNoteSelection: (midi) =>
    set(s => ({
      singleNote: { ...s.singleNote, userSelectedMidi: [midi] }
    })),
  submitSingleNoteAnswer: () =>
    set(s => {
      const { currentCorrectMidi, userSelectedMidi, questionNumber, correctCount, history } = s.singleNote
      const isCorrect = userSelectedMidi.length === 1 && userSelectedMidi[0] === currentCorrectMidi[0]
      const record: HistoryRecord = {
        questionNumber,
        isCorrect,
        correctAnswer: midiToNoteName(currentCorrectMidi[0]),
        correctMidi: currentCorrectMidi,
        userAnswer: userSelectedMidi.length > 0 ? midiToNoteName(userSelectedMidi[0]) : '—',
        userMidi: userSelectedMidi
      }
      const newHistory = [record, ...history].slice(0, 100)
      return {
        singleNote: {
          ...s.singleNote,
          isCurrentCorrect: isCorrect,
          correctCount: isCorrect ? correctCount + 1 : correctCount,
          history: newHistory,
          phase: 'answered'
        }
      }
    }),
  nextSingleNoteQuestion: () =>
    set(s => ({
      singleNote: {
        ...s.singleNote,
        phase: 'idle',
        currentCorrectMidi: [],
        userSelectedMidi: [],
        isCurrentCorrect: null
      }
    })),
  stopSingleNoteTraining: () =>
    set(s => ({
      singleNote: {
        ...s.singleNote,
        phase: 'idle',
        currentCorrectMidi: [],
        userSelectedMidi: [],
        isCurrentCorrect: null
      }
    })),
  clearSingleNoteHistory: () =>
    set(s => ({
      singleNote: {
        ...s.singleNote,
        history: [],
        questionNumber: 0,
        correctCount: 0
      }
    })),

  // Chord training
  setChordInstrument: (instrument) =>
    set(s => ({ chord: { ...s.chord, instrument } })),
  setChordKey: (keySignature) =>
    set(s => ({ chord: { ...s.chord, keySignature } })),
  setChordOctaveGroups: (octaveGroups) =>
    set(s => ({ chord: { ...s.chord, octaveGroups } })),
  setChordPhase: (phase) =>
    set(s => ({ chord: { ...s.chord, phase } })),
  setChordQuestion: (correctMidi, chordName) =>
    set(s => ({
      chord: {
        ...s.chord,
        currentCorrectMidi: correctMidi,
        currentChordName: chordName,
        userSelectedMidi: [],
        isCurrentCorrect: null,
        phase: 'playing',
        questionNumber: s.chord.questionNumber + 1
      }
    })),
  toggleChordSelection: (midi) =>
    set(s => {
      const current = s.chord.userSelectedMidi
      const newSelection = current.includes(midi)
        ? current.filter(m => m !== midi)
        : [...current, midi]
      return { chord: { ...s.chord, userSelectedMidi: newSelection } }
    }),
  submitChordAnswer: (userChordName) =>
    set(s => {
      const { currentCorrectMidi, currentChordName, userSelectedMidi, questionNumber, correctCount, history } = s.chord
      const correctSet = new Set(currentCorrectMidi)
      const userSet = new Set(userSelectedMidi)
      const isCorrect = correctSet.size === userSet.size && Array.from(correctSet).every(m => userSet.has(m))

      const correctNoteNames = currentCorrectMidi.map(midiToNoteName).join(', ')
      const userNoteNames = userSelectedMidi.map(midiToNoteName).join(', ')

      const record: HistoryRecord = {
        questionNumber,
        isCorrect,
        correctAnswer: `${currentChordName} (${correctNoteNames})`,
        correctMidi: currentCorrectMidi,
        userAnswer: `${userChordName} (${userNoteNames})` || '—',
        userMidi: userSelectedMidi,
        correctChordName: currentChordName,
        userChordName
      }
      const newHistory = [record, ...history].slice(0, 100)
      return {
        chord: {
          ...s.chord,
          isCurrentCorrect: isCorrect,
          correctCount: isCorrect ? correctCount + 1 : correctCount,
          history: newHistory,
          phase: 'answered'
        }
      }
    }),
  nextChordQuestion: () =>
    set(s => ({
      chord: {
        ...s.chord,
        phase: 'idle',
        currentCorrectMidi: [],
        currentChordName: '',
        userSelectedMidi: [],
        isCurrentCorrect: null
      }
    })),
  stopChordTraining: () =>
    set(s => ({
      chord: {
        ...s.chord,
        phase: 'idle',
        currentCorrectMidi: [],
        currentChordName: '',
        userSelectedMidi: [],
        isCurrentCorrect: null
      }
    })),
  clearChordHistory: () =>
    set(s => ({
      chord: {
        ...s.chord,
        history: [],
        questionNumber: 0,
        correctCount: 0
      }
    })),

  // Chord ID
  toggleChordIdKey: (midi) =>
    set(s => {
      const current = s.chordId.selectedKeys
      const newKeys = current.includes(midi)
        ? current.filter(m => m !== midi)
        : [...current, midi].sort((a, b) => a - b)
      return { chordId: { ...s.chordId, selectedKeys: newKeys } }
    }),
  resetChordIdKeys: () =>
    set(s => ({ chordId: { ...s.chordId, selectedKeys: [] } })),
  setChordIdVoicing: (voicing) =>
    set(s => ({ chordId: { ...s.chordId, voicing } })),
  setChordIdDirection: (direction) =>
    set(s => ({ chordId: { ...s.chordId, direction } })),
  addChordIdHistory: (notes, chordName) =>
    set(s => {
      const record: ChordIdHistoryRecord = { notes, chordName, timestamp: Date.now() }
      return {
        chordId: {
          ...s.chordId,
          history: [record, ...s.chordId.history].slice(0, 100)
        }
      }
    }),
  clearChordIdHistory: () =>
    set(s => ({ chordId: { ...s.chordId, history: [] } }))
}))
