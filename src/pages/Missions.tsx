import { CircleCheck, Siren } from 'lucide-react'
import { MainAction } from '../components/board/VehicleCard'
import { Page } from '../components/layout/Page'
import { Avatar, SpecBadges } from '../components/ui/badges'
import { personName, VEHICLE_BY_ID } from '../domain/selectors'
import type { Mission } from '../domain/types'
import { fmtDuration, fmtTime, useNow } from '../lib/time'
import { useDerived } from '../store/useDerived'
import { useGarde } from '../store/useGarde'

export function Missions() {
  const missions = useGarde((s) => s.missions)
  const d = useDerived()
  const now = useNow(15_000)
  // Un départ (VO + P) sorti ensemble = une seule mission affichée
  const groups = new Map<string, Mission[]>()
  for (const m of missions.filter((x) => !x.end).sort((a, b) => b.start.localeCompare(a.start))) {
    const v = VEHICLE_BY_ID[m.vehicleId]
    const key = v.groupe ? `${v.groupe}|${m.start}` : m.id
    groups.set(key, [...(groups.get(key) ?? []), m])
  }
  const ongoing = [...groups.values()]
  const done = missions.filter((m) => m.end).sort((a, b) => b.end!.localeCompare(a.end!))

  return (
    <Page title="Missions" subtitle={`${ongoing.length} intervention${ongoing.length > 1 ? 's' : ''} en cours · ${d.enMission.length} personnes engagées`}>
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-[12px] font-bold tracking-wider text-slate-500 uppercase"><Siren className="size-4 text-mission" /> En cours</h2>
        {ongoing.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-slate-500">Aucun véhicule en intervention.</p>
        ) : (
          <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ongoing.map((ms) => {
              const m = ms[0]
              const vs = ms.map((x) => VEHICLE_BY_ID[x.vehicleId])
              const crew = ms.flatMap((x) => x.crew)
              const title = vs.length > 1 ? `${vs[0].groupe} (VO + P)` : vs[0].nom
              return (
                <article key={m.id} className="overflow-hidden rounded-xl border border-mission/35 bg-white">
                  <div className="h-1 bg-mission" />
                  <header className="flex items-center gap-3 bg-mission-soft/60 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-[19px] font-bold tracking-wide text-ink uppercase">{title}</h3>
                      <p className="text-[12px] text-slate-600">Sorti à <b>{fmtTime(m.start)}</b></p>
                    </div>
                    <p className="font-display text-[26px] font-bold text-mission tabular-nums">{fmtDuration(m.start, now)}</p>
                  </header>
                  <ul className="space-y-1.5 px-4 py-3">
                    {crew.length === 0 && <li className="text-[13px] text-slate-500">Sans équipage</li>}
                    {crew.map((pid) => {
                      const p = d.personById[pid]
                      return p && (
                        <li key={pid} className="flex items-center gap-2 text-[13px]">
                          <Avatar person={p} size="xs" /> <span className="font-medium">{personName(p)}</span> <SpecBadges specs={p.specialites} variant="icon" />
                        </li>
                      )
                    })}
                  </ul>
                  <footer className="border-t border-line px-4 py-2.5"><MainAction vehicles={vs} size="sm" /></footer>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-[12px] font-bold tracking-wider text-slate-500 uppercase"><CircleCheck className="size-4 text-ok" /> Terminées pendant la garde</h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-line bg-slate-50 text-left text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              <tr><th className="px-4 py-2">Véhicule</th><th className="px-4 py-2">Sortie</th><th className="px-4 py-2">Retour</th><th className="px-4 py-2">Durée</th><th className="px-4 py-2">Équipage</th></tr>
            </thead>
            <tbody className="text-[13px]">
              {done.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Aucune mission terminée.</td></tr>}
              {done.map((m) => (
                <tr key={m.id} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-2 font-semibold">{VEHICLE_BY_ID[m.vehicleId].nom}</td>
                  <td className="px-4 py-2 tabular-nums">{fmtTime(m.start)}</td>
                  <td className="px-4 py-2 tabular-nums">{fmtTime(m.end)}</td>
                  <td className="px-4 py-2 tabular-nums">{fmtDuration(m.start, m.end!)}</td>
                  <td className="px-4 py-2 text-slate-600">{m.crew.map((pid) => d.personById[pid] && personName(d.personById[pid])).join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  )
}
