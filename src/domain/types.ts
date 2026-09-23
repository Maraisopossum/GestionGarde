export type Grade = 'SP' | 'Cpl' | 'Sgt' | 'Sgt Maj' | 'Adj'

export const GRADE_RANK: Record<Grade, number> = { SP: 0, Cpl: 1, Sgt: 2, 'Sgt Maj': 3, Adj: 4 }

export type Specialite = 'PLONGEUR' | 'HAZMAT' | 'RISC' | 'GRIMP'
export const SPECIALITES: Specialite[] = ['PLONGEUR', 'HAZMAT', 'RISC', 'GRIMP']

/** Qualifications fonctionnelles (hors spécialités) */
export type Fonction = 'CHEF' | 'CHAUFFEUR'

export type Presence = 'PRESENT' | 'MALADE' | 'FORMATION' | 'CONGE' | 'RECUP'

export interface Person {
  id: string
  grade: Grade
  nom: string
  prenom: string
  specialites: Specialite[]
  fonctions: Fonction[]
  presence: Presence
}

export type Requirement =
  | { kind: 'fonction'; value: Fonction }
  | { kind: 'specialite'; value: Specialite }
  | { kind: 'grade'; min: Grade }

export interface Post {
  id: string // `${vehicleId}.${code}`
  code: string
  label: string
  requires?: Requirement[]
}

export type SectionId = 'coordination' | 'incendie' | 'ambulances' | 'techniques'

export interface Vehicle {
  id: string
  nom: string
  court: string // libellé court (mobile, historique)
  section: SectionId
  groupe?: string // ex. « 1er Départ » : VO + autopompe
  specialite?: Specialite
  posts: Post[]
}

export type VehicleState = 'DISPONIBLE' | 'EN_MISSION' | 'RESERVE' | 'INDISPONIBLE'

export interface VehicleStatus {
  state: VehicleState
  since?: string // ISO
}

export type HistoryKind = 'affectation' | 'deplacement' | 'permutation' | 'liberation' | 'sortie' | 'retour' | 'etat' | 'presence' | 'systeme'

export interface HistoryEntry {
  id: string
  at: string // ISO
  kind: HistoryKind
  text: string
  by: string
  personIds?: string[]
  vehicleId?: string
}

export interface Mission {
  id: string
  vehicleId: string
  start: string
  end?: string
  crew: string[]
}

export type ShiftMode = 'AUTO' | 'JOUR' | 'NUIT'

/** Statut dérivé d'une personne à l'instant T */
export type PersonStatusKind = 'EN_MISSION' | 'AFFECTE' | 'LIBRE' | 'ABSENT'

export interface PersonStatus {
  kind: PersonStatusKind
  posts: string[] // tous les postes occupés (véhicules + coordination)
  vehiclePosts: string[] // postes véhicules uniquement
  missionVehicleId?: string
  since?: string
}
