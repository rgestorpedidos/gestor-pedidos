'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, ChefHat, CheckCircle2, ShoppingBasket, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCarrinhoGarcomStore } from '@/stores/carrinho-garcom'
import { useLoadingStore } from '@/stores/loading-store'
import { enviarRodada, fecharPedido } from '@/actions/garcom/pedidos'
import type { PedidoAtivoData } from './types'

interface CartDrawerProps {
  mesaId: string
  mesaNumero: number
  pedidoAtivo: PedidoAtivoData | null
  onClose: () => void
}

const METODOS_PAGAMENTO = [
  { value: 'PIX', label: 'PIX' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CREDITO', label: 'Cartão de Crédito' },
  { value: 'DEBITO', label: 'Cartão de Débito' },
]

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Seção de itens ───────────────────────────────────────────────────────────

function SecaoHeader({
  icon,
  label,
  count,
  colorClass,
}: {
  icon: React.ReactNode
  label: string
  count: number
  colorClass: string
}) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 ${colorClass}`}>
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      <Badge variant="secondary" className="h-4 text-xs px-1.5 ml-auto">
        {count}
      </Badge>
    </div>
  )
}

// ─── CartDrawer ───────────────────────────────────────────────────────────────

export function CartDrawer({ mesaId, mesaNumero, pedidoAtivo, onClose }: CartDrawerProps) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [metodoPagamento, setMetodoPagamento] = useState<string>('')
  const [isPendingRodada, startRodada] = useTransition()
  const [isPendingFecha, startFecha] = useTransition()

  useEffect(() => { setIsMounted(true) }, [])

  const getItens = useCarrinhoGarcomStore((state) => state.getItens)
  const limparCarrinho = useCarrinhoGarcomStore((state) => state.limparCarrinho)
  const removerItem = useCarrinhoGarcomStore((state) => state.removerItem)

  const rascunho = isMounted ? getItens(mesaId) : []


  const enviados = pedidoAtivo?.itens.filter((i) => i.status === 'ENVIADO') ?? []
  const prontos = pedidoAtivo?.itens.filter((i) => i.status === 'PRONTO') ?? []

  const totalRascunho = rascunho.reduce(
    (acc, i) => acc + i.precoUnitario * i.quantidade,
    0
  )
  const totalEnviado = enviados.reduce(
    (acc, i) => acc + i.precoUnitario * i.quantidade,
    0
  )
  const totalPronto = prontos.reduce(
    (acc, i) => acc + i.precoUnitario * i.quantidade,
    0
  )
  const totalGeral = totalRascunho + totalEnviado + totalPronto

  const temEnviados = enviados.length > 0
  const temItens = rascunho.length > 0 || pedidoAtivo !== null

  function handleEnviarRodada() {
    if (rascunho.length === 0) return

    const itensPayload = rascunho.map((i) => ({
      itemCardapioId: i.itemCardapioId,
      quantidade: i.quantidade,
      observacao: i.observacao,
      opcoesSelecionadas: i.opcoesSelecionadas,
    }))

    const { startLoading, stopLoading } = useLoadingStore.getState()
    startLoading()

    startRodada(async () => {
      try {
        const result = await enviarRodada(mesaId, itensPayload)
        if (result.success) {
          limparCarrinho(mesaId)
          toast.success('Rodada enviada para a cozinha!')
          router.refresh()
        } else {
          toast.error(result.error)
        }
      } finally {
        stopLoading()
      }
    })
  }

  function handleFecharConta() {
    if (!pedidoAtivo) return
    if (!metodoPagamento) {
      toast.error('Selecione a forma de pagamento')
      return
    }

    const { startLoading, stopLoading } = useLoadingStore.getState()
    startLoading()

    startFecha(async () => {
      try {
        const result = await fecharPedido(mesaId, pedidoAtivo.id, metodoPagamento)
        if (result.success) {
          limparCarrinho(mesaId)
          toast.success('Conta fechada! Mesa liberada.')
          onClose()
          router.push('/garcom')
        } else {
          toast.error(result.error)
        }
      } finally {
        stopLoading()
      }
    })
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] p-0">
        <SheetHeader className="px-4 pt-5 pb-3">
          <SheetTitle>Mesa {mesaNumero} — Conta</SheetTitle>
        </SheetHeader>

        <Separator />

        <ScrollArea className="max-h-[55vh]">
          {/* ── RASCUNHO ────────────────────────────────────────────────── */}
          {rascunho.length > 0 && (
            <>
              <SecaoHeader
                icon={<ShoppingBasket className="h-3.5 w-3.5 text-slate-600" />}
                label="No carrinho"
                count={rascunho.length}
                colorClass="bg-slate-50 text-slate-600"
              />
              <div className="px-4 py-2 flex flex-col gap-2">
                {rascunho.map((item) => (
                  <div key={item.localId} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-5 text-center">
                      {item.quantidade}×
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.nomeSnapshot}</p>
                      {item.observacao && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.observacao}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold shrink-0">
                      {formatCurrency(item.precoUnitario * item.quantidade)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                      onClick={() => removerItem(mesaId, item.localId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Separator />
            </>
          )}

          {/* ── ENVIADO (na cozinha) ─────────────────────────────────────── */}
          {enviados.length > 0 && (
            <>
              <SecaoHeader
                icon={<ChefHat className="h-3.5 w-3.5 text-orange-600" />}
                label="Na cozinha"
                count={enviados.length}
                colorClass="bg-orange-50 text-orange-600"
              />
              <div className="px-4 py-2 flex flex-col gap-2 opacity-70">
                {enviados.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-5 text-center">
                      {item.quantidade}×
                    </span>
                    <p className="flex-1 text-sm truncate">{item.nomeSnapshot}</p>
                    <span className="text-sm font-semibold shrink-0">
                      {formatCurrency(item.precoUnitario * item.quantidade)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
            </>
          )}

          {/* ── PRONTO ──────────────────────────────────────────────────── */}
          {prontos.length > 0 && (
            <>
              <SecaoHeader
                icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                label="Pronto"
                count={prontos.length}
                colorClass="bg-green-50 text-green-600"
              />
              <div className="px-4 py-2 flex flex-col gap-2">
                {prontos.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-5 text-center">
                      {item.quantidade}×
                    </span>
                    <p className="flex-1 text-sm truncate">{item.nomeSnapshot}</p>
                    <span className="text-sm font-semibold shrink-0">
                      {formatCurrency(item.precoUnitario * item.quantidade)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
            </>
          )}

          {!temItens && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <ShoppingBasket className="h-8 w-8 mb-2" />
              <p className="text-sm">Carrinho vazio</p>
            </div>
          )}
        </ScrollArea>

        {/* ── Rodapé com total + ações ─────────────────────────────────────── */}
        <div className="px-4 py-4 border-t space-y-3">
          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total da mesa</span>
            <span className="font-bold text-lg">{formatCurrency(totalGeral)}</span>
          </div>

          {/* Enviar Rodada */}
          {rascunho.length > 0 && (
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleEnviarRodada}
              disabled={isPendingRodada}
            >
              {isPendingRodada ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                <>Enviar rodada · {formatCurrency(totalRascunho)}</>
              )}
            </Button>
          )}

          {/* Fechar Conta */}
          {pedidoAtivo && rascunho.length === 0 && (
            <>
              {temEnviados ? (
                <p className="text-xs text-center text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                  Aguarde {enviados.length} item(s) na cozinha antes de fechar a conta
                </p>
              ) : (
                <div className="flex gap-2">
                  <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {METODOS_PAGAMENTO.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    className="flex-1 h-10"
                    onClick={handleFecharConta}
                    disabled={isPendingFecha || !metodoPagamento}
                  >
                    {isPendingFecha ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Fechar conta'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
