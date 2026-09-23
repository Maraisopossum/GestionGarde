import { useEffect, useState } from 'react'
import type { ShiftMode } from '../domain/types'

export function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export const fmtTime = (iso?: string | Date) =>
  iso ? new Date(iso).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' }) : ''

export const fmtDate = (d: Date) => {
  const s = d.toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function fmtDuration(fromIso: string, to: Date | string = new Date()) {
  const min = Math.max(0, Math.round((new Date(to).getTime() - new Date(fromIso).getTime()) / 60_000))
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
}

export function currentShift(mode: ShiftMode, now: Date): { kind: 'JOUR' | 'NUIT'; label: string } {
  const h = now.getHours()
  const kind = mode === 'AUTO' ? (h >= 7 && h < 19 ? 'JOUR' : 'NUIT') : mode
  return kind === 'JOUR' ? { kind, label: 'Jour · 07h00 – 19h00' } : { kind, label: 'Nuit · 19h00 – 07h00' }
}
