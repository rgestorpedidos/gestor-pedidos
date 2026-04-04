export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { ChefHat } from 'lucide-react'
import { CozinhaView } from '@/components/app/cozinha/cozinha-view'
import type { PedidoCozinhaData } from '@/components/app/cozinha/pedido-cozinha-card'

export default async function CozinhaPage() {
  const agora = new Date()

  const itens = await prisma.pedidoItem.findMany({
    where: { status: 'ENVIADO' },
    include: {
      pedido: {
        select: {
          id: true,
          mesa: { select: { numero: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Agrupa por pedidoId
  const grupos = new Map<string, PedidoCozinhaData>()

  for (const item of itens) {
    const pedidoId = item.pedido.id
    const mesaNumero = item.pedido.mesa.numero
    const minutosEspera = Math.floor(
      (agora.getTime() - item.createdAt.getTime()) / 60_000
    )

    if (!grupos.has(pedidoId)) {
      grupos.set(pedidoId, { pedidoId, mesaNumero, itens: [] })
    }

    grupos.get(pedidoId)!.itens.push({
      id: item.id,
      nomeSnapshot: item.nomeSnapshot,
      quantidade: item.quantidade,
      observacao: item.observacao,
      minutosEspera,
    })
  }

  const pedidos = Array.from(grupos.values())

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="h-7 w-7 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">Cozinha</h1>
        </div>
        {pedidos.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {itens.length} item(s) pendente(s)
          </span>
        )}
      </div>

      <CozinhaView pedidos={pedidos} />
    </div>
  )
}
