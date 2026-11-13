import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, MapPin, Search } from 'lucide-react'

export interface ResultadoEndereco {
  displayName: string
  lat: number
  lng: number
}

/**
 * Geocodificação via Nominatim (OpenStreetMap) — API pública, sem chave.
 * Observação: o próprio browser não permite sobrescrever o header User-Agent
 * (header proibido no fetch); o Nominatim aceita requisições de navegador
 * usando o User-Agent/Referer enviados automaticamente.
 */
export async function buscarEnderecoNominatim(query: string): Promise<ResultadoEndereco[]> {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5' +
    '&countrycodes=br&accept-language=pt-BR&q=' +
    encodeURIComponent(query)

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new Error(`Serviço de endereços respondeu com status ${res.status}`)
  }
  const dados: unknown = await res.json()
  if (!Array.isArray(dados)) return []

  return dados
    .map((item: any) => ({
      displayName: String(item?.display_name ?? ''),
      lat: Number(item?.lat),
      lng: Number(item?.lon),
    }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng) && r.displayName)
}

interface CampoEnderecoProps {
  /** Chamado quando um endereço é confirmado (resultado único ou escolhido na lista). */
  onCoordenadas: (lat: number, lng: number, rotulo: string) => void
}

/**
 * Campo "Endereço completo" + botão Buscar (Nominatim).
 * Resultado único: aplica as coordenadas direto. Vários: lista suspensa simples.
 * Nenhum resultado ou erro de rede: mensagem amigável. Não mexe em lat/lng —
 * quem aplica é o formulário (mesmos campos usados pelo clique no mini-mapa).
 */
export function CampoEndereco({ onCoordenadas }: CampoEnderecoProps) {
  const [endereco, setEndereco] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<ResultadoEndereco[]>([])
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'info'; texto: string } | null>(null)

  const aplicar = (r: ResultadoEndereco) => {
    onCoordenadas(r.lat, r.lng, r.displayName)
    setResultados([])
    setMensagem({ tipo: 'info', texto: `Localizado: ${r.displayName}` })
  }

  const handleBuscar = async () => {
    const consulta = endereco.trim()
    if (!consulta || buscando) return

    setBuscando(true)
    setMensagem(null)
    setResultados([])
    try {
      const achados = await buscarEnderecoNominatim(consulta)
      if (achados.length === 0) {
        setMensagem({
          tipo: 'erro',
          texto: 'Endereço não encontrado — verifique ou digite as coordenadas.',
        })
      } else if (achados.length === 1) {
        aplicar(achados[0])
      } else {
        setResultados(achados)
        setMensagem({
          tipo: 'info',
          texto: `Encontrados ${achados.length} endereços — selecione o correto:`,
        })
      }
    } catch (err: unknown) {
      console.error('Erro na geocodificação (Nominatim):', err)
      setMensagem({
        tipo: 'erro',
        texto:
          'Falha de conexão com o serviço de endereços. Verifique sua internet e tente novamente.',
      })
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="endereco-obra" className="text-xs font-semibold">
        Endereço Completo
      </Label>
      <div className="flex gap-2">
        <Input
          id="endereco-obra"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleBuscar()
            }
          }}
          placeholder="Rua, número, bairro, cidade, estado"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleBuscar}
          disabled={buscando || !endereco.trim()}
          className="shrink-0"
        >
          {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {buscando ? 'Buscando...' : 'Buscar endereço'}
        </Button>
      </div>

      {mensagem && (
        <p
          className={
            mensagem.tipo === 'erro'
              ? 'text-[11px] text-red-600 dark:text-red-400'
              : 'text-[11px] text-emerald-700 dark:text-emerald-400'
          }
        >
          {mensagem.texto}
        </p>
      )}

      {resultados.length > 1 && (
        <div className="rounded-md border bg-white dark:bg-slate-900 divide-y max-h-40 overflow-y-auto">
          {resultados.map((r, i) => (
            <button
              key={`${r.lat},${r.lng},${i}`}
              type="button"
              onClick={() => aplicar(r)}
              className="w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 flex items-start gap-1.5"
            >
              <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-planner-blue" />
              <span>{r.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
