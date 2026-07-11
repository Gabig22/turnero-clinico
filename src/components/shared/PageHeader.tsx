import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <span className="mb-3 block h-1.5 w-16 rounded-full bg-primary/45" aria-hidden="true" />
        <h1 className="text-[clamp(2rem,3vw,3rem)] font-black leading-tight tracking-normal text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 md:pt-5">{actions}</div> : null}
    </div>
  )
}
