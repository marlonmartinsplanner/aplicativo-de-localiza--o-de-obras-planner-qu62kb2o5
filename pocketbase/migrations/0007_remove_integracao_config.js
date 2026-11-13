// Migração 0007 — Remove a coleção `integracao_config`.
//
// A tela Integração (exportação JSON/CSV e sincronização com o Obra Prima)
// foi excluída do app a pedido do usuário. Com ela saem também:
// - o hook pocketbase/hooks/obra-prima.pb.js (rotas /backend/v1/obras-export
//   e /backend/v1/obra-prima/enviar);
// - o serviço src/services/integracao.ts.
//
// Esta migração remove a coleção do banco. Idempotente por tentativa: se a
// coleção já não existir, o down simplesmente não faz nada.

migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('integracao_config')
      app.delete(col)
      console.log('[0007_remove_integracao_config] coleção integracao_config removida.')
    } catch (_) {
      console.log('[0007_remove_integracao_config] coleção integracao_config já ausente.')
    }
  },
  (app) => {
    // down: recria a coleção com os campos que tinha (para reverter a remoção).
    try {
      app.findCollectionByNameOrId('integracao_config')
      return // já existe
    } catch (_) {}

    const col = new Collection({
      name: 'integracao_config',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: '',
      deleteRule: null,
      fields: [
        { name: 'obra_prima_url', type: 'text' },
        { name: 'obra_prima_token', type: 'text' },
        { name: 'api_token', type: 'text' },
        { name: 'ultimo_envio', type: 'text' },
        { name: 'ultimo_envio_status', type: 'text' },
        { name: 'ultimo_envio_detalhe', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(col)
    console.log('[0007_remove_integracao_config] down: coleção integracao_config recriada.')
  },
)
