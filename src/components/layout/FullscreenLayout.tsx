import { Outlet } from 'react-router-dom'

export function FullscreenLayout() {
  return (
    <main className="min-h-screen bg-background">
      <Outlet />
    </main>
  )
}
