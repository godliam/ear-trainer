import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <button
      className="btn-secondary"
      style={{ padding: '4px 12px', fontSize: '13px' }}
      onClick={() => i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')}
    >
      {i18n.language === 'zh' ? 'EN' : '中文'}
    </button>
  )
}
