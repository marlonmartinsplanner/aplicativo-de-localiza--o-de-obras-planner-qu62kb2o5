import { useEffect, useRef } from 'react'
import { REGIOES_CONFIG } from '@/types'
import type { Regiao } from '@/types'
import { SEDE, CENTRO_SETE_LAGOAS } from '@/utils/regioes'

// Centro de visão: o CENTRO de Sete Lagoas/MG (origem dos quadrantes)
const CENTRO_VISAO: [number, number] = [CENTRO_SETE_LAGOAS.lat, CENTRO_SETE_LAGOAS.lng]

// Mesmo visual de pin da tela Mapa (círculo colorido pela região, com bico)
export function htmlPin(regiao: Regiao): string {
  const cor = REGIOES_CONFIG[regiao].hex
  return `
    <div style="
      position: relative;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${cor};
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
    ">
      <span style="color: white; font-size: 10px; font-weight: 700;">${regiao.charAt(0)}</span>
      <div style="
        position: absolute;
        bottom: -5px;
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 5px solid ${cor};
      "></div>
    </div>
  `
}

// Marcador fixo da Sede — sempre visível, não clicável, não filtrável
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

interface MiniMapaLocalizacaoProps {
  latitude: number | null
  longitude: number | null
  regiao: Regiao
  aoSelecionar: (lat: number, lng: number) => void
}

/**
 * Mini-mapa de captura de coordenadas (usado nos modais Nova/Edição de obra).
 * Leaflet via CDN, mesmo padrão da tela Mapa. Sempre desenha o marcador fixo
 * da Sede e sugere a região pelo quadrante em relação ao centro de Sete Lagoas/MG (via aoSelecionar).
 * (A Sede continua sendo marcador fixo no mini-mapa; a origem dos quadrantes é o centro da cidade.)
 */
export function MiniMapaLocalizacao({
  latitude,
  longitude,
  regiao,
  aoSelecionar,
}: MiniMapaLocalizacaoProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const sedeMarkerRef = useRef<any>(null)
  const aoSelecionarRef = useRef(aoSelecionar)
  aoSelecionarRef.current = aoSelecionar

  useEffect(() => {
    let cancelado = false

    const garantirCss = () => {
      if (document.querySelector('link[data-leaflet-css]')) return
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.setAttribute('data-leaflet-css', '1')
      document.head.appendChild(link)
    }

    const init = () => {
      if (cancelado || mapRef.current || !divRef.current) return
      const L = (window as any).L
      if (!L) return

      const map = L.map(divRef.current, {
        attributionControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        maxZoom: 21,
        minZoom: 3,
      }).setView(CENTRO_VISAO, 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 21,
        maxNativeZoom: 19,
      }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      map.on('click', (e: any) => {
        aoSelecionarRef.current(e.latlng.lat, e.latlng.lng)
      })
      mapRef.current = map

      // Marcador fixo da Sede (sempre visível, não interativo)
      sedeMarkerRef.current = L.marker([SEDE.lat, SEDE.lng], {
        icon: L.divIcon({
          className: 'custom-leaflet-pin',
          html: htmlPinSede(),
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        }),
        interactive: false,
      }).addTo(map)

      // O Dialog anima na abertura: o container pode estar 0x0 no init
      setTimeout(() => mapRef.current?.invalidateSize(), 200)
    }

    if ((window as any).L) {
      garantirCss()
      init()
    } else {
      garantirCss()
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => {
        if (!cancelado) init()
      }
      document.body.appendChild(script)
    }

    return () => {
      cancelado = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
        sedeMarkerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Marcador da obra acompanha lat/lng (clique no mapa ou digitação nos campos)
  useEffect(() => {
    const L = (window as any).L
    if (!L || !mapRef.current) return
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
    if (latitude !== null && longitude !== null) {
      markerRef.current = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: 'custom-leaflet-pin',
          html: htmlPin(regiao),
          iconSize: [28, 28],
          iconAnchor: [14, 33],
        }),
      }).addTo(mapRef.current)
      mapRef.current.setView([latitude, longitude], Math.max(mapRef.current.getZoom(), 16))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, regiao])

  return <div ref={divRef} className="h-44 w-full rounded-md z-0" />
}
