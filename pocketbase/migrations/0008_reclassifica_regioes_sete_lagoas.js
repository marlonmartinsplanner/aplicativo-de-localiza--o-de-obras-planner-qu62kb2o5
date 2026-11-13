// Migração 0008 — Reclassifica as regiões (Norte/Sul/Leste/Oeste) de todas as
// obras usando o CENTRO de Sete Lagoas/MG (-19.4658, -44.2467) como origem dos
// quadrantes, em vez da Sede da Empresa (-19.478723, -44.249233).
//
// Regra idêntica à do frontend (src/utils/regioes.ts): o delta dominante —
// maior |dLat| ou |dLng| — define o quadrante; empates caem no eixo da latitude.
//
// IMPORTANTE: a Sede continua existindo como marcador fixo no mapa — só deixa
// de ser a origem dos quadrantes.
//
// Idempotente: roda de novo e o resultado é o mesmo (reclassifica pelo mesmo
// cálculo). Obras sem coordenada ficam como estão.

migrate(
  (app) => {
    const CENTRO_LAT = -19.4658
    const CENTRO_LNG = -44.2467

    const obras = app.findRecordsByFilter('obras', '', '', 5000, 0)
    let alteradas = 0

    for (const o of obras) {
      const lat = o.getFloat('latitude')
      const lng = o.getFloat('longitude')
      if (lat === 0 && lng === 0) continue // sem coordenada, não reclassifica

      const dLat = lat - CENTRO_LAT
      const dLng = lng - CENTRO_LNG
      const nova =
        Math.abs(dLat) >= Math.abs(dLng)
          ? dLat >= 0
            ? 'Norte'
            : 'Sul'
          : dLng >= 0
            ? 'Leste'
            : 'Oeste'

      if (o.getString('regiao') !== nova) {
        o.set('regiao', nova)
        app.save(o)
        alteradas++
      }
    }

    console.log(
      '[0008_reclassifica_regioes_sete_lagoas] reclassificadas ' +
        alteradas +
        ' obra(s) de ' +
        obras.length +
        '.',
    )
  },
  (app) => {
    // down: volta a usar a SEDE (-19.478723, -44.249233) como origem dos quadrantes
    const SEDE_LAT = -19.478723
    const SEDE_LNG = -44.249233

    const obras = app.findRecordsByFilter('obras', '', '', 5000, 0)
    for (const o of obras) {
      const lat = o.getFloat('latitude')
      const lng = o.getFloat('longitude')
      if (lat === 0 && lng === 0) continue

      const dLat = lat - SEDE_LAT
      const dLng = lng - SEDE_LNG
      const antiga =
        Math.abs(dLat) >= Math.abs(dLng)
          ? dLat >= 0
            ? 'Norte'
            : 'Sul'
          : dLng >= 0
            ? 'Leste'
            : 'Oeste'
      o.set('regiao', antiga)
      app.save(o)
    }
    console.log('[0008_reclassifica_regioes_sete_lagoas] down: regiões reclassificadas pela Sede.')
  },
)
