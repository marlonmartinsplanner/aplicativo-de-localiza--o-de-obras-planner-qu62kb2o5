migrate(
  (app) => {
    // 1. Coleção 'engenheiros'
    const engenheiros = new Collection({
      name: 'engenheiros',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_engenheiros_nome ON engenheiros (nome)'],
    })
    app.save(engenheiros)

    const engenheirosCol = app.findCollectionByNameOrId('engenheiros')

    // 2. Coleção 'obras'
    const obras = new Collection({
      name: 'obras',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'codigo', type: 'text' },
        { name: 'nome', type: 'text', required: true },
        { name: 'municipio', type: 'text', required: true },
        {
          name: 'regiao',
          type: 'select',
          required: true,
          values: ['R1', 'R2', 'R3', 'R4'],
          maxSelect: 1,
        },
        {
          name: 'situacao',
          type: 'select',
          required: true,
          values: ['Em andamento', 'Paralisada', 'Planejada', 'Concluída'],
          maxSelect: 1,
        },
        { name: 'avanco', type: 'number', min: 0, max: 100 },
        { name: 'custo', type: 'number', min: 0 },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        {
          name: 'engenheiro',
          type: 'relation',
          collectionId: engenheirosCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'atribuido_em', type: 'date' },
        { name: 'atribuido_por_nome', type: 'text' },
        {
          name: 'atribuido_por',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_obras_regiao ON obras (regiao)',
        'CREATE INDEX idx_obras_situacao ON obras (situacao)',
        'CREATE INDEX idx_obras_municipio ON obras (municipio)',
        'CREATE INDEX idx_obras_engenheiro ON obras (engenheiro)',
      ],
    })
    app.save(obras)

    const obrasCol = app.findCollectionByNameOrId('obras')

    // 3. Coleção 'historico_atribuicoes'
    const historico = new Collection({
      name: 'historico_atribuicoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'obra',
          type: 'relation',
          collectionId: obrasCol.id,
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'engenheiro',
          type: 'relation',
          collectionId: engenheirosCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'obra_nome', type: 'text' },
        { name: 'engenheiro_nome', type: 'text' },
        { name: 'atribuido_por_nome', type: 'text' },
        {
          name: 'atribuido_por',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'acao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_hist_obra ON historico_atribuicoes (obra)',
        'CREATE INDEX idx_hist_created ON historico_atribuicoes (created)',
      ],
    })
    app.save(historico)
  },
  (app) => {
    try {
      const hist = app.findCollectionByNameOrId('historico_atribuicoes')
      app.delete(hist)
    } catch (_) {}
    try {
      const obras = app.findCollectionByNameOrId('obras')
      app.delete(obras)
    } catch (_) {}
    try {
      const eng = app.findCollectionByNameOrId('engenheiros')
      app.delete(eng)
    } catch (_) {}
  },
)
