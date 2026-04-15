import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const modules = [
    { key: 'singleNote', path: '/single-note', icon: '♪' },
    { key: 'chordTraining', path: '/chord-training', icon: '♫' },
    { key: 'chordId', path: '/chord-id', icon: '𝄞' }
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: '40px',
      padding: '40px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>{t('home.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>{t('home.subtitle')}</p>
      </div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {modules.map(m => (
          <button
            key={m.key}
            onClick={() => navigate(m.path)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '32px 28px',
              width: '240px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text-primary)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: '40px' }}>{m.icon}</span>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>
              {t(`home.${m.key}`)}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {t(`home.${m.key}Desc`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
