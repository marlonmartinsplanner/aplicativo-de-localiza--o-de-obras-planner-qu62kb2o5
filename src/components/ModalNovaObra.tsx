import { useState, useEffect, useMemo, useRef } from 'react'
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
import { REGIOES_CONFIG, SITUACOES_CONFIG } from '@/types'
import type { Obra, Regiao, SituacaoObra } from '@/types'
import { criarObra, resolverCodigoObra } from '@/services/obras'
import { MiniMapaLocalizacao } from '@/components/MiniMapaLocalizacao'
import { regiaoPorQuadrante } from '@/utils/regioes'
import { useToast } from '@/hooks/use-toast'
import {
  Building2,
  DollarSign,
  Percent,
  MapPin,
  MousePointerClick,
  LocateFixed,
} from 'lucide-react'

interface ModalNovaObraProps {
  aberto: boolean
  codigoSugerido: string
  codigosExistentes: string[]
  aoFechar: () => void
  aoSalvar: (novaObra: Obra) => void
}

export function ModalNovaObra({
  aberto,
  codigoSugerido,
  codigosExistentes,
  aoFechar,
  aoSalvar,
}: ModalNovaObraProps) {
  const { toast } = useToast()

  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [regiao, setRegiao] = useState<Regiao>('Norte')
  const [situacao, setSituacao] = useState<SituacaoObra>('Planejada')
  const [avanco, setAvanco] = useState(0)
  const [custo, setCusto] = useState(0)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (aberto) {
      setCodigo(codigoSugerido)
      setNome('')
      setMunicipio('')
      setRegiao('Norte')
      setSituacao('Planejada')
      setAvanco(0)
      setCusto(0)
      setLatitude(null)
      setLongitude(null)
    }
  }, [aberto, codigoSugerido])

  // Campo vazio não é erro: ao salvar, usa a sugestão automática da sequência.
  const erroCodigo = useMemo(() => {
    const valor = codigo.trim().toLowerCase()
    if (!valor) return null
    const duplicado = codigosExistentes.some((c) => c.trim().toLowerCase() === valor)
    if (duplicado) return 'Já existe uma obra com este código.'
    return null
  }, [codigo, codigosExistentes])

  if (!aberto) return null

  const handleSalvar = async () => {
    if (erroCodigo) {
      toast({
        variant: 'destructive',
        title: 'Código inválido',
        description: erroCodigo,
      })
      return
    }
    if (!nome.trim() || !municipio.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Nome da obra e município não podem ficar vazios.',
      })
      return
    }
    if (latitude === null || longitude === null) {
      toast({
        variant: 'destructive',
        title: 'Localização não marcada',
        description: 'Clique no mini-mapa para marcar o ponto da obra ou digite lat/lng.',
      })
      return
    }

    setSalvando(true)
    try {
      const codigoFinal = await resolverCodigoObra(codigo)
      const nova = await criarObra({
        codigo: codigoFinal,
        nome: nome.trim(),
        municipio: municipio.trim(),
        regiao,
        situacao,
        avanco,
        custo,
        latitude,
        longitude,
      })
      toast({
        title: 'Obra criada',
        description: `A obra "${nova.nome}" (${nova.codigo}) foi cadastrada com sucesso.`,
      })
      aoSalvar(nova)
      aoFechar()
    } catch (err: unknown) {
      console.error('Erro ao criar obra:', err)
      const duplicado = err instanceof Error && err.message === 'CODIGO_DUPLICADO'
      toast({
        variant: 'destructive',
        title: duplicado ? 'Código inválido' : 'Erro ao criar obra',
        description: duplicado
          ? 'Já existe uma obra com este código.'
          : 'Não foi possível gravar a nova obra no banco.',
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
              <DialogTitle className="text-lg">Adicionar Obra</DialogTitle>
              <DialogDescription className="text-xs">
                Cadastre um novo empreendimento. Ele passa a aparecer na Tabela de Obras e no Mapa.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="codigo-obra" className="text-xs font-semibold">
                Código
              </Label>
              <Input
                id="codigo-obra"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder={codigoSugerido}
                className="font-mono"
              />
              {erroCodigo ? (
                <p className="text-[11px] text-planner-red">{erroCodigo}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Edite livremente. Vazio ao salvar usa {codigoSugerido}.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="municipio-obra" className="text-xs font-semibold">
                Município <span className="text-planner-red">*</span>
              </Label>
              <Input
                id="municipio-obra"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                placeholder="Ex: São Paulo"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="nome-obra" className="text-xs font-semibold">
                Nome do Empreendimento <span className="text-planner-red">*</span>
              </Label>
              <Input
                id="nome-obra"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Residencial Morumbi Park"
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
                  {Object.keys(SITUACOES_CONFIG).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SITUACOES_CONFIG[s as SituacaoObra].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
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

          {/* Localização: mini-mapa clicável + lat/lng */}
          <div className="p-3.5 rounded-lg border border-planner-blue/30 dark:border-planner-blue/40 bg-planner-blue/5 dark:bg-planner-blue/10 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-planner-blue-dark dark:text-planner-blue-light font-semibold text-xs">
                <MapPin className="w-4 h-4" />
                Localização da Obra
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <MousePointerClick className="w-3.5 h-3.5" />
                Clique no mapa para marcar o ponto
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="lat-obra" className="text-[11px] text-slate-500">
                  Latitude
                </Label>
                <Input
                  id="lat-obra"
                  type="number"
                  step="any"
                  className="h-8 text-xs font-mono"
                  value={latitude ?? ''}
                  onChange={(e) => {
                    const v = e.target.value === '' ? null : Number(e.target.value)
                    setLatitude(v === null || Number.isNaN(v) ? null : v)
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lng-obra" className="text-[11px] text-slate-500">
                  Longitude
                </Label>
                <Input
                  id="lng-obra"
                  type="number"
                  step="any"
                  className="h-8 text-xs font-mono"
                  value={longitude ?? ''}
                  onChange={(e) => {
                    const v = e.target.value === '' ? null : Number(e.target.value)
                    setLongitude(v === null || Number.isNaN(v) ? null : v)
                  }}
                />
              </div>
            </div>

            <div className="h-44 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
              <MiniMapaLocalizacao
                latitude={latitude}
                longitude={longitude}
                regiao={regiao}
                aoSelecionar={(lat, lng) => {
                  const nLat = Number(lat.toFixed(6))
                  const nLng = Number(lng.toFixed(6))
                  setLatitude(nLat)
                  setLongitude(nLng)
                  const sugerida = regiaoPorQuadrante(nLat, nLng)
                  if (sugerida) setRegiao(sugerida)
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Região sugerida pelo quadrante em relação a Sete Lagoas/MG:{' '}
              <strong className="text-planner-blue-dark dark:text-planner-blue-light">
                {regiao}
              </strong>{' '}
              (ajustável manualmente no seletor acima)
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                {latitude !== null && longitude !== null
                  ? `Ponto marcado: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                  : 'Nenhum ponto marcado ainda.'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] gap-1 text-planner-blue hover:text-planner-blue-dark"
                onClick={() => {
                  setLatitude(null)
                  setLongitude(null)
                }}
              >
                <LocateFixed className="w-3.5 h-3.5" />
                Limpar ponto
              </Button>
            </div>
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
            {salvando ? 'Salvando...' : 'Salvar Obra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
