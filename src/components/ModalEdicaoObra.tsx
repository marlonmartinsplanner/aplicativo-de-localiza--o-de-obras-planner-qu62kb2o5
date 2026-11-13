import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { Obra, Engenheiro, Regiao, SituacaoObra } from '@/types'
import { REGIOES_CONFIG, SITUACOES_CONFIG } from '@/types'
import { atualizarObra, atribuirEngenheiro } from '@/services/obras'
import { MiniMapaLocalizacao } from '@/components/MiniMapaLocalizacao'
import { regiaoPorQuadrante } from '@/utils/regioes'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Building2, UserCheck, Calendar, DollarSign, Percent, MapPin } from 'lucide-react'

interface ModalEdicaoObraProps {
  obra: Obra | null
  aberto: boolean
  engenheiros: Engenheiro[]
  aoFechar: () => void
  aoSalvar: (obraAtualizada: Obra) => void
}

export function ModalEdicaoObra({
  obra,
  aberto,
  engenheiros,
  aoFechar,
  aoSalvar,
}: ModalEdicaoObraProps) {
  const { usuario } = useAuth()
  const { toast } = useToast()

  const [nome, setNome] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [regiao, setRegiao] = useState<Regiao>('Norte')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [situacao, setSituacao] = useState<SituacaoObra>('Em andamento')
  const [avanco, setAvanco] = useState(0)
  const [custo, setCusto] = useState(0)
  const [engenheiroId, setEngenheiroId] = useState<string>('nenhum')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (obra) {
      setNome(obra.nome || '')
      setMunicipio(obra.municipio || '')
      setRegiao(obra.regiao || 'Norte')
      setSituacao(obra.situacao || 'Em andamento')
      setAvanco(obra.avanco || 0)
      setCusto(obra.custo || 0)
      setEngenheiroId(obra.engenheiro || 'nenhum')
      setLatitude(obra.latitude ?? null)
      setLongitude(obra.longitude ?? null)
    }
  }, [obra])

  if (!obra) return null

  const handleSalvar = async () => {
    if (!nome.trim() || !municipio.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Nome da obra e município não podem ficar vazios.',
      })
      return
    }

    setSalvando(true)
    try {
      const engSelecionado = engenheiroId === 'nenhum' ? null : engenheiroId
      const engMudou = engSelecionado !== (obra.engenheiro || null)

      // Atualiza campos gerais da obra
      let res = await atualizarObra(obra.id, {
        nome: nome.trim(),
        municipio: municipio.trim(),
        regiao,
        situacao,
        avanco,
        custo,
        latitude: latitude ?? obra.latitude,
        longitude: longitude ?? obra.longitude,
      })

      // Se o engenheiro foi alterado, usa atribuirEngenheiro que grava histórico e carimbo
      if (engMudou) {
        res = await atribuirEngenheiro(
          obra.id,
          engSelecionado,
          usuario?.name || 'Marlon Martins',
          usuario?.id,
        )
      }

      toast({
        title: 'Obra atualizada',
        description: `Os dados da obra "${res.nome}" foram salvos com sucesso.`,
      })

      aoSalvar(res)
      aoFechar()
    } catch (err: unknown) {
      console.error('Erro ao salvar obra:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível persistir as alterações no banco.',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-planner-blue/15 dark:bg-planner-blue/25 text-planner-blue-dark dark:text-planner-blue-light">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Editar Obra: {obra.codigo}</DialogTitle>
              <DialogDescription className="text-xs">
                Atualize situação, avanço, custo, região ou atribuição de engenheiro.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="nome-obra" className="text-xs font-semibold">
                Nome do Empreendimento
              </Label>
              <Input
                id="nome-obra"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Residencial Morumbi Park"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="municipio-obra" className="text-xs font-semibold">
                Município
              </Label>
              <Input
                id="municipio-obra"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                placeholder="Ex: São Paulo"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="regiao-obra" className="text-xs font-semibold">
                Região
              </Label>
              <Select value={regiao} onValueChange={(v) => setRegiao(v as Regiao)}>
                <SelectTrigger id="regiao-obra">
                  <SelectValue placeholder="Selecione a região" />
                </SelectTrigger>
                <SelectContent>
                  {(['Norte', 'Sul', 'Leste', 'Oeste'] as Regiao[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r} - {REGIOES_CONFIG[r].nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="situacao-obra" className="text-xs font-semibold">
                Situação Atual
              </Label>
              <Select value={situacao} onValueChange={(v) => setSituacao(v as SituacaoObra)}>
                <SelectTrigger id="situacao-obra">
                  <SelectValue placeholder="Selecione a situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Paralisada">Paralisada</SelectItem>
                  <SelectItem value="Planejada">Planejada</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custo-obra" className="text-xs font-semibold flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                Custo Orçado (R$)
              </Label>
              <Input
                id="custo-obra"
                type="number"
                min="0"
                step="50000"
                value={custo}
                onChange={(e) => setCusto(Number(e.target.value))}
              />
              <span className="text-[11px] text-muted-foreground">
                Formatado:{' '}
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  custo,
                )}
              </span>
            </div>
          </div>

          {/* Slider de Avanço Físico */}
          <div className="p-3.5 rounded-lg border bg-slate-50 dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-planner-blue" />
                Avanço Físico:{' '}
                <span className="font-bold text-planner-blue-dark text-sm">{avanco}%</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {avanco === 100 ? 'Obra Completa' : avanco > 0 ? 'Em execução' : 'Não iniciada'}
              </span>
            </div>
            <Slider
              value={[avanco]}
              min={0}
              max={100}
              step={1}
              onValueChange={(vals) => setAvanco(vals[0])}
            />
          </div>

          {/* Mini-mapa: localização da obra + sugestão automática de região pelo quadrante */}
          <div className="p-3.5 rounded-lg border bg-slate-50 dark:bg-slate-900/50 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-planner-blue" />
                Localização da Obra
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Clique no mapa para marcar — a região é sugerida pelo quadrante em relação à Sede
              </span>
            </div>
            <MiniMapaLocalizacao
              latitude={latitude}
              longitude={longitude}
              regiao={regiao}
              aoSelecionar={(lat, lng) => {
                setLatitude(lat)
                setLongitude(lng)
                const sugerida = regiaoPorQuadrante(lat, lng)
                if (sugerida) setRegiao(sugerida)
              }}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Região sugerida:{' '}
              <strong className="text-planner-blue-dark dark:text-planner-blue-light">
                {regiao}
              </strong>{' '}
              (ajustável manualmente no seletor acima)
            </p>
          </div>

          {/* Atribuição de Engenheiro */}
          <div className="p-3.5 rounded-lg border border-planner-blue-200 dark:border-planner-blue/40 bg-planner-blue-50/50 dark:bg-planner-blue/10 space-y-2.5">
            <div className="flex items-center gap-1.5 text-planner-blue-dark dark:text-planner-blue-light font-semibold text-xs">
              <UserCheck className="w-4 h-4" />
              Engenheiro Responsável Único
            </div>

            <Select value={engenheiroId} onValueChange={setEngenheiroId}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue placeholder="Selecione um engenheiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Nenhum engenheiro atribuído</SelectItem>
                {engenheiros.map((eng) => (
                  <SelectItem key={eng.id} value={eng.id}>
                    {eng.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {obra.atribuido_em && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Última atribuição por: <strong>{obra.atribuido_por_nome || 'Sistema'}</strong> em{' '}
                  {new Date(obra.atribuido_em).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(obra.atribuido_em).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={salvando}
            className="bg-planner-blue hover:bg-planner-blue-dark text-white"
          >
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
