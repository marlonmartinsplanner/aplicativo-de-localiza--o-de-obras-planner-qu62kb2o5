// Migração 0006 — Sincroniza a coleção `obras` com a LISTA OFICIAL do usuário
// (41 obras, códigos OBR-001 a OBR-041 na ordem da lista enviada).
//
// A lista oficial SUBSTITUI o conteúdo atual da coleção:
// - registros cujo `codigo` NÃO está na lista oficial são apagados;
// - registros cujo `codigo` está na lista são atualizados para os dados oficiais
//   (cobre as 41 obras antigas do backup, que usavam os mesmos códigos com
//   dados diferentes);
// - códigos ausentes são inseridos.
//
// Dados oficiais: avanco = 0, engenheiro vazio (e atribuição limpa); nome,
// município, situação, custo e coordenadas exatamente como enviados.
// `regiao` é calculada AQUI pela mesma regra de quadrante de
// src/utils/regioes.ts (reproduzida inline — o runtime de migrações não importa
// módulos): quadrante dominante (maior delta) em torno da Sede
// (-19.478723, -44.249233).
//
// Idempotente: rodar de novo não muda nada (atualizações só ocorrem quando o
// valor gravado difere; comparação por codigo).

const SEDE_LAT = -19.478723
const SEDE_LNG = -44.249233

function regiaoPorQuadrante(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!isFinite(lat) || !isFinite(lng)) return null

  const dLat = lat - SEDE_LAT
  const dLng = lng - SEDE_LNG
  if (Math.abs(dLat) >= Math.abs(dLng)) return dLat > 0 ? 'Norte' : 'Sul'
  return dLng > 0 ? 'Leste' : 'Oeste'
}

