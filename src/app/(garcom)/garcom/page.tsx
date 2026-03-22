import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UtensilsCrossed } from 'lucide-react'

export default function GarcomPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Mesas</h1>
      </div>
      
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        {/* Placeholder para mesas */}
        <p className="col-span-full text-muted-foreground italic">
          Nenhuma mesa configurada ainda.
        </p>
      </div>
    </div>
  )
}
