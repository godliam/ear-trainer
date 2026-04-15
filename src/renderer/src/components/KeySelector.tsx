import { useTranslation } from 'react-i18next'

interface KeySelectorProps {
  value: string
  onChange: (key: string) => void
  disabled?: boolean
  showRandom?: boolean
}

const MAJOR_KEYS = [
  'C major', 'G major', 'D major', 'A major', 'E major', 'B major',
  'F# major', 'F major', 'Bb major', 'Eb major', 'Ab major', 'Db major'
]

const MINOR_KEYS = [
  'A minor', 'E minor', 'B minor', 'F# minor', 'C# minor', 'G# minor',
  'D minor', 'G minor', 'C minor', 'F minor', 'Bb minor', 'Eb minor'
]

const KEY_DISPLAY_NAMES: Record<string, { zh: string; en: string }> = {
  'C major': { zh: 'C 大调', en: 'C Major' },
  'G major': { zh: 'G 大调', en: 'G Major' },
  'D major': { zh: 'D 大调', en: 'D Major' },
  'A major': { zh: 'A 大调', en: 'A Major' },
  'E major': { zh: 'E 大调', en: 'E Major' },
  'B major': { zh: 'B 大调', en: 'B Major' },
  'F# major': { zh: 'F# 大调', en: 'F# Major' },
  'F major': { zh: 'F 大调', en: 'F Major' },
  'Bb major': { zh: 'Bb 大调', en: 'Bb Major' },
  'Eb major': { zh: 'Eb 大调', en: 'Eb Major' },
  'Ab major': { zh: 'Ab 大调', en: 'Ab Major' },
  'Db major': { zh: 'Db 大调', en: 'Db Major' },
  'A minor': { zh: 'A 小调', en: 'A Minor' },
  'E minor': { zh: 'E 小调', en: 'E Minor' },
  'B minor': { zh: 'B 小调', en: 'B Minor' },
  'F# minor': { zh: 'F# 小调', en: 'F# Minor' },
  'C# minor': { zh: 'C# 小调', en: 'C# Minor' },
  'G# minor': { zh: 'G# 小调', en: 'G# Minor' },
  'D minor': { zh: 'D 小调', en: 'D Minor' },
  'G minor': { zh: 'G 小调', en: 'G Minor' },
  'C minor': { zh: 'C 小调', en: 'C Minor' },
  'F minor': { zh: 'F 小调', en: 'F Minor' },
  'Bb minor': { zh: 'Bb 小调', en: 'Bb Minor' },
  'Eb minor': { zh: 'Eb 小调', en: 'Eb Minor' }
}

export default function KeySelector({ value, onChange, disabled, showRandom = true }: KeySelectorProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'zh' | 'en'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        {t('training.key')}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        {showRandom && (
          <option value="random">{t('training.allRandom')}</option>
        )}
        <optgroup label={t('training.major')}>
          {MAJOR_KEYS.map(k => (
            <option key={k} value={k}>
              {KEY_DISPLAY_NAMES[k]?.[lang] || k}
            </option>
          ))}
        </optgroup>
        <optgroup label={t('training.minor')}>
          {MINOR_KEYS.map(k => (
            <option key={k} value={k}>
              {KEY_DISPLAY_NAMES[k]?.[lang] || k}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  )
}
