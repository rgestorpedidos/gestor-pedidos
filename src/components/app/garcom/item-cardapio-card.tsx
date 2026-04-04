'use client'

import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ItemCardapioData } from './types'

interface ItemCardapioCardProps {
  item: ItemCardapioData
  onAdd: (item: ItemCardapioData) => void
}

export function ItemCardapioCard({ item, onAdd }: ItemCardapioCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl border bg-card',
        'active:bg-accent transition-colors'
      )}
    >
      {/* Imagem */}
      {item.imagemUrl && (
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={item.imagemUrl}
            alt={item.nome}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm leading-tight">{item.nome}</p>
          {!item.vaiParaCozinha && (
            <Badge variant="outline" className="text-xs shrink-0 text-green-700 border-green-300">
              Imediato
            </Badge>
          )}
        </div>

        {item.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.descricao}</p>
        )}

        <div className="flex items-center justify-between mt-1">
          <span className="font-bold text-sm">
            {item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>

          {/* Touch target mínimo 44px — zona do polegar */}
          <Button
            size="sm"
            className="h-9 w-9 rounded-full p-0"
            onClick={() => onAdd(item)}
            aria-label={`Adicionar ${item.nome}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
