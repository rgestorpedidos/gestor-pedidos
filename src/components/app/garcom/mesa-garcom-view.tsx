'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCarrinhoGarcomStore } from '@/stores/carrinho-garcom'
import { useTabPolling } from '@/hooks/useTabPolling'
import { ItemCardapioCard } from './item-cardapio-card'
import { ProductModal } from './product-modal'
import { CartDrawer } from './cart-drawer'
import type { CategoriaData, ItemCardapioData, PedidoAtivoData } from './types'

interface MesaGarcomViewProps {
  mesaId: string
  mesaNumero: number
  categorias: CategoriaData[]
  pedidoAtivo: PedidoAtivoData | null
}

export function MesaGarcomView({
  mesaId,
  mesaNumero,
  categorias,
  pedidoAtivo,
}: MesaGarcomViewProps) {
  // Polling de 10s — pausa quando modal/drawer aberto
  useTabPolling(mesaId, 10_000)

  const { adicionarItem, purgeExpired, getTotalItens } = useCarrinhoGarcomStore(
    (state) => ({
      adicionarItem: state.adicionarItem,
      purgeExpired: state.purgeExpired,
      getTotalItens: state.getTotalItens,
    })
  )

  // Limpa carrinhos expirados na montagem
  useEffect(() => {
    purgeExpired()
  }, [purgeExpired])

  // Estado local para controle do selectedItem (ProductModal — 2c.5)
  const [selectedItem, setSelectedItem] = useState<ItemCardapioData | null>(null)

  const totalItens = getTotalItens(mesaId)

  const activeModal = useCarrinhoGarcomStore((state) => state.activeModal)
  const setActiveModal = useCarrinhoGarcomStore((state) => state.setActiveModal)

  function handleAddItem(item: ItemCardapioData) {
    if (item.opcaoGrupos.length > 0) {
      // Abre ProductModal para seleção de opções (implementado em 2c.5)
      setSelectedItem(item)
      setActiveModal(`product:${item.id}`)
      return
    }

    // Sem grupos de opções — adiciona diretamente
    adicionarItem(mesaId, {
      itemCardapioId: item.id,
      nomeSnapshot: item.nome,
      precoUnitario: item.preco,
      quantidade: 1,
    })
    toast.success(`${item.nome} adicionado ao carrinho`)
  }

  // Contadores do pedido ativo (itens já no banco)
  const enviadoCount = pedidoAtivo?.itens.filter((i) => i.status === 'ENVIADO').length ?? 0
  const prontoCount = pedidoAtivo?.itens.filter((i) => i.status === 'PRONTO').length ?? 0

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/garcom">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">Mesa {mesaNumero}</h1>
          {pedidoAtivo && (
            <div className="flex gap-2 mt-0.5">
              {enviadoCount > 0 && (
                <Badge variant="outline" className="text-xs h-5 text-orange-700 border-orange-300">
                  {enviadoCount} na cozinha
                </Badge>
              )}
              {prontoCount > 0 && (
                <Badge variant="outline" className="text-xs h-5 text-green-700 border-green-300">
                  {prontoCount} pronto(s)
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Cardápio (scroll por categoria) ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24">
        {categorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <p className="text-sm">Nenhum item disponível no cardápio.</p>
            <p className="text-xs mt-1">Peça ao administrador para cadastrar itens.</p>
          </div>
        ) : (
          categorias.map((categoria) => (
            <section key={categoria.id}>
              <div className="px-4 py-3 bg-muted/40">
                <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  {categoria.nome}
                </h2>
              </div>

              <div className="px-4 py-2 flex flex-col gap-2">
                {categoria.itens.map((item) => (
                  <ItemCardapioCard
                    key={item.id}
                    item={item}
                    onAdd={handleAddItem}
                  />
                ))}
              </div>

              <Separator className="mt-2" />
            </section>
          ))
        )}
      </div>

      {/* ── ProductModal — abre quando item tem grupos de opções ──────────── */}
      {selectedItem && (
        <ProductModal
          item={selectedItem}
          mesaId={mesaId}
          onClose={() => {
            setSelectedItem(null)
            setActiveModal(null)
          }}
        />
      )}

      {/* ── CartDrawer — abre quando activeModal === 'cart' ─────────────────── */}
      {activeModal === 'cart' && (
        <CartDrawer
          mesaId={mesaId}
          mesaNumero={mesaNumero}
          pedidoAtivo={pedidoAtivo}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* ── Botão flutuante do carrinho ──────────────────────────────────────── */}
      {totalItens > 0 && activeModal !== 'cart' && (
        <div className="fixed bottom-4 left-4 right-4 z-20">
          <Button
            className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg"
            onClick={() => setActiveModal('cart')}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Ver carrinho
            <Badge className="ml-2 bg-white text-primary hover:bg-white">
              {totalItens}
            </Badge>
          </Button>
        </div>
      )}
    </div>
  )
}
