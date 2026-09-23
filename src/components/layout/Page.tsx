import type { ReactNode } from 'react'
import { AlertBar } from './AlertBar'

/** Pages secondaires : en-tête commun + alertes. */
export function Page({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-3 sm:p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="font-display text-[28px] leading-none font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="ml-auto flex gap-2">{actions}</div>}
      </div>
      <AlertBar />
      {children}
    </div>
  )
}
