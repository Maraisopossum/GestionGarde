import clsx from 'clsx'
import { Page } from '../components/layout/Page'
import { statusLine } from '../components/people/AvailablePanel'
import { Avatar, PERSON_STATUS_META, SPEC_META } from '../components/ui/badges'
import { personName } from '../domain/selectors'
import { SPECIALITES, type PersonStatusKind } from '../domain/types'
import { useDerived } from '../store/useDerived'
import { useUI } from '../store/useUI'

const ORDER: Record<PersonStatusKind, number> = { LIBRE: 0, AFFECTE: 1, EN_MISSION: 2, ABSENT: 3 }

/** Vue par capacité opérationnelle : combien de spécialistes restent disponibles. */
export function Specialites() {
  const d = useDerived()
  const openSheet = useUI((s) => s.openSheet)
  return (
    <Page title="Spécialités" subtitle="Capacités spécialisées présentes dans la garde">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {SPECIALITES.map((sp) => {
          const m = SPEC_META[sp]
          const Icon = m.icon
          const dispo = d.specialiteDispo[sp].length
          const people = Object.values(d.personById)
            .filter((p) => p.specialites.includes(sp))
            .sort((a, b) => ORDER[d.status[a.id].kind] - ORDER[d.status[b.id].kind] || a.nom.localeCompare(b.nom))
          return (
            <section key={sp} className={clsx('overflow-hidden rounded-xl border bg-paper', dispo === 0 ? 'border-mission' : 'border-line')}>
              <header className={clsx('flex items-center gap-3 px-4 py-3', dispo === 0 ? 'bg-mission text-white' : m.soft)}>
                <span className={clsx('grid size-10 place-items-center rounded-lg', dispo === 0 ? 'bg-white/15' : 'bg-paper')}>
                  <Icon className={clsx('size-6', dispo === 0 ? 'text-white' : m.text)} strokeWidth={2.25} />
                </span>
                <div>
                  <h2 className={clsx('font-display text-[21px] leading-none font-semibold tracking-tight', dispo === 0 ? 'text-white' : m.text)}>{m.label}</h2>
                  <p className={clsx('mt-1 text-[12.5px]', dispo === 0 ? 'text-white/85' : 'text-muted')}>{d.specialiteTotal[sp].length} présents dans la garde</p>
                </div>
                <p className="ml-auto text-right leading-none">
                  <span className={clsx('block font-display text-[40px] font-semibold tabular-nums', dispo === 0 ? 'text-white' : dispo === 1 ? 'text-amber-600' : 'text-ok')}>{dispo}</span>
                  <span className={clsx('text-[11px] font-semibold uppercase', dispo === 0 ? 'text-white' : 'text-muted')}>disponible{dispo > 1 ? 's' : ''}</span>
                </p>
              </header>
              <ul className="divide-y divide-line/70">
                {people.map((p) => {
                  const st = d.status[p.id]
                  const meta = PERSON_STATUS_META[st.kind]
                  return (
                    <li key={p.id}>
                      <button type="button" onClick={() => openSheet(p.id)} className={clsx('flex w-full items-center gap-2.5 px-4 py-2 text-left hover:bg-ink/[0.03]', st.kind === 'ABSENT' && 'opacity-55')}>
                        <Avatar person={p} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-ink">{personName(p)}</span>
                          <span className="block truncate text-[12px] text-muted">{statusLine(p, st)}</span>
                        </span>
                        <span className={clsx('flex items-center gap-1.5 text-[12px] font-semibold', meta.text)}>
                          <span className={clsx('size-2 rounded-full', meta.dot)} />{meta.label}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </Page>
  )
}
