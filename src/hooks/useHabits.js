import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { todayStr, habitIsForToday, getLastNDays, getISODayOfWeek, formatDate } from '../lib/utils'

/**
 * Calculate streak for a single habit given its completed dates (Set of YYYY-MM-DD strings).
 * Streak = consecutive scheduled days (backwards from today) that were completed.
 */
function calcHabitStreak(habit, completedDatesSet) {
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = formatDate(d)

    // Is this day scheduled for the habit?
    let scheduled = false
    if (habit.frequency_type === 'daily') {
      scheduled = true
    } else if (Array.isArray(habit.frequency_days)) {
      const iso = getISODayOfWeek(d)
      scheduled = habit.frequency_days.includes(iso)
    }

    if (!scheduled) continue

    if (completedDatesSet.has(dateStr)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function useHabits(userId) {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState({}) // { habitId: true/false } — today's logs
  const [recentLogs, setRecentLogs] = useState([]) // last 90 days logs for streak
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const today = todayStr()
      const days90 = getLastNDays(90)
      const from90 = days90[0]

      const [habitsRes, logsRes, recentLogsRes] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', userId)
          .order('order_index', { ascending: true }),
        supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today),
        supabase
          .from('habit_logs')
          .select('habit_id, date')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('date', from90),
      ])
      if (habitsRes.error) throw habitsRes.error
      if (logsRes.error) throw logsRes.error
      if (recentLogsRes.error) throw recentLogsRes.error

      setHabits(habitsRes.data || [])
      const logsMap = {}
      for (const log of logsRes.data || []) {
        logsMap[log.habit_id] = log.completed
      }
      setLogs(logsMap)
      setRecentLogs(recentLogsRes.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const todayHabits = habits.filter(habitIsForToday)

  const toggleHabit = useCallback(async (habitId) => {
    const today = todayStr()
    const current = !!logs[habitId]
    const next = !current

    // Optimistic update
    setLogs(prev => ({ ...prev, [habitId]: next }))

    try {
      if (next) {
        const { error } = await supabase.from('habit_logs').upsert(
          { habit_id: habitId, user_id: userId, date: today, completed: true },
          { onConflict: 'habit_id,date' }
        )
        if (error) throw error
        // Update recentLogs optimistically
        setRecentLogs(prev => [...prev.filter(l => !(l.habit_id === habitId && l.date === today)), { habit_id: habitId, date: today }])
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('user_id', userId)
          .eq('date', today)
        if (error) throw error
        setRecentLogs(prev => prev.filter(l => !(l.habit_id === habitId && l.date === today)))
      }
    } catch (e) {
      // Revert on failure
      setLogs(prev => ({ ...prev, [habitId]: current }))
    }
  }, [logs, userId])

  const addHabit = useCallback(async (data) => {
    const maxOrder = habits.length > 0
      ? Math.max(...habits.map(h => h.order_index || 0))
      : -1
    const { data: newHabit, error } = await supabase
      .from('habits')
      .insert({ ...data, user_id: userId, order_index: maxOrder + 1 })
      .select()
      .single()
    if (error) throw error
    setHabits(prev => [...prev, newHabit])
    return newHabit
  }, [habits, userId])

  const updateHabit = useCallback(async (id, data) => {
    const { data: updated, error } = await supabase
      .from('habits')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    setHabits(prev => prev.map(h => h.id === id ? updated : h))
    return updated
  }, [userId])

  const deleteHabit = useCallback(async (id) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    setHabits(prev => prev.filter(h => h.id !== id))
  }, [userId])

  const reorderHabits = useCallback(async (newOrder) => {
    setHabits(newOrder)
    for (const [i, h] of newOrder.entries()) {
      await supabase.from('habits').update({ order_index: i }).eq('id', h.id).eq('user_id', userId)
    }
  }, [userId])

  // Compute per-habit streaks
  const streaks = {}
  for (const habit of habits) {
    const habitDates = new Set(
      recentLogs.filter(l => l.habit_id === habit.id).map(l => l.date)
    )
    streaks[habit.id] = calcHabitStreak(habit, habitDates)
  }

  const completedCount = todayHabits.filter(h => logs[h.id]).length
  const totalCount = todayHabits.length

  return {
    habits,
    todayHabits,
    logs,
    streaks,
    loading,
    error,
    completedCount,
    totalCount,
    toggleHabit,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    refetch: fetchAll,
  }
}
