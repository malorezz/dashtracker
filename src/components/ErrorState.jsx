import React from 'react'

export default function ErrorState({ message = 'Щось пішло не так', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
      <div className="text-4xl">⚠️</div>
      <div>
        <p className="text-gray-900 dark:text-white font-medium">Помилка</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Спробувати ще раз
        </button>
      )}
    </div>
  )
}
