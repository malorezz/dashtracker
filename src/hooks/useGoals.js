import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useGoals(userId) {
  const [goals, setGoals] = useState([])
  const [tasks, setTasks] = useState({}) // { goalId: [task, ...] }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGoals = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [goalsRes, tasksRes] = await Promise.all([
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('goal_tasks')
          .select('*')
          .eq('user_id', userId)
          .order('order_index', { ascending: true }),
      ])
      if (goalsRes.error) throw goalsRes.error
      if (tasksRes.error) {
        // Table may not exist yet — ignore gracefully
        console.warn('goal_tasks not available:', tasksRes.error.message)
        setGoals(goalsRes.data || [])
        return
      }
      setGoals(goalsRes.data || [])
      const taskMap = {}
      for (const task of tasksRes.data || []) {
        if (!taskMap[task.goal_id]) taskMap[task.goal_id] = []
        taskMap[task.goal_id].push(task)
      }
      setTasks(taskMap)
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
    setTasks(prev => { const next = { ...prev }; delete next[id]; return next })
  }, [userId])

  // --- Goal Tasks ---

  const addTask = useCallback(async (goalId, title) => {
    const existingTasks = tasks[goalId] || []
    const maxOrder = existingTasks.length > 0
      ? Math.max(...existingTasks.map(t => t.order_index))
      : -1
    const { data: newTask, error } = await supabase
      .from('goal_tasks')
      .insert({ goal_id: goalId, user_id: userId, title: title.trim(), order_index: maxOrder + 1 })
      .select()
      .single()
    if (error) throw error
    setTasks(prev => ({
      ...prev,
      [goalId]: [...(prev[goalId] || []), newTask],
    }))
    return newTask
  }, [tasks, userId])

  const toggleTask = useCallback(async (goalId, taskId) => {
    const goalTasks = tasks[goalId] || []
    const task = goalTasks.find(t => t.id === taskId)
    if (!task) return
    const next = !task.completed
    // Optimistic
    setTasks(prev => ({
      ...prev,
      [goalId]: (prev[goalId] || []).map(t =>
        t.id === taskId ? { ...t, completed: next, completed_at: next ? new Date().toISOString() : null } : t
      ),
    }))
    const { error } = await supabase
      .from('goal_tasks')
      .update({ completed: next, completed_at: next ? new Date().toISOString() : null })
      .eq('id', taskId)
      .eq('user_id', userId)
    if (error) {
      // Revert
      setTasks(prev => ({
        ...prev,
        [goalId]: (prev[goalId] || []).map(t =>
          t.id === taskId ? { ...t, completed: task.completed, completed_at: task.completed_at } : t
        ),
      }))
    }
  }, [tasks, userId])

  const deleteTask = useCallback(async (goalId, taskId) => {
    setTasks(prev => ({
      ...prev,
      [goalId]: (prev[goalId] || []).filter(t => t.id !== taskId),
    }))
    const { error } = await supabase
      .from('goal_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)
    if (error) {
      // Revert by refetching
      fetchGoals()
    }
  }, [userId, fetchGoals])

  return {
    goals,
    tasks,
    activeGoals,
    completedGoals,
    loading,
    error,
    addGoal,
    updateGoal,
    completeGoal,
    uncompleteGoal,
    deleteGoal,
    addTask,
    toggleTask,
    deleteTask,
    refetch: fetchGoals,
  }
}
