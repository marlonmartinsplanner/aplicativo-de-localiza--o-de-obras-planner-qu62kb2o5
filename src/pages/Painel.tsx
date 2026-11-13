import { useState, useEffect, useMemo } from 'react'
import { Navbar } from '@/components/Navbar'
import { listarObras } from '@/services/obras'
import { listarEngenheiros } from '@/services/engenheiros'
import type { Obra, Engenheiro, Regiao, SituacaoObra } from '@/types'
import { REGIOES_CONFIG, SITUACOES_CONFIG } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Building2,
  HardHat,
  AlertOctagon,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  Clock,
  Layers,
  ArrowUpRight,
  Wallet,
  ClipboardList,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PainelEngenheiros } from '@/components/PainelEngenheiros'

export default function Painel() {
  const [obras, setObras] = useState<Obra[]>([])
  const [engenheiros, setEngenheiros] = useState<Engenheiro[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true)
        const [listaObras, listaEng] = await Promise.all([listarObras(), listarEngenheiros()])
        setObras(listaObras)
        setEngenheiros(listaEng)
      } catch (e) {
        console.error('Erro ao carregar dados do painel:', e)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  // Métricas Principais (KPIs)
  const metricas = useMemo(() => {
    const total = obras.length
    const emAndamento = obras.filter((o) => o.situacao === 'Em andamento').length
    const paralisadas = obras.filter((o) => o.situacao === 'Paralisada').length
    const planejadas = obras.filter((o) => o.situacao === 'Planejada').length
    const concluidas = obras.filter((o) => o.situacao === 'Concluída').length
    const custoTotal = obras.reduce((acc, o) => acc + (o.custo || 0), 0)
    const atribuicaoTotal = obras.filter((o) => Boolean(o.engenheiro)).length
    const avancoMedio =
      total > 0 ? Math.round(obras.reduce((acc, o) => acc + (o.avanco || 0), 0) / total) : 0

    // Saldo a executar: soma de custo × (100 − avanço) / 100 de TODAS as obras.
    // Ex.: obra de R$ 1.000.000 com 90% de avanço contribui com R$ 100.000.
    const saldoExecutar = obras.reduce(
      (acc, o) => acc + (o.custo || 0) * ((100 - (o.avanco || 0)) / 100),
      0,
    )

    // Obras Planejadas: quantidade e valor somado
    const obrasPlanejadas = obras.filter((o) => o.situacao === 'Planejada')
    const valorPlanejadas = obrasPlanejadas.reduce((acc, o) => acc + (o.custo || 0), 0)

    return {
      total,
      emAndamento,
      paralisadas,
      planejadas,
      concluidas,
      custoTotal,
      atribuicaoTotal,
      avancoMedio,
      saldoExecutar,
      valorPlanejadas,
    }
  }, [obras])

  // Dados para Gráfico por Região (Quantidade e Custo) — quadrantes em torno de Sete Lagoas/MG
  const dadosPorRegiao = useMemo(() => {
    const regioes: Regiao[] = ['Norte', 'Sul', 'Leste', 'Oeste']
    return regioes.map((reg) => {
      const obrasReg = obras.filter((o) => o.regiao === reg)
      const custoReg = obrasReg.reduce((acc, o) => acc + (o.custo || 0), 0)
      const atribuidas = obrasReg.filter((o) => Boolean(o.engenheiro)).length

      return {
        regiao: reg,
        nome: REGIOES_CONFIG[reg].nome,
        total: obrasReg.length,
        atribuidas,
        pendentes: obrasReg.length - atribuidas,
        custoMilhoes: Number((custoReg / 1000000).toFixed(1)),
        cor: REGIOES_CONFIG[reg].hex,
      }
    })
  }, [obras])

  // Dados para Gráfico de Situação (Pizza/Donut)
  const dadosPorSituacao = useMemo(() => {
    const situacoes: SituacaoObra[] = ['Em andamento', 'Paralisada', 'Planejada', 'Concluída']
    return situacoes.map((sit) => {
      const qtd = obras.filter((o) => o.situacao === sit).length
      return {
        nome: sit,
        quantidade: qtd,
        cor: SITUACOES_CONFIG[sit].cor,
      }
    })
  }, [obras])

  // Formatação em Real
  const formatarMoeda = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar totalObras={metricas.total} atribuidasCount={metricas.atribuicaoTotal} />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        {/* Cabeçalho do Painel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-planner-blue" />
              Painel de Indicadores Estratégicos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Visão executiva das {metricas.total} obras da Planner Engenharia, distribuição
              orçamentária e carga operacional
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/mapa">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                Ver no Mapa Interativo
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link to="/obras">
              <Button
                size="sm"
                className="bg-planner-blue hover:bg-planner-blue-dark text-white gap-1.5 text-xs"
              >
                Tabela de Obras
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Linha de KPIs Principais */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total de Obras */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-slate-500">Total de Obras</CardTitle>
              <div className="p-2 rounded-lg bg-planner-blue/10 dark:bg-planner-blue/20 text-planner-blue">
                <Building2 className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metricas.total}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>{metricas.atribuicaoTotal} atribuídas</span>
                <span className="text-planner-blue font-semibold">
                  ({Math.round((metricas.atribuicaoTotal / (metricas.total || 1)) * 100)}%)
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Obras em Andamento */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-slate-500">Em Andamento</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{metricas.emAndamento}</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Avanço médio global de{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {metricas.avancoMedio}%
                </strong>
              </p>
            </CardContent>
          </Card>

          {/* Obras Paralisadas (Atenção Crítica) */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-slate-500">Paralisadas</CardTitle>
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">{metricas.paralisadas}</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Requerem intervenção imediata de engenharia
              </p>
            </CardContent>
          </Card>

          {/* Custo Total do Portfólio */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-slate-500">
                Orçamento Portfólio
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatarMoeda(metricas.custoTotal)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {metricas.total} obras distribuídas em Norte, Sul, Leste e Oeste de Sete Lagoas/MG
              </p>
            </CardContent>
          </Card>

          {/* Saldo a Executar — ao lado do Orçamento Portfólio */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-slate-500">Saldo a Executar</CardTitle>
              <div className="p-2 rounded-lg bg-planner-blue/10 dark:bg-planner-blue/20 text-planner-blue">
                <Wallet className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-planner-blue-dark dark:text-planner-blue-light">
                {formatarMoeda(metricas.saldoExecutar)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Valor restante de todas as obras pelo avanço físico (custo × falta %)
              </p>
            </CardContent>
          </Card>

          {/* Obras Planejadas — quantidade e valor somado */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-slate-500">Obras Planejadas</CardTitle>
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600">
                <ClipboardList className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metricas.planejadas}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Valor somado:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {formatarMoeda(metricas.valorPlanejadas)}
                </strong>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Linha de Gráficos: Obras por Região e Distribuição por Situação */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Barras: Obras por Região */}
          <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-planner-blue" />
                  Obras e Carga por Região (Norte/Sul/Leste/Oeste)
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  Obras atribuídas vs pendentes
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Quadrantes em torno do centro de Sete Lagoas/MG — {metricas.total} obras
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dadosPorRegiao}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="regiao"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                              <p className="font-bold text-sky-300">
                                {data.regiao} — {data.nome}
                              </p>
                              <p>Total de Obras: {data.total}</p>
                              <p>Com Engenheiro: {data.atribuidas}</p>
                              <p>Sem Engenheiro: {data.pendentes}</p>
                              <p>Custo Estimado: R$ {data.custoMilhoes} Milhões</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar
                      dataKey="atribuidas"
                      name="Atribuídas"
                      fill="#2196d3"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="pendentes"
                      name="Sem Engenheiro"
                      fill="#cbd5e1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detalhe dos Valores por Região */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                {dadosPorRegiao.map((d) => (
                  <div key={d.regiao} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <span className="text-xs font-bold" style={{ color: d.cor }}>
                      {d.regiao}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {d.total} obras
                    </p>
                    <p className="text-[10px] text-slate-500">R$ {d.custoMilhoes}M</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza/Donut: Obras por Situação */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                Situação das Obras
              </CardTitle>
              <CardDescription className="text-xs">
                Status físico-operacional atualizado
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosPorSituacao}
                      dataKey="quantidade"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {dadosPorSituacao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-slate-900 text-white p-2 rounded-lg shadow-xl text-xs">
                              <p className="font-semibold">{data.nome}</p>
                              <p className="text-emerald-400">
                                {data.quantidade} obras (
                                {Math.round((data.quantidade / (metricas.total || 1)) * 100)}%)
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda Manual da Situação */}
              <div className="space-y-1.5 pt-2">
                {dadosPorSituacao.map((s) => (
                  <div key={s.nome} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: s.cor }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {s.nome}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {s.quantidade}{' '}
                      <span className="text-slate-400 text-[10px] font-normal">
                        ({Math.round((s.quantidade / (metricas.total || 1)) * 100)}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel de Engenheiros e Carga de Trabalho */}
        <PainelEngenheiros obras={obras} engenheiros={engenheiros} />

        {/* Resumo Rápido para a Diretoria / Reunião */}
        <Card className="border-planner-blue/30 dark:border-planner-blue/40 bg-planner-blue/5 dark:bg-planner-blue/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-planner-blue-dark dark:text-planner-blue-light flex items-center gap-2">
              <HardHat className="w-4 h-4 text-planner-blue" />
              Quadro Resumo de Distribuição de Engenharia
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <p>
              O sistema conta com <strong>{engenheiros.length} engenheiros cadastrados</strong>{' '}
              atendendo às <strong>{metricas.total} obras</strong>. Atualmente,{' '}
              <strong>{metricas.atribuicaoTotal} obras</strong> já possuem responsável técnico
              formalizado e <strong>{metricas.total - metricas.atribuicaoTotal} obras</strong>{' '}
              aguardam alocação.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/engenheiros">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-white dark:bg-slate-900 border-planner-blue/40 dark:border-planner-blue/50"
                >
                  Gerenciar Equipe e Carga de Obras
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
