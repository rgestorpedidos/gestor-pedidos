import Link from 'next/link'
import { UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MesaNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center px-4">
      <div className="rounded-full bg-muted p-4">
        <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Mesa não encontrada</h2>
        <p className="text-sm text-muted-foreground">
          Esta mesa não existe ou foi removida.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/garcom">Voltar para mesas</Link>
      </Button>
    </div>
  )
}
