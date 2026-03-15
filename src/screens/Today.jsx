import React, { useState, useCallback } from 'react'
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
import { SkeletonHabitItem } from '../components/SkeletonLoader'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import { hapticFeedback } from '../lib/telegram'

function ProgressBar({ completed, total }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Виконано сьогодні
        </span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {completed}/{total}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {total > 0 && pct === 100 && (
        <p className="text-center text-xs text-green-500 dark:text-green-400 mt-2 font-medium">
          Всі звички виконано! 🎉
        </p>
      )}
    </div>
  )
}

function HabitCheckbox({ completed, onToggle, animate }) {
  return (
    <button
      onClick={onToggle}
      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
        ${animate ? 'check-pop' : ''}
        ${completed
          ? 'bg-blue-500 border-blue-500'
          : 'border-gray-300 dark:border-gray-600 bg-transparent'
        }`}
    >
      {completed && (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3.5 h-3.5">
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}

function SortableHabitItem({ habit, completed, onToggle }) {
  const [animating, setAnimating] = useState(false)
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

  function handleToggle() {
    setAnimating(true)
    setTimeout(() => setAnimating(false), 200)
    hapticFeedback(completed ? 'light' : 'medium')
    onToggle(habit.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#232e3c] rounded-xl"
    >
      <HabitCheckbox
        completed={completed}
        onToggle={handleToggle}
        animate={animating}
      />
      <span className="text-2xl select-none">{habit.emoji || '✨'}</span>
      <span className={`flex-1 text-base font-medium transition-colors
        ${completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
        {habit.name}
      </span>
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 text-gray-300 dark:text-gray-600 touch-none cursor-grab active:cursor-grabbing"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </button>
    </div>
  )
}

function DragOverlayItem({ habit, completed }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#232e3c] rounded-xl drag-overlay shadow-xl">
      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0
        ${completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
        {completed && (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3.5 h-3.5">
            <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className="text-2xl select-none">{habit.emoji || '✨'}</span>
      <span className="flex-1 text-base font-medium text-gray-900 dark:text-white">{habit.name}</span>
    </div>
  )
}

export default function Today({ userId, onManageHabits }) {
  const {
    todayHabits,
    logs,
    loading,
    error,
    completedCount,
    totalCount,
    toggleHabit,
    reorderHabits,
    refetch,
  } = useHabits(userId)

  const [activeId, setActiveId] = useState(null)
  const [localHabits, setLocalHabits] = useState(null)

  const displayHabits = localHabits || todayHabits

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragStart = useCallback(({ active }) => {
    setActiveId(active.id)
    setLocalHabits(todayHabits)
    hapticFeedback('medium')
  }, [todayHabits])

  const handleDragOver = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return
    setLocalHabits(prev => {
      const items = prev || todayHabits
      const oldIndex = items.findIndex(h => h.id === active.id)
      const newIndex = items.findIndex(h => h.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }, [todayHabits])

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) {
      setLocalHabits(null)
      return
    }
    const final = localHabits || todayHabits
    reorderHabits(final)
    setLocalHabits(null)
  }, [localHabits, todayHabits, reorderHabits])

  const activeHabit = activeId ? displayHabits.find(h => h.id === activeId) : null

  if (loading) {
    return (
      <div className="screen-scroll">
        <div className="px-4 pt-5 pb-3">
          <div className="skeleton h-2 rounded-full bg-gray-200 dark:bg-white/10 w-full" />
        </div>
        <div className="px-4 space-y-2">
          {[...Array(5)].map((_, i) => <SkeletonHabitItem key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="screen-scroll">
      {/* Header */}
      <div className="px-4 pt-5 pb-1">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Сьогодні</h1>
          <button
            onClick={onManageHabits}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-sm text-gray-600 dark:text-gray-300 font-medium"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93A10 10 0 0 0 12 2a10 10 0 0 0-7.07 2.93M4.93 19.07A10 10 0 0 0 12 22a10 10 0 0 0 7.07-2.93"/>
            </svg>
            Звички
          </button>
        </div>
        <ProgressBar completed={completedCount} total={totalCount} />
      </div>

      {/* Habit list */}
      {displayHabits.length === 0 ? (
        <EmptyState
          emoji="🌱"
          title="Немає звичок на сьогодні"
          description="Додайте звички, щоб почати відстежувати прогрес"
          action={onManageHabits}
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
            <div className="px-4 pb-4 space-y-2">
              {displayHabits.map(habit => (
                <SortableHabitItem
                  key={habit.id}
                  habit={habit}
                  completed={!!logs[habit.id]}
                  onToggle={toggleHabit}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeHabit && (
              <DragOverlayItem
                habit={activeHabit}
                completed={!!logs[activeHabit.id]}
              />
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
