import { useTranslation } from 'react-i18next'
import type { Instrument } from '../utils/music'

interface InstrumentSelectorProps {
  value: Instrument
  onChange: (instrument: Instrument) => void
  disabled?: boolean
}

export default function InstrumentSelector({ value, onChange, disabled }: InstrumentSelectorProps) {
  const { t } = useTranslation()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        {t('training.instrument')}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as Instrument)}
        disabled={disabled}
      >
        <option value="piano">{t('training.piano')}</option>
        <option value="guitar">{t('training.guitar')}</option>
        <option value="piccolo">{t('training.piccolo')}</option>
      </select>
    </div>
  )
}
