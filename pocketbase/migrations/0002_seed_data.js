migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const adminEmail = 'marlon_martins@construtoraplanner.com.br'

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', adminEmail)
    } catch (_) {
      const admin = new Record(users)
      admin.setEmail(adminEmail)
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Marlon Martins')
      app.save(admin)
    }

    // Engenheiros iniciais da Planner
    const engenheirosCol = app.findCollectionByNameOrId('engenheiros')
    const listaEngenheiros = [
      {
        nome: 'Eng. Carlos Eduardo Ramos',
        email: 'carlos.ramos@construtoraplanner.com.br',
        telefone: '(11) 98765-1001',
      },
      {
        nome: 'Engª. Beatriz Albuquerque',
        email: 'beatriz.albuquerque@construtoraplanner.com.br',
        telefone: '(11) 98765-1002',
      },
      {
        nome: 'Eng. Rodrigo Fontes',
        email: 'rodrigo.fontes@construtoraplanner.com.br',
        telefone: '(11) 98765-1003',
      },
      {
        nome: 'Engª. Mariana Vasconcelos',
        email: 'mariana.vasconcelos@construtoraplanner.com.br',
        telefone: '(11) 98765-1004',
      },
      {
        nome: 'Eng. Fernando Silveira',
        email: 'fernando.silveira@construtoraplanner.com.br',
        telefone: '(11) 98765-1005',
      },
    ]

    const engMap = {}
    for (let i = 0; i < listaEngenheiros.length; i++) {
      const item = listaEngenheiros[i]
      try {
        const existing = app.findFirstRecordByData('engenheiros', 'nome', item.nome)
        engMap[item.nome] = existing.id
      } catch (_) {
        const rec = new Record(engenheirosCol)
        rec.set('nome', item.nome)
        rec.set('email', item.email)
        rec.set('telefone', item.telefone)
        rec.set('ativo', true)
        app.save(rec)
        engMap[item.nome] = rec.id
      }
    }

    // 41 Obras da Planner Engenharia distribuídas pelas 4 regiões (R1, R2, R3, R4)
    // Inclui intencionalmente obras com coordenadas compartilhadas para testar agrupamento e conflito de região
    const obrasCol = app.findCollectionByNameOrId('obras')

    // Verificar se já tem 41 obras
    const countObras = app.countRecords('obras')
    if (countObras >= 41) {
      return
    }

    const obrasIniciais = [
      // R1 - Região Metropolitana e Capital (11 obras)
      {
        codigo: 'OBR-001',
        nome: 'Residencial Morumbi Park - Torre A',
        municipio: 'São Paulo',
        regiao: 'R1',
        situacao: 'Em andamento',
        avanco: 68,
        custo: 18500000,
        latitude: -23.6125,
        longitude: -46.7214,
        eng: 'Eng. Carlos Eduardo Ramos',
      },
      {
        codigo: 'OBR-002',
        nome: 'Residencial Morumbi Park - Torre B',
        municipio: 'São Paulo',
        regiao: 'R1',
        situacao: 'Em andamento',
        avanco: 45,
        custo: 16200000,
        // Mesma coordenada da Torre A para testar agrupamento na mesma região
        latitude: -23.6125,
        longitude: -46.7214,
        eng: 'Eng. Carlos Eduardo Ramos',
      },
      {
        codigo: 'OBR-003',
        nome: 'Centro Logístico Anhanguera Express',
        municipio: 'Osasco',
        regiao: 'R1',
        situacao: 'Em andamento',
        avanco: 82,
        custo: 24300000,
        latitude: -23.5329,
        longitude: -46.7918,
        eng: 'Engª. Beatriz Albuquerque',
      },
      {
        codigo: 'OBR-004',
        nome: 'Hospital Regional Metropolitano - Ala Norte',
        municipio: 'Guarulhos',
        regiao: 'R1',
        situacao: 'Paralisada',
        avanco: 34,
        custo: 32000000,
        latitude: -23.4628,
        longitude: -46.5333,
        eng: 'Eng. Rodrigo Fontes',
      },
      {
        codigo: 'OBR-005',
        nome: 'Edifício Comercial Faria Lima Prime',
        municipio: 'São Paulo',
        regiao: 'R1',
        situacao: 'Em andamento',
        avanco: 54,
        custo: 41000000,
        latitude: -23.5855,
        longitude: -46.6811,
        eng: 'Engª. Mariana Vasconcelos',
      },
      {
        codigo: 'OBR-006',
        nome: 'Saneamento Básico Bacia Tietê Leste',
        municipio: 'Guarulhos',
        regiao: 'R1',
        situacao: 'Planejada',
        avanco: 10,
        custo: 12800000,
        latitude: -23.4411,
        longitude: -46.5188,
        eng: null,
      },
      {
        codigo: 'OBR-007',
        nome: 'Condomínio Reserva Alphaville Fase 1',
        municipio: 'Barueri',
        regiao: 'R1',
        situacao: 'Concluída',
        avanco: 100,
        custo: 22000000,
        latitude: -23.5062,
        longitude: -46.8489,
        eng: 'Engª. Beatriz Albuquerque',
      },
      {
        codigo: 'OBR-008',
        nome: 'Condomínio Reserva Alphaville Fase 2',
        municipio: 'Barueri',
        regiao: 'R1',
        situacao: 'Em andamento',
        avanco: 28,
        custo: 21500000,
        // Mesma coordenada do Alphaville Fase 1
        latitude: -23.5062,
        longitude: -46.8489,
        eng: 'Engª. Beatriz Albuquerque',
      },
      {
        codigo: 'OBR-009',
        nome: 'Terminal Multimodal Lapa',
        municipio: 'São Paulo',
        regiao: 'R1',
        situacao: 'Em andamento',
        avanco: 42,
        custo: 17800000,
        latitude: -23.5222,
        longitude: -46.7028,
        eng: 'Eng. Fernando Silveira',
      },
      {
        codigo: 'OBR-010',
        nome: 'Escola Técnica Estadual ABC',
        municipio: 'Santo André',
        regiao: 'R1',
        situacao: 'Planejada',
        avanco: 5,
        custo: 8900000,
        latitude: -23.6639,
        longitude: -46.5383,
        eng: null,
      },
      {
        codigo: 'OBR-011',
        nome: 'Centro de Distribuição São Bernardo',
        municipio: 'São Bernardo do Campo',
        regiao: 'R1',
        situacao: 'Em andamento',
        avanco: 61,
        custo: 19400000,
        latitude: -23.6914,
        longitude: -46.5644,
        eng: 'Eng. Fernando Silveira',
      },

      // Ponto Especial com CONFLITO DE REGIÃO (mesma coordenada, regiões R1 e R2 para testar alerta)
      // OBR-012 (R1) e OBR-013 (R2) na divisa Jundiaí/Polígono metropolitano
      {
        codigo: 'OBR-012',
        nome: 'Viaduto Interligação Rodoanel Norte',
        municipio: 'Caieiras',
        regiao: 'R1',
        situacao: 'Em andamento',
        avanco: 71,
        custo: 28500000,
        latitude: -23.3642,
        longitude: -46.7419,
        eng: 'Eng. Carlos Eduardo Ramos',
      },
      {
        codigo: 'OBR-013',
        nome: 'Canalização e Drenagem Rio Juqueri',
        municipio: 'Franco da Rocha',
        regiao: 'R2', // Atenção: conflito de região na mesma coordenada de OBR-012
        situacao: 'Paralisada',
        avanco: 39,
        custo: 14700000,
        latitude: -23.3642,
        longitude: -46.7419,
        eng: 'Eng. Rodrigo Fontes',
      },

      // R2 - Região Campinas e Interior Central (10 obras)
      {
        codigo: 'OBR-014',
        nome: 'Complexo Tecnológico Barão Geraldo',
        municipio: 'Campinas',
        regiao: 'R2',
        situacao: 'Em andamento',
        avanco: 76,
        custo: 36000000,
        latitude: -22.8228,
        longitude: -47.0689,
        eng: 'Engª. Mariana Vasconcelos',
      },
      {
        codigo: 'OBR-015',
        nome: 'Hub Logístico Rodovia Dom Pedro',
        municipio: 'Campinas',
        regiao: 'R2',
        situacao: 'Em andamento',
        avanco: 58,
        custo: 26800000,
        latitude: -22.8824,
        longitude: -47.0125,
        eng: 'Eng. Carlos Eduardo Ramos',
      },
      {
        codigo: 'OBR-016',
        nome: 'Estação de Tratamento de Esgoto Jundiaí Mirim',
        municipio: 'Jundiaí',
        regiao: 'R2',
        situacao: 'Em andamento',
        avanco: 89,
        custo: 18200000,
        latitude: -23.1857,
        longitude: -46.8978,
        eng: 'Eng. Rodrigo Fontes',
      },
      {
        codigo: 'OBR-017',
        nome: 'Parque Industrial e Empresarial Piracicaba',
        municipio: 'Piracicaba',
        regiao: 'R2',
        situacao: 'Em andamento',
        avanco: 48,
        custo: 22400000,
        latitude: -22.7253,
        longitude: -47.6492,
        eng: 'Engª. Beatriz Albuquerque',
      },
      {
        codigo: 'OBR-018',
        nome: 'Ampliação Anel Viário de Sorocaba',
        municipio: 'Sorocaba',
        regiao: 'R2',
        situacao: 'Em andamento',
        avanco: 65,
        custo: 31200000,
        latitude: -23.5015,
        longitude: -47.4526,
        eng: 'Eng. Fernando Silveira',
      },
      {
        codigo: 'OBR-019',
        nome: 'Residencial Jardins de Sorocaba',
        municipio: 'Sorocaba',
        regiao: 'R2',
        situacao: 'Concluída',
        avanco: 100,
        custo: 15600000,
        latitude: -23.4812,
        longitude: -47.4288,
        eng: 'Eng. Fernando Silveira',
      },
      {
        codigo: 'OBR-020',
        nome: 'UPA 24h Região Noroeste',
        municipio: 'Campinas',
        regiao: 'R2',
        situacao: 'Paralisada',
        avanco: 41,
        custo: 9400000,
        latitude: -22.8951,
        longitude: -47.1124,
        eng: null,
      },
      {
        codigo: 'OBR-021',
        nome: 'Centro de Convenções e Inovação Limeira',
        municipio: 'Limeira',
        regiao: 'R2',
        situacao: 'Planejada',
        avanco: 12,
        custo: 13500000,
        latitude: -22.5647,
        longitude: -47.4017,
        eng: 'Engª. Mariana Vasconcelos',
      },
      {
        codigo: 'OBR-022',
        nome: 'Complexo de Galpões Americana Tech',
        municipio: 'Americana',
        regiao: 'R2',
        situacao: 'Em andamento',
        avanco: 33,
        custo: 17100000,
        latitude: -22.7375,
        longitude: -47.3331,
        eng: 'Engª. Beatriz Albuquerque',
      },
      {
        codigo: 'OBR-023',
        nome: 'Macrodrenagem Córrego do Tanque',
        municipio: 'Indaiatuba',
        regiao: 'R2',
        situacao: 'Em andamento',
        avanco: 84,
        custo: 11800000,
        latitude: -23.0903,
        longitude: -47.2181,
        eng: 'Eng. Rodrigo Fontes',
      },

      // R3 - Região Vale do Paraíba e Litoral (10 obras)
      {
        codigo: 'OBR-024',
        nome: 'Hub Aeroespacial São José',
        municipio: 'São José dos Campos',
        regiao: 'R3',
        situacao: 'Em andamento',
        avanco: 72,
        custo: 44000000,
        latitude: -23.2183,
        longitude: -45.8672,
        eng: 'Eng. Carlos Eduardo Ramos',
      },
      {
        codigo: 'OBR-025',
        nome: 'Terminal Retroportuário Santos Mar',
        municipio: 'Santos',
        regiao: 'R3',
        situacao: 'Em andamento',
        avanco: 59,
        custo: 51000000,
        latitude: -23.9535,
        longitude: -46.3312,
        eng: 'Engª. Mariana Vasconcelos',
      },
      {
        codigo: 'OBR-026',
        nome: 'Contenção de Encostas Morro São Bento',
        municipio: 'Santos',
        regiao: 'R3',
        situacao: 'Em andamento',
        avanco: 88,
        custo: 12400000,
        latitude: -23.9421,
        longitude: -46.3265,
        eng: 'Eng. Fernando Silveira',
      },
      {
        codigo: 'OBR-027',
        nome: 'Ponte Pênsil Acesso Litoral Sul',
        municipio: 'São Vicente',
        regiao: 'R3',
        situacao: 'Paralisada',
        avanco: 52,
        custo: 27900000,
        latitude: -23.9678,
        longitude: -46.3881,
        eng: 'Eng. Rodrigo Fontes',
      },
      {
        codigo: 'OBR-028',
        nome: 'Avenida Perimetral Portuária',
        municipio: 'Guarujá',
        regiao: 'R3',
        situacao: 'Em andamento',
        avanco: 37,
        custo: 33500000,
        latitude: -23.9931,
        longitude: -46.2564,
        eng: 'Engª. Beatriz Albuquerque',
      },
      {
        codigo: 'OBR-029',
        nome: 'Hospital Regional Litoral Norte',
        municipio: 'Caraguatatuba',
        regiao: 'R3',
        situacao: 'Concluída',
        avanco: 100,
        custo: 38200000,
        latitude: -23.6229,
        longitude: -45.4128,
        eng: 'Eng. Carlos Eduardo Ramos',
      },
      {
        codigo: 'OBR-030',
        nome: 'Drenagem Urbana Bairro Perequê',
        municipio: 'Ilhabela',
        regiao: 'R3',
        situacao: 'Planejada',
        avanco: 8,
        custo: 7600000,
        latitude: -23.8167,
        longitude: -45.3619,
        eng: null,
      },
      {
        codigo: 'OBR-031',
        nome: 'Polo Logístico Taubaté Dutra',
        municipio: 'Taubaté',
        regiao: 'R3',
        situacao: 'Em andamento',
        avanco: 63,
        custo: 19800000,
        latitude: -23.0264,
        longitude: -45.5558,
        eng: 'Engª. Mariana Vasconcelos',
      },
      {
        codigo: 'OBR-032',
        nome: 'Saneamento Estuário de Bertioga',
        municipio: 'Bertioga',
        regiao: 'R3',
        situacao: 'Em andamento',
        avanco: 47,
        custo: 16500000,
        latitude: -23.8544,
        longitude: -46.1389,
        eng: 'Eng. Fernando Silveira',
      },
      {
        codigo: 'OBR-033',
        nome: 'Viaduto de Acesso Jacareí',
        municipio: 'Jacareí',
        regiao: 'R3',
        situacao: 'Planejada',
        avanco: 15,
        custo: 14200000,
        latitude: -23.3056,
        longitude: -45.9658,
        eng: null,
      },

      // R4 - Região Ribeirão Preto, Bauru e Noroeste (8 obras)
      {
        codigo: 'OBR-034',
        nome: 'Anel Viário Sul de Ribeirão Preto',
        municipio: 'Ribeirão Preto',
        regiao: 'R4',
        situacao: 'Em andamento',
        avanco: 78,
        custo: 38900000,
        latitude: -21.1775,
        longitude: -47.8103,
        eng: 'Eng. Carlos Eduardo Ramos',
      },
      {
        codigo: 'OBR-035',
        nome: 'Centro de Oncologia do Interior',
        municipio: 'Ribeirão Preto',
        regiao: 'R4',
        situacao: 'Em andamento',
        avanco: 91,
        custo: 29500000,
        latitude: -21.1691,
        longitude: -47.8252,
        eng: 'Engª. Mariana Vasconcelos',
      },
      {
        codigo: 'OBR-036',
        nome: 'Centro Universitário e Hospital das Clínicas',
        municipio: 'Bauru',
        regiao: 'R4',
        situacao: 'Em andamento',
        avanco: 53,
        custo: 27400000,
        latitude: -22.3145,
        longitude: -49.0587,
        eng: 'Engª. Beatriz Albuquerque',
      },
      {
        codigo: 'OBR-037',
        nome: 'Infraestrutura Distrito Industrial Bauru III',
        municipio: 'Bauru',
        regiao: 'R4',
        situacao: 'Planejada',
        avanco: 18,
        custo: 13900000,
        latitude: -22.3389,
        longitude: -49.0311,
        eng: null,
      },
      {
        codigo: 'OBR-038',
        nome: 'Terminal Hidroviário Tietê-Paraná',
        municipio: 'Araçatuba',
        regiao: 'R4',
        situacao: 'Paralisada',
        avanco: 31,
        custo: 34200000,
        latitude: -21.2089,
        longitude: -50.4328,
        eng: 'Eng. Rodrigo Fontes',
      },
      {
        codigo: 'OBR-039',
        nome: 'Usina Solar Fotovoltaica Noroeste',
        municipio: 'São José do Rio Preto',
        regiao: 'R4',
        situacao: 'Em andamento',
        avanco: 83,
        custo: 42100000,
        latitude: -20.8113,
        longitude: -49.3758,
        eng: 'Eng. Fernando Silveira',
      },
      {
        codigo: 'OBR-040',
        nome: 'Saneamento e ETE Franca Sul',
        municipio: 'Franca',
        regiao: 'R4',
        situacao: 'Em andamento',
        avanco: 64,
        custo: 18700000,
        latitude: -20.5386,
        longitude: -47.4008,
        eng: 'Engª. Beatriz Albuquerque',
      },
      {
        codigo: 'OBR-041',
        nome: 'Aeroporto Regional de Presidente Prudente - Novo Terminal',
        municipio: 'Presidente Prudente',
        regiao: 'R4',
        situacao: 'Concluída',
        avanco: 100,
        custo: 21800000,
        latitude: -22.1753,
        longitude: -51.4244,
        eng: 'Eng. Carlos Eduardo Ramos',
      },
    ]

    for (let i = 0; i < obrasIniciais.length; i++) {
      const o = obrasIniciais[i]
      const rec = new Record(obrasCol)
      rec.set('codigo', o.codigo)
      rec.set('nome', o.nome)
      rec.set('municipio', o.municipio)
      rec.set('regiao', o.regiao)
      rec.set('situacao', o.situacao)
      rec.set('avanco', o.avanco)
      rec.set('custo', o.custo)
      rec.set('latitude', o.latitude)
      rec.set('longitude', o.longitude)

      if (o.eng && engMap[o.eng]) {
        rec.set('engenheiro', engMap[o.eng])
        rec.set('atribuido_em', new Date().toISOString().replace('T', ' ').substring(0, 19))
        rec.set('atribuido_por_nome', 'Marlon Martins')
      }

      app.save(rec)
    }
  },
  (app) => {
    try {
      const obras = app.findCollectionByNameOrId('obras')
      app.truncateCollection(obras)
    } catch (_) {}
    try {
      const eng = app.findCollectionByNameOrId('engenheiros')
      app.truncateCollection(eng)
    } catch (_) {}
  },
)
