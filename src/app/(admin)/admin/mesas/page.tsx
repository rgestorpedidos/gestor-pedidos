import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { UtensilsCrossed } from 'lucide-react'
import { MesaCard } from '@/components/app/mesas/mesa-card'
import { MesaForm } from '@/components/app/mesas/mesa-form'

export const dynamic = 'force-dynamic'

export default async function MesasPage() {
  const mesas = await prisma.mesa.findMany({ orderBy: { numero: 'asc' } })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Mesas</h1>
        <MesaForm>
          <Button>
            <UtensilsCrossed className="mr-2 h-4 w-4" />
            Nova Mesa
          </Button>
        </MesaForm>
      </div>

      {mesas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <UtensilsCrossed className="h-10 w-10 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">Nenhuma mesa cadastrada</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em &quot;Nova Mesa&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {mesas.map((mesa) => (
            <MesaCard
              key={mesa.id}
              mesa={{
                id: mesa.id,
                numero: mesa.numero,
                status: mesa.status as 'LIVRE' | 'OCUPADA' | 'RESERVADA',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
