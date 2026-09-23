import { BASE_VEHICLES, VEHICLES } from '../data/seed'
import {
  GRADE_RANK, SPECIALITES,
  type Fonction, type Organisme, type Person, type PersonStatus, type Post, type Requirement, type Specialite, type Vehicle, type VehicleStatus,
} from './types'

/* ----------------------------------------------------------------- Index statique */

export const VEHICLE_BY_ID: Record<string, Vehicle> = {}
export const POST_BY_ID: Record<string, Post> = {}

/** Reconstruit le registre (base + véhicules armés pendant la garde). Appelé par le store à chaque changement. */
export function registerCustomVehicles(custom: Vehicle[]) {
  VEHICLES.length = 0
  VEHICLES.push(...BASE_VEHICLES, ...custom)
  for (const k of Object.keys(VEHICLE_BY_ID)) delete VEHICLE_BY_ID[k]
  for (const k of Object.keys(POST_BY_ID)) delete POST_BY_ID[k]
  for (const v of VEHICLES) {
    VEHICLE_BY_ID[v.id] = v
    for (const p of v.posts) POST_BY_ID[p.id] = p
  }
}
registerCustomVehicles([])

export const ORG_META: Record<Organisme, { label: string; court: string }> = {
  CROIX_ROUGE: { label: 'Croix-Rouge', court: 'CR' },
  PROTECTION_CIVILE: { label: 'Protection civile', court: 'PC' },
  AUTRE_ZONE: { label: 'Renfort autre zone', court: 'RZ' },
  AUTRE: { label: 'Autre renfort', court: 'EXT' },
}

export const vehicleIdOf = (postId: string) => postId.split('.')[0]
export const vehicleOf = (postId: string) => VEHICLE_BY_ID[vehicleIdOf(postId)]
export const isCoordPost = (postId: string) => vehicleOf(postId)?.section === 'coordination'

/** « N°5 (3e Départ P) » ou « Sgt Chf » */
export function postLabel(postId: string): string {
  const v = vehicleOf(postId)
  const p = POST_BY_ID[postId]
  if (!v || !p) return postId
  return v.section === 'coordination' ? v.nom : `${p.label} (${v.nom})`
}
export function postShort(postId: string): string {
  const v = vehicleOf(postId)
  const p = POST_BY_ID[postId]
  if (!v || !p) return postId
  return v.section === 'coordination' ? v.nom : `${v.court} · ${p.label}`
}

// Les renforts externes n'ont pas de grade SIAMU : on affiche le nom et l'initiale du prénom.
export const personName = (p: Person) => (p.organisme ? `${p.nom} ${p.prenom.charAt(0)}.` : `${p.grade} ${p.nom}`)

export const GRADE_INITIALS: Record<Person['grade'], string> = { SP: 'SP', Cpl: 'CP', Sgt: 'SG', 'Sgt Maj': 'SM', Adj: 'AD' }

export const PRESENCE_LABEL: Record<Person['presence'], string> = {
  PRESENT: 'Présent', MALADE: 'Malade', FORMATION: 'En formation', CONGE: 'Congé', RECUP: 'Récupération',
}

/* ----------------------------------------------------------------- Compatibilité */

export function requirementLabel(r: Requirement): string {
  if (r.kind === 'fonction') return r.value === 'CHEF' ? 'qualification Chef' : 'permis / qualification Chauffeur'
  if (r.kind === 'specialite') return `spécialité ${r.value}`
  return `grade ${r.min} minimum`
}

export function meets(person: Person, r: Requirement): boolean {
  if (r.kind === 'fonction') return person.fonctions.includes(r.value)
  if (r.kind === 'specialite') return person.specialites.includes(r.value)
  return GRADE_RANK[person.grade] >= GRADE_RANK[r.min]
}

/** La personne possède-t-elle la spécialité ou la fonction recherchée ? */
export function matchesCap(person: Person, cap: Specialite | Fonction): boolean {
  return cap === 'CHEF' || cap === 'CHAUFFEUR' ? person.fonctions.includes(cap) : person.specialites.includes(cap)
}

export function checkPost(person: Person, postId: string): { ok: boolean; missing: string[] } {
  const post = POST_BY_ID[postId]
  const missing = (post?.requires ?? []).filter((r) => !meets(person, r)).map(requirementLabel)
  return { ok: missing.length === 0, missing }
}

/* ----------------------------------------------------------------- Dérivés dynamiques */

export interface GardeSnapshot {
  persons: Person[]
  assignments: Record<string, string>
  vehicleStatus: Record<string, VehicleStatus>
}

export interface Derived {
  personById: Record<string, Person>
  status: Record<string, PersonStatus>
  specialiteDispo: Record<Specialite, Person[]>
  specialiteTotal: Record<Specialite, Person[]>
  presents: Person[] // personnel SIAMU présent
  disponibles: Person[] // personnel SIAMU disponible (indicateurs)
  affectables: Person[] // disponibles + renforts externes (listes d'affectation)
  externes: Person[]
  enMission: Person[]
  vehiclesOut: Vehicle[]
}

