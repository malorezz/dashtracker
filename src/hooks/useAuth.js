import { useState, useEffect } from 'react'
import { getEffectiveUserId, getInitData, expandWebApp, getColorScheme } from '../lib/telegram'

export function useAuth() {
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        // Expand the WebApp
        expandWebApp()

        // Apply color scheme
        const scheme = getColorScheme()
        const dark = scheme === 'dark'
        setIsDark(dark)
        if (dark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }

        // Listen for theme changes
        const tg = window.Telegram?.WebApp
        if (tg) {
          tg.onEvent('themeChanged', () => {
            const newScheme = tg.colorScheme
            const newDark = newScheme === 'dark'
            setIsDark(newDark)
            if (newDark) {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          })
        }

        const id = getEffectiveUserId()
        if (!id) throw new Error('Не вдалося отримати ID користувача')
        setUserId(id)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  return { userId, loading, error, isDark }
}
