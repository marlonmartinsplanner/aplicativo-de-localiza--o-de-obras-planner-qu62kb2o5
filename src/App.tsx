import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { RotaProtegida } from '@/components/RotaProtegida'

// Telas do Sistema Planner Engenharia
import Login from '@/pages/Login'
import Mapa from '@/pages/Mapa'
import Painel from '@/pages/Painel'
import Obras from '@/pages/Obras'
import Engenheiros from '@/pages/Engenheiros'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Rota pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Redirecionamento da raiz para o Mapa */}
          <Route
            path="/"
            element={
              <RotaProtegida>
                <Navigate to="/mapa" replace />
              </RotaProtegida>
            }
          />

          {/* Telas protegidas do sistema */}
          <Route
            path="/mapa"
            element={
              <RotaProtegida>
                <Mapa />
              </RotaProtegida>
            }
          />
          <Route
            path="/painel"
            element={
              <RotaProtegida>
                <Painel />
              </RotaProtegida>
            }
          />
          <Route
            path="/obras"
            element={
              <RotaProtegida>
                <Obras />
              </RotaProtegida>
            }
          />
          <Route
            path="/engenheiros"
            element={
              <RotaProtegida>
                <Engenheiros />
              </RotaProtegida>
            }
          />

          {/* Rota 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
