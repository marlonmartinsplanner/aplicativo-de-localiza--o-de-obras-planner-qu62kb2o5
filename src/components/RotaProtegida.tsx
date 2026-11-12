import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { HardHat } from 'lucide-react'

export function RotaProtegida({ children }: { children: ReactNode }) {
  const { estaAutenticado, carregando } = useAuth()
  const location = useLocation()

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <HardHat className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
