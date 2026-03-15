/**
 * Get today's date as YYYY-MM-DD in local timezone
 */
export function todayStr() {
  const d = new Date()
  return formatDate(d)
}

export function formatDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = parseLocalDate(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target - now) / (1000 * 60 * 60 * 24))
  return diff
}

export function formatDeadline(dateStr) {
  if (!dateStr) return null
  const days = daysUntil(dateStr)
  if (days < 0) return `Прострочено на ${Math.abs(days)} дн.`
  if (days === 0) return 'Сьогодні'
  if (days === 1) return 'Завтра'
  return `${days} дн. залишилось`
}

export function formatDisplayDate(dateStr) {
  const d = parseLocalDate(dateStr)
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatShortDate(dateStr) {
  const d = parseLocalDate(dateStr)
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

/**
 * Day-of-week index: 0=Mon … 6=Sun (ISO style for our UI)
 */
export function getISODayOfWeek(date = new Date()) {
  const d = new Date(date)
  return (d.getDay() + 6) % 7 // Mon=0 … Sun=6
}

/**
 * Check if a habit should show on today based on frequency_type and frequency_days
 */
export function habitIsForToday(habit) {
  if (habit.frequency_type === 'daily') return true
  const today = getISODayOfWeek()
  return Array.isArray(habit.frequency_days) && habit.frequency_days.includes(today)
}

/**
 * Debounce
 */
export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Get last N days as YYYY-MM-DD strings
 */
export function getLastNDays(n) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }
  return days
}

/**
 * Calculate streak from sorted array of completed dates
 */
export function calculateStreak(completedDates) {
  if (!completedDates.length) return 0
  const sorted = [...completedDates].sort().reverse()
  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const dateStr of sorted) {
    const d = parseLocalDate(dateStr)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((current - d) / (1000 * 60 * 60 * 24))
    if (diff === 0 || diff === 1) {
      streak++
      current = d
    } else {
      break
    }
  }
  return streak
}

export const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
export const CATEGORIES = ['WU Wien', 'Стартап', 'Особисте', 'Інше']
