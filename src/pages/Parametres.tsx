import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Download, RotateCcw, Share } from 'lucide-react'
import { useInstall } from '../components/layout/InstallBanner'
import { Page } from '../components/layout/Page'
import type { ShiftMode } from '../domain/types'
import { useGarde } from '../store/useGarde'
import { useUI } from '../store/useUI'

const SHIFTS: { id: ShiftMode; label: string }[] = [
  { id: 'AUTO', label: 'Automatique' },
  { id: 'JOUR', label: 'Jour 07h–19h' },
  { id: 'NUIT', label: 'Nuit 19h–07h' },
]

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="mb-3 text-[12px] font-bold tracking-wider text-slate-500 uppercase">{title}</h2>
      {children}
    </section>
  )
}

export function Parametres() {
  const shift = useGarde((s) => s.shift)
  const setShift = useGarde((s) => s.setShift)
  const reset = useGarde((s) => s.reset)
  const ask = useUI((s) => s.ask)
  const install = useInstall()

  return (
    <Page title="Paramètres">
      <div className="grid max-w-4xl gap-4 md:grid-cols-2">
        <Card title="Quart affiché">
          <div className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1">
            {SHIFTS.map((s) => (
              <button key={s.id} type="button" onClick={() => setShift(s.id)} className={clsx('h-9 rounded text-[12.5px] font-semibold', shift === s.id ? 'bg-white text-ink shadow-sm' : 'text-slate-500')}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-slate-500">En automatique, le quart suit l’heure (07h00 / 19h00).</p>
        </Card>

        <Card title="Données de démonstration">
          <p className="mb-3 text-[13px] text-slate-600">
            Les manipulations sont enregistrées dans ce navigateur uniquement. Réinitialiser restaure le scénario fictif de départ.
          </p>
          <button
            type="button"
            onClick={() => ask({ title: 'Réinitialiser la démo ?', body: 'Toutes les affectations, sorties et l’historique reviendront au scénario initial.', confirmLabel: 'Réinitialiser', tone: 'danger', onConfirm: reset })}
            className="flex h-9 items-center gap-2 rounded-md border border-mission/40 px-3 text-[13px] font-semibold text-mission hover:bg-mission-soft"
          >
            <RotateCcw className="size-4" /> Réinitialiser la démo
          </button>
        </Card>

        <Card title="Application mobile">
          {install.installed ? (
            <p className="text-[13px] text-ok">L’application est installée sur cet appareil.</p>
          ) : install.canPrompt ? (
            <button type="button" onClick={install.prompt} className="flex h-9 items-center gap-2 rounded-md bg-ink px-3 text-[13px] font-semibold text-white">
              <Download className="size-4" /> Installer l’application
            </button>
          ) : (
            <p className="text-[13px] leading-relaxed text-slate-600">
              {install.ios
                ? <>Sur iPhone / iPad : ouvrez ce site dans Safari, touchez <Share className="inline size-3.5 align-[-2px]" /> puis « Sur l’écran d’accueil ».</>
                : <>Sur Android ou ordinateur (Chrome, Edge) : menu du navigateur → « Installer l’application ». Elle fonctionne ensuite en plein écran et hors connexion.</>}
            </p>
          )}
        </Card>

        <Card title="À propos de cette maquette">
          <ul className="list-disc space-y-1 pl-4 text-[13px] text-slate-600">
            <li>Toutes les données (noms, affectations, missions) sont <b>fictives</b>.</li>
            <li>Les règles de qualification (N°6 ≥ Sgt, N°5 et chauffeurs = qualification Chauffeur, Plong. = spécialité Plongeur…) sont des hypothèses à valider.</li>
            <li>Raccourci : <kbd className="rounded border border-line bg-slate-50 px-1 text-[11px]">Ctrl</kbd>+<kbd className="rounded border border-line bg-slate-50 px-1 text-[11px]">Z</kbd> annule la dernière action.</li>
          </ul>
        </Card>
      </div>
    </Page>
  )
}
