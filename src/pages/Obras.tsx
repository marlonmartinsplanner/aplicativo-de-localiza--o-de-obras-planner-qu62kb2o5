import { useState, useEffect, useMemo } from 'react'
import { Navbar } from '@/components/Navbar'
import { listarObras, atribuirEngenheiro, excluirTodasObras } from '@/services/obras'
import { ExcluirTodasObrasDialog } from '@/components/ExcluirTodasObrasDialog'
import { listarEngenheiros } from '@/services/engenheiros'
import type { Obra, Engenheiro, Regiao, SituacaoObra } from '@/types'
import { REGIOES_CONFIG, SITUACOES_CONFIG } from '@/types'
import { ModalEdicaoObra } from '@/components/ModalEdicaoObra'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Building2,
  Download,
  Search,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  HardHat,
  MapPin,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  DollarSign,
  Trash2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

type CampoOrdenacao =
  | 'codigo'
  | 'nome'
  | 'municipio'
  | 'regiao'
  | 'situacao'
  | 'avanco'
  | 'custo'
  | 'engenheiro'
type DirecaoOrdenacao = 'asc' | 'desc'

export default function Obras() {
  const { usuario } = useAuth()
  const { toast } = useToast()

  const [obras, setObras] = useState<Obra[]>([])
  const [engenheiros, setEngenheiros] = useState<Engenheiro[]>([])
  const [carregando, setCarregando] = useState(true)

  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroRegiao, setFiltroRegiao] = useState<string>('todas')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('todas')
  const [filtroEngenheiro, setFiltroEngenheiro] = useState<string>('todos')

  // Ordenação
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao>('codigo')
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>('asc')

  // Edição
  const [obraParaEditar, setObraParaEditar] = useState<Obra | null>(null)
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)

  // Exclusão de todas as obras
  const [dialogExclusaoAberto, setDialogExclusaoAberto] = useState(false)
  const [excluindoTodas, setExcluindoTodas] = useState(false)

  const carregar = async () => {
    try {
      setCarregando(true)
      const [listaObras, listaEng] = await Promise.all([listarObras(), listarEngenheiros()])
      setObras(listaObras)
      setEngenheiros(listaEng)
    } catch (e) {
      console.error('Erro ao carregar obras:', e)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as obras do banco.',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleExcluirTodas = async () => {
    setExcluindoTodas(true)
    try {
      const quantidade = await excluirTodasObras()
      setObras([])
      setObraParaEditar(null)
      setModalEdicaoAberto(false)
      setDialogExclusaoAberto(false)
      toast({
        title: 'Obras excluídas',
        description: `${quantidade} obras, atribuições e histórico foram apagados do banco.`,
      })
    } catch (e) {
      console.error('Erro ao excluir obras:', e)
      // Recarrega para refletir o estado real caso a exclusão tenha sido parcial
      await carregar()
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível concluir a exclusão. A lista foi recarregada.',
      })
    } finally {
      setExcluindoTodas(false)
    }
  }

  const alternarOrdenacao = (campo: CampoOrdenacao) => {
    if (campoOrdenacao === campo) {
      setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc')
    } else {
      setCampoOrdenacao(campo)
      setDirecaoOrdenacao('asc')
    }
  }

  const obrasProcessadas = useMemo(() => {
    return obras
      .filter((o) => {
        const matchBusca =
          busca === '' ||
          o.nome.toLowerCase().includes(busca.toLowerCase()) ||
          o.codigo.toLowerCase().includes(busca.toLowerCase()) ||
          o.municipio.toLowerCase().includes(busca.toLowerCase())

        const matchRegiao = filtroRegiao === 'todas' || o.regiao === filtroRegiao
        const matchSituacao = filtroSituacao === 'todas' || o.situacao === filtroSituacao

        let matchEngenheiro = true
        if (filtroEngenheiro === 'com') matchEngenheiro = Boolean(o.engenheiro)
        else if (filtroEngenheiro === 'sem') matchEngenheiro = !o.engenheiro
        else if (filtroEngenheiro !== 'todos') matchEngenheiro = o.engenheiro === filtroEngenheiro

        return matchBusca && matchRegiao && matchSituacao && matchEngenheiro
      })
      .sort((a, b) => {
        let valA: any = a[campoOrdenacao as keyof Obra]
        let valB: any = b[campoOrdenacao as keyof Obra]

        if (campoOrdenacao === 'engenheiro') {
          const engA = engenheiros.find((e) => e.id === a.engenheiro)?.nome || ''
          const engB = engenheiros.find((e) => e.id === b.engenheiro)?.nome || ''
          valA = engA
          valB = engB
        }

        if (typeof valA === 'string') {
          return direcaoOrdenacao === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }

        return direcaoOrdenacao === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0)
      })
  }, [
    obras,
    engenheiros,
    busca,
    filtroRegiao,
    filtroSituacao,
    filtroEngenheiro,
    campoOrdenacao,
    direcaoOrdenacao,
  ])

  const exportarCSV = () => {
    try {
      const headers = [
        'Código',
        'Nome da Obra',
        'Município',
        'Região',
        'Situação',
        'Avanço (%)',
        'Custo Orçado (R$)',
        'Latitude',
        'Longitude',
        'Engenheiro Responsável',
        'Atribuído Em',
        'Atribuído Por',
      ]

      const linhas = obrasProcessadas.map((o) => {
        const engNome = engenheiros.find((e) => e.id === o.engenheiro)?.nome || 'Não atribuído'
        const dataAtrib = o.atribuido_em ? new Date(o.atribuido_em).toLocaleDateString('pt-BR') : ''

        return [
          `"${o.codigo}"`,
          `"${o.nome.replace(/"/g, '""')}"`,
          `"${o.municipio}"`,
          `"${o.regiao}"`,
          `"${o.situacao}"`,
          o.avanco,
          o.custo,
          o.latitude,
          o.longitude,
          `"${engNome}"`,
          `"${dataAtrib}"`,
          `"${o.atribuido_por_nome || ''}"`,
        ].join(';')
      })

      // BOM para Excel reconhecer acentos UTF-8
      const conteudoCsv = '\uFEFF' + [headers.join(';'), ...linhas].join('\r\n')
      const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `planner_engenharia_obras_${new Date().toISOString().substring(0, 10)}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Exportação Concluída',
        description: `${obrasProcessadas.length} obras exportadas com sucesso em formato CSV.`,
      })
    } catch (err) {
      console.error('Erro ao exportar CSV:', err)
      toast({
        variant: 'destructive',
        title: 'Falha na exportação',
        description: 'Não foi possível gerar o arquivo CSV.',
      })
    }
  }

  const limparFiltros = () => {
    setBusca('')
    setFiltroRegiao('todas')
    setFiltroSituacao('todas')
    setFiltroEngenheiro('todos')
  }

  const totalObras = obras.length
  const totalAtribuidas = obras.filter((o) => Boolean(o.engenheiro)).length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar totalObras={totalObras} atribuidasCount={totalAtribuidas} />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-5">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-planner-blue" />
              Tabela de Obras ({totalObras})
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Listagem cadastral completa com busca, ordenação de colunas, edição direta no banco e
              exportação em CSV
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={exportarCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-semibold shadow-xs"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
            <Button
              onClick={() => setDialogExclusaoAberto(true)}
              disabled={obras.length === 0 || carregando}
              className="bg-planner-red hover:bg-planner-red-dark text-white gap-2 text-xs font-semibold shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              Excluir todas as obras
            </Button>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por código, nome da obra ou cidade..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select value={filtroRegiao} onValueChange={setFiltroRegiao}>
              <SelectTrigger className="h-9 text-xs w-[140px]">
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Regiões</SelectItem>
                <SelectItem value="R1">R1 - Metropolitana</SelectItem>
                <SelectItem value="R2">R2 - Campinas</SelectItem>
                <SelectItem value="R3">R3 - Vale/Litoral</SelectItem>
                <SelectItem value="R4">R4 - Ribeirão</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
              <SelectTrigger className="h-9 text-xs w-[150px]">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Situações</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Paralisada">Paralisada</SelectItem>
                <SelectItem value="Planejada">Planejada</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroEngenheiro} onValueChange={setFiltroEngenheiro}>
              <SelectTrigger className="h-9 text-xs w-[170px]">
                <SelectValue placeholder="Engenheiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Engenheiros</SelectItem>
                <SelectItem value="com">Somente Atribuídas</SelectItem>
                <SelectItem value="sem">Sem Engenheiro</SelectItem>
                {engenheiros.map((eng) => (
                  <SelectItem key={eng.id} value={eng.id}>
                    {eng.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(busca ||
              filtroRegiao !== 'todas' ||
              filtroSituacao !== 'todas' ||
              filtroEngenheiro !== 'todos') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparFiltros}
                className="h-9 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 px-2.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar
              </Button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Exibindo <strong>{obrasProcessadas.length}</strong> de {obras.length} obras
          </div>
        </div>

        {/* Tabela de Obras */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                <TableRow>
                  <TableHead
                    className="w-[100px] cursor-pointer"
                    onClick={() => alternarOrdenacao('codigo')}
                  >
                    <div className="flex items-center gap-1">
                      Código
                      {campoOrdenacao === 'codigo' ? (
                        direcaoOrdenacao === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-planner-blue" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-planner-blue" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </TableHead>

                  <TableHead className="cursor-pointer" onClick={() => alternarOrdenacao('nome')}>
                    <div className="flex items-center gap-1">
                      Nome da Obra
                      {campoOrdenacao === 'nome' ? (
                        direcaoOrdenacao === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-planner-blue" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-planner-blue" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer"
                    onClick={() => alternarOrdenacao('municipio')}
                  >
                    <div className="flex items-center gap-1">
                      Município
                      {campoOrdenacao === 'municipio' ? (
                        direcaoOrdenacao === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-planner-blue" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-planner-blue" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </TableHead>

                  <TableHead
                    className="w-[80px] cursor-pointer text-center"
                    onClick={() => alternarOrdenacao('regiao')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Região
                      {campoOrdenacao === 'regiao' ? (
                        direcaoOrdenacao === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-planner-blue" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-planner-blue" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer"
                    onClick={() => alternarOrdenacao('situacao')}
                  >
                    <div className="flex items-center gap-1">
                      Situação
                      {campoOrdenacao === 'situacao' ? (
                        direcaoOrdenacao === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-planner-blue" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-planner-blue" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </TableHead>

                  <TableHead className="cursor-pointer" onClick={() => alternarOrdenacao('avanco')}>
                    <div className="flex items-center gap-1">
                      Avanço
                      {campoOrdenacao === 'avanco' ? (
                        direcaoOrdenacao === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-planner-blue" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-planner-blue" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => alternarOrdenacao('custo')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Custo Orçado
                      {campoOrdenacao === 'custo' ? (
                        direcaoOrdenacao === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-planner-blue" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-planner-blue" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => alternarOrdenacao('custo')}
                  >
                    {' '}
                    <div className="flex items-center gap-1">
                      Engenheiro Responsável
                      {campoOrdenacao === 'engenheiro' ? (
                        direcaoOrdenacao === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-planner-blue" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-planner-blue" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </TableHead>

                  <TableHead className="text-right w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {obrasProcessadas.map((obra) => {
                  const regConf = REGIOES_CONFIG[obra.regiao]
                  const sitConf = SITUACOES_CONFIG[obra.situacao]
                  const engResponsavel = engenheiros.find((e) => e.id === obra.engenheiro)

                  return (
                    <TableRow
                      key={obra.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="font-mono font-semibold text-xs text-slate-600 dark:text-slate-400">
                        {obra.codigo}
                      </TableCell>

                      <TableCell className="font-medium text-xs text-slate-900 dark:text-white max-w-[260px]">
                        <div className="truncate font-semibold">{obra.nome}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          Lat: {obra.latitude.toFixed(4)}, Lon: {obra.longitude.toFixed(4)}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                        {obra.municipio}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold"
                          style={{
                            borderColor: regConf?.hex,
                            color: regConf?.hex,
                          }}
                        >
                          {obra.regiao}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-medium border ${sitConf?.bgBadge || ''}`}
                        >
                          {obra.situacao}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="w-24 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            <span>{obra.avanco}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${obra.avanco}%`,
                                backgroundColor: regConf?.hex || '#2563eb',
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          maximumFractionDigits: 0,
                        }).format(obra.custo)}
                      </TableCell>

                      <TableCell className="text-xs">
                        {engResponsavel ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <HardHat className="w-3.5 h-3.5 text-planner-blue shrink-0" />
                              {engResponsavel.nome}
                            </span>
                            {obra.atribuido_em && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(obra.atribuido_em).toLocaleDateString('pt-BR')} por{' '}
                                {obra.atribuido_por_nome || 'Marlon'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 text-xs italic">
                            Não atribuído
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-planner-blue hover:bg-planner-blue/10 dark:hover:bg-planner-blue/20"
                          onClick={() => {
                            setObraParaEditar(obra)
                            setModalEdicaoAberto(true)
                          }}
                          title="Editar obra e atribuir engenheiro"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {obrasProcessadas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      {obras.length === 0
                        ? 'Nenhuma obra cadastrada.'
                        : 'Nenhuma obra corresponde aos filtros atuais.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Confirmação: Excluir todas as obras */}
      <ExcluirTodasObrasDialog
        aberto={dialogExclusaoAberto}
        aoFechar={() => setDialogExclusaoAberto(false)}
        totalObras={totalObras}
        processando={excluindoTodas}
        aoConfirmar={handleExcluirTodas}
      />

      {/* Modal de Edição */}
      <ModalEdicaoObra
        obra={obraParaEditar}
        aberto={modalEdicaoAberto}
        engenheiros={engenheiros}
        aoFechar={() => {
          setModalEdicaoAberto(false)
          setObraParaEditar(null)
        }}
        aoSalvar={(obraAtualizada) => {
          setObras((prev) => prev.map((o) => (o.id === obraAtualizada.id ? obraAtualizada : o)))
        }}
      />
    </div>
  )
}
