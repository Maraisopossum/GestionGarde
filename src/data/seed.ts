// Données 100 % fictives — aucun nom ne correspond à un membre réel du personnel.
import type {
  Fonction, Grade, HistoryEntry, Mission, Organisme, Person, Post, Presence, Requirement, SectionId,
  Specialite, Vehicle, VehicleStatus,
} from '../domain/types'

/* ------------------------------------------------------------------ Personnel */

type P = [id: string, grade: Grade, nom: string, prenom: string, spec?: Specialite[], fn?: Fonction[], presence?: Presence]

const C: Fonction[] = ['CHEF']
const D: Fonction[] = ['CHAUFFEUR']
const CD: Fonction[] = ['CHEF', 'CHAUFFEUR']

const PEOPLE: P[] = [
  ['vermeulen', 'Adj', 'Vermeulen', 'Thomas', [], C],
  ['lambert', 'Adj', 'Lambert', 'Olivier', [], C],
  ['maes', 'Adj', 'Maes', 'Raphaël', [], C],
  ['peeters', 'Sgt Maj', 'Peeters', 'Jan', ['RISC'], C],
  ['dubois', 'Sgt Maj', 'Dubois', 'Antoine', ['PLONGEUR'], C],
  ['janssens', 'Sgt Maj', 'Janssens', 'Koen', [], C],
  ['claes', 'Sgt Maj', 'Claes', 'Marc', ['HAZMAT'], C],
  ['wouters', 'Sgt', 'Wouters', 'Lucas', [], CD],
  ['mertens', 'Sgt', 'Mertens', 'Sophie', ['GRIMP'], C],
  ['leclercq', 'Sgt', 'Leclercq', 'Nicolas', ['RISC'], C],
  ['jacobs', 'Sgt', 'Jacobs', 'Pieter', ['HAZMAT'], C],
  ['willems', 'Sgt', 'Willems', 'David', [], CD],
  ['goossens', 'Sgt', 'Goossens', 'Frédéric', ['PLONGEUR'], C],
  ['dumont', 'Sgt', 'Dumont', 'Élodie', [], C],
  ['lambrecht', 'Sgt', 'Lambrecht', 'Filip', [], CD],
  ['dewulf', 'Sgt', 'Dewulf', 'Bart', [], C, 'CONGE'],
  ['renard', 'Cpl', 'Renard', 'Benoît', [], D],
  ['lemaire', 'Cpl', 'Lemaire', 'Cédric', ['HAZMAT'], D],
  ['hermans', 'Cpl', 'Hermans', 'Geert', [], D],
  ['michiels', 'Cpl', 'Michiels', 'Vincent', ['PLONGEUR'], D],
  ['dupuis', 'Cpl', 'Dupuis', 'Yannick', ['GRIMP'], D],
  ['desmet', 'Cpl', 'De Smet', 'Wim', [], D],
  ['laurent', 'Cpl', 'Laurent', 'Hugo', ['RISC'], D],
  ['aerts', 'Cpl', 'Aerts', 'Ilse', [], D],
  ['martens', 'Cpl', 'Martens', 'Quentin', [], D],
  ['simon', 'Cpl', 'Simon', 'Xavier', ['HAZMAT'], D],
  ['vandamme', 'Cpl', 'Van Damme', 'Zeno', [], D],
  ['lejeune', 'Cpl', 'Lejeune', 'Romain', [], D],
  ['gilson', 'Cpl', 'Gilson', 'Olivier', [], D],
  ['hubert', 'Cpl', 'Hubert', 'Cyril', ['HAZMAT'], D],
  ['stevens', 'Cpl', 'Stevens', 'Joris', ['PLONGEUR'], D, 'FORMATION'],
  ['denis', 'SP', 'Denis', 'Maxime', [], []],
  ['fontaine', 'SP', 'Fontaine', 'Julien', [], []],
  ['bosmans', 'SP', 'Bosmans', 'Kevin', [], []],
  ['pauwels', 'SP', 'Pauwels', 'Arne', [], []],
  ['mathieu', 'SP', 'Mathieu', 'Simon', [], D],
  ['lefebvre', 'SP', 'Lefebvre', 'Louis', [], []],
  ['cools', 'SP', 'Cools', 'Dries', [], []],
  ['declercq', 'SP', 'Declercq', 'Tom', [], D],
  ['moreau', 'SP', 'Moreau', 'Clément', [], D],
  ['verhoeven', 'SP', 'Verhoeven', 'Lotte', [], []],
  ['bertrand', 'SP', 'Bertrand', 'Nathan', [], D],
  ['coppens', 'SP', 'Coppens', 'Stijn', [], []],
  ['nicolas', 'SP', 'Nicolas', 'Adrien', [], D],
  ['smets', 'SP', 'Smets', 'Jens', [], []],
  ['wuyts', 'SP', 'Wuyts', 'Robbe', [], D],
  ['collard', 'SP', 'Collard', 'Mathis', [], []],
  ['lenaerts', 'SP', 'Lenaerts', 'Sander', [], D],
  ['baert', 'SP', 'Baert', 'Pieterjan', [], D],
  ['charlier', 'SP', 'Charlier', 'Damien', [], D],
  ['segers', 'SP', 'Segers', 'Ruben', [], []],
  ['renson', 'SP', 'Renson', 'Loïc', [], D],
  ['heylen', 'SP', 'Heylen', 'Wout', [], []],
  ['poncelet', 'SP', 'Poncelet', 'Arnaud', ['PLONGEUR'], []],
  ['wauters', 'SP', 'Wauters', 'Bram', ['GRIMP'], []],
  ['delvaux', 'SP', 'Delvaux', 'Dylan', [], []],
  ['moens', 'SP', 'Moens', 'Emiel', [], D],
  ['gerard', 'SP', 'Gérard', 'Florian', [], [], 'MALADE'],
  ['parmentier', 'SP', 'Parmentier', 'Guillaume', [], D, 'RECUP'],
]

