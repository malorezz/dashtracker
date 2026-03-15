import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStats } from '../hooks/useStats'
import ErrorState from '../components/ErrorState'
import { SkeletonCard } from '../components/SkeletonLoader'
import { formatShortDate } from '../lib/utils'

// Heatmap intensity: 0 = empty, 1-3 = light, 4-6 = medium, 7+ = dark
function heatColor(count) {
  if (count === 0) return 'bg-gray-100 dark:bg-white/5'
  if (count <= 2) return 'bg-blue-200 dark:bg-blue-900/60'
  if (count <= 5) return 'bg-blue-400 dark:bg-blue-600'
  return 'bg-blue-600 dark:bg-blue-400'
}

function Heatmap({ data }) {
  // data: [{ date, count }] for 84 days
  // Display as 12 columns (weeks) x 7 rows (days)
  const weeks = []
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7))
  }

  const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

  return (
    <div className="bg-white dark:bg-[#232e3c] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Активність за 12 тижнів</h3>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map(d => (
            <div key={d} className="h-4 w-5 text-[9px] text-gray-400 dark:text-gray-500 flex items-center">{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-1 overflow-x-auto flex-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1 flex-shrink-0">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${day.date}: ${day.count} звичок`}
                  className={`heatmap-cell w-4 h-4 rounded-sm ${heatColor(day.count)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-gray-400">Менше</span>
        {[0, 1, 3, 5, 8].map(n => (
          <div key={n} className={`w-3 h-3 rounded-sm ${heatColor(n)}`} />
        ))}
        <span className="text-[10px] text-gray-400">Більше</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, suffix = '', color = 'text-blue-500 dark:text-blue-400' }) {
  return (
    <div className="bg-white dark:bg-[#232e3c] rounded-xl p-4 flex flex-col gap-1 flex-1">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>
        {value}<span className="text-base font-medium ml-0.5">{suffix}</span>
      </span>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#232e3c] text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        <p>{payload[0].value} дн.</p>
      </div>
    )
  }
  return null
}

export default function Stats({ userId }) {
  const {
    habits,
    loading,
    error,
    rate7,
    rate30,
    streak,
    heatmapData,
    habitBarData,
    refetch,
  } = useStats(userId)

  const [selectedHabitId, setSelectedHabitId] = useState('all')

  const filteredBarData = selectedHabitId === 'all'
    ? habitBarData
    : habitBarData.filter(h => h.id === selectedHabitId)

  if (loading) {
    return (
      <div className="screen-scroll px-4 pt-5 space-y-4">
        <div className="flex gap-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="skeleton h-36 rounded-xl bg-gray-200 dark:bg-white/10" />
        <div className="skeleton h-48 rounded-xl bg-gray-200 dark:bg-white/10" />
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
      <div className="px-4 pt-5 pb-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Статистика</h1>

        {/* Summary cards */}
        <div className="flex gap-3">
          <StatCard label="За 7 днів" value={rate7} suffix="%" />
          <StatCard label="За 30 днів" value={rate30} suffix="%" color="text-purple-500 dark:text-purple-400" />
          <StatCard label="Streak" value={streak} suffix=" 🔥" color="text-orange-500 dark:text-orange-400" />
        </div>

        {/* Heatmap */}
        <Heatmap data={heatmapData} />

        {/* Bar chart */}
        <div className="bg-white dark:bg-[#232e3c] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Виконання за 30 днів</h3>
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setSelectedHabitId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${selectedHabitId === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}
            >
              Всі
            </button>
            {habits.map(h => (
              <button
                key={h.id}
                onClick={() => setSelectedHabitId(h.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${selectedHabitId === h.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}
              >
                {h.emoji} {h.name}
              </button>
            ))}
          </div>

          {filteredBarData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
              Немає даних для відображення
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={filteredBarData} barSize={16} barGap={4}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {filteredBarData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={selectedHabitId === entry.id || selectedHabitId === 'all' ? '#3b82f6' : '#6b7280'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {filteredBarData.map(h => (
                  <div key={h.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-gray-700 dark:text-gray-300 truncate">{h.name}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">{h.count}/30 дн.</span>
                      </div>
                      <div className="h-1 bg-gray-100 dark:bg-white/10 rounded-full">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.round((h.count / 30) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
