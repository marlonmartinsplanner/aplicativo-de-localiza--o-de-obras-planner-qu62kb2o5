import type { Obra } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HardHat, Building2 } from 'lucide-react'

interface PainelTerceirizadosProps {
  obras: Obra[]
}

// Barra horizontal com o percentual, na paleta da marca (azul = próprias, vermelho = terceirizadas)
function BarraPercentual({ percentual, cor }: { percentual: number; cor: string }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, percentual))}%`, backgroundColor: cor }}
      />
    </div>
  )
}

// Seção "Terceirizados" do Painel — obras terceirizadas × próprias,
// SOMENTE percentual físico: quantidade de obras e % do total (sem valores em R$).
export function PainelTerceirizados({ obras }: PainelTerceirizadosProps) {
  const total = obras.length
  const terceirizadas = obras.filter((o) => o.terceirizado)
  const proprias = obras.filter((o) => !o.terceirizado)

  const pctQtdTerceirizadas = total > 0 ? (terceirizadas.length / total) * 100 : 0
  const pctQtdProprias = total > 0 ? (proprias.length / total) * 100 : 0

  return (
    <Card className="border-planner-red/20 dark:border-planner-red/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-2 rounded-lg bg-planner-red/10 text-planner-red">
            <HardHat className="w-5 h-5" />
          </div>
          Terceirizados
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {terceirizadas.length} de {total} obras
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Obras Terceirizadas */}
        <div className="rounded-lg border border-planner-red/25 bg-planner-red/5 dark:bg-planner-red/10 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-planner-red">
              <HardHat className="w-3.5 h-3.5" />
              Terceirizadas
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-planner-red leading-none">
                {terceirizadas.length}
              </div>
              <div className="text-[11px] text-muted-foreground">obras</div>
            </div>
          </div>
          <BarraPercentual percentual={pctQtdTerceirizadas} cor="#c8102e" />
          <div className="flex items-center justify-end text-[11px] text-muted-foreground">
            <span>{pctQtdTerceirizadas.toFixed(1)}% do total de obras</span>
          </div>
        </div>

        {/* Obras Próprias (não terceirizadas) */}
        <div className="rounded-lg border border-planner-blue/25 bg-planner-blue/5 dark:bg-planner-blue/10 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-planner-blue-dark dark:text-planner-blue-light">
              <Building2 className="w-3.5 h-3.5" />
              Próprias
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-planner-blue-dark dark:text-planner-blue-light leading-none">
                {proprias.length}
              </div>
              <div className="text-[11px] text-muted-foreground">obras</div>
            </div>
          </div>
          <BarraPercentual percentual={pctQtdProprias} cor="#2196d3" />
          <div className="flex items-center justify-end text-[11px] text-muted-foreground">
            <span>{pctQtdProprias.toFixed(1)}% do total de obras</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Percentual físico calculado sobre o total de {total} obra{total === 1 ? '' : 's'} — sem
          valores financeiros. A flag não interfere na contagem de engenheiros.
        </p>
      </CardContent>
    </Card>
  )
}
