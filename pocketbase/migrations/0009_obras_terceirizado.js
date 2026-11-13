// Migração 0009 — Adiciona o campo booleano "terceirizado" na coleção `obras`.
//
// Padrão false. As 41 obras existentes ficam com terceirizado=false
// (comportamento padrão do PocketBase para campos bool sem valor gravado).
// Idempotente: se o campo já existir, nada é feito.
// A Sede e os quadrantes Norte/Sul/Leste/Oeste não são alterados.

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('obras')
    if (col.fields.getByName('terceirizado')) {
      console.log('[0009] campo terceirizado já existe — nada a fazer.')
      return
    }
    col.fields.add(
      new Field({
        name: 'terceirizado',
        type: 'bool',
        required: false,
      }),
    )
    app.save(col)
    console.log('[0009] campo terceirizado adicionado à coleção obras.')
  },
  (app) => {
    const col = app.findCollectionByNameOrId('obras')
    if (!col.fields.getByName('terceirizado')) {
      return
    }
    col.fields.removeByName('terceirizado')
    app.save(col)
    console.log('[0009] down: campo terceirizado removido da coleção obras.')
  },
)
