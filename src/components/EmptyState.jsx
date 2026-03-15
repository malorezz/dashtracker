import React from 'react'

export default function EmptyState({ emoji = '📭', title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
      <div className="text-5xl">{emoji}</div>
      <div>
        {title && <p className="text-gray-900 dark:text-white font-semibold text-base">{title}</p>}
        {description && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{description}</p>}
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
