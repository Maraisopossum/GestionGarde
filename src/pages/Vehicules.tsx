import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { SECTION_META, vehiclesOf } from '../components/board/Sections'
import { MainAction, StateMenu } from '../components/board/VehicleCard'
import { Page } from '../components/layout/Page'
import { SpecBadge, StatePill, STATE_META } from '../components/ui/badges'
import { personName } from '../domain/selectors'
import type { SectionId } from '../domain/types'
import { fmtDuration, useNow } from '../lib/time'
import { useDerived } from '../store/useDerived'
import { useGarde } from '../store/useGarde'
import { useUI } from '../store/useUI'

const SECTIONS: SectionId[] = ['incendie', 'ambulances', 'techniques']

export function Vehicules() {
  const vehicleStatus = useGarde((s) => s.vehicleStatus)
  const assignments = useGarde((s) => s.assignments)
  const d = useDerived()
  const now = useNow(30_000)
  const navigate = useNavigate()
  const flash = useUI((s) => s.flashVehicle)
  const all = SECTIONS.flatMap(vehiclesOf)
  const count = (st: string) => all.filter((v) => vehicleStatus[v.id]?.state === st).length

  return (
    <Page
      title="Véhicules"
      subtitle={`${count('DISPONIBLE')} disponibles · ${count('EN_MISSION')} en mission · ${count('RESERVE')} en réserve · ${count('INDISPONIBLE')} indisponibles`}
    >
      {SECTIONS.map((sec) => {
        const M = SECTION_META[sec]
        return (
          <section key={sec} className="overflow-hidden rounded-xl border border-line bg-white">
            <h2 className="flex items-center gap-2 border-b border-line bg-slate-50 px-4 py-2.5 font-display text-[18px] font-bold tracking-wide text-ink uppercase">
              <span className={clsx('grid size-6 place-items-center rounded-full text-white', M.tone)}><M.icon className="size-3.5" /></span>
              {M.title}
            </h2>
            <ul className="divide-y divide-line/70">
              {vehiclesOf(sec).map((v) => {
                const st = vehicleStatus[v.id]
                const crew = v.posts.map((p) => assignments[p.id]).filter(Boolean)
                return (
                  <li key={v.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
                    <span className={clsx('h-9 w-1 shrink-0 rounded', STATE_META[st.state].bar)} />
                    <button type="button" onClick={() => { navigate('/'); setTimeout(() => flash(v.id), 60) }} className="w-52 text-left">
                      <span className="block text-[14px] font-semibold text-ink hover:underline">{v.nom}</span>
                      <span className="block text-[11.5px] text-slate-500">{v.groupe ?? ''}</span>
                    </button>
                    <span className="flex w-44 items-center gap-2">
                      <StatePill state={st.state} since={st.since} size="sm" />
                      {st.state === 'EN_MISSION' && st.since && <span className="text-[11.5px] text-mission">{fmtDuration(st.since, now)}</span>}
                    </span>
                    <span className="w-24">{v.specialite && <SpecBadge sp={v.specialite} />}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-600">
                      <b className={clsx('mr-2 tabular-nums', crew.length < v.posts.length ? 'text-reserve' : 'text-slate-500')}>{crew.length}/{v.posts.length}</b>
                      {crew.map((pid) => personName(d.personById[pid])).join(' · ') || <span className="text-slate-400">Aucun équipage</span>}
                    </span>
                    <span className="flex w-52 items-center gap-1">
                      <MainAction vehicles={[v]} size="sm" />
                      <StateMenu vehicle={v} />
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </Page>
  )
}
