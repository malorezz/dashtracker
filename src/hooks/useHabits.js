import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { todayStr, habitIsForToday } from '../lib/utils'

export function useHabits(userId) {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState({}) // { habitId: true/false }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const today = todayStr()
      const [habitsRes, logsRes] = await Promise.all([
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
      ])
      if (habitsRes.error) throw habitsRes.error
      if (logsRes.error) throw logsRes.error

      setHabits(habitsRes.data || [])
      const logsMap = {}
      for (const log of logsRes.data || []) {
        logsMap[log.habit_id] = log.completed
      }
      setLogs(logsMap)
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
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('user_id', userId)
          .eq('date', today)
        if (error) throw error
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
    // Persist new order
    const updates = newOrder.map((h, i) => ({ id: h.id, order_index: i, user_id: userId, name: h.name, emoji: h.emoji, frequency_type: h.frequency_type, frequency_days: h.frequency_days }))
    for (const u of updates) {
      await supabase.from('habits').update({ order_index: u.order_index }).eq('id', u.id).eq('user_id', userId)
    }
  }, [userId])

  const completedCount = todayHabits.filter(h => logs[h.id]).length
  const totalCount = todayHabits.length

  return {
    habits,
    todayHabits,
    logs,
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
