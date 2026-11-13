import { useState, useMemo, useEffect, useRef } from 'react'
import { Navbar } from '@/components/Navbar'
import { listarObras, atribuirEngenheiro } from '@/services/obras'
import { listarEngenheiros } from '@/services/engenheiros'
import type { Obra, Engenheiro, Regiao, SituacaoObra } from '@/types'
import { REGIOES_CONFIG, SITUACOES_CONFIG } from '@/types'
import { ModalEdicaoObra } from '@/components/ModalEdicaoObra'
import { SEDE } from '@/utils/regioes'

// Marcador FIXO da Sede da Empresa — sempre visível, não clicável, não filtrável
function htmlPinSede(): string {
  return `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0f172a;
        border: 3px solid #f8fafc;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      ">
        <span style="transform: rotate(45deg); color: #facc15; font-size: 14px;">★</span>
      </div>
      <div style="
        margin-top: 4px;
        background: #0f172a;
        color: #facc15;
        font-size: 9px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
      ">Sede da Empresa</div>
    </div>
  `
}
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
  Layers,
  Search,
  Filter,
  RotateCcw,
  AlertTriangle,
  Building2,
  HardHat,
  MapPin,
  Pencil,
  ChevronRight,
  Maximize2,
  X,
  Info,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

// Tipo para agrupar obras na mesma coordenada
export interface ClusterPonto {
  chave: string
  latitude: number
  longitude: number
  obras: Obra[]
  regioes: Set<Regiao>
  temConflitoRegiao: boolean // Caso haja regiões diferentes nas mesmas coordenadas
  corPredominante: string
}

