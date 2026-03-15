import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useGoals(userId) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGoals = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setGoals(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  const addGoal = useCallback(async (data) => {
    const { data: newGoal, error } = await supabase
      .from('goals')
      .insert({ ...data, user_id: userId, completed: false })
      .select()
      .single()
    if (error) throw error
    setGoals(prev => [newGoal, ...prev])
    return newGoal
  }, [userId])

  const updateGoal = useCallback(async (id, data) => {
    const { data: updated, error } = await supabase
      .from('goals')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    setGoals(prev => prev.map(g => g.id === id ? updated : g))
    return updated
  }, [userId])

  const completeGoal = useCallback(async (id) => {
    return updateGoal(id, { completed: true, completed_at: new Date().toISOString() })
  }, [updateGoal])

  const uncompleteGoal = useCallback(async (id) => {
    return updateGoal(id, { completed: false, completed_at: null })
  }, [updateGoal])

  const deleteGoal = useCallback(async (id) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    setGoals(prev => prev.filter(g => g.id !== id))
  }, [userId])

  return {
    goals,
    activeGoals,
    completedGoals,
    loading,
    error,
    addGoal,
    updateGoal,
    completeGoal,
    uncompleteGoal,
    deleteGoal,
    refetch: fetchGoals,
  }
}