// Lista oficial — nome | município | lat | lng | situação | custo (R$, centavos)
const OFICIAIS = [
  ['Reforma e Ampliação da Nova Sede', 'Sete Lagoas', -19.46784, -44.23322, 'Em andamento', 0],
  [
    'Construção da Escola Municipal ASC - Projeto Mãos Dadas',
    'Prudente de Morais',
    -19.47516,
    -44.15824,
    'Em andamento',
    2309714.18,
  ],
  [
    'Construção da Escola Municipal Branca Martins Drummond',
    'Matozinhos',
    -19.56118,
    -44.07907,
    'Em andamento',
    10982119.12,
  ],
  [
    'Pavimentação em Piso Intertravado e Revitalização Paisagística',
    'Confins',
    -19.62578,
    -43.98642,
    'Paralisada',
    203204.74,
  ],
  [
    'Construção de Fossa Comunitária do Tavares',
    'Confins',
    -19.62696,
    -43.98841,
    'Planejada',
    80018.78,
  ],
  [
    'Reforma completa da UPA Dr. Juvenal de Paiva',
    'Sete Lagoas',
    -19.46784,
    -44.23322,
    'Em andamento',
    795513.65,
  ],
  [
    'Fornecimento de Má de Obra Especializada - PISTA (TESLA)',
    'Sete Lagoas',
    -19.36386,
    -44.20357,
    'Em andamento',
    265000,
  ],
  [
    'Interligação de esgoto ETE Matadouro - Bairro Mata Grande (SAAE)',
    'Sete Lagoas',
    -19.36507,
    -44.20377,
    'Em andamento',
    322522.02,
  ],
  [
    'Construção de Salas na Sede da OAB Sete Lagoas',
    'Sete Lagoas',
    -19.46846,
    -44.23172,
    'Em andamento',
    45000,
  ],
  [
    'Registro de Preço de mão de obra de calçamento poliedrico',
    'Capim Branco',
    -19.48495,
    -44.39562,
    'Em andamento',
    90000,
  ],
  [
    'Reforma do PSF Maria Filomena',
    'São José da Lapa',
    -19.44234,
    -43.70347,
    'Planejada',
    197089.63,
  ],
  [
    'Obra de Canalização do Córrego do Beco',
    'Paraopeba',
    -19.27654,
    -44.41189,
    'Em andamento',
    12152337.18,
  ],
  [
    'Reforma do Estádio Vander Marota (Campo do Ferrugem)',
    'Paraopeba',
    -19.27425,
    -44.40825,
    'Em andamento',
    5460482.41,
  ],
  [
    'Sistema de Esgotamento Sanitário Bairro Pe. Horto',
    'Paraopeba',
    -19.27887,
    -44.38132,
    'Em andamento',
    2427996.17,
  ],
  [
    'Construção de UBS Porte 1 - Bairro Colina',
    'Paraopeba',
    -19.27654,
    -44.41189,
    'Em andamento',
    1119391.98,
  ],
  [
    'Construção de UBS Porte 1 - Bairro Champs Elysees',
    'Paraopeba',
    -19.52211,
    -43.74864,
    'Em andamento',
    1119391.98,
  ],
  [
    'Execução de obra de interiores da Câmara Municipal de Paraopeba',
    'Paraopeba',
    -19.27654,
    -44.41189,
    'Em andamento',
    415656.44,
  ],
  [
    'Reforma do Batalhão de Polícia Militar de Paraopeba',
    'Paraopeba',
    -19.48819,
    -44.24968,
    'Em andamento',
    83935.66,
  ],
  [
    'Reforma de Ponte sobre o Córrego do Cedro (divisa Caetanópolis/Paraopeba)',
    'Caetanópolis',
    -19.27654,
    -44.41189,
    'Em andamento',
    57241.83,
  ],
  [
    'Pavimentação em Bloco sextavado - Quinha e Barra Lúis Pereira',
    'Cordisburgo',
    -19.13608,
    -44.31375,
    'Em andamento',
    529190.81,
  ],
  [
    'Reforma E.M. Carlos Ribas em Maquinzinho',
    'Cordisburgo',
    -19.13608,
    -44.31375,
    'Em andamento',
    119903.7,
  ],
  ['Registro de Preço Sinalização', 'Papagaios', -19.23278, -44.02988, 'Em andamento', 106100],
  [
    'Reforma e Ampliação do Inhaúma Social Clube',
    'Inhaúma',
    -19.47374,
    -44.39738,
    'Em andamento',
    1141192.3,
  ],
  [
    'Pavimentação de Vias Rurais em Calçamento Poliedrico nos Quartéis',
    'Inhaúma',
    -19.47374,
    -44.39738,
    'Planejada',
    183840.83,
  ],
  [
    'Espaço Comunitário de Lazer São João',
    'Corinto',
    -18.38118,
    -44.46043,
    'Em andamento',
    1110422.75,
  ],
  [
    'Pavimentação da Avenida Amarante Ribeiro de Castro',
    'Corinto',
    -18.36309,
    -44.46146,
    'Em andamento',
    1536019.49,
  ],
  [
    'Registro de Preços Calçamento em Bloquete Sextavado',
    'Corinto',
    -18.36497,
    -44.45112,
    'Planejada',
    2177641.76,
  ],
  [
    'Execução de cobertura e vestiário na quadra da E.M. Prof. Antônio Ribeiro',
    'Morada Nova de Minas',
    -18.95108,
    -44.12587,
    'Em andamento',
    590945.17,
  ],
  [
    'LOTE 1 - Reforma Escola Municipal Dona Maria do Carmo',
    'Morada Nova de Minas',
    -18.95232,
    -44.12576,
    'Planejada',
    331677.23,
  ],
  [
    'LOTE 2 - Reforma Escola Municipal Professor Antônio Ribeiro - Vau das Flores',
    'Morada Nova de Minas',
    -18.95108,
    -44.12587,
    'Planejada',
    112160.6,
  ],
  [
    'LOTE 3 - Reforma do CEMEI Tia Otília',
    'Morada Nova de Minas',
    -18.95232,
    -44.12576,
    'Planejada',
    92489.81,
  ],
  [
    'Ampliação de salas de aula na E.M. Prof. Antônio Ribeiro',
    'Morada Nova de Minas',
    -18.95108,
    -44.12587,
    'Em andamento',
    113582.47,
  ],
  [
    'Pavimentação em Bloquetes Sextavado',
    'Augusto de Lima',
    -18.10648,
    -44.26034,
    'Em andamento',
    367443.54,
  ],
  [
    'Reforma das Escolas Municipais Manoel Thomaz, Coronel José Batista e Dona Maria Elias',
    'Itabira',
    -19.57589,
    -43.41007,
    'Paralisada',
    3852413.53,
  ],
  [
    'Reforma e Cobertura da Quadra da E.M. Manoel Tomaz',
    'Itabira',
    -19.57589,
    -43.41007,
    'Paralisada',
    1068290.92,
  ],
  [
    'Construção do prédio da Secretaria Municipal de Fazenda',
    'Congonhas',
    -20.52377,
    -43.88412,
    'Planejada',
    2327577.4,
  ],
  [
    'Construção de Vestários, Pista de Caminhada e Alambrado',
    'Congonhas',
    -20.52377,
    -43.88412,
    'Em andamento',
    2299210.93,
  ],
  [
    'Construção de Arquibancada no Campo Helvécio Machado',
    'Jaboticatubas',
    -19.25087,
    -43.88303,
    'Em andamento',
    456782.05,
  ],
  [
    'Pavimentação piso sextavado Av. Dom Orione - Capão Grosso',
    'Jaboticatubas',
    -19.35085,
    -43.82469,
    'Em andamento',
    472060.39,
  ],
  [
    'Serviço de Pavimentação em Piso Sextavado (Bloquete)',
    'Santana do Riacho',
    -19.24727,
    -44.03044,
    'Em andamento',
    405763.3,
  ],
  [
    'Registro de Preço Serviços de Serralheria',
    'Brumadinho',
    -19.66416,
    -43.97511,
    'Em andamento',
    457852.1,
  ],
].map(function (linha, i) {
  const n = i + 1
  const pad = n < 10 ? '00' : '0'
  return {
    codigo: 'OBR-' + pad + n,
    nome: linha[0],
    municipio: linha[1],
    latitude: linha[2],
    longitude: linha[3],
    situacao: linha[4],
    custo: linha[5],
    regiao: regiaoPorQuadrante(linha[2], linha[3]),
  }
})

