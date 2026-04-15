import { useTranslation } from 'react-i18next'
import { OCTAVE_GROUPS, midiToNoteName } from '../utils/music'

interface OctaveRangeSelectorProps {
  selectedGroups: number[]
  onChange: (groups: number[]) => void
  disabled?: boolean
}

// Only show groups 2-6 for practical training range
const TRAINING_GROUPS = OCTAVE_GROUPS.filter(g => g.group >= 2 && g.group <= 6)

export default function OctaveRangeSelector({ selectedGroups, onChange, disabled }: OctaveRangeSelectorProps) {
  const { t } = useTranslation()

  // Calculate display range label
  const getRangeLabel = () => {
    if (selectedGroups.length === 0) return ''
    const sorted = [...selectedGroups].sort((a, b) => a - b)
    const minGroup = TRAINING_GROUPS.find(g => g.group === sorted[0])
    const maxGroup = TRAINING_GROUPS.find(g => g.group === sorted[sorted.length - 1])
    if (!minGroup || !maxGroup) return ''
    
    const startNote = midiToNoteName(minGroup.minMidi)
    const endNote = midiToNoteName(maxGroup.maxMidi)
    return `${startNote}–${endNote}`
  }

  const handleGroupClick = (group: number) => {
    if (disabled) return
    
    // If clicking an already selected group, remove it
    if (selectedGroups.includes(group)) {
      const next = selectedGroups.filter(g => g !== group)
      if (next.length > 0) {
        onChange(next.sort((a, b) => a - b))
      }
      return
    }
    
    // If adding a new group, create a continuous range
    const allGroups = [...selectedGroups, group].sort((a, b) => a - b)
    const min = Math.min(...allGroups)
    const max = Math.max(...allGroups)
    
    // Create continuous range from min to max
    const next: number[] = []
    for (let i = min; i <= max; i++) {
      next.push(i)
    }
    
    onChange(next)
  }

  const rangeLabel = getRangeLabel()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
        {t('training.octaveRange')}
      </label>
      <div style={{ display: 'flex', gap: '4px' }}>
        {TRAINING_GROUPS.map(g => {
          const active = selectedGroups.includes(g.group)
          return (
            <button
              key={g.group}
              onClick={() => handleGroupClick(g.group)}
              disabled={disabled}
              title={`${g.label} (${midiToNoteName(g.minMidi)}–${midiToNoteName(g.maxMidi)})`}
              style={{
                padding: '3px 10px',
                fontSize: '13px',
                borderRadius: '4px',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent)' : 'var(--bg-card)',
                color: active ? '#fff' : 'var(--text-secondary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s'
              }}
            >
              {g.label}
            </button>
          )
        })}
      </div>
      {rangeLabel && (
        <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500, marginLeft: '4px' }}>
          {rangeLabel}
        </span>
      )}
    </div>
  )
}
