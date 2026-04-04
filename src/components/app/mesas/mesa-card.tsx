'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'
import { MesaForm } from './mesa-form'
import { DeleteDialog } from './delete-dialog'

export type MesaStatus = 'LIVRE' | 'OCUPADA' | 'RESERVADA'

export interface Mesa {
  id: string
  numero: number
  status: MesaStatus
}

interface MesaCardProps {
  mesa: Mesa
}

const STATUS_CONFIG: Record<MesaStatus, { label: string; className: string }> = {
  LIVRE: {
    label: 'Livre',
    className: 'bg-green-500 hover:bg-green-600 text-white border-transparent',
  },
  OCUPADA: {
    label: 'Ocupada',
    className: 'bg-orange-500 hover:bg-orange-600 text-white border-transparent',
  },
  RESERVADA: {
    label: 'Reservada',
    className: 'bg-blue-500 hover:bg-blue-600 text-white border-transparent',
  },
}

export function MesaCard({ mesa }: MesaCardProps) {
  const config = STATUS_CONFIG[mesa.status]

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-col items-center gap-3 pt-6 pb-3 flex-1">
        <span className="text-4xl font-bold text-foreground">{mesa.numero}</span>
        <Badge className={config.className}>{config.label}</Badge>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-0 pb-4 px-4">
        <MesaForm mesa={mesa}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar mesa {mesa.numero}</span>
          </Button>
        </MesaForm>
        <DeleteDialog mesaId={mesa.id} mesaNumero={mesa.numero}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Excluir mesa {mesa.numero}</span>
          </Button>
        </DeleteDialog>
      </CardFooter>
    </Card>
  )
}
