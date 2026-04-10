'use client'

import { useEffect, useState } from 'react'
import { useLoadingStore } from '@/stores/loading-store'
import { cn } from '@/lib/utils'

export function LoadingBar() {
  const isLoading = useLoadingStore((state) => state.activeTasks > 0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setVisible(true)
    } else {
      const timeout = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [isLoading])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] w-full bg-background overflow-hidden">
      <div 
        className={cn(
          "h-full bg-primary transition-all duration-300 ease-out",
          isLoading ? "w-full animate-loading-progress" : "w-full opacity-0"
        )}
      />
    </div>
  )
}
