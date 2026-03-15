import React from 'react'

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }
  return (
    <div className={`${sizes[size]} rounded-full border-blue-500 border-t-transparent animate-spin ${className}`} />
  )
}

export function FullScreenLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}
