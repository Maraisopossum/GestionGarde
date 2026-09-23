import clsx from 'clsx'
import { ArrowLeftRight, Lock, Search, UserMinus, UserRound, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { checkPost, isCoordPost, personName, POST_BY_ID, postLabel, postShort, vehicleOf } from '../../domain/selectors'
import { GRADE_RANK, type Person } from '../../domain/types'
import { useIsMobile } from '../../lib/useMedia'
import { useDerived } from '../../store/useDerived'
import { useGarde } from '../../store/useGarde'
import { useUI } from '../../store/useUI'
import { Avatar, SpecBadges } from '../ui/badges'

/** Affectation avec confirmation si la personne n'a pas la qualification requise. */
export function useAssign() {
  const place = useGarde((s) => s.place)
  const ask = useUI((s) => s.ask)
  return (person: Person, postId: string, from: string | null = null, after?: () => void) => {
    const { ok, missing } = checkPost(person, postId)
    if (ok) { place(person.id, postId, from); after?.(); return }
    ask({
      title: `${personName(person)} n’a pas la qualification requise`,
      body: `${postLabel(postId)} demande : ${missing.join(', ')}. Affecter quand même ?`,
      confirmLabel: 'Affecter quand même',
      onConfirm: () => { place(person.id, postId, from); after?.() },
    })
  }
}

function CandidateList({ postId, onDone }: { postId: string; onDone: () => void }) {
  const d = useDerived()
  const occupant = useGarde((s) => s.assignments[postId])
  const assign = useAssign()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const mobile = useIsMobile()
  useEffect(() => { if (!mobile) inputRef.current?.focus() }, [mobile])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    // Poste d'encadrement : grades élevés d'abord ; sinon on évite de mobiliser un gradé.
    const senior = (POST_BY_ID[postId]?.requires ?? []).some((r) => r.kind === 'grade' || (r.kind === 'fonction' && r.value === 'CHEF'))
    const dir = senior ? 1 : -1
    return d.disponibles
      .filter((p) => p.id !== occupant)
      .filter((p) => !needle || `${p.grade} ${p.nom} ${p.prenom} ${p.specialites.join(' ')}`.toLowerCase().includes(needle))
      .map((p) => ({ p, ok: checkPost(p, postId).ok, st: d.status[p.id] }))
      .sort((a, b) =>
        Number(b.ok) - Number(a.ok) ||
        Number(a.st.vehiclePosts.length > 0) - Number(b.st.vehiclePosts.length > 0) ||
        dir * (GRADE_RANK[b.p.grade] - GRADE_RANK[a.p.grade]) ||
        a.p.nom.localeCompare(b.p.nom))
  }, [d, q, occupant, postId])

  const coord = isCoordPost(postId)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative border-b border-line px-3 py-2">
        <Search className="pointer-events-none absolute top-1/2 left-5.5 size-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, grade, spécialité…"
          className="h-9 w-full rounded-md border border-line bg-slate-50 pr-2 pl-8 text-sm outline-none focus:border-sky-500 focus:bg-white"
        />
      </div>
      <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto py-1">
        {rows.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">Aucun personnel disponible</li>}
        {rows.map(({ p, ok, st }) => {
          const current = st.vehiclePosts[0]
          let hint = 'Libre'
          if (coord) { if (st.posts.length) hint = `Cumul avec ${postShort(st.posts[0])}` }
          else if (current) hint = occupant ? `${postShort(current)} · permutation` : `Quitte ${postShort(current)}`
          else if (st.posts.length) hint = `Cumul avec ${postShort(st.posts[0])}`
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => assign(p, postId, null, onDone)}
                className={clsx('flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 focus-visible:bg-sky-50 focus-visible:outline-none', !ok && 'opacity-60')}
              >
                <Avatar person={p} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-semibold text-slate-800">{personName(p)}</span>
                    <SpecBadges specs={p.specialites} variant="icon" />
                  </span>
                  <span className={clsx('block truncate text-[11.5px]', !ok ? 'text-reserve' : hint === 'Libre' ? 'text-ok' : 'text-slate-500')}>
                    {!ok ? `Qualification manquante : ${checkPost(p, postId).missing.join(', ')}` : hint}
                  </span>
                </span>
                {occupant && current && !coord && <ArrowLeftRight className="size-4 text-slate-400" />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PickerBody({ postId, onClose }: { postId: string; onClose: () => void }) {
  const d = useDerived()
  const occupantId = useGarde((s) => s.assignments[postId])
  const vehicleState = useGarde((s) => s.vehicleStatus[vehicleOf(postId).id]?.state)
  const unassign = useGarde((s) => s.unassign)
  const openSheet = useUI((s) => s.openSheet)
  const [mode, setMode] = useState<'menu' | 'list'>(occupantId ? 'menu' : 'list')
  const occupant = occupantId ? d.personById[occupantId] : undefined
  const locked = vehicleState === 'EN_MISSION'
  const post = POST_BY_ID[postId]
  const v = vehicleOf(postId)

  return (
    <>
      <header className="flex items-start gap-2 border-b border-line px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold tracking-wider text-slate-400 uppercase">
            {mode === 'list' ? (occupant ? 'Remplacer / permuter' : 'Affecter au poste') : 'Poste'}
          </p>
          <p className="truncate text-[14px] font-semibold text-ink">
            {v.section === 'coordination' ? v.nom : <>{post.label} <span className="font-normal text-slate-500">· {v.nom}</span></>}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer" className="grid size-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X className="size-4" />
        </button>
      </header>

      {mode === 'menu' && occupant ? (
        <div className="p-3">
          <div className="flex items-center gap-2.5">
            <Avatar person={occupant} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{personName(occupant)} <span className="font-normal text-slate-500">{occupant.prenom}</span></p>
              <SpecBadges specs={occupant.specialites} />
            </div>
          </div>
          {locked ? (
            <p className="mt-3 flex items-center gap-2 rounded-md bg-mission-soft px-2.5 py-2 text-[12.5px] text-mission">
              <Lock className="size-4" /> Véhicule en mission — équipage verrouillé jusqu’au retour.
            </p>
          ) : (
            <div className="mt-3 grid gap-1.5">
              <button type="button" onClick={() => setMode('list')} className="flex h-9 items-center gap-2 rounded-md bg-ink px-3 text-[13px] font-semibold text-white hover:bg-ink-3">
                <ArrowLeftRight className="size-4" /> Remplacer ou permuter…
              </button>
              <button type="button" onClick={() => { unassign(postId); onClose() }} className="flex h-9 items-center gap-2 rounded-md border border-line px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                <UserMinus className="size-4" /> Retirer du poste
              </button>
            </div>
          )}
          <button type="button" onClick={() => openSheet(occupant.id)} className="mt-1.5 flex h-9 w-full items-center gap-2 rounded-md border border-line px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
            <UserRound className="size-4" /> Voir la fiche
          </button>
        </div>
      ) : (
        <CandidateList postId={postId} onDone={onClose} />
      )}
    </>
  )
}

/** Sélecteur rapide ancré au poste (desktop) ou en feuille basse (mobile). */
export function PostPicker() {
  const picker = useUI((s) => s.picker)
  const close = useUI((s) => s.closePicker)
  const mobile = useIsMobile()
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; maxH: number } | null>(null)

  useLayoutEffect(() => {
    if (!picker || mobile) return
    const r = picker.rect
    const W = 320
    const left = Math.min(Math.max(8, r.left), window.innerWidth - W - 8)
    const below = window.innerHeight - r.bottom - 12
    const above = r.top - 12
    if (below >= 300 || below >= above) setPos({ left, top: r.bottom + 6, maxH: Math.min(420, below) })
    else setPos({ left, bottom: window.innerHeight - r.top + 6, maxH: Math.min(420, above) })
  }, [picker, mobile])

  useEffect(() => {
    if (!picker) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) close() }
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => document.addEventListener('pointerdown', onDown), 0)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); document.removeEventListener('pointerdown', onDown) }
  }, [picker, close])

  if (!picker) return null
  if (mobile)
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-ink/40">
        <div ref={ref} role="dialog" className="up-in pb-safe flex max-h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl">
          <PickerBody key={picker.postId} postId={picker.postId} onClose={close} />
        </div>
      </div>
    )
  if (!pos) return null
  return (
    <div
      ref={ref}
      role="dialog"
      style={{ left: pos.left, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH }}
      className="fixed z-50 flex w-80 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-[0_12px_40px_rgb(15_29_51/0.22)]"
    >
      <PickerBody key={picker.postId} postId={picker.postId} onClose={close} />
    </div>
  )
}
