import { create } from 'zustand'
import type { Specialite } from '../domain/types'

export type StatusFilter = 'DISPO' | 'LIBRE' | 'MISSION' | 'TOUS'
export type CapFilter = Specialite | 'CHEF' | 'CHAUFFEUR' | null

export interface ConfirmRequest {
  title: string
  body?: string
  confirmLabel: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
}

interface UIState {
  picker: { postId: string; rect: DOMRect } | null
  sheetPersonId: string | null
  drawerOpen: boolean
  statusFilter: StatusFilter
  capFilter: CapFilter
  search: string
  confirm: ConfirmRequest | null
  flashVehicleId: string | null
  openPicker: (postId: string, el: HTMLElement) => void
  closePicker: () => void
  openSheet: (personId: string | null) => void
  setDrawer: (open: boolean) => void
  setStatusFilter: (f: StatusFilter) => void
  setCapFilter: (f: CapFilter) => void
  setSearch: (s: string) => void
  ask: (c: ConfirmRequest | null) => void
  flashVehicle: (id: string) => void
}

export const useUI = create<UIState>()((set) => ({
  picker: null,
  sheetPersonId: null,
  drawerOpen: false,
  statusFilter: 'DISPO',
  capFilter: null,
  search: '',
  confirm: null,
  flashVehicleId: null,
  openPicker: (postId, el) => set({ picker: { postId, rect: el.getBoundingClientRect() } }),
  closePicker: () => set({ picker: null }),
  openSheet: (sheetPersonId) => set({ sheetPersonId, picker: null }),
  setDrawer: (drawerOpen) => set({ drawerOpen }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setCapFilter: (capFilter) => set({ capFilter }),
  setSearch: (search) => set({ search }),
  ask: (confirm) => set({ confirm }),
  flashVehicle(id) {
    set({ flashVehicleId: id })
    document.getElementById(`veh-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => set((s) => (s.flashVehicleId === id ? { flashVehicleId: null } : s)), 1800)
  },
}))
