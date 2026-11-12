import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  MapPin,
  LayoutDashboard,
  HardHat,
  Users,
  LogOut,
  Building2,
  Menu,
  X,
  FileSpreadsheet,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavbarProps {
  totalObras?: number
  atribuidasCount?: number
}

export function Navbar({ totalObras = 41, atribuidasCount }: NavbarProps) {
  const { usuario, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  const itensNavegacao = [
    { label: 'Mapa', path: '/mapa', icon: MapPin },
    { label: 'Painel', path: '/painel', icon: LayoutDashboard },
    { label: 'Obras (41)', path: '/obras', icon: FileSpreadsheet },
    { label: 'Engenheiros', path: '/engenheiros', icon: Users },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getIniciais = (nome?: string) => {
    if (!nome) return 'PL'
    const partes = nome.split(' ')
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80 shadow-xs">
      <div className="flex h-16 items-center px-4 md:px-6 justify-between max-w-7xl mx-auto">
        {/* Logo / Marca */}
        <div className="flex items-center gap-6">
          <Link to="/mapa" className="flex items-center gap-2.5 font-bold tracking-tight">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  PLANNER
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  ENGENHARIA
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                Distribuição das 41 Obras
              </span>
            </div>
          </Link>

          {/* Links desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {itensNavegacao.map((item) => {
              const Icon = item.icon
              const ativo = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                    ativo
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${ativo ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Lado Direito: Status e Usuário */}
        <div className="flex items-center gap-3">
          {atribuidasCount !== undefined && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Atribuídas: <strong>{atribuidasCount}</strong>/{totalObras}
              </span>
            </div>
          )}

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative flex items-center gap-2.5 h-10 px-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Avatar className="h-8 w-8 border border-blue-200 dark:border-blue-900">
                  <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                    {getIniciais(usuario?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {usuario?.name || 'Marlon Martins'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[140px]">
                    {usuario?.email || 'Engenheiro'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold">{usuario?.name || 'Marlon Martins'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{usuario?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate('/engenheiros')}
                className="text-xs cursor-pointer"
              >
                <Users className="w-4 h-4 mr-2" />
                Painel de Engenheiros
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/obras')}
                className="text-xs cursor-pointer"
              >
                <HardHat className="w-4 h-4 mr-2" />
                Tabela de Obras
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-xs text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair da Conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botão Mobile Hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-600 dark:text-slate-300"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Menu mobile dropdown */}
      {menuAberto && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          {itensNavegacao.map((item) => {
            const Icon = item.icon
            const ativo = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuAberto(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg ${
                  ativo
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
