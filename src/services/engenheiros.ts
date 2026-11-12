import pb from '@/lib/pocketbase/client'
import type { Engenheiro } from '@/types'

export async function listarEngenheiros(): Promise<Engenheiro[]> {
  return await pb.collection('engenheiros').getFullList<Engenheiro>({
    sort: 'nome',
  })
}

export async function criarEngenheiro(dados: {
  nome: string
  email?: string
  telefone?: string
}): Promise<Engenheiro> {
  return await pb.collection('engenheiros').create<Engenheiro>({
    ...dados,
    ativo: true,
  })
}

export async function removerEngenheiro(id: string): Promise<boolean> {
  // Desatribui obras que estavam com este engenheiro
  try {
    const obrasVinculadas = await pb.collection('obras').getFullList({
      filter: `engenheiro = "${id}"`,
    })

    for (const o of obrasVinculadas) {
      await pb.collection('obras').update(o.id, {
        engenheiro: '',
        atribuido_em: '',
        atribuido_por_nome: '',
        atribuido_por: '',
      })
    }
  } catch (e) {
    console.error('Aviso ao desvincular obras do engenheiro:', e)
  }

  return await pb.collection('engenheiros').delete(id)
}
