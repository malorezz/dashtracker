import React from 'react'

export function SkeletonLine({ className = '' }) {
  return (
    <div className={`skeleton rounded-lg h-4 bg-gray-200 dark:bg-white/10 ${className}`} />
  )
}

export function SkeletonHabitItem() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#232e3c] rounded-xl">
      <div className="skeleton w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
      <div className="skeleton w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="w-3/4" />
        <SkeletonLine className="w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonGoalItem() {
  return (
    <div className="bg-white dark:bg-[#232e3c] rounded-xl p-4 space-y-2">
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-1/3" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#232e3c] rounded-xl p-4 flex-1 space-y-2">
      <SkeletonLine className="w-1/2" />
      <SkeletonLine className="w-1/3 h-8" />
    </div>
  )
}