export const seedPersons = (): Person[] =>
  PEOPLE.map(([id, grade, nom, prenom, spec = [], fn = [], presence = 'PRESENT']) => ({
    id, grade, nom, prenom, specialites: spec, fonctions: fn, presence,
  }))

/* ------------------------------------------------------------------ Véhicules */

const R = {
  chef: { kind: 'fonction', value: 'CHEF' } as Requirement,
  chauf: { kind: 'fonction', value: 'CHAUFFEUR' } as Requirement,
  plong: { kind: 'specialite', value: 'PLONGEUR' } as Requirement,
  sgt: { kind: 'grade', min: 'Sgt' } as Requirement,
  cpl: { kind: 'grade', min: 'Cpl' } as Requirement,
  adj: { kind: 'grade', min: 'Adj' } as Requirement,
}

type PostDef = [code: string, label: string, req?: Requirement[]]

function vehicle(
  id: string, nom: string, court: string, section: SectionId, posts: PostDef[],
  extra: Partial<Pick<Vehicle, 'groupe' | 'specialite' | 'code'>> = {},
): Vehicle {
  return {
    id, nom, court, section, ...extra,
    posts: posts.map(([code, label, requires]): Post => ({ id: `${id}.${code}`, code, label, requires })),
  }
}

const CHAUF_CONV: PostDef[] = [['CHAUF', 'Chauf.', [R.chauf]], ['CONV', 'Conv.']]
const AUTOPOMPE: PostDef[] = [
  ['N6', 'N°6', [R.sgt]], ['N5', 'N°5', [R.chauf]], ['N1', 'N°1'], ['N2', 'N°2'], ['N3', 'N°3'], ['N4', 'N°4'],
]
const VO_R: PostDef[] = [['CHAUF', 'Chauf.', [R.chauf]]]
const coord = (id: string, nom: string, req?: Requirement[]) =>
  vehicle(id, nom, nom, 'coordination', [['X', nom, req]])

