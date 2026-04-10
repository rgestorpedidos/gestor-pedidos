import { create } from 'zustand'

interface LoadingStore {
  activeTasks: number
  startLoading: () => void
  stopLoading: () => void
  isLoading: () => boolean
}

export const useLoadingStore = create<LoadingStore>((set, get) => ({
  activeTasks: 0,
  startLoading: () => set((state) => ({ activeTasks: state.activeTasks + 1 })),
  stopLoading: () => set((state) => ({ activeTasks: Math.max(0, state.activeTasks - 1) })),
  isLoading: () => get().activeTasks > 0,
}))
