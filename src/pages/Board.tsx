import { UserCheck } from 'lucide-react'
import { HighlightBar } from '../components/board/HighlightBar'
import { CoordinationSection, IncendieSection, SimpleSection } from '../components/board/Sections'
import { HistoryPanel } from '../components/history/HistoryPanel'
import { AlertBar } from '../components/layout/AlertBar'
import { MobileBoard } from '../components/mobile/MobileBoard'
import { AvailablePanel } from '../components/people/AvailablePanel'
import { useIsMobile, useIsWide } from '../lib/useMedia'
import { useDerived } from '../store/useDerived'
import { useUI } from '../store/useUI'

export function Board() {
  const mobile = useIsMobile()
  const wide = useIsWide()
  const drawerOpen = useUI((s) => s.drawerOpen)
  const setDrawer = useUI((s) => s.setDrawer)
  const d = useDerived()

  if (mobile) return <MobileBoard />

  return (
    <div className="flex h-full min-h-0">
      <div className="scroll-thin min-w-0 flex-1 space-y-4 overflow-y-auto p-4">
        <AlertBar />
        <div className="sticky top-0 z-10 -mx-1 bg-canvas/95 px-1 pt-1 pb-1 backdrop-blur-sm"><HighlightBar /></div>
        <IncendieSection />
        <SimpleSection id="ambulances" />
        <SimpleSection id="techniques" min={190} />
        <CoordinationSection />
        <p className="pb-2 text-center text-[11.5px] text-ink/45">
          Glisser une personne sur un poste pour l’affecter · déposer sur un poste occupé pour permuter · clic sur un poste pour les actions rapides
        </p>
      </div>

      {wide ? (
        <aside className="flex w-[360px] shrink-0 flex-col gap-4 py-4 pr-4">
          <AvailablePanel className="min-h-[320px] flex-1" />
          <HistoryPanel limit={6} />
        </aside>
      ) : (
        <>
          {!drawerOpen && (
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="fixed right-5 bottom-5 z-20 flex h-12 items-center gap-2 rounded-full bg-ink pr-4 pl-3 text-[14px] font-semibold text-paper shadow-inset active:opacity-80 shadow-[0_8px_24px_rgb(15_29_51/0.35)]"
            >
              <UserCheck className="size-5 text-ok-dot" />
              Personnel disponible
              <span className="rounded-full bg-ok px-2 py-0.5 text-[12px] font-semibold tabular-nums">{d.disponibles.length}</span>
            </button>
          )}
          {drawerOpen && (
            // Tiroir non modal : le tableau reste visible et accepte le glisser-déposer.
            <aside className="sheet-in fixed top-0 right-0 bottom-0 z-30 flex w-[360px] max-w-[88vw] flex-col bg-canvas p-3 shadow-[-12px_0_32px_rgb(15_29_51/0.18)]">
              <AvailablePanel className="flex-1" onClose={() => setDrawer(false)} />
            </aside>
          )}
        </>
      )}
    </div>
  )
}
