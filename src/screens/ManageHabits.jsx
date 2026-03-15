import React, { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useHabits } from '../hooks/useHabits'
import ErrorState from '../components/ErrorState'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { SkeletonHabitItem } from '../components/SkeletonLoader'
import EmptyState from '../components/EmptyState'
import { DAY_NAMES } from '../lib/utils'
import { hapticFeedback, showBackButton, hideBackButton } from '../lib/telegram'

const POPULAR_EMOJIS = ['✨', '💪', '📚', '🏃', '💧', '🧘', '🎯', '🍎', '😴', '🧠', '✍️', '🎵', '🌿', '💊', '🚶', '🏊', '🚴', '🥗', '☕', '🙏']

function HabitForm({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [emoji, setEmoji] = useState(initial?.emoji || '✨')
  const [customEmoji, setCustomEmoji] = useState('')
  const [frequencyType, setFrequencyType] = useState(initial?.frequency_type || 'daily')
  const [frequencyDays, setFrequencyDays] = useState(initial?.frequency_days || [0, 1, 2, 3, 4])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function toggleDay(day) {
    setFrequencyDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setErr('Назва не може бути порожньою'); return }
    if (frequencyType === 'specific' && frequencyDays.length === 0) {
      setErr('Виберіть хоча б один день'); return
    }
    setSaving(true)
    setErr('')
    try {
      await onSave({
        name: name.trim(),
        emoji: customEmoji || emoji,
        frequency_type: frequencyType,
        frequency_days: frequencyType === 'daily' ? [] : [...frequencyDays].sort(),
      })
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Emoji picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Емодзі</label>
        <div className="flex gap-2 flex-wrap mb-2">
          {POPULAR_EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => { setEmoji(e); setCustomEmoji('') }}
              className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center transition-all
                ${(customEmoji ? false : emoji === e) ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500' : 'bg-gray-100 dark:bg-white/10'}`}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={customEmoji}
          onChange={e => setCustomEmoji(e.target.value.slice(0, 2))}
          placeholder="Або введіть своє..."
          className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Назва *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Наприклад: Читати 30 хвилин"
          className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Частота</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setFrequencyType('daily')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${frequencyType === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}
          >
            Щодня
          </button>
          <button
            type="button"
            onClick={() => setFrequencyType('specific')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${frequencyType === 'specific' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}
          >
            Певні дні
          </button>
        </div>

        {frequencyType === 'specific' && (
          <div className="flex gap-1.5 flex-wrap">
            {DAY_NAMES.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`w-10 h-10 rounded-xl text-xs font-semibold transition-colors
                  ${frequencyDays.includes(i) ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}
              >
                {day}
              </button>
            ))}
          </div>
        )}
      </div>

      {err && <p className="text-red-500 text-sm">{err}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
      >
        {saving ? 'Збереження...' : (initial ? 'Зберегти зміни' : 'Додати звичку')}
      </button>
    </form>
  )
}

function SortableHabitRow({ habit, streak, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const freqLabel = habit.frequency_type === 'daily'
    ? 'Щодня'
    : `${(habit.frequency_days || []).map(d => DAY_NAMES[d]).join(', ')}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white dark:bg-[#232e3c] rounded-xl px-4 py-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 dark:text-gray-600 touch-none cursor-grab active:cursor-grabbing p-1"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </button>
      <span className="text-2xl">{habit.emoji || '✨'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{habit.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-400 dark:text-gray-500">{freqLabel}</p>
          {streak > 0 && (
            <span className="text-xs font-medium text-orange-500 dark:text-orange-400">
              🔥 {streak}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onEdit(habit)}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button
        onClick={() => onDelete(habit.id)}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  )
}

export default function ManageHabits({ userId, onBack }) {
  const { habits, streaks, loading, error, addHabit, updateHabit, deleteHabit, reorderHabits, refetch } = useHabits(userId)
  const [modalOpen, setModalOpen] = useState(false)
  const [editHabit, setEditHabit] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [localHabits, setLocalHabits] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const displayHabits = localHabits || habits

  useEffect(() => {
    showBackButton(onBack)
    return () => hideBackButton()
  }, [onBack])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragStart = useCallback(({ active }) => {
    setActiveId(active.id)
    setLocalHabits(habits)
    hapticFeedback('medium')
  }, [habits])

  const handleDragOver = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return
    setLocalHabits(prev => {
      const items = prev || habits
      const oldIndex = items.findIndex(h => h.id === active.id)
      const newIndex = items.findIndex(h => h.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }, [habits])

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) { setLocalHabits(null); return }
    const final = localHabits || habits
    reorderHabits(final)
    setLocalHabits(null)
  }, [localHabits, habits, reorderHabits])

  function handleEdit(habit) {
    setEditHabit(habit)
    setModalOpen(true)
  }
  function handleAdd() {
    setEditHabit(null)
    setModalOpen(true)
  }
  async function handleSave(data) {
    if (editHabit) {
      await updateHabit(editHabit.id, data)
    } else {
      await addHabit(data)
    }
  }

  const activeHabit = activeId ? displayHabits.find(h => h.id === activeId) : null

  if (error) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="screen-scroll">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Управління звичками</h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 text-white text-sm font-medium"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Додати
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <SkeletonHabitItem key={i} />)}
          </div>
        ) : displayHabits.length === 0 ? (
          <EmptyState
            emoji="🌱"
            title="Немає звичок"
            description="Додайте першу звичку"
            action={handleAdd}
            actionLabel="Додати звичку"
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayHabits.map(h => h.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {displayHabits.map(habit => (
                  <SortableHabitRow
                    key={habit.id}
                    habit={habit}
                    streak={streaks[habit.id] || 0}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeHabit && (
                <div className="flex items-center gap-3 bg-white dark:bg-[#232e3c] rounded-xl px-4 py-3 drag-overlay shadow-xl">
                  <span className="text-2xl">{activeHabit.emoji}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{activeHabit.name}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
          Перетягніть рядки для зміни порядку
        </p>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editHabit ? 'Редагувати звичку' : 'Нова звичка'}
      >
        <HabitForm
          initial={editHabit}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteHabit(deleteId)}
        title="Видалити звичку?"
        message="Усі дані цієї звички будуть видалені."
        confirmLabel="Видалити"
        danger
      />
    </div>
  )
}
