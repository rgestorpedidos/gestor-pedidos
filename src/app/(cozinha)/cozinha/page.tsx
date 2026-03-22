import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChefHat } from 'lucide-react'

export default function CozinhaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ChefHat className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Cozinha</h1>
      </div>
      
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl">
        <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-medium">
          Aguardando novos pedidos...
        </p>
      </div>
    </div>
  )
}
