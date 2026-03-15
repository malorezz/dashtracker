import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import BottomNav from './components/BottomNav'
import { FullScreenLoader } from './components/LoadingSpinner'
import Today from './screens/Today'
import Goals from './screens/Goals'
import Journal from './screens/Journal'
import Stats from './screens/Stats'
import ManageHabits from './screens/ManageHabits'

function AuthError({ message }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="text-5xl">🔐</div>
      <div>
        <p className="text-gray-900 dark:text-white font-semibold text-lg">Помилка авторизації</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{message}</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium"
      >
        Спробувати ще раз
      </button>
    </div>
  )
}

export default function App() {
  const { userId, loading, error } = useAuth()
  const [activeTab, setActiveTab] = useState('today')
  const [screen, setScreen] = useState('main') // 'main' | 'habits'

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#17212b]">
        <FullScreenLoader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#17212b]">
        <AuthError message={error} />
      </div>
    )
  }

  if (screen === 'habits') {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-[#17212b]">
        <ManageHabits
          userId={userId}
          onBack={() => setScreen('main')}
        />
      </div>
    )
  }

  function renderScreen() {
    switch (activeTab) {
      case 'today':
        return <Today userId={userId} onManageHabits={() => setScreen('habits')} />
      case 'goals':
        return <Goals userId={userId} />
      case 'journal':
        return <Journal userId={userId} />
      case 'stats':
        return <Stats userId={userId} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#17212b]">
      {renderScreen()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