migrate(
  (app) => {
    const codigosOficiais = {}
    for (const o of OFICIAIS) codigosOficiais[o.codigo] = true

    // 1. Apaga registros que não correspondem à lista oficial.
    let apagadas = 0
    const existentes = app.findRecordsByFilter('obras', '', '', 0, 0) // todas
    for (const rec of existentes) {
      if (!codigosOficiais[rec.getString('codigo')]) {
        app.delete(rec)
        apagadas++
      }
    }

    // 2. Insere/atualiza as 41 obras oficiais, comparando campo a campo.
    const obrasCol = app.findCollectionByNameOrId('obras')
    let inseridas = 0
    let atualizadas = 0

    for (const o of OFICIAIS) {
      let rec = null
      try {
        rec = app.findFirstRecordByFilter('obras', "codigo = '" + o.codigo + "'")
      } catch (_) {}

      const desejado = {
        nome: o.nome,
        municipio: o.municipio,
        regiao: o.regiao,
        situacao: o.situacao,
        avanco: 0,
        custo: o.custo,
        latitude: o.latitude,
        longitude: o.longitude,
      }

      if (rec === null) {
        rec = new Record(obrasCol)
        rec.set('codigo', o.codigo)
        for (const k in desejado) rec.set(k, desejado[k])
        // engenheiro e atribuição ficam vazios
        rec.set('engenheiro', '')
        rec.set('atribuido_em', '')
        rec.set('atribuido_por_nome', '')
        rec.set('atribuido_por', '')
        app.save(rec)
        inseridas++
        continue
      }

      let mudou = false
      for (const k in desejado) {
        if (rec.get(k) !== desejado[k]) {
          rec.set(k, desejado[k])
          mudou = true
        }
      }
      if (rec.get('engenheiro') !== '') {
        rec.set('engenheiro', '')
        mudou = true
      }
      if (rec.getString('atribuido_por_nome') !== '') {
        rec.set('atribuido_por_nome', '')
        mudou = true
      }
      if (mudou) {
        app.save(rec)
        atualizadas++
      }
    }

    console.log(
      '[0006_sync_obras_oficial] oficiais: ' +
        OFICIAIS.length +
        ' | inseridas: ' +
        inseridas +
        ' | atualizadas: ' +
        atualizadas +
        ' | apagadas (fora da lista): ' +
        apagadas +
        ' | total final: ' +
        app.countRecords('obras'),
    )
  },
  (app) => {
    // down: remove as 41 obras oficiais pelo codigo.
    for (const o of OFICIAIS) {
      try {
        const rec = app.findFirstRecordByFilter('obras', "codigo = '" + o.codigo + "'")
        app.delete(rec)
      } catch (_) {}
    }
  },
)