export const BASE_VEHICLES: Vehicle[] = [
  // Coordination — rangées comme sur le tableau physique
  coord('adj1', 'Adj 1', [R.adj]), coord('adj2', 'Adj 2', [R.adj]), coord('adj3', 'Adj 3', [R.adj]),
  coord('chefat', 'Chef Atelier', [R.sgt]),
  coord('sgtsem', 'Sgt Sem', [R.sgt]), coord('sgtchf', 'Sgt Chf', [R.sgt]), coord('sgtins', 'Sgt INS', [R.sgt]),
  coord('supamu', 'Supervisor AMU', [R.sgt]),
  coord('invins', 'INV + INS VEH'), coord('insphyg', 'Insp Hyg'), coord('fact1', 'Fact 1'), coord('fact2', 'Fact 2'),
  coord('poljour', 'Pol Jour'), coord('polnuit', 'Pol Nuit'), coord('controle', 'Contrôle'), coord('remise', 'Remise'),
  coord('labo1', 'Labo Masque 1'), coord('labo2', 'Labo Masque 2'),

  // Incendie
  // VO R = Voiture Officier « Rouge », véhicule distinct de l'autopompe (Départ P)
  vehicle('vo1', '1e Voiture Officier R', '1e VO R', 'incendie', VO_R, { code: 'VO' }),
  vehicle('vo2', '2e Voiture Officier R', '2e VO R', 'incendie', VO_R, { code: 'VO' }),
  vehicle('vo3', '3e Voiture Officier R', '3e VO R', 'incendie', VO_R, { code: 'VO' }),
  vehicle('p1', '1e Départ P', '1e P', 'incendie', AUTOPOMPE, { code: 'AP' }),
  vehicle('p2', '2e Départ P', '2e P', 'incendie', AUTOPOMPE, { code: 'AP' }),
  vehicle('p3', '3e Départ P', '3e P', 'incendie', AUTOPOMPE, { code: 'AP' }),
  vehicle('ech1', '1e Échelle', '1e Éch.', 'incendie', [['CHEF', 'Chef', [R.cpl]], ['CONV', 'Conv.']], { code: 'AE' }),
  vehicle('ech2', '2e Échelle', '2e Éch.', 'incendie', [['CHEF', 'Chef', [R.cpl]], ['CONV', 'Conv.']], { code: 'AE' }),
  vehicle('ech3', '3e Échelle', '3e Éch.', 'incendie', [['CHEF', 'Chef', [R.cpl]], ['CONV', 'Conv.']], { code: 'AE' }),
  vehicle('ambinc', 'AMB INC', 'AMB INC', 'incendie', CHAUF_CONV),

  // Ambulances
  vehicle('amb1', '1e Ambulance', '1e Amb.', 'ambulances', CHAUF_CONV),
  vehicle('amb2', '2e Ambulance', '2e Amb.', 'ambulances', CHAUF_CONV),
  vehicle('amb3', '3e Ambulance', '3e Amb.', 'ambulances', CHAUF_CONV),
  vehicle('amb4', '4e Ambulance', '4e Amb.', 'ambulances', CHAUF_CONV),
  vehicle('hsp', 'Ambulance HSP', 'Amb. HSP', 'ambulances', CHAUF_CONV),
  vehicle('sch', 'Ambulance SCH', 'Amb. SCH', 'ambulances', CHAUF_CONV),

  // Véhicules techniques
  vehicle('s11', 'Secours S11', 'S11', 'techniques',
    [['CHEF', 'Chef', [R.sgt]], ['CHAUF', 'Chauf.', [R.chauf]], ['CONV', 'Conv.']], { specialite: 'RISC' }),
  vehicle('t13', 'Plongeur T13 / C12', 'T13', 'techniques',
    [['CHAUF', 'Chauf.', [R.chauf]], ['PL1', 'Plong. 1', [R.plong]], ['PL2', 'Plong. 2', [R.plong]], ['ASSIST', 'Assist.']],
    { specialite: 'PLONGEUR' }),
  vehicle('t43', 'Poudre T43 / T6 / T9', 'T43', 'techniques', CHAUF_CONV, { specialite: 'HAZMAT' }),
  vehicle('c61', 'Deconta C61', 'C61', 'techniques', CHAUF_CONV, { specialite: 'HAZMAT' }),
  vehicle('c56', 'Vent C56 / PVID C54', 'C56', 'techniques', CHAUF_CONV),
  vehicle('c34', 'Petit Service C34 / T10', 'C34', 'techniques', CHAUF_CONV),
  vehicle('t20', 'Grue T20 / P1', 'T20', 'techniques', CHAUF_CONV),
]

/**
 * Registre courant des véhicules : base + véhicules armés pendant la garde.
 * Mis à jour en place par `registerCustomVehicles` (domain/selectors) à chaque changement.
 */
export const VEHICLES: Vehicle[] = [...BASE_VEHICLES]

/* --------------------------------------------------------------- Gabarits */

export type VehicleTemplate = 'VO' | 'DEPART' | 'ECHELLE' | 'AMB_INC' | 'AMBULANCE' | 'TECHNIQUE'

export const TEMPLATES: Record<VehicleTemplate, { label: string; section: SectionId; hint: string }> = {
  VO: { label: 'Voiture Officier R (VO)', section: 'incendie', hint: 'Chauf.' },
  DEPART: { label: 'Départ P — autopompe (AP)', section: 'incendie', hint: 'N°6, N°5, N°1 à N°4' },
  ECHELLE: { label: 'Échelle (AE)', section: 'incendie', hint: 'Chef, Conv.' },
  AMB_INC: { label: 'AMB INC', section: 'incendie', hint: 'Chauf., Conv.' },
  AMBULANCE: { label: 'Ambulance', section: 'ambulances', hint: 'Chauf., Conv.' },
  TECHNIQUE: { label: 'Véhicule technique', section: 'techniques', hint: 'Chauf., Conv.' },
}

