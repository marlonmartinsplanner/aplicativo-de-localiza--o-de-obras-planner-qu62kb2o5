/**
 * Integração com o sistema externo "Obra Prima".
 *
 * Rotas customizadas sob /backend/v1/:
 * - GET  /backend/v1/obras-export      — o Obra Prima PUXA os dados (Bearer token).
 * - POST /backend/v1/obra-prima/enviar — o app EMPURRA os dados para a URL cadastrada.
 *
 * Somente leitura das coleções obras/engenheiros — nunca altera nem apaga registros.
 *
 * IMPORTANTE: todo o código vive dentro dos callbacks — o JSVM do PocketBase
 * executa cada callback em um pool separado e não enxerga declarações de nível superior.
 */

// ---- Rota de exportação (o Obra Prima puxa os dados) ----
routerAdd(
  'GET',
  '/backend/v1/obras-export',
  function (e) {
    var token = ''
    var auth = e.request.header.get('Authorization')
    if (auth && auth.length > 7 && auth.substring(0, 7).toLowerCase() === 'bearer ') {
      token = auth.substring(7).trim()
    }

    if (!token) {
      throw new BadRequestError(
        'Token de acesso ausente. Informe o header Authorization: Bearer <token>.',
      )
    }

    var config = null
    try {
      config = $app.findFirstRecordByData('integracao_config', 'api_token:isset', true)
    } catch (_) {
      config = null
    }
    if (
      !config ||
      config.getString('api_token') === '' ||
      config.getString('api_token') !== token
    ) {
      throw new ForbiddenError('Token de acesso inválido.')
    }

    var engenheiros = $app.findRecordsByFilter('engenheiros', '', 'nome', 1000, 0)
    var nomePorId = {}
    for (var i = 0; i < engenheiros.length; i++) {
      nomePorId[engenheiros[i].id] = engenheiros[i].getString('nome')
    }

    var obras = $app.findRecordsByFilter('obras', '', 'codigo', 1000, 0)
    var lista = []
    for (var j = 0; j < obras.length; j++) {
      var o = obras[j]
      var engId = o.getString('engenheiro')
      lista.push({
        codigo: o.getString('codigo'),
        nome: o.getString('nome'),
        municipio: o.getString('municipio'),
        regiao: o.getString('regiao'),
        situacao: o.getString('situacao'),
        avanco: o.getFloat('avanco'),
        custo: o.getFloat('custo'),
        latitude: o.getFloat('latitude'),
        longitude: o.getFloat('longitude'),
        engenheiro_id: engId === '' ? null : engId,
        engenheiro: engId !== '' && nomePorId[engId] ? nomePorId[engId] : null,
        atribuido_em: o.get('atribuido_em') || null,
        atualizado_em: o.getString('updated'),
      })
    }

    var engs = []
    for (var k = 0; k < engenheiros.length; k++) {
      engs.push({
        id: engenheiros[k].id,
        nome: engenheiros[k].getString('nome'),
        email: engenheiros[k].getString('email') || null,
        telefone: engenheiros[k].getString('telefone') || null,
        ativo: engenheiros[k].getBool('ativo'),
      })
    }

    return e.json(200, {
      sistema: 'Planner Engenharia',
      gerado_em: new Date().toISOString(),
      total: lista.length,
      obras: lista,
      engenheiros: engs,
    })
  },
  $apis.requireSuperuserAuth(),
)

// ---- Rota de envio (o app empurra os dados para o Obra Prima) ----
routerAdd(
  'POST',
  '/backend/v1/obra-prima/enviar',
  function (e) {
    var config = null
    try {
      config = $app.findFirstRecordByData('integracao_config', 'api_token:isset', true)
    } catch (_) {
      config = null
    }
    if (!config) {
      throw new NotFoundError('Configuração da integração não encontrada.')
    }

    var urlAlvo = config.getString('obra_prima_url')
    if (urlAlvo === '') {
      throw new BadRequestError(
        'URL da API do Obra Prima não configurada. Cadastre-a na tela de Integração.',
      )
    }

    var tokenAlvo = config.getString('obra_prima_token')

    var engenheiros = $app.findRecordsByFilter('engenheiros', '', 'nome', 1000, 0)
    var nomePorId = {}
    for (var i = 0; i < engenheiros.length; i++) {
      nomePorId[engenheiros[i].id] = engenheiros[i].getString('nome')
    }

    var obras = $app.findRecordsByFilter('obras', '', 'codigo', 1000, 0)
    var lista = []
    for (var j = 0; j < obras.length; j++) {
      var o = obras[j]
      var engId = o.getString('engenheiro')
      lista.push({
        codigo: o.getString('codigo'),
        nome: o.getString('nome'),
        municipio: o.getString('municipio'),
        regiao: o.getString('regiao'),
        situacao: o.getString('situacao'),
        avanco: o.getFloat('avanco'),
        custo: o.getFloat('custo'),
        latitude: o.getFloat('latitude'),
        longitude: o.getFloat('longitude'),
        engenheiro_id: engId === '' ? null : engId,
        engenheiro: engId !== '' && nomePorId[engId] ? nomePorId[engId] : null,
        atribuido_em: o.get('atribuido_em') || null,
        atualizado_em: o.getString('updated'),
      })
    }

    var corpo = { total: lista.length, obras: lista, engenheiros: [] }
    for (var k = 0; k < engenheiros.length; k++) {
      corpo.engenheiros.push({
        id: engenheiros[k].id,
        nome: engenheiros[k].getString('nome'),
        email: engenheiros[k].getString('email') || null,
        telefone: engenheiros[k].getString('telefone') || null,
        ativo: engenheiros[k].getBool('ativo'),
      })
    }

    var headers = { 'Content-Type': 'application/json' }
    if (tokenAlvo !== '') {
      headers['Authorization'] = 'Bearer ' + tokenAlvo
    }

    var resposta
    try {
      resposta = $http.send({
        url: urlAlvo,
        method: 'POST',
        headers: headers,
        body: corpo,
        timeout: 30,
      })
    } catch (err) {
      config.set('ultimo_envio', new Date().toISOString())
      config.set('ultimo_envio_status', 'falha')
      config.set('ultimo_envio_detalhe', 'Falha de conexão: ' + (err.message || err))
      $app.save(config)
      throw new BadRequestError('Não foi possível conectar ao Obra Prima: ' + (err.message || err))
    }

    var status = 0
    if (resposta && resposta.statusCode) {
      status = resposta.statusCode
    } else if (resposta && resposta.status) {
      status = resposta.status
    }

    var ok = status >= 200 && status < 300
    var corpoTexto = ''
    try {
      if (resposta && resposta.raw) {
        corpoTexto = JSON.stringify(resposta.raw).substring(0, 400)
      }
    } catch (_) {
      corpoTexto = ''
    }

    config.set('ultimo_envio', new Date().toISOString())
    config.set('ultimo_envio_status', ok ? 'sucesso' : 'falha')
    config.set(
      'ultimo_envio_detalhe',
      'HTTP ' + status + (corpoTexto !== '' ? ' — ' + corpoTexto : ''),
    )
    $app.save(config)

    if (!ok) {
      throw new BadRequestError(
        'O Obra Prima respondeu com status HTTP ' +
          status +
          '. Último envio registrado como falha.',
      )
    }

    return e.json(200, {
      ok: true,
      status: status,
      total_obras: lista.length,
      ultimo_envio: config.getString('ultimo_envio'),
      mensagem:
        'Envio realizado com sucesso: ' + lista.length + ' obras enviadas para o Obra Prima.',
    })
  },
  $apis.requireAuth(),
)
