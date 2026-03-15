import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getLastNDays, calculateStreak, formatDate } from '../lib/utils'

export function useStats(userId) {
  const [logs, setLogs] = useState([])
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      // Fetch last 84 days of logs (12 weeks)
      const days84 = getLastNDays(84)
      const from84 = days84[0]
      const [logsRes, habitsRes] = await Promise.all([
        supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('date', from84),
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', userId)
          .order('order_index', { ascending: true }),
      ])
      if (logsRes.error) throw logsRes.error
      if (habitsRes.error) throw habitsRes.error
      setLogs(logsRes.data || [])
      setHabits(habitsRes.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Compute stats
  const days7 = getLastNDays(7)
  const days30 = getLastNDays(30)
  const days84 = getLastNDays(84)

  const completedSet = new Set(logs.map(l => `${l.habit_id}:${l.date}`))
  const completedDates = [...new Set(logs.map(l => l.date))]

  function completionRate(days, habitFilter = null) {
    if (!habits.length) return 0
    let total = 0
    let done = 0
    for (const day of days) {
      const dayDate = new Date(day + 'T00:00:00')
      const relevantHabits = habitFilter
        ? habits.filter(h => h.id === habitFilter)
        : habits
      for (const habit of relevantHabits) {
        if (habit.frequency_type === 'daily') {
          total++
          if (completedSet.has(`${habit.id}:${day}`)) done++
        } else if (Array.isArray(habit.frequency_days)) {
          const iso = (dayDate.getDay() + 6) % 7
          if (habit.frequency_days.includes(iso)) {
            total++
            if (completedSet.has(`${habit.id}:${day}`)) done++
          }
        }
      }
    }
    return total === 0 ? 0 : Math.round((done / total) * 100)
  }

  const rate7 = completionRate(days7)
  const rate30 = completionRate(days30)
  const streak = calculateStreak(completedDates)

  // Heatmap data: for each of 84 days, count how many habits completed
  function heatmapData() {
    return days84.map(day => {
      const count = logs.filter(l => l.date === day).length
      return { date: day, count }
    })
  }

  // Bar chart data per habit for last 30 days
  function barChartData(habitFilter = null) {
    const targetHabits = habitFilter ? habits.filter(h => h.id === habitFilter) : habits
    return days30.map(day => {
      const entry = { date: day }
      for (const habit of targetHabits) {
        entry[habit.id] = completedSet.has(`${habit.id}:${day}`) ? 1 : 0
      }
      return entry
    })
  }

  function habitBarData() {
    return habits.map(habit => {
      const count = days30.filter(day => completedSet.has(`${habit.id}:${day}`)).length
      return {
        name: `${habit.emoji} ${habit.name}`,
        id: habit.id,
        count,
        total: days30.length,
      }
    })
  }

  return {
    habits,
    logs,
    loading,
    error,
    rate7,
    rate30,
    streak,
    heatmapData: heatmapData(),
    habitBarData: habitBarData(),
    completionRate,
    refetch: fetchStats,
  }
}
