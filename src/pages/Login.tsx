import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, HardHat, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const { login, recuperarSenha, estaAutenticado, carregando } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [email, setEmail] = useState('marlon_martins@construtoraplanner.com.br')
  const [senha, setSenha] = useState('Skip@Pass')
  const [submetendo, setSubmetendo] = useState(false)
  const [erroLogin, setErroLogin] = useState<string | null>(null)

  // Modal de Recuperação de Senha
  const [modalRecuperarAberto, setModalRecuperarAberto] = useState(false)
  const [emailRecuperacao, setEmailRecuperacao] = useState('')
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false)

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <HardHat className="w-10 h-10 text-blue-600 animate-bounce" />
          <p className="text-sm text-muted-foreground font-medium">Carregando sistema Planner...</p>
        </div>
      </div>
    )
  }

  if (estaAutenticado) {
    return <Navigate to="/mapa" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErroLogin(null)
    setSubmetendo(true)

    try {
      await login(email.trim(), senha)
      toast({
        title: 'Bem-vindo à Planner Engenharia',
        description: 'Autenticação realizada com sucesso.',
      })
      navigate('/mapa')
    } catch (err: unknown) {
      console.error('Falha de login:', err)
      const mensagem =
        err instanceof Error
          ? err.message
          : 'E-mail ou senha incorretos. Verifique suas credenciais.'
      setErroLogin(mensagem)
      toast({
        variant: 'destructive',
        title: 'Falha no login',
        description: 'Não foi possível autenticar. Verifique o e-mail e a senha.',
      })
    } finally {
      setSubmetendo(false)
    }
  }

  const handleRecuperarSenha = async (e: FormEvent) => {
    e.preventDefault()
    if (!emailRecuperacao.trim()) {
      toast({
        variant: 'destructive',
        title: 'Informe o e-mail',
        description: 'Digite o endereço de e-mail associado à sua conta.',
      })
      return
    }

    setEnviandoRecuperacao(true)
    try {
      await recuperarSenha(emailRecuperacao.trim())
      toast({
        title: 'E-mail de recuperação enviado',
        description:
          'Instruções para redefinição de senha foram enviadas para o seu e-mail cadastrado.',
      })
      setModalRecuperarAberto(false)
      setEmailRecuperacao('')
    } catch (err: unknown) {
      console.error('Erro na recuperação:', err)
      toast({
        title: 'Solicitação registrada',
        description: 'Se o e-mail estiver cadastrado, um link de recuperação foi enviado.',
      })
      setModalRecuperarAberto(false)
    } finally {
      setEnviandoRecuperacao(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 relative overflow-hidden">
      {/* Elementos visuais decorativos de engenharia */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-3 shadow-lg shadow-blue-500/10">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            PLANNER <span className="text-blue-400 font-semibold text-lg">ENGENHARIA</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sistema Integrado de Distribuição e Gestão das 41 Obras
          </p>
        </div>

        <Card className="border-slate-700/60 bg-slate-900/80 backdrop-blur-md text-white shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg text-white">Acessar Plataforma</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Entre com seu e-mail corporativo e credenciais de acesso
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {erroLogin && (
                <div className="p-3 text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{erroLogin}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@construtoraplanner.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="senha" className="text-xs font-medium text-slate-300">
                    Senha
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailRecuperacao(email)
                      setModalRecuperarAberto(true)
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50 flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Acesso oficial padrão: <strong>marlon_martins@construtoraplanner.com.br</strong>
                </span>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                disabled={submetendo}
              >
                {submetendo ? (
                  <>Autenticando...</>
                ) : (
                  <>
                    Entrar no Sistema
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Construtora Planner Engenharia &copy; {new Date().getFullYear()} &bull; Gestão de Obras
          R1–R4
        </p>
      </div>

      {/* Modal de Recuperação de Senha */}
      <Dialog open={modalRecuperarAberto} onOpenChange={setModalRecuperarAberto}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-base">Recuperar Senha</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Digite seu e-mail cadastrado. Enviaremos um link seguro para você redefinir a sua
              senha.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecuperarSenha} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="recup-email" className="text-xs text-slate-300">
                E-mail para envio
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="recup-email"
                  type="email"
                  placeholder="seu.email@construtoraplanner.com.br"
                  value={emailRecuperacao}
                  onChange={(e) => setEmailRecuperacao(e.target.value)}
                  required
                  className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalRecuperarAberto(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={enviandoRecuperacao}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                {enviandoRecuperacao ? 'Enviando...' : 'Enviar Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
