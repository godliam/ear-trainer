import { create } from 'zustand'

interface AppState {
  language: 'zh' | 'en'
  setLanguage: (lang: 'zh' | 'en') => void
}

export const useAppStore = create<AppState>((set) => ({
  language: 'zh',
  setLanguage: (language) => set({ language })
}))
