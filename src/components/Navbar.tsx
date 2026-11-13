import { Home, MapPin, LayoutDashboard, Users, LogOut, Building2, Menu, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import logoPlanner from '@/assets/construtora-planner-engenharia-60ea4.png'

interface NavbarProps {
  totalObras?: number
  atribuidasCount?: number
}

export function Navbar({ totalObras, atribuidasCount }: NavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, logout, atualizarAvatar } = useAuth()
  const { toast } = useToast()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const navItems = [
    { label: 'Início', path: '/', icon: Home },
    { label: 'Mapa', path: '/mapa', icon: MapPin },
    { label: 'Painel', path: '/painel', icon: LayoutDashboard },
    { label: 'Obras', path: '/obras', icon: Building2 },
    { label: 'Engenheiros', path: '/engenheiros', icon: Users },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Aceita imagens de até 5 MB; acima disso avisa e não envia.
  const handleFotoSelecionada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Permite re-selecionar a mesma foto depois
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Escolha um arquivo de imagem (JPG, PNG, WEBP etc.) para a foto do perfil.',
      })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'A foto deve ter no máximo 5 MB. Reduza a imagem e tente novamente.',
      })
      return
    }

    setEnviandoFoto(true)
    try {
      await atualizarAvatar(file)
      toast({
        title: 'Foto atualizada',
        description: 'Sua foto de perfil foi salva com sucesso.',
      })
    } catch (err) {
      console.error('Erro ao enviar foto de perfil:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar foto',
        description: 'Não foi possível salvar a foto do perfil. Tente novamente.',
      })
    } finally {
      setEnviandoFoto(false)
    }
  }

  const iniciais =
    (usuario?.name || usuario?.email || 'U')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || 'U'

  const urlAvatar =
    usuario?.avatar && usuario.avatar !== ''
      ? `${import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') || ''}/api/files/users/${
          usuario.id
        }/${usuario.avatar}`
      : null

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo + Marca */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logoPlanner} alt="Planner Engenharia" className="w-9 h-9 object-contain" />
          <div className="leading-tight hidden sm:block">
            <span className="block text-sm font-bold text-slate-900 dark:text-white">
              Planner Engenharia
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-planner-blue font-semibold">
              Localização de Obras
            </span>
          </div>
        </Link>

        {/* Navegação Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const ativo = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    ativo
                      ? 'bg-planner-blue/10 text-planner-blue-dark dark:text-planner-blue-light font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-planner-blue'
                  }
                >
                  <item.icon className="w-4 h-4 mr-1.5" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Área do usuário (canto superior direito) */}
        <div className="flex items-center gap-2">
          {usuario && (
            <div className="flex items-center gap-2.5">
              {totalObras !== undefined && (
                <span className="hidden lg:inline text-xs text-slate-500 dark:text-slate-400">
                  {totalObras} obras · {atribuidasCount ?? 0} atribuídas
                </span>
              )}

              {/* Foto / iniciais + nome — clique abre o seletor de imagem */}
              <button
                type="button"
                onClick={() => inputFotoRef.current?.click()}
                disabled={enviandoFoto}
                title="Trocar foto do perfil"
                className="group flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-planner-blue/60 hover:bg-planner-blue/5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <span className="relative block w-8 h-8 rounded-full overflow-hidden bg-planner-blue text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {urlAvatar ? (
                    <img
                      src={urlAvatar}
                      alt={`Foto de ${usuario.name || usuario.email}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    iniciais
                  )}
                  {enviandoFoto && (
                    <span className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </span>
                  )}
                </span>
                <span className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {usuario.name || usuario.email}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-planner-blue">
                    {enviandoFoto ? 'Enviando foto…' : 'Trocar foto'}
                  </span>
                </span>
              </button>

              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFotoSelecionada}
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-500 hover:text-planner-red"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Menu Mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Navegação Mobile */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const ativo = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start ${
                    ativo
                      ? 'bg-planner-blue/10 text-planner-blue-dark dark:text-planner-blue-light font-semibold'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-500 hover:text-planner-red"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </nav>
      )}
    </header>
  )
}
