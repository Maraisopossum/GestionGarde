import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { createSeed } from '../data/seed'
import {
  derive, isCoordPost, personName, postLabel, postShort, VEHICLE_BY_ID, vehicleIdOf,
} from '../domain/selectors'
import {
  SPECIALITES, type HistoryEntry, type Mission, type Person, type Presence, type ShiftMode,
  type VehicleState, type VehicleStatus,
} from '../domain/types'
import { toast } from './useToasts'

const USER = 'Chef de garde'

interface Data {
  persons: Person[]
  assignments: Record<string, string>
  vehicleStatus: Record<string, VehicleStatus>
  missions: Mission[]
  history: HistoryEntry[]
}

interface GardeState extends Data {
  shift: ShiftMode
  past: Data[]
  place: (personId: string, toPostId: string, fromPostId?: string | null) => void
  unassign: (postId: string) => void
  sortir: (vehicleIds: string[]) => void
  retour: (vehicleIds: string[]) => void
  setVehicleState: (vehicleId: string, state: VehicleState) => void
  setPresence: (personId: string, presence: Presence) => void
  setShift: (shift: ShiftMode) => void
  undo: () => void
  reset: () => void
}

const uid = () => Math.random().toString(36).slice(2, 10)
const entry = (kind: HistoryEntry['kind'], text: string, extra: Partial<HistoryEntry> = {}): HistoryEntry =>
  ({ id: uid(), at: new Date().toISOString(), kind, text, by: USER, ...extra })

const hhmm = (d = new Date()) => d.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })

// localStorage peut être indisponible (navigation privée, stockage bloqué) : on ne casse jamais l'app.
const safeStorage: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  setItem: (k, v) => { try { localStorage.setItem(k, v) } catch { /* ignoré */ } },
  removeItem: (k) => { try { localStorage.removeItem(k) } catch { /* ignoré */ } },
}