/** Construit le véhicule d'un gabarit. */
export function buildVehicles(tpl: VehicleTemplate, nom: string, id: string, specialite?: Specialite): Vehicle[] {
  const court = nom.length > 14 ? nom.slice(0, 13) + '…' : nom
  const x = { custom: true }
  switch (tpl) {
    case 'VO': return [{ ...vehicle(id, nom, court, 'incendie', VO_R, { code: 'VO' }), ...x }]
    case 'DEPART': return [{ ...vehicle(id, nom, court, 'incendie', AUTOPOMPE, { code: 'AP' }), ...x }]
    case 'ECHELLE': return [{ ...vehicle(id, nom, court, 'incendie', [['CHEF', 'Chef', [R.cpl]], ['CONV', 'Conv.']], { code: 'AE' }), ...x }]
    case 'AMB_INC': return [{ ...vehicle(id, nom, court, 'incendie', CHAUF_CONV), ...x }]
    case 'AMBULANCE': return [{ ...vehicle(id, nom, court, 'ambulances', CHAUF_CONV), ...x }]
    case 'TECHNIQUE': return [{ ...vehicle(id, nom, court, 'techniques', CHAUF_CONV, { specialite }), ...x }]
  }
}

/* ------------------------------------------------------------ Scénario initial */

const SEED_ASSIGN: Record<string, string> = {
  // Coordination
  'adj1.X': 'vermeulen', 'adj2.X': 'lambert', 'chefat.X': 'peeters', 'sgtsem.X': 'janssens',
  'sgtchf.X': 'dubois', 'sgtins.X': 'claes', 'supamu.X': 'mertens', 'fact1.X': 'jacobs',
  'poljour.X': 'goossens', 'remise.X': 'hermans', 'labo1.X': 'segers',
  // 1er Départ
  'vo1.CHAUF': 'renard',
  'p1.N6': 'vermeulen', 'p1.N5': 'hermans', 'p1.N1': 'denis', 'p1.N2': 'wouters', 'p1.N3': 'michiels', 'p1.N4': 'fontaine',
  // 2e Départ (en mission)
  'vo2.CHAUF': 'aerts',
  'p2.N6': 'lambert', 'p2.N5': 'martens', 'p2.N1': 'simon', 'p2.N2': 'bosmans', 'p2.N3': 'desmet', 'p2.N4': 'pauwels',
  // 3e Départ (incomplet)
  'vo3.CHAUF': 'laurent', 'p3.N5': 'mathieu',
  // Échelles
  'ech1.CHEF': 'lemaire', 'ech1.CONV': 'lefebvre',
  'ech2.CHEF': 'dumont', 'ech2.CONV': 'cools',
  'ambinc.CHAUF': 'declercq', 'ambinc.CONV': 'vandamme',
  // Ambulances
  'amb1.CHAUF': 'moreau', 'amb1.CONV': 'verhoeven',
  'amb2.CHAUF': 'bertrand', 'amb2.CONV': 'coppens',
  'amb3.CHAUF': 'nicolas', 'amb3.CONV': 'lejeune',
  'amb4.CHAUF': 'dupuis', 'amb4.CONV': 'smets',
  // Techniques
  's11.CHEF': 'peeters', 's11.CHAUF': 'wuyts', 's11.CONV': 'leclercq',
  't13.CHAUF': 'lenaerts', 't13.PL1': 'dubois', 't13.PL2': 'goossens', 't13.ASSIST': 'collard',
  't43.CHAUF': 'baert', 't43.CONV': 'jacobs',
  'c56.CHAUF': 'charlier', 'c56.CONV': 'cools', // doublon volontaire (cf. alerte « affecté deux fois »)
  'c34.CHAUF': 'renson', 'c34.CONV': 'willems',
  't20.CHAUF': 'gilson', 't20.CONV': 'heylen',
}

const minutesAgo = (now: Date, m: number) => new Date(now.getTime() - m * 60_000).toISOString()

export interface SeedState {
  indicatifs: Record<string, string>
  customVehicles: Vehicle[]
  vehicleOrg: Record<string, Organisme>
  persons: Person[]
  assignments: Record<string, string>
  vehicleStatus: Record<string, VehicleStatus>
  missions: Mission[]
  history: HistoryEntry[]
}

