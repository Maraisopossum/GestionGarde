import { useEffect, useState } from 'react'

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}

/** < 768 px : navigation mobile dédiée */
export const useIsMobile = () => useMedia('(max-width: 767px)')
/** ≥ 1280 px : panneau personnel affiché en colonne à droite */
export const useIsWide = () => useMedia('(min-width: 1280px)')
