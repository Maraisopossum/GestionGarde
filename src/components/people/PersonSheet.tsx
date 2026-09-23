import clsx from 'clsx'
import { ChevronDown, LogOut, Siren, UserMinus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { VEHICLES } from '../../data/seed'
import { checkPost, ORG_META, postLabel, POST_BY_ID, PRESENCE_LABEL, VEHICLE_BY_ID, vehicleIdOf } from '../../domain/selectors'
import type { Person, Presence } from '../../domain/types'
import { fmtDuration, fmtTime, useNow } from '../../lib/time'
import { useIsMobile } from '../../lib/useMedia'
import { useDerived } from '../../store/useDerived'
import { useGarde } from '../../store/useGarde'
import { useUI } from '../../store/useUI'
import { useAssign } from '../board/PostPicker'
import { Avatar, OrgBadge, SpecBadge } from '../ui/badges'

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
        <p className="flex items-center gap-2 font-display text-[18px] font-semibold tracking-tight text-mission"><Siren className="size-5" /> En mission</p>
        <p className="mt-0.5 text-[13px] text-ink/85">
          Sur <b>{v.nom}</b> depuis {fmtTime(st.since)} ({fmtDuration(st.since!, now)}). Indisponible jusqu’au retour du véhicule.
        </p>
      </div>
    )
  }
  if (st.kind === 'ABSENT')
    return (
      <div className="rounded-lg border border-line bg-ink/[0.03] px-3 py-2.5">
        <p className="font-display text-[18px] font-semibold tracking-tight text-muted">Absent — {PRESENCE_LABEL[person.presence]}</p>
        <p className="mt-0.5 text-[13px] text-muted">Non comptabilisé dans le personnel disponible ni dans les spécialistes.</p>
      </div>
    )
  return (
    <div className="rounded-lg border border-ok/25 bg-ok-soft px-3 py-2.5">
      <p className="font-display text-[18px] font-semibold tracking-tight text-ok">Disponible</p>
      <p className="mt-0.5 text-[13px] text-ink/85">
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
        Affecter à un poste libre <span className="text-ink/45">({free.filter((f) => f.ok).length} compatibles)</span>
        <ChevronDown className={clsx('ml-auto size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="scroll-thin max-h-64 overflow-y-auto border-t border-line py-1">
          {free.map(({ p, ok }) => (
            <li key={p.id}>
              <button type="button" onClick={() => assign(person, p.id)} className={clsx('flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-ink/[0.03]', !ok && 'text-ink/45')}>
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
  const removePerson = useGarde((s) => s.removePerson)
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
          {person.organisme ? <OrgBadge org={person.organisme} /> : <p className="text-[12px] font-semibold tracking-wider text-muted uppercase">{person.grade}</p>}
          <h2 className="truncate font-display text-[26px] leading-tight font-semibold tracking-tight text-ink">{person.nom}</h2>
          <p className="text-[13px] text-muted">{person.prenom}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer" className="grid size-9 place-items-center rounded-md text-ink/45 hover:bg-ink/[0.05] hover:text-ink/85">
          <X className="size-5" />
        </button>
      </header>

      <div className="scroll-thin min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <Explanation person={person} />

        <section>
          <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Affectation actuelle</h3>
          {st.posts.length === 0 ? <p className="text-[13px] text-muted">Aucun poste.</p> : (
            <ul className="space-y-1.5">
              {st.posts.map((pid) => {
                const v = VEHICLE_BY_ID[vehicleIdOf(pid)]
                const locked = st.kind === 'EN_MISSION' && st.missionVehicleId === v.id
                return (
                  <li key={pid} className="flex items-center gap-2 rounded-md border border-line px-3 py-2">
                    <button type="button" onClick={() => { onClose(); flashVehicle(v.id) }} className="min-w-0 flex-1 text-left">
                      <span className="block text-[13.5px] font-semibold text-ink">{v.section === 'coordination' ? v.nom : POST_BY_ID[pid].label}</span>
                      <span className="block text-[12px] text-muted">{v.section === 'coordination' ? 'Coordination' : v.nom}</span>
                    </button>
                    {!locked && (
                      <button type="button" onClick={() => unassign(pid)} className="flex h-8 items-center gap-1 rounded px-2 text-[12px] font-medium text-muted hover:bg-ink/[0.05] hover:text-ink">
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

        {person.organisme && (
          <section className="rounded-xl border border-line bg-canvas px-3 py-2.5">
            <p className="text-[13px] text-ink/80">Renfort externe — {ORG_META[person.organisme].label}. Non comptabilisé dans les indicateurs SIAMU.</p>
            <button type="button" onClick={() => removePerson(person.id)} className="mt-2 flex h-8 items-center gap-1.5 rounded-full border border-ink/40 px-3 text-[12.5px] text-ink hover:bg-ink/[0.04]">
              <LogOut className="size-4" /> Retirer de la garde
            </button>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Spécialités</h3>
          {person.specialites.length ? <div className="flex flex-wrap gap-1.5">{person.specialites.map((s) => <SpecBadge key={s} sp={s} className="h-6 text-[11.5px]" />)}</div> : <p className="text-[13px] text-muted">Aucune spécialité.</p>}
        </section>

        <section>
          <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Fonctions possibles</h3>
          <div className="flex flex-wrap gap-1.5">
            {roles.postes.map((r) => <span key={r} className="rounded bg-ink/[0.05] px-2 py-1 text-[12px] font-semibold text-ink/85">{r}</span>)}
            <span className="rounded px-1 py-1 text-[12px] text-muted">+ tous les postes sans qualification</span>
          </div>
          {roles.coord.length > 0 && (
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              <span className="font-semibold text-muted">Coordination :</span> {roles.coord.join(' · ')}
            </p>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Présence</h3>
          <div className="flex flex-wrap gap-1.5">
            {PRESENCES.map((p) => (
              <button
                key={p}
                type="button"
                disabled={st.kind === 'EN_MISSION'}
                onClick={() => setPresence(person.id, p)}
                className={clsx('h-8 rounded-md border px-2.5 text-[12px] font-semibold disabled:opacity-40', person.presence === p ? 'border-ink bg-ink text-paper shadow-inset' : 'border-line text-muted hover:bg-ink/[0.03]')}
              >
                {PRESENCE_LABEL[p]}
              </button>
            ))}
          </div>
          {person.presence === 'PRESENT' && st.posts.length > 0 && st.kind !== 'EN_MISSION' && <p className="mt-1.5 text-[11.5px] text-muted">Marquer absent libère automatiquement ses postes.</p>}
        </section>

        <section>
          <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Historique récent</h3>
          {mine.length === 0 ? <p className="text-[13px] text-muted">Aucun mouvement pendant cette garde.</p> : (
            <ol className="space-y-2 border-l-2 border-line pl-3">
              {mine.map((h) => (
                <li key={h.id} className="text-[12.5px]">
                  <span className="font-semibold text-ink tabular-nums">{fmtTime(h.at)}</span>
                  <span className="text-muted"> — {h.text}</span>
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
        className={clsx('relative flex flex-col bg-paper shadow-2xl', mobile ? 'up-in pt-safe pb-safe mt-auto h-[92vh] w-full rounded-t-2xl' : 'sheet-in h-full w-[420px]')}
      >
        <SheetBody person={person} onClose={close} />
      </aside>
    </div>
  )
}
