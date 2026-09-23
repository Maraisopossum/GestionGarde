import { create } from 'zustand'
import type { Specialite } from '../domain/types'

export type StatusFilter = 'DISPO' | 'LIBRE' | 'MISSION' | 'TOUS'
export type CapFilter = Specialite | 'CHEF' | 'CHAUFFEUR' | null

// Préférences d'affichage par navigateur (menu déplié, historique ouvert)
const pref = (k: string, dflt: boolean) => { try { const v = localStorage.getItem(k); return v === null ? dflt : v === '1' } catch { return dflt } }
const savePref = (k: string, v: boolean) => { try { localStorage.setItem(k, v ? '1' : '0') } catch { /* ignoré */ } }

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
  sidebarOpen: boolean
  historyOpen: boolean
  rightOpen: boolean
  toggleRight: () => void
  toggleSidebar: () => void
  toggleHistory: () => void
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
  sidebarOpen: pref('garde-ui-sidebar', false),
  historyOpen: pref('garde-ui-history', false),
  rightOpen: pref('garde-ui-right', false),
  toggleRight: () => set((s) => { savePref('garde-ui-right', !s.rightOpen); return { rightOpen: !s.rightOpen } }),
  toggleSidebar: () => set((s) => { savePref('garde-ui-sidebar', !s.sidebarOpen); return { sidebarOpen: !s.sidebarOpen } }),
  toggleHistory: () => set((s) => { savePref('garde-ui-history', !s.historyOpen); return { historyOpen: !s.historyOpen } }),
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
