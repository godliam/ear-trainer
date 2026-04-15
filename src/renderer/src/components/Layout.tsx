import { Outlet, NavLink } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'
import { useTranslation } from 'react-i18next'

export default function Layout() {
  const { t } = useTranslation()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <nav style={{
        height: 'var(--nav-height)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid var(--border)',
        gap: '8px',
        flexShrink: 0
      }}>
        <NavLink to="/" style={navStyle}>{t('nav.home')}</NavLink>
        <NavLink to="/single-note" style={navStyle}>{t('nav.singleNote')}</NavLink>
        <NavLink to="/chord-training" style={navStyle}>{t('nav.chordTraining')}</NavLink>
        <NavLink to="/chord-id" style={navStyle}>{t('nav.chordId')}</NavLink>
        <div style={{ marginLeft: 'auto' }}>
          <LanguageSwitcher />
        </div>
      </nav>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
  textDecoration: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  fontWeight: isActive ? 600 : 400,
  fontSize: '14px',
  background: isActive ? 'rgba(233,69,96,0.1)' : 'transparent',
  transition: 'all 0.2s'
})
