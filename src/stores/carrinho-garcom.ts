'use client'

import { create } from 'zustand'
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware'

// ─── TTL ──────────────────────────────────────────────────────────────────────

const TTL_MS = 8 * 60 * 60 * 1000 // 8 horas

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CarrinhoItem {
  /** ID local (não é o PedidoItem.id do banco) */
  localId: string
  itemCardapioId: string
  nomeSnapshot: string
  precoUnitario: number
  quantidade: number
  observacao?: string
  opcoesSelecionadas?: Record<string, string[]>
}

interface MesaCarrinho {
  itens: CarrinhoItem[]
  expiresAt: number
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface CarrinhoState {
  /** Carrinhos por mesaId — único campo persistido */
  carrinhos: Record<string, MesaCarrinho>
  /** ID do modal aberto — NÃO persistido (para pausar polling) */
  activeModal: string | null
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export interface CarrinhoActions {
  adicionarItem: (mesaId: string, item: Omit<CarrinhoItem, 'localId'>) => void
  removerItem: (mesaId: string, localId: string) => void
  atualizarQuantidade: (mesaId: string, localId: string, quantidade: number) => void
  limparCarrinho: (mesaId: string) => void
  purgeExpired: () => void
  setActiveModal: (modalId: string | null) => void
  // Selectors
  getItens: (mesaId: string) => CarrinhoItem[]
  getTotalItens: (mesaId: string) => number
  getTotal: (mesaId: string) => number
  isExpired: (mesaId: string) => boolean
}

export type CarrinhoStore = CarrinhoState & CarrinhoActions

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCarrinhoGarcomStore = create<CarrinhoStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        carrinhos: {},
        activeModal: null,

        adicionarItem: (mesaId, item) =>
          set((state) => {
            const atual = state.carrinhos[mesaId]
            const itens = atual?.itens ?? []
            const expiresAt = atual?.expiresAt ?? Date.now() + TTL_MS

            return {
              carrinhos: {
                ...state.carrinhos,
                [mesaId]: {
                  itens: [
                    ...itens,
                    { ...item, localId: crypto.randomUUID() },
                  ],
                  expiresAt,
                },
              },
            }
          }),

        removerItem: (mesaId, localId) =>
          set((state) => {
            const atual = state.carrinhos[mesaId]
            if (!atual) return state

            return {
              carrinhos: {
                ...state.carrinhos,
                [mesaId]: {
                  ...atual,
                  itens: atual.itens.filter((i) => i.localId !== localId),
                },
              },
            }
          }),

        atualizarQuantidade: (mesaId, localId, quantidade) =>
          set((state) => {
            const atual = state.carrinhos[mesaId]
            if (!atual) return state

            return {
              carrinhos: {
                ...state.carrinhos,
                [mesaId]: {
                  ...atual,
                  itens: atual.itens.map((i) =>
                    i.localId === localId ? { ...i, quantidade } : i
                  ),
                },
              },
            }
          }),

        limparCarrinho: (mesaId) =>
          set((state) => {
            const { [mesaId]: _, ...resto } = state.carrinhos
            return { carrinhos: resto }
          }),

        purgeExpired: () =>
          set((state) => {
            const agora = Date.now()
            const ativos = Object.fromEntries(
              Object.entries(state.carrinhos).filter(
                ([, v]) => v.expiresAt > agora
              )
            )
            return { carrinhos: ativos }
          }),

        setActiveModal: (modalId) => set({ activeModal: modalId }),

        // Selectors (não causam re-render — chamados de forma imperativa)
        getItens: (mesaId) => {
          const carrinho = get().carrinhos[mesaId]
          if (!carrinho || carrinho.expiresAt <= Date.now()) return []
          return carrinho.itens
        },

        getTotalItens: (mesaId) => {
          return get().getItens(mesaId).reduce((acc, i) => acc + i.quantidade, 0)
        },

        getTotal: (mesaId) => {
          return get()
            .getItens(mesaId)
            .reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0)
        },

        isExpired: (mesaId) => {
          const carrinho = get().carrinhos[mesaId]
          if (!carrinho) return true
          return carrinho.expiresAt <= Date.now()
        },
      }),
      {
        name: 'carrinho-garcom-v1',
        storage: createJSONStorage(() => localStorage),
        // Persiste apenas os carrinhos — activeModal é estado efêmero de sessão
        partialize: (state) => ({ carrinhos: state.carrinhos }),
      }
    )
  )
)
