import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const KEY = 'garde-bxl-install-dismissed'
const read = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
const write = () => { try { localStorage.setItem(KEY, '1') } catch { /* ignoré */ } }

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as BeforeInstallPromptEvent
  listeners.forEach((l) => l())
})

/** Installation PWA : invite native (Android/Chrome/Edge) ou instructions iOS. */
export function useInstall() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => { listeners.delete(l) }
  }, [])
  return {
    canPrompt: !!deferred,
    ios: isIOS() && !isStandalone(),
    installed: isStandalone(),
    async prompt() {
      if (!deferred) return
      await deferred.prompt()
      deferred = null
      force((n) => n + 1)
    },
  }
}

export function InstallBanner() {
  const { canPrompt, ios, installed, prompt } = useInstall()
  const [hidden, setHidden] = useState(read)
  if (installed || hidden || (!canPrompt && !ios)) return null
  const close = () => { write(); setHidden(true) }
  return (
    <div className="mx-3 mt-3 flex items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink text-white">
        {ios ? <Share className="size-4" /> : <Download className="size-4" />}
      </span>
      <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-ink/85">
        <b className="text-ink">Installer l’application</b>
        <br />
        {ios ? <>Touchez <Share className="inline size-3.5 align-[-2px]" /> puis « Sur l’écran d’accueil ».</> : 'Accès plein écran, même hors connexion.'}
      </p>
      {canPrompt && (
        <button type="button" onClick={prompt} className="h-8 rounded-md bg-ink px-3 text-[12px] font-semibold text-paper shadow-inset active:opacity-80">Installer</button>
      )}
      <button type="button" onClick={close} aria-label="Masquer" className="grid size-7 place-items-center rounded text-ink/45">
        <X className="size-4" />
      </button>
    </div>
  )
}
