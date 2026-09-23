import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { TEMPLATES, VEHICLES, type VehicleTemplate } from '../../data/seed'
import { ORG_META } from '../../domain/selectors'
import { ORGANISMES, SPECIALITES, type Organisme, type SectionId, type Specialite } from '../../domain/types'
import { useGarde } from '../../store/useGarde'
import { useUI } from '../../store/useUI'
import { OrgBadge, SPEC_META } from '../ui/badges'

const BY_SECTION: Record<Exclude<SectionId, 'coordination'>, VehicleTemplate[]> = {
  incendie: ['DEPART', 'VO', 'ECHELLE', 'AMB_INC'],
  ambulances: ['AMBULANCE'],
  techniques: ['TECHNIQUE'],
}

/** Nom proposé : prochain numéro libre (« 4e Départ P », « 5e Ambulance », « Ambulance Croix-Rouge 2 »…). */
function suggestName(tpl: VehicleTemplate, org: Organisme | null): string {
  const next = (re: RegExp) => Math.max(0, ...VEHICLES.map((v) => Number(re.exec(v.nom)?.[1] ?? 0))) + 1
  if (org && tpl === 'AMBULANCE') return `Ambulance ${ORG_META[org].label} ${next(new RegExp(`^Ambulance ${ORG_META[org].label} (\\d+)`))}`
  switch (tpl) {
    case 'DEPART': return `${next(/^(\d+)e Départ P/)}e Départ P`
    case 'VO': return `${next(/^(\d+)e Voiture Officier R/)}e Voiture Officier R`
    case 'ECHELLE': return `${next(/^(\d+)e Échelle/)}e Échelle`
    case 'AMB_INC': return `AMB INC ${VEHICLES.filter((v) => v.nom.startsWith('AMB INC')).length + 1}`
    case 'AMBULANCE': return `${next(/^(\d+)e Ambulance/)}e Ambulance`
    case 'TECHNIQUE': return ''
  }
}

export function AddVehicleDialog({ section, onClose }: { section: Exclude<SectionId, 'coordination'>; onClose: () => void }) {
  const tpls = BY_SECTION[section]
  const addVehicle = useGarde((s) => s.addVehicle)
  const flashVehicle = useUI((s) => s.flashVehicle)
  const [tpl, setTpl] = useState<VehicleTemplate>(tpls[0])
  const [org, setOrg] = useState<Organisme | null>(null)
  const [spec, setSpec] = useState<Specialite | undefined>()
  const suggestion = useMemo(() => suggestName(tpl, org), [tpl, org])
  const [nom, setNom] = useState(suggestion)
  const [touched, setTouched] = useState(false)
  useEffect(() => { if (!touched) setNom(suggestion) }, [suggestion, touched])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = () => {
    if (!nom.trim()) return
    const id = addVehicle(tpl, nom, org, tpl === 'TECHNIQUE' ? spec : undefined)
    onClose()
    setTimeout(() => flashVehicle(id), 80)
  }

  const chip = (on: boolean) => clsx('h-8 rounded-full border px-3 text-[13px] transition-colors', on ? 'border-ink bg-ink text-paper shadow-inset' : 'border-line bg-paper text-ink/80 hover:border-ink/25')

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-ink/35 sm:place-items-center sm:p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-label="Armer un véhicule"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); submit() }}
        className="up-in pb-safe w-full max-w-md rounded-t-3xl bg-canvas p-5 shadow-2xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-start gap-3">
          <div className="flex-1">
            <h2 className="text-[22px] font-semibold tracking-[-0.5px] text-ink">Armer un véhicule</h2>
            <p className="text-[13px] text-muted">Il apparaît immédiatement sur le tableau.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid size-8 place-items-center rounded-full text-ink/45 hover:bg-ink/[0.05]">
            <X className="size-5" />
          </button>
        </header>

        {tpls.length > 1 && (
          <fieldset className="mb-4">
            <legend className="mb-1.5 text-[12.5px] font-medium text-muted">Type</legend>
            <div className="grid grid-cols-2 gap-2">
              {tpls.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTpl(t)}
                  className={clsx('rounded-2xl border px-3 py-2.5 text-left transition-colors', tpl === t ? 'border-ink bg-paper ring-1 ring-ink' : 'border-line bg-paper hover:border-ink/25')}
                >
                  <span className="block text-[13.5px] font-semibold text-ink">{TEMPLATES[t].label}</span>
                  <span className="block text-[11.5px] text-muted">{TEMPLATES[t].hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-muted">Nom sur le tableau</span>
          <input
            autoFocus
            value={nom}
            onChange={(e) => { setNom(e.target.value); setTouched(true) }}
            placeholder={tpl === 'TECHNIQUE' ? 'ex. Deconta C62' : ''}
            className="h-10 w-full rounded-md border border-line bg-paper px-3 text-[15px] outline-none focus:border-sky-500"
          />
        </label>

        <fieldset className="mb-4">
          <legend className="mb-1.5 text-[12.5px] font-medium text-muted">Armé par</legend>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setOrg(null)} className={chip(!org)}>SIAMU</button>
            {ORGANISMES.map((o) => (
              <button key={o} type="button" onClick={() => setOrg(o)} className={clsx(chip(org === o), 'flex items-center gap-1.5 pl-1.5')}>
                <OrgBadge org={o} short className="h-5" /> {ORG_META[o].label}
              </button>
            ))}
          </div>
          {org && <p className="mt-1.5 text-[12px] text-muted">L’équipage externe s’ajoute ensuite depuis chaque poste (« Ajouter un renfort externe »).</p>}
        </fieldset>

        {tpl === 'TECHNIQUE' && (
          <fieldset className="mb-4">
            <legend className="mb-1.5 text-[12.5px] font-medium text-muted">Spécialité du véhicule (facultatif)</legend>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setSpec(undefined)} className={chip(!spec)}>Aucune</button>
              {SPECIALITES.map((s) => (
                <button key={s} type="button" onClick={() => setSpec(s)} className={chip(spec === s)}>{SPEC_META[s].label}</button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="h-10 rounded-full border border-ink/40 px-4 text-[14px] text-ink hover:bg-ink/[0.04]">Annuler</button>
          <button type="submit" disabled={!nom.trim()} className="h-10 rounded-full bg-ink px-5 text-[14px] font-semibold text-paper shadow-inset active:opacity-80 disabled:opacity-40">
            Armer le véhicule
          </button>
        </div>
      </form>
    </div>
  )
}
