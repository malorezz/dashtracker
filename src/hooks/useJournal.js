import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { todayStr, debounce } from '../lib/utils'

export function useJournal(userId) {
  const [content, setContent] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const today = todayStr()

  const fetchTodayEntry = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('content')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle()
      if (error) throw error
      setContent(data?.content || '')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userId, today])

  const fetchHistory = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('date, content')
        .eq('user_id', userId)
        .neq('date', today)
        .order('date', { ascending: false })
        .limit(50)
      if (error) throw error
      setHistory(data || [])
    } catch (e) {
      console.error('Failed to fetch journal history', e)
    }
  }, [userId, today])

  useEffect(() => {
    fetchTodayEntry()
  }, [fetchTodayEntry])

  const saveEntry = useCallback(async (text) => {
    if (!userId) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('journal_entries')
        .upsert(
          { user_id: userId, date: today, content: text, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,date' }
        )
      if (error) throw error
    } catch (e) {
      console.error('Failed to save journal entry', e)
    } finally {
      setSaving(false)
    }
  }, [userId, today])

  const debouncedSave = useRef(debounce(saveEntry, 1000)).current

  const handleChange = useCallback((text) => {
    setContent(text)
    debouncedSave(text)
  }, [debouncedSave])

  return {
    content,
    history,
    loading,
    saving,
    error,
    handleChange,
    fetchHistory,
    refetch: fetchTodayEntry,
  }
}
