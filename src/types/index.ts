export type Regiao = 'Norte' | 'Sul' | 'Leste' | 'Oeste'

export type SituacaoObra = 'Em andamento' | 'Paralisada' | 'Planejada' | 'Concluída'

export interface Engenheiro {
  id: string
  nome: string
  email?: string
  telefone?: string
  ativo?: boolean
  created: string
  updated: string
}

export interface Obra {
  id: string
  codigo: string
  nome: string
  municipio: string
  regiao: Regiao
  situacao: SituacaoObra
  avanco: number
  custo: number
  latitude: number
  longitude: number
  terceirizado?: boolean
  engenheiro?: string
  atribuido_em?: string
  atribuido_por_nome?: string
  atribuido_por?: string
  created: string
  updated: string
  // Dados expandidos via SDK
  expand?: {
    engenheiro?: Engenheiro
  }
}

export interface HistoricoAtribuicao {
  id: string
  obra: string
  engenheiro?: string
  obra_nome: string
  engenheiro_nome?: string
  atribuido_por_nome?: string
  atribuido_por?: string
  acao: string
  created: string
  updated: string
}

export interface Usuario {
  id: string
  email: string
  name?: string
  avatar?: string
}

// 4 cores da paleta Planner redistribuídas para as 4 regiões
// (Norte/Sul/Leste/Oeste — quadrantes em torno de Sete Lagoas/MG, ver src/utils/regioes.ts)
export const REGIOES_CONFIG: Record<
  Regiao,
  {
    nome: string
    cor: string
    hex: string
    bgClass: string
    borderClass: string
    textClass: string
  }
> = {
  Norte: {
    nome: 'Norte de Sete Lagoas',
    cor: 'Azul Planner',
    hex: '#2563eb', // blue-600
    bgClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    borderClass: 'border-blue-500',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  Sul: {
    nome: 'Sul de Sete Lagoas',
    cor: 'Verde Esmeralda',
    hex: '#059669', // emerald-600
    bgClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  Leste: {
    nome: 'Leste de Sete Lagoas',
    cor: 'Laranja Âmbar',
    hex: '#d97706', // amber-600
    bgClass:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  Oeste: {
    nome: 'Oeste de Sete Lagoas',
    cor: 'Púrpura Violeta',
    hex: '#7c3aed', // violet-600
    bgClass:
      'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700',
    borderClass: 'border-violet-500',
    textClass: 'text-violet-600 dark:text-violet-400',
  },
}

export const SITUACOES_CONFIG: Record<
  SituacaoObra,
  { label: string; cor: string; bgBadge: string }
> = {
  'Em andamento': {
    label: 'Em andamento',
    cor: '#10b981',
    bgBadge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300',
  },
  Paralisada: {
    label: 'Paralisada',
    cor: '#ef4444',
    bgBadge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300',
  },
  Planejada: {
    label: 'Planejada',
    cor: '#f59e0b',
    bgBadge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300',
  },
  Concluída: {
    label: 'Concluída',
    cor: '#64748b',
    bgBadge: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300',
  },
}
