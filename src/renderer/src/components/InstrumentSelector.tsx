import { useTranslation } from 'react-i18next'
import type { Instrument } from '../utils/music'

interface InstrumentSelectorProps {
  value: Instrument
  onChange: (instrument: Instrument) => void
  disabled?: boolean
}

export default function InstrumentSelector({ value, onChange, disabled }: InstrumentSelectorProps) {
  const { t } = useTranslation()

  const instruments: { key: Instrument; label: string }[] = [
    { key: 'piano', label: t('training.piano') },
    { key: 'guitar', label: t('training.guitar') },
    { key: 'piccolo', label: t('training.piccolo') }
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        {t('training.instrument')}
      </label>
      <div style={{ display: 'flex', gap: '12px' }}>
        {instruments.map(({ key, label }) => (
          <label
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: value === key ? 'rgba(233,69,96,0.1)' : 'transparent',
              border: value === key ? '1px solid var(--accent)' : '1px solid transparent',
              transition: 'all 0.2s',
              opacity: disabled ? 0.5 : 1
            }}
          >
            <input
              type="radio"
              name="instrument"
              value={key}
              checked={value === key}
              onChange={() => !disabled && onChange(key)}
              disabled={disabled}
              style={{ cursor: disabled ? 'not-allowed' : 'pointer', margin: 0 }}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  )
}