export function createSeed(now = new Date()): SeedState {
  // Exemple de renfort : une ambulance armée par la Croix-Rouge (équipage externe)
  const customVehicles = buildVehicles('AMBULANCE', 'Ambulance Croix-Rouge 1', 'c-cr1')
  const vehicleOrg: Record<string, Organisme> = { 'c-cr1': 'CROIX_ROUGE' }
  const externes: Person[] = [
    { id: 'x-cr-janssen', grade: 'SP', nom: 'Verbeke', prenom: 'Anna', specialites: [], fonctions: ['CHAUFFEUR'], presence: 'PRESENT', organisme: 'CROIX_ROUGE' },
    { id: 'x-cr-leroy', grade: 'SP', nom: 'Masson', prenom: 'Hugo', specialites: [], fonctions: [], presence: 'PRESENT', organisme: 'CROIX_ROUGE' },
  ]

  const vehicleStatus: Record<string, VehicleStatus> = {}
  for (const v of [...BASE_VEHICLES, ...customVehicles]) vehicleStatus[v.id] = { state: 'DISPONIBLE' }
  const out: Record<string, number> = { t20: 175, amb2: 130, vo2: 87, p2: 87, t13: 42 }
  for (const [id, m] of Object.entries(out)) vehicleStatus[id] = { state: 'EN_MISSION', since: minutesAgo(now, m) }
  vehicleStatus.ech3 = { state: 'RESERVE', since: minutesAgo(now, 200) }
  vehicleStatus.sch = { state: 'INDISPONIBLE', since: minutesAgo(now, 200) }

  const crewOf = (vid: string) =>
    Object.entries(SEED_ASSIGN).filter(([p]) => p.startsWith(vid + '.')).map(([, pid]) => pid)
  const missions: Mission[] = Object.entries(out).map(([vid, m]) => ({
    id: `m-${vid}`, vehicleId: vid, start: minutesAgo(now, m), crew: crewOf(vid),
  }))
  missions.push({ id: 'm-amb1-old', vehicleId: 'amb1', start: minutesAgo(now, 205), end: minutesAgo(now, 150), crew: crewOf('amb1') })

  let n = 0
  const h = (m: number, kind: HistoryEntry['kind'], text: string, by = 'Chef de garde', extra: Partial<HistoryEntry> = {}): HistoryEntry =>
    ({ id: `seed-${n++}`, at: minutesAgo(now, m), kind, text, by, ...extra })

  const history: HistoryEntry[] = [
    h(1, 'affectation', 'Ambulance Croix-Rouge 1 armée en renfort (Croix-Rouge)', 'Chef de garde', { vehicleId: 'c-cr1' }),
    h(3, 'affectation', 'SP Mathieu → N°5 (3e Départ P)', 'Chef de garde', { personIds: ['mathieu'], vehicleId: 'p3' }),
    h(12, 'affectation', 'Sgt Maj Dubois → Sgt Chf', 'Chef de garde', { personIds: ['dubois'] }),
    h(42, 'sortie', 'Plongeur T13 / C12 sorti en intervention', 'CTA', { vehicleId: 't13' }),
    h(87, 'sortie', '2e Départ P sorti en intervention', 'CTA', { vehicleId: 'p2' }),
    h(87, 'sortie', '2e Voiture Officier R sortie en intervention', 'CTA', { vehicleId: 'vo2' }),
    h(110, 'affectation', 'Cpl Van Damme → Conv. (AMB INC)', 'Chef de garde', { personIds: ['vandamme'], vehicleId: 'ambinc' }),
    h(130, 'sortie', '2e Ambulance sortie en intervention', 'CTA', { vehicleId: 'amb2' }),
    h(150, 'retour', '1e Ambulance de retour — disponible', 'CTA', { vehicleId: 'amb1' }),
    h(175, 'sortie', 'Grue T20 / P1 sortie en intervention', 'CTA', { vehicleId: 't20' }),
    h(200, 'etat', 'Ambulance SCH → Indisponible (entretien)', 'Chef de garde', { vehicleId: 'sch' }),
    h(200, 'etat', '3e Échelle → Réserve', 'Chef de garde', { vehicleId: 'ech3' }),
    h(205, 'sortie', '1e Ambulance sortie en intervention', 'CTA', { vehicleId: 'amb1' }),
    h(215, 'systeme', 'Prise de garde — tableau initialisé', 'Système'),
  ]

  return {
    // Indicatifs fictifs — modifiables directement sur les cartes
    indicatifs: { p1: '11', p2: '12', p3: '13', ech1: '31', ech2: '32', ech3: '33', vo1: '01', vo2: '02', vo3: '03' },
    customVehicles,
    vehicleOrg,
    persons: [...seedPersons(), ...externes],
    assignments: { ...SEED_ASSIGN, 'c-cr1.CHAUF': 'x-cr-janssen', 'c-cr1.CONV': 'x-cr-leroy' },
    vehicleStatus,
    missions,
    history,
  }
}
