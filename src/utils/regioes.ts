import type { Regiao } from '@/types'

/**
 * SEDE DA EMPRESA — origem fixa de todas as regiões.
 * Rua Ubá, 425 - Vale das Palmeiras, Sete Lagoas - MG, 35701-167
 * 19°28'43.5"S 44°14'57.3"W
 * Não é uma obra: é apenas marcador fixo no mapa + constante usada pela regra de região.
 */
export const SEDE = {
  nome: 'Sede da Empresa',
  endereco: 'Rua Ubá, 425 - Vale das Palmeiras, Sete Lagoas - MG, 35701-167',
  lat: -19.478723,
  lng: -44.249233,
} as const

/**
 * REGRA DAS REGIÕES (fonte única — usada por mapa, filtros, formulários e pela
 * migração 0006, que reproduz a mesma fórmula pois o runtime de migrações não
 * importa módulos do front):
 *
 * As 4 regiões são os quadrantes geográficos EM TORNO DA SEDE (a Sede é a
 * origem). Como só existem 4 rótulos (Norte/Sul/Leste/Oeste) e não 8
 * (Norte-Leste etc.), a região do ponto é decidida pelo EIXO DOMINANTE:
 *
 *   dLat = lat - SEDE.lat,  dLng = lng - SEDE.lng
 *   se |dLat| >= |dLng| → Norte (dLat > 0) ou Sul (dLat < 0)
 *   senão               → Leste (dLng > 0) ou Oeste (dLng < 0)
 *
 * Ou seja: o quadrante cardeal para o qual o ponto "puxa mais" em distância
 * angular a partir da Sede. Determinístico, simétrico e idempotente.
 */
export function regiaoPorQuadrante(lat?: number | null, lng?: number | null): Regiao | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat === SEDE.lat && lng === SEDE.lng) return null

  const dLat = lat - SEDE.lat
  const dLng = lng - SEDE.lng
  if (Math.abs(dLat) >= Math.abs(dLng)) return dLat > 0 ? 'Norte' : 'Sul'
  return dLng > 0 ? 'Leste' : 'Oeste'
}
