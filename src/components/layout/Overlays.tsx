import clsx from 'clsx'
import { CircleAlert, CircleCheck, Info, Siren, TriangleAlert, Undo2, X } from 'lucide-react'
import { useEffect } from 'react'
import { useIsMobile } from '../../lib/useMedia'
import { useGarde } from '../../store/useGarde'
import { useToasts, type ToastLevel } from '../../store/useToasts'
import { useUI } from '../../store/useUI'

const TOAST: Record<ToastLevel, { icon: typeof Info; cls: string }> = {
  success: { icon: CircleCheck, cls: 'text-ok-dot' },
  info: { icon: Info, cls: 'text-sky-300' },
  warning: { icon: TriangleAlert, cls: 'text-amber-300' },
  danger: { icon: CircleAlert, cls: 'text-white' },
  mission: { icon: Siren, cls: 'text-red-400' },
}

export function Toasts() {
  const toasts = useToasts((s) => s.toasts)
  const dismiss = useToasts((s) => s.dismiss)
  const undo = useGarde((s) => s.undo)
  const mobile = useIsMobile()
  return (
    <div
      aria-live="polite"
      className={clsx(
        'pointer-events-none fixed z-[60] flex flex-col gap-2',
        mobile ? 'inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))]' : 'bottom-4 left-1/2 w-[460px] -translate-x-1/2',
      )}
    >
      {toasts.map((t) => {
        const T = TOAST[t.level]
        const Icon = T.icon
        return (
          <div key={t.id} className={clsx('toast-in pointer-events-auto flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-white shadow-xl', t.level === 'danger' ? 'bg-red-700' : 'bg-ink')}>
            <Icon className={clsx('size-5 shrink-0', T.cls)} />
            <span className="min-w-0 flex-1 leading-snug">{t.text}</span>
            {t.undoable && (
              <button type="button" onClick={() => { undo(); dismiss(t.id) }} className="flex h-7 items-center gap-1 rounded px-2 text-[12px] font-bold text-sky-300 uppercase hover:bg-white/10">
                <Undo2 className="size-3.5" /> Annuler
              </button>
            )}
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Fermer" className="grid size-6 place-items-center rounded text-white/50 hover:text-white">
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function ConfirmDialog() {
  const c = useUI((s) => s.confirm)
  const ask = useUI((s) => s.ask)
  useEffect(() => {
    if (!c) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ask(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [c, ask])
  if (!c) return null
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/45 p-4" onClick={() => ask(null)}>
      <div role="alertdialog" aria-modal className="up-in w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[16px] font-semibold text-ink">{c.title}</h2>
        {c.body && <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">{c.body}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => ask(null)} className="h-9 rounded-md border border-line px-3.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
            Annuler
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => { c.onConfirm(); ask(null) }}
            className={clsx('h-9 rounded-md px-3.5 text-[13px] font-semibold text-white', c.tone === 'danger' ? 'bg-mission hover:bg-red-700' : 'bg-ink hover:bg-ink-3')}
          >
            {c.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
