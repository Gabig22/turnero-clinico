import { Outlet } from 'react-router-dom'

import { AppSidebar, type SidebarSection } from '@/components/layout/AppSidebar'
import { DemoBadge } from '@/components/shared/DemoBadge'
import { formatFechaLarga } from '@/lib/dates/formatters'

type MainLayoutProps = {
  section: SidebarSection
}

export function MainLayout({ section }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[18rem_1fr]">
      <AppSidebar section={section} />
      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
          <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Centro clínico demo
              </p>
              <p className="mt-1 text-sm text-muted-foreground first-letter:uppercase">{formatFechaLarga()}</p>
            </div>
            <DemoBadge />
          </div>
          <AppSidebar compact section={section} />
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
