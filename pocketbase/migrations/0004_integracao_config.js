// Coleção de configurações da integração com o sistema externo "Obra Prima".
// Guarda: URL da API do Obra Prima, token para autenticar nesse sistema,
// token de acesso que o Obra Prima usa para puxar dados daqui (/backend/v1/obras-export)
// e a data/hora do último envio bem-sucedido.
migrate(
  (app) => {
    const collection = new Collection({
      name: 'integracao_config',
      type: 'base',
      // Só usuários autenticados via SDK; leitura/escrita pela tela de Integração.
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        { name: 'obra_prima_url', type: 'text', required: false },
        { name: 'obra_prima_token', type: 'text', required: false },
        { name: 'api_token', type: 'text', required: false },
        { name: 'ultimo_envio', type: 'text', required: false },
        { name: 'ultimo_envio_status', type: 'text', required: false },
        { name: 'ultimo_envio_detalhe', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)

    // Registro único de configuração, com token de API já gerado (idempotente).
    if (app.countRecords('integracao_config') === 0) {
      const record = new Record(collection)
      record.set('api_token', 'opk_' + $security.randomString(32))
      app.save(record)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('integracao_config')
    app.delete(collection)
  },
)
