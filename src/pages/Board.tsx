import { History, PanelRightClose, UserCheck } from 'lucide-react'
import { HighlightBar } from '../components/board/HighlightBar'
import { CoordinationSection, IncendieSection, SimpleSection } from '../components/board/Sections'
import { HistoryPanel } from '../components/history/HistoryPanel'
import { AlertBar } from '../components/layout/AlertBar'
import { MobileBoard } from '../components/mobile/MobileBoard'
import { AvailablePanel } from '../components/people/AvailablePanel'
import { useIsMobile, useIsWide } from '../lib/useMedia'
import { useDerived } from '../store/useDerived'
import { useUI } from '../store/useUI'

/** Colonne de droite repliée : une fine barre d'icônes, les véhicules gardent toute la place. */
function RightRail() {
  const d = useDerived()
  const toggleRight = useUI((s) => s.toggleRight)
  const historyOpen = useUI((s) => s.historyOpen)
  const toggleHistory = useUI((s) => s.toggleHistory)
  return (
    <aside className="flex w-[60px] shrink-0 flex-col items-center gap-2 border-l border-line py-3">
      <button
        type="button"
        onClick={toggleRight}
        title="Afficher le personnel disponible"
        className="flex w-11 flex-col items-center gap-0.5 rounded-2xl border border-line bg-paper py-2.5 hover:border-ink/25"
      >
        <UserCheck className="size-5 text-ok" />
        <span className="text-[15px] font-semibold tabular-nums">{d.disponibles.length}</span>
        <span className="text-[9.5px] text-muted">dispo</span>
      </button>
      <button
        type="button"
        onClick={() => { if (!historyOpen) toggleHistory(); toggleRight() }}
        title="Dernières modifications"
        className="grid size-11 place-items-center rounded-2xl border border-line bg-paper text-muted hover:border-ink/25 hover:text-ink"
      >
        <History className="size-5" />
      </button>
    </aside>
  )
}

export function Board() {
  const mobile = useIsMobile()
  const wide = useIsWide()
  const drawerOpen = useUI((s) => s.drawerOpen)
  const setDrawer = useUI((s) => s.setDrawer)
  const rightOpen = useUI((s) => s.rightOpen)
  const toggleRight = useUI((s) => s.toggleRight)
  const d = useDerived()

  if (mobile) return <MobileBoard />

  return (
    <div className="flex h-full min-h-0">
      <div className="scroll-thin min-w-0 flex-1 overflow-y-auto">
        {/* Barre d'outils unique : alertes repliées + repérage des spécialités */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-canvas/95 px-4 py-2.5 backdrop-blur-sm">
          <AlertBar className="max-w-[380px]" />
          <HighlightBar className="ml-auto" />
        </div>
        <div className="space-y-5 p-4">
          <IncendieSection />
          <SimpleSection id="ambulances" />
          <SimpleSection id="techniques" min={190} />
          <CoordinationSection />
          <p className="pb-2 text-center text-[12px] text-ink/40">
            Glisser une personne sur un poste pour l’affecter · sur un poste occupé pour permuter · clic sur un poste pour les actions rapides
          </p>
        </div>
      </div>

      {wide ? (
        rightOpen ? (
          <aside className="sheet-in flex w-[340px] shrink-0 flex-col gap-3 border-l border-line p-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={toggleRight}
                className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] text-muted hover:bg-ink/[0.04] hover:text-ink"
              >
                <PanelRightClose className="size-4" /> Replier
              </button>
            </div>
            <AvailablePanel className="min-h-[280px] flex-1" />
            <HistoryPanel limit={6} />
          </aside>
        ) : <RightRail />
      ) : (
        <>
          {!drawerOpen && (
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="fixed right-5 bottom-5 z-20 flex h-12 items-center gap-2 rounded-full bg-ink pr-4 pl-3 text-[14px] font-semibold text-paper shadow-lg active:opacity-80"
            >
              <UserCheck className="size-5 text-ok-dot" />
              Personnel disponible
              <span className="rounded-full bg-ok px-2 py-0.5 text-[12px] font-semibold tabular-nums">{d.disponibles.length}</span>
            </button>
          )}
          {drawerOpen && (
            // Tiroir non modal : le tableau reste visible et accepte le glisser-déposer.
            <aside className="sheet-in fixed top-0 right-0 bottom-0 z-30 flex w-[360px] max-w-[88vw] flex-col gap-3 bg-canvas p-3 shadow-[-12px_0_32px_rgb(28_28_28/0.14)]">
              <AvailablePanel className="flex-1" onClose={() => setDrawer(false)} />
              <HistoryPanel limit={5} />
            </aside>
          )}
        </>
      )}
    </div>
  )
}
