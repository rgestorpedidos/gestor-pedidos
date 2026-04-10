'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCarrinhoGarcomStore } from '@/stores/carrinho-garcom'
import { useTabPolling } from '@/hooks/useTabPolling'
import { ItemCardapioCard } from './item-cardapio-card'
import { ProductModal } from './product-modal'
import { CartDrawer } from './cart-drawer'
import { cn } from '@/lib/utils'
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
  // Guard de hydration
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  // Polling de 10s — pausa quando modal/drawer aberto
  useTabPolling(mesaId, 10_000)

  const adicionarItem = useCarrinhoGarcomStore((state) => state.adicionarItem)
  const purgeExpired = useCarrinhoGarcomStore((state) => state.purgeExpired)
  const setActiveModal = useCarrinhoGarcomStore((state) => state.setActiveModal)
  const activeModal = useCarrinhoGarcomStore((state) => state.activeModal)
  
  const itensRaw = useCarrinhoGarcomStore((state) => state.carrinhos[mesaId]?.itens ?? [])
  const totalItens = isMounted ? itensRaw.reduce((acc, i) => acc + i.quantidade, 0) : 0

  useEffect(() => { purgeExpired() }, [purgeExpired])

  const [selectedItem, setSelectedItem] = useState<ItemCardapioData | null>(null)

  // ── CategoryNav ──────────────────────────────────────────────────────────────
  const [activeCategoria, setActiveCategoria] = useState<string | null>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 })
  const categoryNavRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Define primeira categoria como ativa
  useEffect(() => {
    if (!activeCategoria && categorias.length > 0) {
      setActiveCategoria(categorias[0].id)
    }
  }, [categorias, activeCategoria])

  // Scroll spy — escuta o container de scroll
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const offset = 140
      const scrollPos = container.scrollTop + offset
      let currentId: string | null = null

      for (const cat of categorias) {
        const el = document.getElementById(`cat-${cat.id}`)
        if (el && el.offsetTop <= scrollPos) {
          currentId = cat.id
        }
      }

      if (currentId && currentId !== activeCategoria) {
        setActiveCategoria(currentId)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [categorias, activeCategoria])

  // Atualiza indicador e centraliza botão ativo no nav
  useEffect(() => {
    const nav = categoryNavRef.current
    if (!nav || !activeCategoria) return

    const btn = nav.querySelector<HTMLButtonElement>(`[data-cat-id="${activeCategoria}"]`)
    if (!btn) return

    setIndicatorStyle({ left: btn.offsetLeft, width: btn.offsetWidth, opacity: 1 })
    nav.scrollTo({
      left: btn.offsetLeft - nav.offsetWidth / 2 + btn.offsetWidth / 2,
      behavior: 'smooth',
    })
  }, [activeCategoria])

  function handleCategoriaSelect(id: string) {
    setActiveCategoria(id)
    const container = scrollContainerRef.current
    const el = document.getElementById(`cat-${id}`)
    if (!container || !el) return
    const navHeight = 48
    container.scrollTo({ top: el.offsetTop - navHeight, behavior: 'smooth' })
  }

  function handleAddItem(item: ItemCardapioData) {
    if (item.opcaoGrupos.length > 0) {
      setSelectedItem(item)
      setActiveModal(`product:${item.id}`)
      return
    }
    adicionarItem(mesaId, {
      itemCardapioId: item.id,
      nomeSnapshot: item.nome,
      precoUnitario: item.preco,
      quantidade: 1,
    })
    toast.success(`${item.nome} adicionado ao carrinho`)
  }

  const enviadoCount = pedidoAtivo?.itens.filter((i) => i.status === 'ENVIADO').length ?? 0
  const prontoCount = pedidoAtivo?.itens.filter((i) => i.status === 'PRONTO').length ?? 0

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── Bloco sticky: header + category nav ─────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background">

        {/* Header */}
        <div className="border-b px-4 py-3 flex items-center gap-3">
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

        {/* Category Nav com indicador animado */}
        {categorias.length > 0 && (
          <div
            ref={categoryNavRef}
            className="relative flex overflow-x-auto no-scrollbar py-2 px-4 gap-1 border-b bg-background"
          >
            {/* Pill indicador animado */}
            <div
              className="absolute top-2 bottom-2 bg-foreground rounded-full transition-all duration-300 ease-out pointer-events-none"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
                height: 'calc(100% - 16px)',
              }}
            />

            {categorias.map((cat) => (
              <Button
                key={cat.id}
                data-cat-id={cat.id}
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-full whitespace-nowrap relative z-10 hover:bg-transparent transition-colors',
                  activeCategoria === cat.id
                    ? 'text-background hover:text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => handleCategoriaSelect(cat.id)}
              >
                {cat.nome}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* ── Conteúdo scrollável ──────────────────────────────────────────────── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-24">
        {categorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <p className="text-sm">Nenhum item disponível no cardápio.</p>
            <p className="text-xs mt-1">Peça ao administrador para cadastrar itens.</p>
          </div>
        ) : (
          <div className="px-4 py-6 space-y-8">
            {categorias.map((categoria) => (
              <section key={categoria.id} id={`cat-${categoria.id}`}>
                <h2 className="text-xl font-bold mb-3 text-foreground">{categoria.nome}</h2>
                <div>
                  {categoria.itens.map((item) => (
                    <ItemCardapioCard
                      key={item.id}
                      item={item}
                      onAdd={handleAddItem}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* ── ProductModal ─────────────────────────────────────────────────────── */}
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

      {/* ── CartDrawer ───────────────────────────────────────────────────────── */}
      {activeModal === 'cart' && (
        <CartDrawer
          mesaId={mesaId}
          mesaNumero={mesaNumero}
          pedidoAtivo={pedidoAtivo}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Botão flutuante do carrinho / conta */}
      {(totalItens > 0 || pedidoAtivo !== null) && activeModal !== 'cart' && (
        <div className="sticky bottom-6 px-4 z-20 mt-auto pointer-events-none">
          <Button
            className={cn(
              "w-full h-14 text-base font-semibold rounded-2xl shadow-xl transition-all active:scale-95 pointer-events-auto",
              totalItens > 0 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-black text-white hover:bg-zinc-900 border-none"
            )}
            onClick={() => setActiveModal('cart')}
          >
            {totalItens > 0 ? (
              <>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Ver carrinho
                <Badge className="ml-2 bg-white text-primary hover:bg-white border-none">
                  {totalItens}
                </Badge>
              </>
            ) : (
              <>
                <Receipt className="h-5 w-5 mr-2" />
                Ver conta
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