export default function Mapa() {
  const { usuario } = useAuth()
  const { toast } = useToast()

  const [obras, setObras] = useState<Obra[]>([])
  const [engenheiros, setEngenheiros] = useState<Engenheiro[]>([])
  const [carregando, setCarregando] = useState(true)

  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroRegiao, setFiltroRegiao] = useState<string>('todas')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('todas')
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos')

  // Camada: ruas (OSM) ou satelite (Esri)
  const [camada, setCamada] = useState<'ruas' | 'satelite'>('satelite')

  // Obra selecionada para detalhe/modal
  const [obraSelecionada, setObraSelecionada] = useState<Obra | null>(null)
  const [clusterSelecionado, setClusterSelecionado] = useState<ClusterPonto | null>(null)
  const [obraParaEditar, setObraParaEditar] = useState<Obra | null>(null)
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)

  // Painel lateral visível em telas mobile/toggle
  const [mostrarListaLateral, setMostrarListaLateral] = useState(true)

  const mapaRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)

  // Carregar dados do banco
  const carregarDados = async () => {
    try {
      setCarregando(true)
      const [listaObras, listaEng] = await Promise.all([listarObras(), listarEngenheiros()])
      setObras(listaObras)
      setEngenheiros(listaEng)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar obras',
        description: 'Não foi possível buscar as obras no banco.',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Lista de municípios únicos para o filtro
  const municipiosUnicos = useMemo(() => {
    const setM = new Set<string>()
    obras.forEach((o) => {
      if (o.municipio) setM.add(o.municipio)
    })
    return Array.from(setM).sort()
  }, [obras])

  // Filtragem
  const obrasFiltradas = useMemo(() => {
    return obras.filter((o) => {
      const matchBusca =
        busca === '' ||
        o.nome.toLowerCase().includes(busca.toLowerCase()) ||
        o.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        o.municipio.toLowerCase().includes(busca.toLowerCase())

      const matchRegiao = filtroRegiao === 'todas' || o.regiao === filtroRegiao
      const matchSituacao = filtroSituacao === 'todas' || o.situacao === filtroSituacao
      const matchMunicipio = filtroMunicipio === 'todos' || o.municipio === filtroMunicipio

      return matchBusca && matchRegiao && matchSituacao && matchMunicipio
    })
  }, [obras, busca, filtroRegiao, filtroSituacao, filtroMunicipio])

  // Agrupamento por coordenadas para evitar sobreposição cega e detectar conflito de região
  const clusters = useMemo(() => {
    const mapaClusters = new Map<string, ClusterPonto>()

    obrasFiltradas.forEach((o) => {
      // Arredonda para 4 casas decimais para agrupar pontos idênticos/muito próximos
      const latFixed = Number(o.latitude.toFixed(4))
      const lonFixed = Number(o.longitude.toFixed(4))
      const chave = `${latFixed},${lonFixed}`

      if (!mapaClusters.has(chave)) {
        mapaClusters.set(chave, {
          chave,
          latitude: o.latitude,
          longitude: o.longitude,
          obras: [o],
          regioes: new Set([o.regiao]),
          temConflitoRegiao: false,
          corPredominante: REGIOES_CONFIG[o.regiao]?.hex || '#2563eb',
        })
      } else {
        const cl = mapaClusters.get(chave)!
        cl.obras.push(o)
        cl.regioes.add(o.regiao)
        if (cl.regioes.size > 1) {
          cl.temConflitoRegiao = true
        }
      }
    })

    return Array.from(mapaClusters.values())
  }, [obrasFiltradas])

  const limparFiltros = () => {
    setBusca('')
    setFiltroRegiao('todas')
    setFiltroSituacao('todas')
    setFiltroMunicipio('todos')
  }

  const filtrosAtivos =
    busca !== '' ||
    filtroRegiao !== 'todas' ||
    filtroSituacao !== 'todas' ||
    filtroMunicipio !== 'todos'

  // Carregar Leaflet dinamicamente via CDN para evitar problemas de SSR / empacotamento
  useEffect(() => {
    if (!mapaRef.current) return

    // Carregar folha de estilo do Leaflet se ainda não existir
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const initMap = () => {
      const L = (window as any).L
      if (!L || !mapaRef.current) return

      if (!leafletMapRef.current) {
        // Centro: Sete Lagoas - MG (a Sede permanece como marcador fixo ★)
        const map = L.map(mapaRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([SEDE.lat, SEDE.lng], 10)

        L.control.zoom({ position: 'bottomright' }).addTo(map)

        // Marcador FIXO da Sede da Empresa — sempre visível, não filtrável
        const iconeSede = L.divIcon({
          className: 'custom-leaflet-pin',
          html: htmlPinSede(),
          iconSize: [34, 34],
          iconAnchor: [17, 40],
        })
        L.marker([SEDE.lat, SEDE.lng], { icon: iconeSede, interactive: false }).addTo(map)

        leafletMapRef.current = map
        markersLayerRef.current = L.layerGroup().addTo(map)
      }

      const map = leafletMapRef.current

      // Remove camadas anteriores
      map.eachLayer((layer: any) => {
        if (layer._url) {
          map.removeLayer(layer)
        }
      })

      // Adiciona a camada selecionada: Esri Satellite ou OpenStreetMap
      if (camada === 'satelite') {
        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            attribution:
              'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          },
        ).addTo(map)

        // Adiciona etiquetas de ruas por cima do satélite
        L.tileLayer(
          'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            opacity: 0.8,
          },
        ).addTo(map)
      } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map)
      }

      // Atualiza os marcadores
      renderizarMarcadores(L)
    }

    if ((window as any).L) {
      initMap()
    } else {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => {
        initMap()
      }
      document.body.appendChild(script)
    }
  }, [camada])

  // Re-renderiza os marcadores quando os clusters ou obras selecionadas mudam
  const renderizarMarcadores = (LInstance?: any) => {
    const L = LInstance || (window as any).L
    if (!L || !markersLayerRef.current || !leafletMapRef.current) return

    markersLayerRef.current.clearLayers()

    clusters.forEach((cl) => {
      const temConflito = cl.temConflitoRegiao
      const qtdObras = cl.obras.length
      const regiao = cl.obras[0].regiao
      const corBase = REGIOES_CONFIG[regiao]?.hex || '#2563eb'

      let htmlIcon = ''

      if (temConflito) {
        // Sinalização explícita de conflito de regiões diferentes no mesmo ponto!
        htmlIcon = `
          <div style="
            position: relative;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #7c3aed 100%);
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
            cursor: pointer;
            animation: pulse 2s infinite;
          ">
            <span style="color: white; font-size: 11px; font-weight: 800;">! ${qtdObras}</span>
            <div style="
              position: absolute;
              bottom: -6px;
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid #ef4444;
            "></div>
          </div>
        `
      } else if (qtdObras > 1) {
        // Agrupamento de obras da MESMA região
        htmlIcon = `
          <div style="
            position: relative;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${corBase};
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <span style="color: white; font-size: 12px; font-weight: 800;">${qtdObras}</span>
            <div style="
              position: absolute;
              bottom: -6px;
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 6px solid ${corBase};
            "></div>
          </div>
        `
      } else {
        // Pin individual de obra única
        htmlIcon = `
          <div style="
            position: relative;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${corBase};
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <span style="color: white; font-size: 10px; font-weight: 700;">${regiao}</span>
            <div style="
              position: absolute;
              bottom: -5px;
              width: 0;
              height: 0;
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-top: 5px solid ${corBase};
            "></div>
          </div>
        `
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: htmlIcon,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -32],
      })

      const marker = L.marker([cl.latitude, cl.longitude], { icon: customIcon })

      marker.on('click', () => {
        setClusterSelecionado(cl)
        setObraSelecionada(cl.obras[0])
        setMostrarListaLateral(true)
      })

      markersLayerRef.current.addLayer(marker)
    })
  }

  useEffect(() => {
    renderizarMarcadores()
  }, [clusters])

  const centralizarNoPonto = (lat: number, lon: number) => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([lat, lon], 12, { duration: 1.2 })
    }
  }

  const atribuirEngenheiroRapido = async (obraId: string, engId: string | null) => {
    try {
      const atualizada = await atribuirEngenheiro(
        obraId,
        engId,
        usuario?.name || 'Marlon Martins',
        usuario?.id,
      )
      setObras((prev) => prev.map((o) => (o.id === obraId ? atualizada : o)))
      if (obraSelecionada?.id === obraId) {
        setObraSelecionada(atualizada)
      }
      toast({
        title: 'Engenheiro atualizado',
        description: 'Atribuição da obra salva no banco com registro de auditoria.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar a atribuição.',
      })
    }
  }

  const obrasComEngenheiro = obras.filter((o) => Boolean(o.engenheiro)).length

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      <Navbar totalObras={obras.length} atribuidasCount={obrasComEngenheiro} />

      {/* Barra de Filtros e Ferramentas */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-xs z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Busca e Filtros */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar obra, código ou cidade..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Select value={filtroRegiao} onValueChange={setFiltroRegiao}>
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Regiões</SelectItem>
                {(['Norte', 'Sul', 'Leste', 'Oeste'] as Regiao[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r} - {REGIOES_CONFIG[r].nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
              <SelectTrigger className="h-9 text-xs w-[140px]">
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

            <Select value={filtroMunicipio} onValueChange={setFiltroMunicipio}>
              <SelectTrigger className="h-9 text-xs w-[140px]">
                <SelectValue placeholder="Município" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Municípios</SelectItem>
                {municipiosUnicos.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filtrosAtivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparFiltros}
                className="h-9 text-xs text-planner-red hover:text-planner-red-dark hover:bg-planner-red/10 dark:hover:bg-planner-red/20 gap-1 px-2.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar
              </Button>
            )}
          </div>

          {/* Alternador de Camada e Legenda */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setCamada('satelite')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  camada === 'satelite'
                    ? 'bg-planner-blue text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Satélite Esri
              </button>
              <button
                type="button"
                onClick={() => setCamada('ruas')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  camada === 'ruas'
                    ? 'bg-planner-blue text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Ruas OSM
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarListaLateral(!mostrarListaLateral)}
              className="h-9 text-xs gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {mostrarListaLateral ? 'Ocultar Obras' : `Ver Obras (${obrasFiltradas.length})`}
              </span>
            </Button>
          </div>
        </div>

        {/* Legenda de Regiões */}
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Regiões:</span>
          {(['Norte', 'Sul', 'Leste', 'Oeste'] as Regiao[]).map((r) => {
            const conf = REGIOES_CONFIG[r]
            const qtd = obrasFiltradas.filter((o) => o.regiao === r).length
            return (
              <div key={r} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shadow-xs"
                  style={{ backgroundColor: conf.hex }}
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">{r}:</span>
                <span className="text-slate-500">({qtd})</span>
              </div>
            )
          })}

          {/* A Sede é fixa e não faz parte dos filtros — só legenda (a origem dos quadrantes é o centro de Sete Lagoas/MG) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] leading-none">★</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">Sede:</span>
            <span className="text-slate-500">
              marcador fixo (não filtrável) — quadrantes em relação ao centro de Sete Lagoas/MG
            </span>
          </div>

          <div className="flex items-center gap-1 ml-auto text-amber-600 dark:text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pin com (!) indica ponto com obras de regiões distintas</span>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal: Mapa e Painel Lateral */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Container do Leaflet */}
        <div ref={mapaRef} className="flex-1 w-full h-full z-0 bg-slate-900" />

        {/* Alerta Flutuante se houver Conflito de Regiões no Mapa */}
        {clusters.some((c) => c.temConflitoRegiao) && (
          <div className="absolute top-4 left-4 z-10 max-w-sm bg-amber-500/90 dark:bg-amber-950/90 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 p-3 rounded-xl shadow-lg backdrop-blur-md flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Atenção: Coordenada compartilhada entre regiões</p>
              <p className="text-[11px] mt-0.5 leading-snug">
                Detectamos obras registradas nas mesmas coordenadas geográficas pertencentes a
                regiões diferentes (ex: Norte e Sul no mesmo ponto). O pin no mapa destaca esse
                conflito para conferência.
              </p>
            </div>
          </div>
        )}

        {/* Lista / Detalhes Lateral */}
        {mostrarListaLateral && (
          <aside className="w-full sm:w-96 md:w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            {/* Header da lista lateral */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-planner-blue" />
                  {clusterSelecionado
                    ? `Ponto Selecionado (${clusterSelecionado.obras.length} obra${clusterSelecionado.obras.length > 1 ? 's' : ''})`
                    : `Obras (${obrasFiltradas.length}/${obras.length})`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {clusterSelecionado
                    ? clusterSelecionado.temConflitoRegiao
                      ? 'Atenção: Contém obras de regiões distintas!'
                      : `${clusterSelecionado.obras[0].municipio} - Região ${clusterSelecionado.obras[0].regiao}`
                    : 'Clique em um pin para focar ou selecione abaixo'}
                </p>
              </div>

              {clusterSelecionado && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setClusterSelecionado(null)
                    setObraSelecionada(null)
                  }}
                  className="h-7 text-xs text-slate-500 hover:text-slate-800"
                >
                  Ver todas
                </Button>
              )}
            </div>

            {/* Aviso explícito de conflito de região na lateral */}
            {clusterSelecionado?.temConflitoRegiao && (
              <div className="mx-3 mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Conflito de Região Identificado:</span>
                  <p className="text-[11px] mt-0.5">
                    As obras deste ponto possuem divisões territoriais diferentes:
                    {Array.from(clusterSelecionado.regioes).map((r) => (
                      <strong
                        key={r}
                        className="ml-1 px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100"
                      >
                        {r}
                      </strong>
                    ))}
                    . A cor do marcador segue a primeira obra do ponto.
                  </p>
                </div>
              </div>
            )}

            {/* Lista de Obras */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {(clusterSelecionado ? clusterSelecionado.obras : obrasFiltradas).map((obra) => {
                const regConf = REGIOES_CONFIG[obra.regiao]
                const sitConf = SITUACOES_CONFIG[obra.situacao]
                const estaSelecionada = obraSelecionada?.id === obra.id
                const engResponsavel = engenheiros.find((e) => e.id === obra.engenheiro)

                return (
                  <div
                    key={obra.id}
                    onClick={() => {
                      setObraSelecionada(obra)
                      centralizarNoPonto(obra.latitude, obra.longitude)
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      estaSelecionada
                        ? 'border-planner-blue bg-planner-blue/10 dark:bg-planner-blue/20 shadow-md ring-1 ring-planner-blue'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {obra.codigo}
                        </span>
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
                      </div>

                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-medium border ${sitConf?.bgBadge || ''}`}
                      >
                        {obra.situacao}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-xs text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                      {obra.nome}
                    </h3>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {obra.municipio} &bull;{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0,
                      }).format(obra.custo)}
                    </p>

                    {/* Barra de Progresso */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Avanço Físico</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {obra.avanco}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${obra.avanco}%`,
                            backgroundColor: regConf?.hex || '#2563eb',
                          }}
                        />
                      </div>
                    </div>

                    {/* Engenheiro Responsável e Ações */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <HardHat
                          className={`w-3.5 h-3.5 shrink-0 ${engResponsavel ? 'text-planner-blue' : 'text-slate-400'}`}
                        />
                        <span className="text-[11px] truncate">
                          {engResponsavel ? (
                            <strong className="text-slate-800 dark:text-slate-200">
                              {engResponsavel.nome}
                            </strong>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 italic">
                              Sem engenheiro
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-500 hover:text-planner-blue"
                          onClick={(e) => {
                            e.stopPropagation()
                            setObraParaEditar(obra)
                            setModalEdicaoAberto(true)
                          }}
                          title="Editar dados da obra e engenheiro"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {obra.atribuido_em && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        Atribuído por {obra.atribuido_por_nome || 'Marlon'} em{' '}
                        {new Date(obra.atribuido_em).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                )
              })}

              {obrasFiltradas.length === 0 && (
                <div className="text-center py-10 px-4 text-slate-500">
                  <Building2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="font-semibold text-sm">
                    {obras.length === 0 ? 'Nenhuma obra cadastrada' : 'Nenhuma obra encontrada'}
                  </p>
                  {obras.length > 0 && (
                    <>
                      <p className="text-xs text-slate-400 mt-1">
                        Tente ajustar ou limpar os filtros de busca.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={limparFiltros}
                        className="mt-3 text-xs"
                      >
                        Limpar Filtros
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Modal de Edição de Obra */}
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
          if (obraSelecionada?.id === obraAtualizada.id) {
            setObraSelecionada(obraAtualizada)
          }
          if (clusterSelecionado) {
            setClusterSelecionado((prev) =>
              prev
                ? {
                    ...prev,
                    obras: prev.obras.map((o) => (o.id === obraAtualizada.id ? obraAtualizada : o)),
                  }
                : null,
            )
          }
        }}
      />
    </div>
  )
}
