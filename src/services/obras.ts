import pb from '@/lib/pocketbase/client'
import type { Obra, Engenheiro, HistoricoAtribuicao } from '@/types'

export async function listarObras(filtro?: string): Promise<Obra[]> {
  const records = await pb.collection('obras').getFullList<Obra>({
    sort: 'codigo',
    filter: filtro || '',
    expand: 'engenheiro',
  })
  return records
}

export async function buscarObraPorId(id: string): Promise<Obra> {
  return await pb.collection('obras').getOne<Obra>(id, {
    expand: 'engenheiro',
  })
}

export async function atualizarObra(
  id: string,
  dados: {
    nome?: string
    municipio?: string
    regiao?: 'R1' | 'R2' | 'R3' | 'R4'
    situacao?: 'Em andamento' | 'Paralisada' | 'Planejada' | 'Concluída'
    avanco?: number
    custo?: number
    engenheiro?: string | null
    atribuido_em?: string | null
    atribuido_por_nome?: string | null
    atribuido_por?: string | null
  },
): Promise<Obra> {
  const payload: Record<string, unknown> = { ...dados }
  if (payload.engenheiro === null) {
    payload.engenheiro = ''
  }
  if (payload.atribuido_em === null) {
    payload.atribuido_em = ''
  }
  if (payload.atribuido_por_nome === null) {
    payload.atribuido_por_nome = ''
  }
  if (payload.atribuido_por === null) {
    payload.atribuido_por = ''
  }

  const updated = await pb.collection('obras').update<Obra>(id, payload, {
    expand: 'engenheiro',
  })
  return updated
}

export async function atribuirEngenheiro(
  obraId: string,
  engenheiroId: string | null,
  usuarioNome: string,
  usuarioId?: string,
): Promise<Obra> {
  const obraAtual = await buscarObraPorId(obraId)
  let engNome = ''

  if (engenheiroId) {
    const eng = await pb.collection('engenheiros').getOne<Engenheiro>(engenheiroId)
    engNome = eng.nome
  }

  const agora = new Date().toISOString().replace('T', ' ').substring(0, 19)

  const atualizada = await atualizarObra(obraId, {
    engenheiro: engenheiroId,
    atribuido_em: engenheiroId ? agora : '',
    atribuido_por_nome: engenheiroId ? usuarioNome : '',
    atribuido_por: engenheiroId ? usuarioId || '' : '',
  })

  // Salva no histórico
  try {
    await pb.collection('historico_atribuicoes').create<HistoricoAtribuicao>({
      obra: obraId,
      engenheiro: engenheiroId || '',
      obra_nome: obraAtual.nome,
      engenheiro_nome: engNome || 'Nenhum (Desatribuído)',
      atribuido_por_nome: usuarioNome,
      atribuido_por: usuarioId || '',
      acao: engenheiroId ? `Atribuído para ${engNome}` : 'Atribuição removida',
    })
  } catch (err) {
    console.error('Erro ao registrar histórico de atribuição:', err)
  }

  return atualizada
}

/**
 * Exclui TODAS as obras e o histórico de atribuições (dependente das obras).
 * Engenheiros e usuários não são tocados. Retorna a quantidade de obras apagadas.
 */
export async function excluirTodasObras(): Promise<number> {
  const historicos = await pb.collection('historico_atribuicoes').getFullList<HistoricoAtribuicao>()
  for (const h of historicos) {
    await pb.collection('historico_atribuicoes').delete(h.id)
  }

  const obras = await pb.collection('obras').getFullList<Obra>()
  for (const o of obras) {
    await pb.collection('obras').delete(o.id)
  }

  return obras.length
}

export async function zerarTodasAtribuicoes(
  usuarioNome: string,
  usuarioId?: string,
): Promise<number> {
  const obras = await pb.collection('obras').getFullList<Obra>({
    filter: 'engenheiro != ""',
  })

  let modificadas = 0
  for (const o of obras) {
    await atualizarObra(o.id, {
      engenheiro: '',
      atribuido_em: '',
      atribuido_por_nome: '',
      atribuido_por: '',
    })
    modificadas++
  }

  try {
    await pb.collection('historico_atribuicoes').create<HistoricoAtribuicao>({
      obra: obras[0]?.id || '',
      obra_nome: 'Todas as Obras',
      engenheiro_nome: 'Atribuições Zeradas',
      atribuido_por_nome: usuarioNome,
      atribuido_por: usuarioId || '',
      acao: `Zerar atribuições em lote (${modificadas} obras liberadas)`,
    })
  } catch (err) {
    console.error('Erro ao registrar histórico de zeramento:', err)
  }

  return modificadas
}