export function derive(s: GardeSnapshot): Derived {
  const personById = Object.fromEntries(s.persons.map((p) => [p.id, p]))
  const postsByPerson: Record<string, string[]> = {}
  for (const [postId, pid] of Object.entries(s.assignments)) {
    if (!POST_BY_ID[postId]) continue
    ;(postsByPerson[pid] ??= []).push(postId)
  }

  const status: Record<string, PersonStatus> = {}
  for (const p of s.persons) {
    const posts = postsByPerson[p.id] ?? []
    const vehiclePosts = posts.filter((x) => !isCoordPost(x))
    const missionPost = vehiclePosts.find((x) => s.vehicleStatus[vehicleIdOf(x)]?.state === 'EN_MISSION')
    if (missionPost) {
      const vid = vehicleIdOf(missionPost)
      status[p.id] = { kind: 'EN_MISSION', posts, vehiclePosts, missionVehicleId: vid, since: s.vehicleStatus[vid].since }
    } else if (p.presence !== 'PRESENT') {
      status[p.id] = { kind: 'ABSENT', posts, vehiclePosts }
    } else {
      status[p.id] = { kind: posts.length ? 'AFFECTE' : 'LIBRE', posts, vehiclePosts }
    }
  }

  const externes = s.persons.filter((p) => p.organisme)
  const presents = s.persons.filter((p) => p.presence === 'PRESENT' && !p.organisme)
  const disponibles = presents.filter((p) => status[p.id].kind !== 'EN_MISSION')
  const affectables = s.persons.filter((p) => p.presence === 'PRESENT' && status[p.id].kind !== 'EN_MISSION')
  const enMission = s.persons.filter((p) => status[p.id].kind === 'EN_MISSION')
  const specialiteDispo = {} as Record<Specialite, Person[]>
  const specialiteTotal = {} as Record<Specialite, Person[]>
  for (const sp of SPECIALITES) {
    specialiteDispo[sp] = disponibles.filter((p) => p.specialites.includes(sp))
    specialiteTotal[sp] = presents.filter((p) => p.specialites.includes(sp))
  }
  const vehiclesOut = VEHICLES.filter((v) => s.vehicleStatus[v.id]?.state === 'EN_MISSION')

  return { personById, status, specialiteDispo, specialiteTotal, presents, disponibles, affectables, externes, enMission, vehiclesOut }
}

/* ----------------------------------------------------------------- Alertes */

export type AlertLevel = 'danger' | 'warning' | 'info'
export interface Alert {
  id: string
  level: AlertLevel
  title: string
  detail?: string
  specialite?: Specialite
  vehicleId?: string
  personId?: string
}

export function computeAlerts(s: GardeSnapshot, d: Derived): Alert[] {
  const alerts: Alert[] = []

  for (const sp of SPECIALITES) {
    const n = d.specialiteDispo[sp].length
    if (n === 0) alerts.push({ id: `sp-${sp}`, level: 'danger', title: `${sp} : 0 disponible`, detail: 'Capacité opérationnelle indisponible', specialite: sp })
    else if (n === 1) alerts.push({ id: `sp-${sp}`, level: 'warning', title: `${sp} : 1 seul disponible`, detail: personName(d.specialiteDispo[sp][0]), specialite: sp })
  }

  for (const p of s.persons) {
    const vp = d.status[p.id].vehiclePosts
    if (vp.length > 1)
      alerts.push({ id: `dbl-${p.id}`, level: 'danger', title: `${personName(p)} affecté deux fois`, detail: vp.map(postShort).join(' + '), personId: p.id })
    if (p.presence !== 'PRESENT' && d.status[p.id].posts.length)
      alerts.push({ id: `abs-${p.id}`, level: 'warning', title: `${personName(p)} absent mais affecté`, detail: PRESENCE_LABEL[p.presence], personId: p.id })
  }

  const nonArmes: Vehicle[] = []
  for (const v of VEHICLES) {
    if (v.section === 'coordination' || s.vehicleStatus[v.id]?.state !== 'DISPONIBLE') continue
    const filled = v.posts.filter((p) => s.assignments[p.id]).length
    if (filled === 0) nonArmes.push(v)
    else if (filled < v.posts.length)
      alerts.push({ id: `inc-${v.id}`, level: 'warning', title: `${v.nom} — équipage incomplet`, detail: `${filled}/${v.posts.length} postes armés`, vehicleId: v.id })
  }
  if (nonArmes.length)
    alerts.push({ id: 'non-armes', level: 'info', title: `${nonArmes.length} véhicule${nonArmes.length > 1 ? 's' : ''} non armé${nonArmes.length > 1 ? 's' : ''}`, detail: nonArmes.map((v) => v.court).join(', ') })

  const order: Record<AlertLevel, number> = { danger: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => order[a.level] - order[b.level])
}
