export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { UtensilsCrossed } from 'lucide-react'
import { MesaGarcomCard } from '@/components/app/garcom/mesa-garcom-card'

export default async function GarcomPage() {
  const mesas = await prisma.mesa.findMany({
    orderBy: { numero: 'asc' },
    include: {
      pedidos: {
        where: { status: 'ABERTO' },
        select: {
          id: true,
          itens: {
            where: { status: 'ENVIADO' },
            select: { id: true },
          },
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Mesas</h1>
      </div>

      {mesas.length === 0 ? (
        <p className="text-muted-foreground italic">
          Nenhuma mesa configurada ainda. Peça ao administrador para criar mesas.
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {mesas.map((mesa) => (
            <MesaGarcomCard
              key={mesa.id}
              mesa={{
                id: mesa.id,
                numero: mesa.numero,
                status: mesa.status,
              }}
              enviadoCount={mesa.pedidos[0]?.itens.length ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
