import pb from '@/lib/pocketbase/client'
import type { Obra, Engenheiro } from '@/types'

export interface IntegracaoConfig {
  id: string
  obra_prima_url: string
  obra_prima_token: string
  api_token: string
  ultimo_envio: string
  ultimo_envio_status: string
  ultimo_envio_detalhe: string
  created: string
  updated: string
}

export interface ResultadoEnvio {
  ok: boolean
  mensagem: string
  detalhe?: string
}

/** Busca o registro único de configuração da integração. */
export async function obterConfig(): Promise<IntegracaoConfig | null> {
  const registros = await pb.collection('integracao_config').getList<IntegracaoConfig>(1, 1)
  return registros.items[0] ?? null
}

/** Salva URL e token do Obra Prima no registro de configuração. */
export async function salvarDestinoObraPrima(
  configId: string,
  dados: { obra_prima_url: string; obra_prima_token: string },
): Promise<IntegracaoConfig> {
  return await pb.collection('integracao_config').update<IntegracaoConfig>(configId, dados)
}

/** Gera um novo token de API e o salva na configuração. */
export async function regenerarTokenApi(configId: string): Promise<IntegracaoConfig> {
  const novoToken = 'opk_' + gerarStringAleatoria(36)
  return await pb.collection('integracao_config').update<IntegracaoConfig>(configId, {
    api_token: novoToken,
  })
}

/** Pede ao backend que envie os dados das obras para o Obra Prima (POST via pb_hooks). */
export async function enviarParaObraPrima(): Promise<ResultadoEnvio> {
  try {
    const resposta = await pb.send<ResultadoEnvio>('/backend/v1/obra-prima/enviar', {
      method: 'POST',
    })
    return resposta
  } catch (err) {
    const mensagem =
      typeof err === 'object' && err !== null && 'response' in err
        ? ((err as { response?: { message?: string } }).response?.message ?? '')
        : ''
    return {
      ok: false,
      mensagem: mensagem || 'Falha no envio para o Obra Prima.',
    }
  }
}

/** URL completa da rota de exportação, para exibir/copiar na tela. */
export function urlExportacao(): string {
  const base = import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') || ''
  return `${base}/backend/v1/obras-export`
}

// ---------- Exportação local (JSON / CSV) ----------

export interface ObraExport {
  codigo: string
  nome: string
  municipio: string
  regiao: string
  situacao: string
  avanco: number
  custo: number
  latitude: number
  longitude: number
  engenheiro: string | null
  atribuido_em: string | null
  atualizado_em: string
}

/** Monta o objeto de exportação: todas as obras + engenheiro atribuído (nome). */
export function montarExportacao(obras: Obra[]): ObraExport[] {
  return obras.map((o) => ({
    codigo: o.codigo ?? '',
    nome: o.nome ?? '',
    municipio: o.municipio ?? '',
    regiao: o.regiao ?? '',
    situacao: o.situacao ?? '',
    avanco: o.avanco ?? 0,
    custo: o.custo ?? 0,
    latitude: o.latitude ?? 0,
    longitude: o.longitude ?? 0,
    engenheiro: o.expand?.engenheiro?.nome ?? null,
    atribuido_em: o.atribuido_em || null,
    atualizado_em: o.updated ?? '',
  }))
}

const COLUNAS: Array<keyof ObraExport> = [
  'codigo',
  'nome',
  'municipio',
  'regiao',
  'situacao',
  'avanco',
  'custo',
  'latitude',
  'longitude',
  'engenheiro',
  'atribuido_em',
  'atualizado_em',
]

function escaparCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  const texto = String(valor)
  if (texto.includes('"') || texto.includes(';') || texto.includes('\n') || texto.includes('\r')) {
    return '"' + texto.replace(/"/g, '""') + '"'
  }
  return texto
}

export function gerarCsv(obras: Obra[]): string {
  const linhas = [COLUNAS.join(';')]
  for (const item of montarExportacao(obras)) {
    linhas.push(COLUNAS.map((c) => escaparCsv(item[c])).join(';'))
  }
  // BOM para o Excel reconhecer acentuação
  return '\uFEFF' + linhas.join('\r\n')
}

export function baixarArquivo(conteudo: string, nomeArquivo: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function dataHoraBrasil(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// util simples — não usa crypto API para manter compatibilidade
function gerarStringAleatoria(tamanho: number): string {
  const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let resultado = ''
  const valores = new Uint8Array(tamanho)
  crypto.getRandomValues(valores)
  for (let i = 0; i < tamanho; i++) {
    resultado += caracteres[valores[i] % caracteres.length]
  }
  return resultado
}

// reexporta tipo útil para as telas
export type { Engenheiro }
