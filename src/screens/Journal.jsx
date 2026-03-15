import React, { useState, useEffect } from 'react'
import { useJournal } from '../hooks/useJournal'
import ErrorState from '../components/ErrorState'
import { formatDisplayDate, formatShortDate } from '../lib/utils'
import { showBackButton, hideBackButton } from '../lib/telegram'

function HistoryView({ history, onBack, onSelectEntry }) {
  useEffect(() => {
    showBackButton(onBack)
    return () => hideBackButton()
  }, [onBack])

  if (history.length === 0) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
          <span className="text-5xl">📖</span>
          <p className="text-gray-900 dark:text-white font-semibold">Немає попередніх записів</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Починайте писати щодня!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-scroll">
      <div className="px-4 pt-5 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Історія записів</h2>
        <div className="space-y-2">
          {history.map(entry => (
            <button
              key={entry.date}
              onClick={() => onSelectEntry(entry)}
              className="w-full text-left bg-white dark:bg-[#232e3c] rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDisplayDate(entry.date)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{entry.content}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400 flex-shrink-0">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function EntryView({ entry, onBack }) {
  useEffect(() => {
    showBackButton(onBack)
    return () => hideBackButton()
  }, [onBack])

  return (
    <div className="screen-scroll">
      <div className="px-4 pt-5 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{formatDisplayDate(entry.date)}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Запис журналу</p>
        <div className="bg-white dark:bg-[#232e3c] rounded-xl p-4">
          <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
            {entry.content || <span className="text-gray-400 italic">Порожній запис</span>}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Journal({ userId }) {
  const { content, history, loading, saving, error, handleChange, fetchHistory, refetch } = useJournal(userId)
  const [view, setView] = useState('today') // 'today' | 'history' | 'entry'
  const [selectedEntry, setSelectedEntry] = useState(null)

  async function handleShowHistory() {
    await fetchHistory()
    setView('history')
  }

  if (view === 'history') {
    return (
      <HistoryView
        history={history}
        onBack={() => setView('today')}
        onSelectEntry={(entry) => { setSelectedEntry(entry); setView('entry') }}
      />
    )
  }

  if (view === 'entry' && selectedEntry) {
    return (
      <EntryView
        entry={selectedEntry}
        onBack={() => setView('history')}
      />
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
    <div className="screen-scroll flex flex-col">
      <div className="px-4 pt-5 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Журнал</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">Зберігається...</span>
            )}
            {!saving && content && (
              <span className="text-xs text-green-500 dark:text-green-400">Збережено ✓</span>
            )}
            <button
              onClick={handleShowHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-sm text-gray-600 dark:text-gray-300 font-medium"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
              Історія
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 skeleton rounded-2xl bg-gray-200 dark:bg-white/10" />
        ) : (
          <textarea
            value={content}
            onChange={e => handleChange(e.target.value)}
            placeholder="Що сьогодні сталось? Думки, ідеї, нотатки..."
            className="flex-1 w-full p-4 rounded-2xl bg-white dark:bg-[#232e3c] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed resize-none"
          />
        )}

        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
          Автозбереження увімкнено
        </p>
      </div>
    </div>
  )
}
