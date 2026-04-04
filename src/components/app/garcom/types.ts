export interface OpcaoData {
  id: string
  nome: string
  precoAdicional: number
}

export interface OpcaoGrupoData {
  id: string
  nome: string
  obrigatorio: boolean
  minSelecoes: number
  maxSelecoes: number
  opcoes: OpcaoData[]
}

export interface ItemCardapioData {
  id: string
  nome: string
  descricao: string | null
  preco: number
  imagemUrl: string | null
  vaiParaCozinha: boolean
  opcaoGrupos: OpcaoGrupoData[]
}

export interface CategoriaData {
  id: string
  nome: string
  itens: ItemCardapioData[]
}

export interface PedidoItemAtivoData {
  id: string
  nomeSnapshot: string
  precoUnitario: number
  quantidade: number
  observacao: string | null
  status: string // 'ENVIADO' | 'PRONTO'
}

export interface PedidoAtivoData {
  id: string
  itens: PedidoItemAtivoData[]
}
