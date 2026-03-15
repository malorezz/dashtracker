/**
 * Telegram WebApp helpers
 */

export function getTelegramWebApp() {
  return window.Telegram?.WebApp
}

export function getTelegramUser() {
  const tg = getTelegramWebApp()
  if (!tg) return null
  return tg.initDataUnsafe?.user || null
}

export function getTelegramUserId() {
  const user = getTelegramUser()
  if (!user) return null
  return String(user.id)
}

export function getInitData() {
  const tg = getTelegramWebApp()
  return tg?.initData || ''
}

export function getColorScheme() {
  const tg = getTelegramWebApp()
  // Only trust colorScheme when actually running inside Telegram (initData present)
  if (tg && tg.initData) return tg.colorScheme
  return 'dark'
}

export function expandWebApp() {
  const tg = getTelegramWebApp()
  tg?.expand()
}

export function showBackButton(onClick) {
  const tg = getTelegramWebApp()
  if (!tg) return
  tg.BackButton.show()
  tg.BackButton.onClick(onClick)
}

export function hideBackButton() {
  const tg = getTelegramWebApp()
  if (!tg) return
  tg.BackButton.hide()
  tg.BackButton.offClick()
}

export function hapticFeedback(type = 'light') {
  const tg = getTelegramWebApp()
  tg?.HapticFeedback?.impactOccurred(type)
}

export function hapticNotification(type = 'success') {
  const tg = getTelegramWebApp()
  tg?.HapticFeedback?.notificationOccurred(type)
}

/**
 * Returns Telegram user ID, or dev fallback when running on localhost.
 * Returns null if opened outside Telegram in production (e.g. plain browser url).
 */
export function getEffectiveUserId() {
  const telegramId = getTelegramUserId()
  if (telegramId) return telegramId

  // Dev fallback — only on localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'dev-user-123'
  }

  return null
}