export const useGarde = create<GardeState>()(
  persist(
    (set, get) => {
      const snapshot = (): Data => {
        const { persons, assignments, vehicleStatus, missions, history } = get()
        return { persons, assignments, vehicleStatus, missions, history }
      }
      /** Applique une modification en mémorisant l'état précédent (pour « Annuler »). */
      const commit = (patch: Partial<Data>) =>
        set((s) => ({ ...patch, past: [...s.past.slice(-19), snapshot()] }))

      return {
        ...createSeed(),
        shift: 'AUTO',
        past: [],

        place(personId, toPostId, fromPostId = null) {
          const s = get()
          const d = derive(s)
          const person = d.personById[personId]
          if (!person || fromPostId === toPostId) return
          if (d.status[personId].kind === 'EN_MISSION') {
            toast('warning', `${personName(person)} est en mission — déplacement impossible`)
            return
          }
          if (s.vehicleStatus[vehicleIdOf(toPostId)]?.state === 'EN_MISSION') {
            toast('warning', `${VEHICLE_BY_ID[vehicleIdOf(toPostId)].nom} est en mission — équipage verrouillé`)
            return
          }

          const next = { ...s.assignments }
          const toIsCoord = isCoordPost(toPostId)
          let swapSlot: string | null = fromPostId
          if (fromPostId) delete next[fromPostId]
          // Une personne n'occupe qu'un seul poste véhicule : l'ancien est libéré.
          if (!toIsCoord) {
            for (const [pid, who] of Object.entries(s.assignments)) {
              if (who === personId && pid !== toPostId && !isCoordPost(pid)) {
                delete next[pid]
                swapSlot ??= pid
              }
            }
          }
          const displaced = s.assignments[toPostId]
          next[toPostId] = personId

          let h: HistoryEntry
          let msg: string
          if (displaced && displaced !== personId) {
            const other = d.personById[displaced]
            if (swapSlot && d.status[displaced].kind !== 'EN_MISSION') {
              next[swapSlot] = displaced
              msg = `Permutation : ${personName(person)} ⇄ ${personName(other)}`
              h = entry('permutation', `${msg} (${postShort(swapSlot)} / ${postShort(toPostId)})`, { personIds: [personId, displaced] })
            } else {
              msg = `${personName(person)} → ${postLabel(toPostId)} · ${personName(other)} libéré`
              h = entry('affectation', msg, { personIds: [personId, displaced], vehicleId: vehicleIdOf(toPostId) })
            }
          } else if (swapSlot) {
            msg = `${personName(person)} : ${postShort(swapSlot)} → ${postShort(toPostId)}`
            h = entry('deplacement', msg, { personIds: [personId], vehicleId: vehicleIdOf(toPostId) })
          } else {
            msg = `${personName(person)} → ${postLabel(toPostId)}`
            h = entry('affectation', msg, { personIds: [personId], vehicleId: vehicleIdOf(toPostId) })
          }
          commit({ assignments: next, history: [h, ...s.history] })
          toast('success', msg, true)
        },

        unassign(postId) {
          const s = get()
          const pid = s.assignments[postId]
          if (!pid) return
          const person = s.persons.find((p) => p.id === pid)!
          const next = { ...s.assignments }
          delete next[postId]
          const msg = `${personName(person)} retiré de ${postLabel(postId)}`
          commit({ assignments: next, history: [entry('liberation', msg, { personIds: [pid], vehicleId: vehicleIdOf(postId) }), ...s.history] })
          toast('success', msg, true)
        },

        sortir(vehicleIds) {
          const s = get()
          const ids = vehicleIds.filter((id) => s.vehicleStatus[id]?.state !== 'EN_MISSION')
          if (!ids.length) return
          const before = derive(s)
          const now = new Date().toISOString()
          const vehicleStatus = { ...s.vehicleStatus }
          const missions = [...s.missions]
          for (const id of ids) {
            vehicleStatus[id] = { state: 'EN_MISSION', since: now }
            const crew = VEHICLE_BY_ID[id].posts.map((p) => s.assignments[p.id]).filter(Boolean)
            missions.push({ id: uid(), vehicleId: id, start: now, crew })
          }
          const after = derive({ ...s, vehicleStatus })
          const label = groupLabel(ids)
          commit({ vehicleStatus, missions, history: [entry('sortie', `${label} sorti en intervention`, { vehicleId: ids[0] }), ...s.history] })
          toast('mission', `${label} — sorti à ${hhmm()}`, true)
          for (const sp of SPECIALITES) {
            const b = before.specialiteDispo[sp].length
            const a = after.specialiteDispo[sp].length
            if (b > 0 && a === 0) toast('danger', `Dernier ${sp} disponible engagé — plus aucun ${sp} disponible`)
            else if (b > 1 && a === 1) toast('warning', `${sp} : il ne reste qu'un seul spécialiste disponible`)
          }
        },

        retour(vehicleIds) {
          const s = get()
          const ids = vehicleIds.filter((id) => s.vehicleStatus[id]?.state === 'EN_MISSION')
          if (!ids.length) return
          const now = new Date().toISOString()
          const vehicleStatus = { ...s.vehicleStatus }
          for (const id of ids) vehicleStatus[id] = { state: 'DISPONIBLE', since: now }
          const missions = s.missions.map((m) => (ids.includes(m.vehicleId) && !m.end ? { ...m, end: now } : m))
          const label = groupLabel(ids)
          commit({ vehicleStatus, missions, history: [entry('retour', `${label} de retour — disponible`, { vehicleId: ids[0] }), ...s.history] })
          toast('success', `${label} de retour — disponible`, true)
        },

        setVehicleState(vehicleId, state) {
          const s = get()
          if (state === 'EN_MISSION') return get().sortir([vehicleId])
          if (s.vehicleStatus[vehicleId]?.state === 'EN_MISSION' && state === 'DISPONIBLE') return get().retour([vehicleId])
          const now = new Date().toISOString()
          const missions = s.missions.map((m) => (m.vehicleId === vehicleId && !m.end ? { ...m, end: now } : m))
          const v = VEHICLE_BY_ID[vehicleId]
          const msg = `${v.nom} → ${STATE_LABEL[state]}`
          commit({ vehicleStatus: { ...s.vehicleStatus, [vehicleId]: { state, since: now } }, missions, history: [entry('etat', msg, { vehicleId }), ...s.history] })
          toast('success', msg, true)
        },

        setPresence(personId, presence) {
          const s = get()
          const person = s.persons.find((p) => p.id === personId)!
          const persons = s.persons.map((p) => (p.id === personId ? { ...p, presence } : p))
          const assignments = { ...s.assignments }
          const freed: string[] = []
          if (presence !== 'PRESENT')
            for (const [pid, who] of Object.entries(s.assignments)) if (who === personId) { delete assignments[pid]; freed.push(pid) }
          const msg = presence === 'PRESENT'
            ? `${personName(person)} de nouveau présent`
            : `${personName(person)} → ${PRESENCE_TEXT[presence]}${freed.length ? ` · ${freed.length} poste${freed.length > 1 ? 's' : ''} libéré${freed.length > 1 ? 's' : ''}` : ''}`
          commit({ persons, assignments, history: [entry('presence', msg, { personIds: [personId] }), ...s.history] })
          toast('success', msg, true)
        },

        setShift: (shift) => set({ shift }),

        undo() {
          const { past } = get()
          const prev = past[past.length - 1]
          if (!prev) return
          set({ ...prev, past: past.slice(0, -1) })
          toast('info', 'Dernière action annulée')
        },

        reset() {
          const seed = createSeed()
          set({ ...seed, past: [] })
          toast('info', 'Démo réinitialisée avec les données fictives')
        },
      }
    },
    {
      name: 'garde-bxl',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ persons, assignments, vehicleStatus, missions, history, shift }) =>
        ({ persons, assignments, vehicleStatus, missions, history, shift }),
    },
  ),
)

export const STATE_LABEL: Record<VehicleState, string> = {
  DISPONIBLE: 'Disponible', EN_MISSION: 'En mission', RESERVE: 'Réserve', INDISPONIBLE: 'Indisponible',
}
const PRESENCE_TEXT: Record<Presence, string> = {
  PRESENT: 'présent', MALADE: 'malade', FORMATION: 'en formation', CONGE: 'en congé', RECUP: 'en récupération',
}

/** « 2e Départ (VO + P) » quand toute la paire part, sinon le nom du véhicule. */
function groupLabel(ids: string[]): string {
  const vs = ids.map((id) => VEHICLE_BY_ID[id])
  const g = vs[0].groupe
  if (g && vs.length > 1 && vs.every((v) => v.groupe === g)) return `${g} (VO + P)`
  return vs.map((v) => v.nom).join(' + ')
}
