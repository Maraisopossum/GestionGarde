import { create } from 'zustand'

export type ToastLevel = 'success' | 'info' | 'warning' | 'danger' | 'mission'
export interface Toast { id: number; level: ToastLevel; text: string; undoable: boolean }

interface ToastState {
  toasts: Toast[]
  push: (level: ToastLevel, text: string, undoable?: boolean) => void
  dismiss: (id: number) => void
}

let seq = 0
export const useToasts = create<ToastState>()((set) => ({
  toasts: [],
  push(level, text, undoable = false) {
    const id = ++seq
    // Une seule action annulable affichée à la fois : la plus récente.
    set((s) => ({ toasts: [...s.toasts.filter((t) => !(undoable && t.undoable)).slice(-3), { id, level, text, undoable }] }))
    const ttl = level === 'danger' ? 9000 : level === 'warning' ? 7000 : 5000
    setTimeout(() => useToasts.getState().dismiss(id), ttl)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = (level: ToastLevel, text: string, undoable = false) => useToasts.getState().push(level, text, undoable)
