export type Regiao = 'Norte' | 'Sul' | 'Leste' | 'Oeste'

export type SituacaoObra = 'Em andamento' | 'Paralisada' | 'Planejada' | 'Concluída'

/** Centro de Sete Lagoas/MG — origem dos quadrantes Norte/Sul/Leste/Oeste */
export const CENTRO_SETE_LAGOAS = { lat: -19.4658, lng: -44.2467 }

/** Sede da empresa (Rua Ubá, 425, Sete Lagoas - MG) — marcador fixo no mapa, NÃO é origem dos quadrantes */
export const SEDE = { lat: -19.478723, lng: -44.249233 }

/**
 * Região da obra pelo quadrante dominante em relação ao CENTRO de Sete Lagoas/MG.
 * Delta de latitude define Norte/Sul; delta de longitude define Leste/Oeste.
 * O maior delta vence (empates ficam no eixo da latitude).
 */
export function regiaoPorQuadrante(lat: number, lng: number): Regiao {
  const dLat = lat - CENTRO_SETE_LAGOAS.lat
  const dLng = lng - CENTRO_SETE_LAGOAS.lng
  if (Math.abs(dLat) >= Math.abs(dLng)) {
    return dLat >= 0 ? 'Norte' : 'Sul'
  }
  return dLng >= 0 ? 'Leste' : 'Oeste'
}
