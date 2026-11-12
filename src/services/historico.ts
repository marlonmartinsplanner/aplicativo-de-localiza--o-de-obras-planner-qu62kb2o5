import pb from '@/lib/pocketbase/client'
import type { HistoricoAtribuicao } from '@/types'

export async function listarHistoricoAtribuicoes(limite = 50): Promise<HistoricoAtribuicao[]> {
  try {
    return await pb.collection('historico_atribuicoes').getFullList<HistoricoAtribuicao>({
      sort: '-created',
      batch: limite,
    })
  } catch {
    return []
  }
}
