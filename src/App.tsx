import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { PostPicker } from './components/board/PostPicker'
import { DndLayer } from './components/layout/DndLayer'
import { InstallBanner } from './components/layout/InstallBanner'
import { MobileNav } from './components/layout/MobileNav'
import { ConfirmDialog, Toasts } from './components/layout/Overlays'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { PersonSheet } from './components/people/PersonSheet'
import { useIsMobile, useMedia } from './lib/useMedia'
import { Board } from './pages/Board'
import { Disponibles, Plus } from './pages/MobilePages'
import { Historique } from './pages/Historique'
import { Missions } from './pages/Missions'
import { Parametres } from './pages/Parametres'
import { Personnel } from './pages/Personnel'
import { Specialites } from './pages/Specialites'
import { Vehicules } from './pages/Vehicules'
import { useGarde } from './store/useGarde'
import { useUI } from './store/useUI'

function Shortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea')) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); useGarde.getState().undo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return null
}

function Layout() {
  const mobile = useIsMobile()
  const collapsed = useMedia('(max-width: 1279px)')
  const { pathname } = useLocation()
  useEffect(() => {
    const ui = useUI.getState()
    ui.closePicker()
    ui.setDrawer(false)
    if (mobile) window.scrollTo(0, 0)
  }, [pathname, mobile])

  const overlays = (
    <>
      <PostPicker />
      <PersonSheet />
      <ConfirmDialog />
      <Toasts />
      <Shortcuts />
    </>
  )

  if (mobile)
    return (
      <DndLayer>
        <div className="min-h-full pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
          <TopBar />
          <InstallBanner />
          <main><Outlet /></main>
        </div>
        <MobileNav />
        {overlays}
      </DndLayer>
    )

  return (
    <DndLayer>
      <div className="flex h-full">
        <Sidebar collapsed={collapsed} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
      {overlays}
    </DndLayer>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Board />} />
        <Route path="personnel" element={<Personnel />} />
        <Route path="vehicules" element={<Vehicules />} />
        <Route path="specialites" element={<Specialites />} />
        <Route path="missions" element={<Missions />} />
        <Route path="historique" element={<Historique />} />
        <Route path="parametres" element={<Parametres />} />
        <Route path="disponibles" element={<Disponibles />} />
        <Route path="plus" element={<Plus />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
