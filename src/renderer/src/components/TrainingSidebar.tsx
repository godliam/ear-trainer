import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface SidebarRecord {
  questionNumber: number
  isCorrect: boolean
  correctAnswer: string
  userAnswer: string
}

interface TrainingSidebarProps {
  totalQuestions: number
  correctCount: number
  history: SidebarRecord[]
  onClearHistory?: () => void
}

export default function TrainingSidebar({ totalQuestions, correctCount, history, onClearHistory }: TrainingSidebarProps) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)

  const accuracy = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0

  if (collapsed) {
    return (
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
        onClick={() => setCollapsed(false)}
        title={t('sidebar.expand')}
      >
        <span style={{ fontSize: '18px', transform: 'rotate(180deg)' }}>›</span>
      </div>
    )
  }

  return (
    <div style={{
      width: 'var(--sidebar-width)',
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontWeight: 600, fontSize: '14px' }}>{t('training.history')}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {onClearHistory && history.length > 0 && (
            <button
              className="btn-secondary"
              style={{ padding: '2px 8px', fontSize: '12px', color: 'var(--error)' }}
              onClick={onClearHistory}
            >
              {t('sidebar.clear')}
            </button>
          )}
          <button
            className="btn-secondary"
            style={{ padding: '2px 8px', fontSize: '12px' }}
            onClick={() => setCollapsed(true)}
          >
            {t('sidebar.collapse')} ›
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '16px',
        fontSize: '13px',
        flexWrap: 'wrap'
      }}>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>{t('training.totalQuestions')}:</span>
          <span style={{ marginLeft: '4px', fontWeight: 600 }}>{totalQuestions}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>{t('training.correctCount')}:</span>
          <span style={{ marginLeft: '4px', fontWeight: 600, color: 'var(--success)' }}>{correctCount}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>{t('training.accuracy')}:</span>
          <span style={{ marginLeft: '4px', fontWeight: 600 }}>{accuracy}%</span>
        </div>
      </div>

      {/* Wrong answer records */}
      <div style={{
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-secondary)'
      }}>
        {t('training.wrongRecords')}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        {history.filter(r => !r.isCorrect).length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '8px 0' }}>
            {t('training.noRecords')}
          </div>
        ) : (
          history.filter(r => !r.isCorrect).map((record, idx) => (
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
              <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {t('training.question', { n: record.questionNumber })}
              </div>
              <div>
                <span style={{ color: 'var(--error)' }}>{t('training.yourAnswer')}:</span>{' '}
                {record.userAnswer}
              </div>
              <div>
                <span style={{ color: 'var(--success)' }}>{t('training.correctAnswer')}:</span>{' '}
                {record.correctAnswer}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
