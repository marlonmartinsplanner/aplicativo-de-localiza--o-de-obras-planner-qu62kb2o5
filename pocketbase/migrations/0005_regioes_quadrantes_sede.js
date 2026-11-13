// Migração 0005 — Novas regiões Norte/Sul/Leste/Oeste (quadrantes em torno da
// Sede da Empresa) substituindo R1–R4.
//
// A Sede fica em Sete Lagoas - MG: lat -19.478723, lng -44.249233
// (Rua Ubá, 425 - Vale das Palmeiras, Sete Lagoas - MG, 35701-167).
// A regra do quadrante é a mesma de src/utils/regioes.ts (fonte única no front;
// aqui é reproduzida inline porque o runtime de migrações não importa módulos):
//
//   dLat = lat - (-19.478723);  dLng = lng - (-44.249233)
//   se |dLat| >= |dLng| → Norte (dLat > 0) ou Sul (dLat < 0)
//   senão               → Leste (dLng > 0) ou Oeste (dLng < 0)
//
// Idempotente: cada obra é atualizada apenas se a região gravada differir do
// resultado da regra; rodar de novo não muda nada.
//
// Passos:
// 1. Campo `regiao` da coleção `obras`: selectValues R1–R4 → Norte/Sul/Leste/Oeste
//    (obrigando a regravar os registros antes de trocar os valores permitidos).
// 2. Recalcula a região de TODAS as obras pela regra do quadrante a partir das
//    coordenadas gravadas. Obras sem coordenada válida: fica a região que já
//    estava gravada se ela pertencer ao novo conjunto; senão a região fica
//    vazia (campo segue required — sem coordenada e sem região legada, a obra
//    precisará de revisão manual na tela Obras).
// 3. Nenhuma obra é criada para a Sede — ela é só marcador fixo no mapa.

const NOVAS = ['Norte', 'Sul', 'Leste', 'Oeste']

function regiaoPorQuadrante(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!isFinite(lat) || !isFinite(lng)) return null
  if (lat === -19.478723 && lng === -44.249233) return null // é a própria Sede

  const dLat = lat - -19.478723
  const dLng = lng - -44.249233
  if (Math.abs(dLat) >= Math.abs(dLng)) return dLat > 0 ? 'Norte' : 'Sul'
  return dLng > 0 ? 'Leste' : 'Oeste'
}

migrate(
  (app) => {
    const obras = app.findCollectionByNameOrId('obras')
    const campoRegiao = obras.fields.getByName('regiao')

    // 1. Amplia temporariamente os valores permitidos (novo + legado) para que
    //    a regravação dos registros não falhe antes da troca definitiva.
    campoRegiao.values = ['R1', 'R2', 'R3', 'R4'].concat(NOVAS)
    app.save(obras)

    // 2. Recalcula a região de cada obra pela regra do quadrante em torno da Sede.
    let atualizadas = 0
    let semCoordenada = 0
    const registros = app.findRecordsByFilter('obras', '', '', 0, 0) // todas
    for (const rec of registros) {
      const lat = rec.get('latitude')
      const lng = rec.get('longitude')
      const nova = regiaoPorQuadrante(lat, lng)

      if (nova === null) {
        // Sem coordenada (ou coordenada = Sede): mantém a região legada se ela
        // couber no novo conjunto; senão limpa para revisão manual.
        semCoordenada++
        if (NOVAS.indexOf(rec.get('regiao')) === -1) {
          rec.set('regiao', '')
          app.save(rec)
          atualizadas++
        }
        continue
      }

      if (rec.get('regiao') !== nova) {
        rec.set('regiao', nova)
        app.save(rec)
        atualizadas++
      }
    }

    // 3. Troca definitiva do select para os 4 novos valores.
    const recarregada = app.findCollectionByNameOrId('obras')
    recarregada.fields.getByName('regiao').values = NOVAS
    app.save(recarregada)

    console.log(
      '[0005_regioes_quadrantes_sede] obras reclassificadas: ' +
        atualizadas +
        ' (sem coordenada: ' +
        semCoordenada +
        ')',
    )
  },
  (app) => {
    // down: volta os valores R1–R4. Como a regra inversa não é derivável
    // (quadrantes não mapeiam 1:1 para as macrorregiões antigas), as obras
    // ficam com a região R1 para não violar o required — é uma reversão de
    // esquema, não de dados.
    const obras = app.findCollectionByNameOrId('obras')
    const campoRegiao = obras.fields.getByName('regiao')
    campoRegiao.values = ['R1', 'R2', 'R3', 'R4']
    app.save(obras)

    const registros = app.findRecordsByFilter('obras', '', '', 0, 0)
    for (const rec of registros) {
      rec.set('regiao', 'R1')
      app.save(rec)
    }
  },
)
