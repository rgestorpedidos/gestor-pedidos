'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { marcarItemPronto, marcarTodosProntos } from '@/actions/cozinha/pedidos'

export interface ItemCozinha {
  id: string
  nomeSnapshot: string
  quantidade: number
  observacao: string | null
  minutosEspera: number
}

export interface PedidoCozinhaData {
  pedidoId: string
  mesaNumero: number
  itens: ItemCozinha[]
}

function ItemRow({ item, onPronto }: { item: ItemCozinha; onPronto: (id: string) => void }) {
  const urgente = item.minutosEspera >= 15

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {item.quantidade}× {item.nomeSnapshot}
          </span>
          {urgente && (
            <Badge className="bg-red-500 text-white text-xs px-1.5 h-4">
              {item.minutosEspera}min
            </Badge>
          )}
        </div>
        {item.observacao && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">
            {item.observacao}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-8 shrink-0 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
        onClick={() => onPronto(item.id)}
      >
        <CheckCircle2 className="h-4 w-4 mr-1" />
        Pronto
      </Button>
    </div>
  )
}

export function PedidoCozinhaCard({ pedido }: { pedido: PedidoCozinhaData }) {
  const [isPending, startTransition] = useTransition()

  function handleItemPronto(itemId: string) {
    startTransition(async () => {
      const result = await marcarItemPronto(itemId)
      if (!result.success) toast.error(result.error)
    })
  }

  function handleTodosProntos() {
    startTransition(async () => {
      const result = await marcarTodosProntos(pedido.pedidoId)
      if (result.success) {
        toast.success(`Mesa ${pedido.mesaNumero} — todos os itens prontos`)
      } else {
        toast.error(result.error)
      }
    })
  }

  const maxEspera = Math.max(...pedido.itens.map((i) => i.minutosEspera))

  return (
    <Card className={maxEspera >= 15 ? 'border-red-300 shadow-red-100 shadow-md' : ''}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            Mesa {pedido.mesaNumero}
          </CardTitle>
          <div className="flex items-center gap-2">
            {maxEspera > 0 && (
              <span className="text-xs text-muted-foreground">{maxEspera}min</span>
            )}
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs"
              onClick={handleTodosProntos}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Tudo pronto'
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="px-4 pb-3 divide-y">
        {pedido.itens.map((item) => (
          <ItemRow key={item.id} item={item} onPronto={handleItemPronto} />
        ))}
      </CardContent>
    </Card>
  )
}
