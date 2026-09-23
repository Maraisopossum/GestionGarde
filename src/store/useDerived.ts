import { computeAlerts, derive, type Alert, type Derived } from '../domain/selectors'
import { useGarde } from './useGarde'

type Result = Derived & { alerts: Alert[] }
let cache: { key: unknown[]; value: Result } | null = null

/**
 * Statuts dérivés (dispo, en mission, spécialités, alertes).
 * Calculés une seule fois par changement d'état, partagés par tous les composants.
 */
export function useDerived(): Result {
  const persons = useGarde((s) => s.persons)
  const assignments = useGarde((s) => s.assignments)
  const vehicleStatus = useGarde((s) => s.vehicleStatus)
  const key = [persons, assignments, vehicleStatus]
  if (!cache || cache.key.some((k, i) => k !== key[i])) {
    const snap = { persons, assignments, vehicleStatus }
    const d = derive(snap)
    cache = { key, value: { ...d, alerts: computeAlerts(snap, d) } }
  }
  return cache.value
}
