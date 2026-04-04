'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat } from 'lucide-react'
import { PedidoCozinhaCard } from './pedido-cozinha-card'
import type { PedidoCozinhaData } from './pedido-cozinha-card'

interface CozinhaViewProps {
  pedidos: PedidoCozinhaData[]
}

const POLL_INTERVAL_MS = 10_000

export function CozinhaView({ pedidos }: CozinhaViewProps) {
  const router = useRouter()

  // Polling 10s — pausa quando aba em background
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (timer !== null) return
      timer = setInterval(() => router.refresh(), POLL_INTERVAL_MS)
    }

    const stop = () => {
      if (timer !== null) { clearInterval(timer); timer = null }
    }

    const handleVisibility = () => {
      if (document.hidden) { stop() } else { router.refresh(); start() }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    if (!document.hidden) start()

    return () => { stop(); document.removeEventListener('visibilitychange', handleVisibility) }
  }, [router])

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <div className="rounded-full bg-green-50 p-5">
          <ChefHat className="h-10 w-10 text-green-500" />
        </div>
        <p className="font-semibold text-lg text-foreground">Tudo em dia!</p>
        <p className="text-sm">Nenhum item aguardando preparo.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pedidos.map((pedido) => (
        <PedidoCozinhaCard key={pedido.pedidoId} pedido={pedido} />
      ))}
    </div>
  )
}
