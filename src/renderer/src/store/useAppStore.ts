import { create } from 'zustand'
import type { Instrument } from '../utils/music'

interface AppState {
  language: 'zh' | 'en'
  setLanguage: (lang: 'zh' | 'en') => void
  instrument: Instrument
  setInstrument: (instrument: Instrument) => void
}

export const useAppStore = create<AppState>((set) => ({
  language: 'zh',
  setLanguage: (language) => set({ language }),
  instrument: 'piano',
  setInstrument: (instrument) => set({ instrument })
}))
