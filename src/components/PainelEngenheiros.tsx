import { useMemo } from 'react'
import type { Obra, Engenheiro } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HardHat, UserX, Users, MapPin } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface Props {
  obras: Obra[]
  engenheiros: Engenheiro[]
}

interface LinhaCarga {
  id: string
  nome: string
  obras: Obra[]
  qtdObras: number
  valor: number
  saldo: number
  pctObras: number
  pctValor: number
  semEngenheiro?: boolean
}

// Saldo a executar: custo × (100 − avanço) / 100 — mesma fórmula do KPI do Painel
const saldoDasObras = (lista: Obra[]) =>
  lista.reduce((acc, o) => acc + (o.custo || 0) * ((100 - (o.avanco || 0)) / 100), 0)

// Cores da marca Planner (azul/vermelho) — não reaproveita as cores das regiões
const COR_ENGENHEIRO = '#2196d3' // planner-blue
const COR_SEM_ENGENHEIRO = '#c8102e' // planner-red

export function PainelEngenheiros({ obras, engenheiros }: Props) {
  const totalObras = obras.length
  const custoTotal = obras.reduce((acc, o) => acc + (o.custo || 0), 0)
  const navigate = useNavigate()

  const linhas = useMemo<LinhaCarga[]>(() => {
    const porEng = engenheiros
      .map((eng) => {
        const obrasEng = obras.filter((o) => o.engenheiro === eng.id)
        const valor = obrasEng.reduce((acc, o) => acc + (o.custo || 0), 0)
        return {
          id: eng.id,
          nome: eng.nome,
          obras: obrasEng,
          qtdObras: obrasEng.length,
          valor,
          saldo: saldoDasObras(obrasEng),
          pctObras: totalObras > 0 ? (obrasEng.length / totalObras) * 100 : 0,
          pctValor: custoTotal > 0 ? (valor / custoTotal) * 100 : 0,
        }
      })
      .sort((a, b) => b.qtdObras - a.qtdObras || b.valor - a.valor)

    const semEng = obras.filter((o) => !o.engenheiro)
    const valorSem = semEng.reduce((acc, o) => acc + (o.custo || 0), 0)

    const linhaSem: LinhaCarga = {
      id: 'sem-engenheiro',
      nome: 'Sem engenheiro',
      obras: semEng,
      qtdObras: semEng.length,
      valor: valorSem,
      saldo: saldoDasObras(semEng),
      pctObras: totalObras > 0 ? (semEng.length / totalObras) * 100 : 0,
      pctValor: custoTotal > 0 ? (valorSem / custoTotal) * 100 : 0,
      semEngenheiro: true,
    }

    // Mostra a linha "Sem engenheiro" só quando existe algo pendente de alocação
    return semEng.length > 0 ? [...porEng, linhaSem] : porEng
  }, [obras, engenheiros, totalObras, custoTotal])

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)

  const formatarPct = (pct: number) =>
    `${pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-planner-blue" />
            Painel de Engenheiros e Carga de Trabalho
          </span>
          <span className="text-xs font-normal text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {engenheiros.length} engenheiro{engenheiros.length === 1 ? '' : 's'} · {totalObras}{' '}
            obras
          </span>
        </CardTitle>
        <CardDescription className="text-xs">
          Obras atribuídas, valor sob responsabilidade e participação no portfólio — ordenado pela
          maior carga
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {engenheiros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Nenhum engenheiro cadastrado — cadastre na tela Engenheiros
            </p>
            <Link to="/engenheiros">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-planner-blue/40 dark:border-planner-blue/50"
              >
                Ir para Engenheiros
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Cabeçalho da tabela (desktop) */}
            <div className="hidden md:grid grid-cols-[minmax(0,1.4fr)_80px_minmax(0,1.2fr)_minmax(0,1.2fr)_110px_110px] gap-3 px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <span>Engenheiro</span>
              <span className="text-center">Obras</span>
              <span>Valor das Obras</span>
              <span>Saldo a Executar</span>
              <span className="text-right">% Obras</span>
              <span className="text-right">% Valor</span>
            </div>

            {linhas.map((l) => (
              <div
                key={l.id}
                className={`rounded-lg border p-3 transition-colors ${
                  l.semEngenheiro
                    ? 'border-planner-red/30 dark:border-planner-red/40 bg-planner-red/5 dark:bg-planner-red/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-planner-blue/40 dark:hover:border-planner-blue/50'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_80px_minmax(0,1.2fr)_minmax(0,1.2fr)_110px_110px] gap-1.5 md:gap-3 items-center">
                  {/* Nome */}
                  <div className="flex items-center gap-2 min-w-0">
                    {l.semEngenheiro ? (
                      <span className="p-1.5 rounded-md bg-planner-red/10 text-planner-red shrink-0">
                        <UserX className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-md bg-planner-blue/10 text-planner-blue shrink-0">
                        <HardHat className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {l.nome}
                    </span>
                  </div>

                  {/* Quantidade de obras */}
                  <div className="text-sm font-bold text-slate-900 dark:text-white md:text-center">
                    <span className="md:hidden text-[10px] font-medium text-slate-400 uppercase mr-1">
                      Obras:
                    </span>
                    {l.qtdObras}
                  </div>

                  {/* Valor somado */}
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                    <span className="md:hidden text-[10px] font-medium text-slate-400 uppercase mr-1">
                      Valor:
                    </span>
                    {formatarMoeda(l.valor)}
                  </div>

                  {/* Saldo a executar dos contratos */}
                  <div className="text-sm font-semibold text-planner-blue-dark dark:text-planner-blue-light truncate">
                    <span className="md:hidden text-[10px] font-medium text-slate-400 uppercase mr-1">
                      Saldo:
                    </span>
                    {formatarMoeda(l.saldo)}
                  </div>

                  {/* % obras e % valor */}
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 md:text-right">
                    <span className="md:hidden text-[10px] font-medium text-slate-400 uppercase mr-1">
                      % Obras:
                    </span>
                    <span className="text-planner-blue dark:text-planner-blue-light">
                      {formatarPct(l.pctObras)}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 md:text-right">
                    <span className="md:hidden text-[10px] font-medium text-slate-400 uppercase mr-1">
                      % Valor:
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {formatarPct(l.pctValor)}
                    </span>
                  </div>
                </div>

                {/* Barra de progresso do percentual de obras */}
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(l.pctObras, l.qtdObras > 0 ? 2 : 0))}%`,
                        backgroundColor: l.semEngenheiro ? COR_SEM_ENGENHEIRO : COR_ENGENHEIRO,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {l.qtdObras} de {totalObras}
                  </span>
                </div>

                {/* Obras sob gestão — clicar leva ao Mapa na localização da obra */}
                {l.obras.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                      Obras sob gestão ({l.obras.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {l.obras.map((obra) => (
                        <button
                          key={obra.id}
                          type="button"
                          title={`Ver "${obra.nome}" no mapa`}
                          onClick={() => navigate(`/mapa?obra=${obra.id}`)}
                          className="inline-flex items-center gap-1 max-w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:border-planner-blue hover:text-planner-blue hover:bg-planner-blue/5 dark:hover:bg-planner-blue/10 transition-colors cursor-pointer"
                        >
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="font-mono font-bold">{obra.codigo}</span>
                          <span className="truncate max-w-[140px]">{obra.nome}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Rodapé de conferência */}
            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              Percentuais calculados sobre o total de {totalObras} obras e{' '}
              {formatarMoeda(custoTotal)} em orçamento do portfólio.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
