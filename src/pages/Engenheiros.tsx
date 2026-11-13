import { useState, useEffect, useMemo } from 'react'
import { Navbar } from '@/components/Navbar'
import { listarObras, zerarTodasAtribuicoes, atribuirEngenheiro } from '@/services/obras'
import { listarEngenheiros, criarEngenheiro, removerEngenheiro } from '@/services/engenheiros'
import { listarHistoricoAtribuicoes } from '@/services/historico'
import type { Obra, Engenheiro, HistoricoAtribuicao } from '@/types'
import { REGIOES_CONFIG } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Users,
  HardHat,
  UserPlus,
  Trash2,
  RotateCcw,
  Copy,
  Printer,
  CheckCircle2,
  DollarSign,
  Building2,
  History,
  AlertTriangle,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import logoPlanner from '@/assets/construtora-planner-engenharia-60ea4.png'

export default function Engenheiros() {
  const { usuario } = useAuth()
  const { toast } = useToast()

  const [engenheiros, setEngenheiros] = useState<Engenheiro[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [historico, setHistorico] = useState<HistoricoAtribuicao[]>([])
  const [carregando, setCarregando] = useState(true)

  // Modais de Cadastro e Confirmação
  const [modalNovoEngAberto, setModalNovoEngAberto] = useState(false)
  const [nomeNovoEng, setNomeNovoEng] = useState('')
  const [emailNovoEng, setEmailNovoEng] = useState('')
  const [telNovoEng, setTelNovoEng] = useState('')
  const [salvandoEng, setSalvandoEng] = useState(false)

  // Confirmações
  const [alertaZerarAberto, setAlertaZerarAberto] = useState(false)
  const [engParaRemover, setEngParaRemover] = useState<Engenheiro | null>(null)
  const [processandoAcao, setProcessandoAcao] = useState(false)

  const carregarDados = async () => {
    try {
      setCarregando(true)
      const [listaEng, listaObras, listaHist] = await Promise.all([
        listarEngenheiros(),
        listarObras(),
        listarHistoricoAtribuicoes(20),
      ])
      setEngenheiros(listaEng)
      setObras(listaObras)
      setHistorico(listaHist)
    } catch (e) {
      console.error('Erro ao carregar dados:', e)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Cálculo de Carga de cada Engenheiro
  const painelCarga = useMemo(() => {
    return engenheiros.map((eng) => {
      const obrasDoEng = obras.filter((o) => o.engenheiro === eng.id)
      const qtdObras = obrasDoEng.length
      const custoTotal = obrasDoEng.reduce((acc, o) => acc + (o.custo || 0), 0)
      const avancoMedio =
        qtdObras > 0
          ? Math.round(obrasDoEng.reduce((acc, o) => acc + (o.avanco || 0), 0) / qtdObras)
          : 0

      // Distribuição por região
      const r1 = obrasDoEng.filter((o) => o.regiao === 'R1').length
      const r2 = obrasDoEng.filter((o) => o.regiao === 'R2').length
      const r3 = obrasDoEng.filter((o) => o.regiao === 'R3').length
      const r4 = obrasDoEng.filter((o) => o.regiao === 'R4').length

      return {
        ...eng,
        obras: obrasDoEng,
        qtdObras,
        custoTotal,
        avancoMedio,
        distribuicao: { r1, r2, r3, r4 },
      }
    })
  }, [engenheiros, obras])

  // Obras sem engenheiro atribuído
  const obrasSemEngenheiro = useMemo(() => {
    return obras.filter((o) => !o.engenheiro)
  }, [obras])

  const custoTotalSemEngenheiro = useMemo(() => {
    return obrasSemEngenheiro.reduce((acc, o) => acc + (o.custo || 0), 0)
  }, [obrasSemEngenheiro])

  const handleCadastrarEngenheiro = async () => {
    if (!nomeNovoEng.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nome obrigatório',
        description: 'Digite o nome do engenheiro para cadastrar.',
      })
      return
    }

    setSalvandoEng(true)
    try {
      const novo = await criarEngenheiro({
        nome: nomeNovoEng.trim(),
        email: emailNovoEng.trim() || undefined,
        telefone: telNovoEng.trim() || undefined,
      })

      setEngenheiros((prev) => [...prev, novo])
      setNomeNovoEng('')
      setEmailNovoEng('')
      setTelNovoEng('')
      setModalNovoEngAberto(false)

      toast({
        title: 'Engenheiro Cadastrado',
        description: `${novo.nome} foi adicionado com sucesso.`,
      })
    } catch (e) {
      console.error(e)
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: 'Não foi possível cadastrar o engenheiro.',
      })
    } finally {
      setSalvandoEng(false)
    }
  }

  const handleRemoverEngenheiro = async () => {
    if (!engParaRemover) return
    setProcessandoAcao(true)
    try {
      await removerEngenheiro(engParaRemover.id)
      setEngenheiros((prev) => prev.filter((e) => e.id !== engParaRemover.id))
      // Atualiza obras locais
      setObras((prev) =>
        prev.map((o) => (o.engenheiro === engParaRemover.id ? { ...o, engenheiro: undefined } : o)),
      )
      toast({
        title: 'Engenheiro Removido',
        description: `${engParaRemover.nome} foi removido e suas obras foram desvinculadas.`,
      })
      setEngParaRemover(null)
    } catch (e) {
      console.error(e)
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: 'Não foi possível remover o engenheiro.',
      })
    } finally {
      setProcessandoAcao(false)
    }
  }

  const handleZerarAtribuicoes = async () => {
    setProcessandoAcao(true)
    try {
      const alteradas = await zerarTodasAtribuicoes(usuario?.name || 'Marlon Martins', usuario?.id)
      setObras((prev) =>
        prev.map((o) => ({ ...o, engenheiro: undefined, atribuido_em: undefined })),
      )
      setAlertaZerarAberto(false)

      // Atualiza histórico
      const novoHist = await listarHistoricoAtribuicoes(20)
      setHistorico(novoHist)

      toast({
        title: 'Atribuições Zeradas',
        description: `Todas as atribuições foram removidas (${alteradas} obras liberadas).`,
      })
    } catch (e) {
      console.error(e)
      toast({
        variant: 'destructive',
        title: 'Erro ao zerar',
        description: 'Não foi possível zerar as atribuições.',
      })
    } finally {
      setProcessandoAcao(false)
    }
  }

  // Gerar texto do Resumo para Reunião
  const gerarTextoResumo = () => {
    const dataHora = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    let texto = `PLANNER ENGENHARIA - RESUMO DE DISTRIBUIÇÃO DAS OBRAS\r\n`
    texto += `Gerado em: ${dataHora} por ${usuario?.name || 'Marlon Martins'}\r\n`
    texto += `------------------------------------------------------------\r\n\r\n`

    texto += `CARGA POR ENGENHEIRO:\r\n`
    painelCarga.forEach((eng) => {
      const custoFmt = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(eng.custoTotal)
      texto += `• ${eng.nome}: ${eng.qtdObras} obras | Custo Somado: ${custoFmt} | Avanço Médio: ${eng.avancoMedio}%\r\n`
      texto += `  (R1: ${eng.distribuicao.r1} | R2: ${eng.distribuicao.r2} | R3: ${eng.distribuicao.r3} | R4: ${eng.distribuicao.r4})\r\n`
      eng.obras.forEach((o) => {
        texto += `    - [${o.codigo}] ${o.nome} (${o.municipio} - ${o.regiao}) - ${o.situacao} (${o.avanco}%)\r\n`
      })
      texto += `\r\n`
    })

    if (obrasSemEngenheiro.length > 0) {
      const custoPendFmt = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(custoTotalSemEngenheiro)
      texto += `OBRAS PENDENTES DE ENGENHEIRO (${obrasSemEngenheiro.length} obras - ${custoPendFmt}):\r\n`
      obrasSemEngenheiro.forEach((o) => {
        texto += `• [${o.codigo}] ${o.nome} (${o.municipio} - ${o.regiao}) - ${o.situacao}\r\n`
      })
      texto += `\r\n`
    }

    texto += `------------------------------------------------------------\r\n`
    texto += `TOTAL: ${obras.length} obras cadastradas | ${obras.length - obrasSemEngenheiro.length} atribuídas\r\n`

    return texto
  }

  const copiarResumo = () => {
    const texto = gerarTextoResumo()
    navigator.clipboard.writeText(texto)
    toast({
      title: 'Resumo Copiado',
      description: 'O texto do resumo para a reunião foi copiado para a área de transferência.',
    })
  }

  const imprimirResumo = () => {
    window.print()
  }

  const formatarMoeda = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="print:hidden">
        <Navbar
          totalObras={obras.length}
          atribuidasCount={obras.length - obrasSemEngenheiro.length}
        />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:border-b-2 print:border-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <Users className="w-6 h-6 text-planner-blue print:hidden" />
                Painel de Engenheiros e Carga de Trabalho
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Distribuição de responsabilidade técnica, quantidade de obras e custo orçado somado
              por engenheiro
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button onClick={copiarResumo} variant="outline" size="sm" className="text-xs gap-1.5">
              <Copy className="w-3.5 h-3.5" />
              Copiar Resumo
            </Button>

            <Button
              onClick={imprimirResumo}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir para Reunião
            </Button>

            <Button
              onClick={() => setAlertaZerarAberto(true)}
              variant="outline"
              size="sm"
              className="text-xs text-planner-red hover:text-planner-red-dark hover:bg-planner-red/10 dark:hover:bg-planner-red/20 border-planner-red/30 dark:border-planner-red/40 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Zerar Atribuições
            </Button>

            <Button
              onClick={() => setModalNovoEngAberto(true)}
              size="sm"
              className="bg-planner-blue hover:bg-planner-blue-dark text-white text-xs gap-1.5 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Novo Engenheiro
            </Button>
          </div>
        </div>

        {/* Resumo da Reunião (Visível apenas na impressão) */}
        <div className="hidden print:block p-4 mb-4 bg-white border border-slate-300 rounded text-xs space-y-2">
          <img
            src={logoPlanner}
            alt="Construtora Planner Engenharia"
            className="print-logo h-12 w-auto mb-2"
          />
          <p className="font-bold text-sm">
            PLANNER ENGENHARIA &bull; PAUTA DE DISTRIBUIÇÃO DAS 41 OBRAS
          </p>
          <p>
            Data de emissão: {new Date().toLocaleDateString('pt-BR')} &bull; Responsável:{' '}
            {usuario?.name || 'Marlon Martins'}
          </p>
        </div>

        {/* Painel de Carga dos Engenheiros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {painelCarga.map((eng) => (
            <Card
              key={eng.id}
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
            >
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-planner-blue/10 dark:bg-planner-blue/20 flex items-center justify-center text-planner-blue-dark dark:text-planner-blue-light font-bold text-sm">
                      {eng.nome
                        .replace('Eng. ', '')
                        .replace('Engª. ', '')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                        {eng.nome}
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Briefcase className="w-3 h-3" />
                        Engenheiro de Obras
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEngParaRemover(eng)}
                    className="h-8 w-8 text-slate-400 hover:text-planner-red print:hidden"
                    title="Remover engenheiro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3.5 flex-1">
                {/* Métricas Principais deste Engenheiro */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-planner-blue/5 dark:bg-planner-blue/15 border border-planner-blue-200 dark:border-planner-blue/30">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">
                      Carga de Obras
                    </span>
                    <p className="text-xl font-bold text-planner-blue-dark dark:text-planner-blue-light mt-0.5">
                      {eng.qtdObras}{' '}
                      <span className="text-xs font-normal text-slate-400">obras</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">
                      Custo Somado
                    </span>
                    <p
                      className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate"
                      title={formatarMoeda(eng.custoTotal)}
                    >
                      {formatarMoeda(eng.custoTotal)}
                    </p>
                  </div>
                </div>

                {/* Avanço Médio */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Avanço Médio</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {eng.avancoMedio}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-planner-blue h-full rounded-full"
                      style={{ width: `${eng.avancoMedio}%` }}
                    />
                  </div>
                </div>

                {/* Distribuição por Região */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                    Distribuição Regional:
                  </span>
                  <div className="grid grid-cols-4 gap-1 text-center text-xs">
                    <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                      <span className="font-bold text-blue-600">R1</span>
                      <p className="text-[11px] font-semibold">{eng.distribuicao.r1}</p>
                    </div>
                    <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                      <span className="font-bold text-emerald-600">R2</span>
                      <p className="text-[11px] font-semibold">{eng.distribuicao.r2}</p>
                    </div>
                    <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                      <span className="font-bold text-amber-600">R3</span>
                      <p className="text-[11px] font-semibold">{eng.distribuicao.r3}</p>
                    </div>
                    <div className="p-1 rounded bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900">
                      <span className="font-bold text-violet-600">R4</span>
                      <p className="text-[11px] font-semibold">{eng.distribuicao.r4}</p>
                    </div>
                  </div>
                </div>

                {/* Lista de Obras sob responsabilidade */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Obras sob gestão ({eng.obras.length}):
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                    {eng.obras.map((o) => (
                      <div
                        key={o.id}
                        className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-[11px]"
                      >
                        <div className="truncate mr-2">
                          <span className="font-mono font-bold text-slate-500 mr-1">
                            [{o.codigo}]
                          </span>
                          <span className="text-slate-800 dark:text-slate-200">{o.nome}</span>
                        </div>
                        <span className="text-slate-400 shrink-0 font-medium">{o.regiao}</span>
                      </div>
                    ))}
                    {eng.obras.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic py-1 text-center">
                        Nenhuma obra atribuída a este engenheiro.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Obras Pendentes de Engenheiro */}
        {obrasSemEngenheiro.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Obras sem Engenheiro Responsável ({obrasSemEngenheiro.length})
                  </CardTitle>
                  <CardDescription className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Estas obras precisam de alocação de equipe técnica. Custo somado desatendido:{' '}
                    {formatarMoeda(custoTotalSemEngenheiro)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {obrasSemEngenheiro.map((o) => (
                  <div
                    key={o.id}
                    className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        <span className="font-mono text-slate-500 mr-1">[{o.codigo}]</span>
                        {o.nome}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {o.municipio} &bull; Região {o.regiao} &bull; {formatarMoeda(o.custo)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico Recente de Atribuições */}
        <Card className="border-slate-200 dark:border-slate-800 print:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-planner-blue" />
              Auditoria e Histórico de Atribuições
            </CardTitle>
            <CardDescription className="text-xs">
              Registro cronológico de quem atribuiu cada engenheiro e quando a alteração foi
              efetuada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {historico.map((h) => (
                <div
                  key={h.id}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-planner-blue" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {h.obra_nome || 'Obra'}
                      </span>
                      <span className="text-slate-400 mx-1.5">&bull;</span>
                      <span className="text-planner-blue-dark dark:text-planner-blue-light font-medium">
                        {h.acao}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 shrink-0">
                    Por <strong>{h.atribuido_por_nome || 'Marlon'}</strong> em{' '}
                    {new Date(h.created).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(h.created).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}

              {historico.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 italic">
                  Nenhuma atribuição registrada no histórico ainda.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modal: Novo Engenheiro */}
      <Dialog open={modalNovoEngAberto} onOpenChange={setModalNovoEngAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-planner-blue" />
              Cadastrar Novo Engenheiro
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adicione um novo profissional para compor a equipe técnica da Planner Engenharia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome-eng" className="text-xs font-semibold">
                Nome Completo do Engenheiro
              </Label>
              <Input
                id="nome-eng"
                placeholder="Ex: Eng. Ricardo Sampaio"
                value={nomeNovoEng}
                onChange={(e) => setNomeNovoEng(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email-eng" className="text-xs font-semibold">
                E-mail Corporativo
              </Label>
              <Input
                id="email-eng"
                type="email"
                placeholder="ricardo.sampaio@construtoraplanner.com.br"
                value={emailNovoEng}
                onChange={(e) => setEmailNovoEng(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tel-eng" className="text-xs font-semibold">
                Telefone / WhatsApp
              </Label>
              <Input
                id="tel-eng"
                placeholder="(11) 98765-4321"
                value={telNovoEng}
                onChange={(e) => setTelNovoEng(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setModalNovoEngAberto(false)}
              disabled={salvandoEng}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCadastrarEngenheiro}
              disabled={salvandoEng}
              className="bg-planner-blue hover:bg-planner-blue-dark text-white"
            >
              {salvandoEng ? 'Salvando...' : 'Cadastrar Engenheiro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de Confirmação: Zerar Atribuições */}
      <AlertDialog open={alertaZerarAberto} onOpenChange={setAlertaZerarAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-planner-red">
              <AlertTriangle className="w-5 h-5 text-planner-red" />
              Zerar Todas as Atribuições de Obras?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              Esta ação removerá o engenheiro responsável de <strong>todas as obras</strong> do
              sistema de uma só vez. As obras ficarão desvinculadas e o histórico registrará a
              operação de zeramento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processandoAcao}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleZerarAtribuicoes}
              disabled={processandoAcao}
              className="bg-planner-red hover:bg-planner-red-dark text-white"
            >
              {processandoAcao ? 'Zerando...' : 'Confirmar e Zerar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alerta de Confirmação: Remover Engenheiro */}
      <AlertDialog
        open={Boolean(engParaRemover)}
        onOpenChange={(open) => !open && setEngParaRemover(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-planner-red">
              <Trash2 className="w-5 h-5" />
              Remover {engParaRemover?.nome}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              O engenheiro será excluído do cadastro e todas as obras atualmente sob sua
              responsabilidade ficarão sem engenheiro atribuído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processandoAcao}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoverEngenheiro}
              disabled={processandoAcao}
              className="bg-planner-red hover:bg-planner-red-dark text-white"
            >
              {processandoAcao ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
