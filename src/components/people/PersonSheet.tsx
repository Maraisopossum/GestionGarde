import clsx from 'clsx'
import { ChevronDown, Siren, UserMinus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { VEHICLES } from '../../data/seed'
import { checkPost, postLabel, POST_BY_ID, PRESENCE_LABEL, VEHICLE_BY_ID, vehicleIdOf } from '../../domain/selectors'
import type { Person, Presence } from '../../domain/types'
import { fmtDuration, fmtTime, useNow } from '../../lib/time'
import { useIsMobile } from '../../lib/useMedia'
import { useDerived } from '../../store/useDerived'
import { useGarde } from '../../store/useGarde'
import { useUI } from '../../store/useUI'
import { useAssign } from '../board/PostPicker'
import { Avatar, SpecBadge } from '../ui/badges'

const PRESENCES: Presence[] = ['PRESENT', 'MALADE', 'FORMATION', 'CONGE', 'RECUP']

/** Phrase qui explique le statut : « pourquoi disponible / indisponible ». */
function Explanation({ person }: { person: Person }) {
  const d = useDerived()
  const now = useNow(30_000)
  const st = d.status[person.id]
  if (st.kind === 'EN_MISSION') {
    const v = VEHICLE_BY_ID[st.missionVehicleId!]
    return (
      <div className="rounded-lg border border-mission/25 bg-mission-soft px-3 py-2.5">
        <p className="flex items-center gap-2 font-display text-[18px] font-bold tracking-wide text-mission uppercase"><Siren className="size-5" /> En mission</p>
        <p className="mt-0.5 text-[13px] text-slate-700">
          Sur <b>{v.nom}</b> depuis {fmtTime(st.since)} ({fmtDuration(st.since!, now)}). Indisponible jusqu’au retour du véhicule.
        </p>
      </div>
    )
  }
  if (st.kind === 'ABSENT')
    return (
      <div className="rounded-lg border border-line bg-slate-50 px-3 py-2.5">
        <p className="font-display text-[18px] font-bold tracking-wide text-slate-600 uppercase">Absent — {PRESENCE_LABEL[person.presence]}</p>
        <p className="mt-0.5 text-[13px] text-slate-600">Non comptabilisé dans le personnel disponible ni dans les spécialistes.</p>
      </div>
    )
  return (
    <div className="rounded-lg border border-ok/25 bg-ok-soft px-3 py-2.5">
      <p className="font-display text-[18px] font-bold tracking-wide text-ok uppercase">Disponible</p>
      <p className="mt-0.5 text-[13px] text-slate-700">
        {st.kind === 'LIBRE' ? 'Présent à la caserne, sans poste attribué — peut être affecté immédiatement.' : 'Présent à la caserne, affecté à un véhicule disponible.'}
      </p>
    </div>
  )
}

function PostChooser({ person }: { person: Person }) {
  const assignments = useGarde((s) => s.assignments)
  const vehicleStatus = useGarde((s) => s.vehicleStatus)
  const assign = useAssign()
  const [open, setOpen] = useState(false)
  const free = useMemo(() =>
    VEHICLES.filter((v) => vehicleStatus[v.id]?.state !== 'EN_MISSION')
      .flatMap((v) => v.posts)
      .filter((p) => !assignments[p.id])
      .map((p) => ({ p, ok: checkPost(person, p.id).ok }))
      .sort((a, b) => Number(b.ok) - Number(a.ok)),
  [assignments, vehicleStatus, person])
  return (
    <div className="rounded-lg border border-line">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex h-10 w-full items-center gap-2 px-3 text-[13px] font-semibold text-ink">
        Affecter à un poste libre <span className="text-slate-400">({free.filter((f) => f.ok).length} compatibles)</span>
        <ChevronDown className={clsx('ml-auto size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="scroll-thin max-h-64 overflow-y-auto border-t border-line py-1">
          {free.map(({ p, ok }) => (
            <li key={p.id}>
              <button type="button" onClick={() => assign(person, p.id)} className={clsx('flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-slate-50', !ok && 'text-slate-400')}>
                <span className="font-medium">{postLabel(p.id)}</span>
                {!ok && <span className="ml-auto text-[11px] text-reserve">non qualifié</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SheetBody({ person, onClose }: { person: Person; onClose: () => void }) {
  const d = useDerived()
  const history = useGarde((s) => s.history)
  const unassign = useGarde((s) => s.unassign)
  const setPresence = useGarde((s) => s.setPresence)
  const flashVehicle = useUI((s) => s.flashVehicle)
  const st = d.status[person.id]
  const mine = history.filter((h) => h.personIds?.includes(person.id) || (h.vehicleId && st.vehiclePosts.some((p) => vehicleIdOf(p) === h.vehicleId) && h.kind === 'sortie')).slice(0, 8)

  // Fonctions que la personne peut tenir, déduites des qualifications
  const roles = useMemo(() => {
    const postes = new Set<string>()
    const coord = new Set<string>()
    for (const v of VEHICLES) for (const p of v.posts) {
      if (!p.requires?.length || !checkPost(person, p.id).ok) continue
      if (v.section === 'coordination') coord.add(v.nom)
      else postes.add(p.label === 'Chauf.' ? 'Chauffeur' : p.label)
    }
    return { postes: [...postes], coord: [...coord] }
  }, [person])

  return (
    <>
      <header className="flex items-start gap-3 border-b border-line p-4">
        <Avatar person={person} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold tracking-wider text-slate-500 uppercase">{person.grade}</p>
          <h2 className="truncate font-display text-[26px] leading-tight font-bold tracking-wide text-ink uppercase">{person.nom}</h2>
          <p className="text-[13px] text-slate-600">{person.prenom}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer" className="grid size-9 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X className="size-5" />
        </button>
      </header>

      <div className="scroll-thin min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <Explanation person={person} />

        <section>
          <h3 className="mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Affectation actuelle</h3>
          {st.posts.length === 0 ? <p className="text-[13px] text-slate-500">Aucun poste.</p> : (
            <ul className="space-y-1.5">
              {st.posts.map((pid) => {
                const v = VEHICLE_BY_ID[vehicleIdOf(pid)]
                const locked = st.kind === 'EN_MISSION' && st.missionVehicleId === v.id
                return (
                  <li key={pid} className="flex items-center gap-2 rounded-md border border-line px-3 py-2">
                    <button type="button" onClick={() => { onClose(); flashVehicle(v.id) }} className="min-w-0 flex-1 text-left">
                      <span className="block text-[13.5px] font-semibold text-ink">{v.section === 'coordination' ? v.nom : POST_BY_ID[pid].label}</span>
                      <span className="block text-[12px] text-slate-500">{v.section === 'coordination' ? 'Coordination' : v.nom}</span>
                    </button>
                    {!locked && (
                      <button type="button" onClick={() => unassign(pid)} className="flex h-8 items-center gap-1 rounded px-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                        <UserMinus className="size-4" /> Retirer
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {st.kind !== 'EN_MISSION' && st.kind !== 'ABSENT' && <div className="mt-2"><PostChooser person={person} /></div>}
        </section>

        <section>
          <h3 className="mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Spécialités</h3>
          {person.specialites.length ? <div className="flex flex-wrap gap-1.5">{person.specialites.map((s) => <SpecBadge key={s} sp={s} className="h-6 text-[11.5px]" />)}</div> : <p className="text-[13px] text-slate-500">Aucune spécialité.</p>}
        </section>

        <section>
          <h3 className="mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Fonctions possibles</h3>
          <div className="flex flex-wrap gap-1.5">
            {roles.postes.map((r) => <span key={r} className="rounded bg-slate-100 px-2 py-1 text-[12px] font-semibold text-slate-700">{r}</span>)}
            <span className="rounded px-1 py-1 text-[12px] text-slate-500">+ tous les postes sans qualification</span>
          </div>
          {roles.coord.length > 0 && (
            <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
              <span className="font-semibold text-slate-600">Coordination :</span> {roles.coord.join(' · ')}
            </p>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Présence</h3>
          <div className="flex flex-wrap gap-1.5">
            {PRESENCES.map((p) => (
              <button
                key={p}
                type="button"
                disabled={st.kind === 'EN_MISSION'}
                onClick={() => setPresence(person.id, p)}
                className={clsx('h-8 rounded-md border px-2.5 text-[12px] font-semibold disabled:opacity-40', person.presence === p ? 'border-ink bg-ink text-white' : 'border-line text-slate-600 hover:bg-slate-50')}
              >
                {PRESENCE_LABEL[p]}
              </button>
            ))}
          </div>
          {person.presence === 'PRESENT' && st.posts.length > 0 && st.kind !== 'EN_MISSION' && <p className="mt-1.5 text-[11.5px] text-slate-500">Marquer absent libère automatiquement ses postes.</p>}
        </section>

        <section>
          <h3 className="mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Historique récent</h3>
          {mine.length === 0 ? <p className="text-[13px] text-slate-500">Aucun mouvement pendant cette garde.</p> : (
            <ol className="space-y-2 border-l-2 border-line pl-3">
              {mine.map((h) => (
                <li key={h.id} className="text-[12.5px]">
                  <span className="font-semibold text-slate-800 tabular-nums">{fmtTime(h.at)}</span>
                  <span className="text-slate-600"> — {h.text}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  )
}

/** Fiche individuelle : panneau latéral (desktop) ou feuille plein écran (mobile). */
export function PersonSheet() {
  const id = useUI((s) => s.sheetPersonId)
  const openSheet = useUI((s) => s.openSheet)
  const d = useDerived()
  const mobile = useIsMobile()
  const close = () => openSheet(null)
  useEffect(() => {
    if (!id) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openSheet(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id, openSheet])
  const person = id ? d.personById[id] : undefined
  if (!person) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink/25" onClick={close} />
      <aside
        role="dialog"
        aria-label={`Fiche ${person.nom}`}
        className={clsx('relative flex flex-col bg-white shadow-2xl', mobile ? 'up-in pt-safe pb-safe mt-auto h-[92vh] w-full rounded-t-2xl' : 'sheet-in h-full w-[420px]')}
      >
        <SheetBody person={person} onClose={close} />
      </aside>
    </div>
  )
}
