import React, { useState } from 'react'
import { useGoals } from '../hooks/useGoals'
import { SkeletonGoalItem } from '../components/SkeletonLoader'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatDeadline, formatDisplayDate, CATEGORIES } from '../lib/utils'
import { hapticFeedback, hapticNotification } from '../lib/telegram'

const CATEGORY_COLORS = {
  'WU Wien': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  'Стартап': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'Особисте': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  'Інше': 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300',
}

const CATEGORY_EMOJIS = {
  'WU Wien': '🎓',
  'Стартап': '🚀',
  'Особисте': '🌿',
  'Інше': '📌',
}

function GoalForm({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0])
  const [deadline, setDeadline] = useState(initial?.deadline || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { setErr('Назва не може бути порожньою'); return }
    setSaving(true)
    setErr('')
    try {
      await onSave({ title: title.trim(), description: description.trim(), category, deadline: deadline || null })
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Назва *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Наприклад: Здати іспит з економіки"
          className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Опис</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Детальний опис цілі..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Категорія</label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`py-2.5 px-3 rounded-xl text-sm font-medium text-left transition-all
                ${category === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                }`}
            >
              {CATEGORY_EMOJIS[cat]} {cat}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Дедлайн</label>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      {err && <p className="text-red-500 text-sm">{err}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
      >
        {saving ? 'Збереження...' : (initial ? 'Зберегти зміни' : 'Додати ціль')}
      </button>
    </form>
  )
}

function GoalCard({ goal, onComplete, onUncomplete, onEdit, onDelete }) {
  const deadline = goal.deadline ? formatDeadline(goal.deadline) : null
  const daysLeft = goal.deadline ? (() => {
    const d = new Date(goal.deadline + 'T00:00:00')
    const now = new Date(); now.setHours(0,0,0,0)
    return Math.round((d - now) / (1000*60*60*24))
  })() : null
  const isOverdue = daysLeft !== null && daysLeft < 0 && !goal.completed

  return (
    <div className={`bg-white dark:bg-[#232e3c] rounded-xl p-4 border-l-4 transition-all
      ${goal.completed ? 'border-green-400 opacity-70' : isOverdue ? 'border-red-400' : 'border-blue-400'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[goal.category] || CATEGORY_COLORS['Інше']}`}>
              {CATEGORY_EMOJIS[goal.category]} {goal.category}
            </span>
            {goal.completed && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                ✅ Виконано
              </span>
            )}
          </div>
          <h3 className={`font-semibold text-gray-900 dark:text-white text-sm leading-tight
            ${goal.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{goal.description}</p>
          )}
          {deadline && (
            <p className={`text-xs mt-1.5 font-medium
              ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
              📅 {deadline}
            </p>
          )}
          {goal.completed && goal.completed_at && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Виконано {formatDisplayDate(goal.completed_at.split('T')[0])}
            </p>
          )}
        </div>
        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {!goal.completed ? (
            <>
              <button
                onClick={() => { hapticNotification('success'); onComplete(goal.id) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                title="Позначити як виконану"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={() => onEdit(goal)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                title="Редагувати"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={() => onUncomplete(goal.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
              title="Відновити"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          )}
          <button
            onClick={() => onDelete(goal.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500"
            title="Видалити"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Goals({ userId }) {
  const { activeGoals, completedGoals, loading, error, addGoal, updateGoal, completeGoal, uncompleteGoal, deleteGoal, refetch } = useGoals(userId)
  const [modalOpen, setModalOpen] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)

  if (loading) {
    return (
      <div className="screen-scroll px-4 pt-5 space-y-3">
        <div className="skeleton h-7 w-40 rounded-lg bg-gray-200 dark:bg-white/10 mb-2" />
        {[...Array(3)].map((_, i) => <SkeletonGoalItem key={i} />)}
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

  function handleEdit(goal) {
    setEditGoal(goal)
    setModalOpen(true)
  }

  function handleAdd() {
    setEditGoal(null)
    setModalOpen(true)
  }

  async function handleSave(data) {
    if (editGoal) {
      await updateGoal(editGoal.id, data)
    } else {
      await addGoal(data)
    }
  }

  return (
    <div className="screen-scroll">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Цілі</h1>
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

        {/* Active goals */}
        {activeGoals.length === 0 ? (
          <EmptyState
            emoji="🎯"
            title="Немає активних цілей"
            description="Додайте свою першу ціль"
            action={handleAdd}
            actionLabel="Додати ціль"
          />
        ) : (
          <div className="space-y-3">
            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onComplete={completeGoal}
                onUncomplete={uncompleteGoal}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        )}

        {/* Completed goals */}
        {completedGoals.length > 0 && (
          <div className="mt-5">
            <button
              onClick={() => setShowCompleted(v => !v)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-3"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              Виконані ({completedGoals.length})
            </button>
            {showCompleted && (
              <div className="space-y-3">
                {completedGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onComplete={completeGoal}
                    onUncomplete={uncompleteGoal}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editGoal ? 'Редагувати ціль' : 'Нова ціль'}
      >
        <GoalForm
          initial={editGoal}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteGoal(deleteId)}
        title="Видалити ціль?"
        message="Цю дію не можна скасувати."
        confirmLabel="Видалити"
        danger
      />
    </div>
  )
}
