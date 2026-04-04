'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { confirmarReserva } from '@/actions/garcom/pedidos'

export type MesaStatus = 'LIVRE' | 'OCUPADA' | 'RESERVADA'

export interface MesaGarcom {
  id: string
  numero: number
  status: string
}

interface MesaGarcomCardProps {
  mesa: MesaGarcom
  /** Quantidade de itens com status ENVIADO no pedido ativo (apenas OCUPADA) */
  enviadoCount?: number
}

const STATUS_CONFIG: Record<MesaStatus, { label: string; badge: string; card: string }> = {
  LIVRE: {
    label: 'Livre',
    badge: 'bg-green-500 hover:bg-green-500 text-white border-transparent',
    card: 'border-green-200 hover:border-green-400 hover:shadow-md cursor-pointer transition-all',
  },
  OCUPADA: {
    label: 'Ocupada',
    badge: 'bg-orange-500 hover:bg-orange-500 text-white border-transparent',
    card: 'border-orange-200 hover:border-orange-400 hover:shadow-md cursor-pointer transition-all',
  },
  RESERVADA: {
    label: 'Reservada',
    badge: 'bg-blue-500 hover:bg-blue-500 text-white border-transparent',
    card: 'border-blue-200',
  },
}

function ConfirmarReservaButton({ mesaId }: { mesaId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await confirmarReserva(mesaId)
      if (result.success) {
        toast.success('Reserva confirmada — mesa liberada')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full mt-2 text-xs h-7"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? 'Confirmando...' : 'Confirmar chegada'}
    </Button>
  )
}

export function MesaGarcomCard({ mesa, enviadoCount = 0 }: MesaGarcomCardProps) {
  const status = (mesa.status as MesaStatus) in STATUS_CONFIG
    ? (mesa.status as MesaStatus)
    : 'LIVRE'
  const config = STATUS_CONFIG[status]

  const cardContent = (
    <CardContent className="flex flex-col items-center gap-2 py-5 px-3">
      <span className="text-4xl font-bold">{mesa.numero}</span>
      <Badge className={config.badge}>{config.label}</Badge>

      {status === 'OCUPADA' && enviadoCount > 0 && (
        <Badge
          variant="outline"
          className="text-xs border-orange-300 text-orange-700 bg-orange-50"
        >
          {enviadoCount} na cozinha
        </Badge>
      )}

      {status === 'RESERVADA' && (
        <ConfirmarReservaButton mesaId={mesa.id} />
      )}
    </CardContent>
  )

  if (status === 'RESERVADA') {
    return (
      <Card className={cn('flex flex-col', config.card)}>
        {cardContent}
      </Card>
    )
  }

  return (
    <Link href={`/garcom/mesa/${mesa.id}`}>
      <Card className={cn('flex flex-col', config.card)}>
        {cardContent}
      </Card>
    </Link>
  )
}
