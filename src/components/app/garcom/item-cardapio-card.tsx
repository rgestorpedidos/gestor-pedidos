'use client'

import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ItemCardapioData } from './types'

interface ItemCardapioCardProps {
  item: ItemCardapioData
  onAdd: (item: ItemCardapioData) => void
}

export function ItemCardapioCard({ item, onAdd }: ItemCardapioCardProps) {
  return (
    <div
      className="flex items-center justify-between py-4 border-b border-border last:border-b-0 cursor-pointer"
      onClick={() => onAdd(item)}
    >
      {/* Esquerda: nome, descrição, preço */}
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-foreground text-base">{item.nome}</h3>
          {!item.vaiParaCozinha && (
            <Badge variant="outline" className="text-xs shrink-0 text-green-700 border-green-300">
              Imediato
            </Badge>
          )}
        </div>
        {item.descricao && (
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{item.descricao}</p>
        )}
        <p className="text-foreground font-semibold mt-2">
          {item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>

      {/* Direita: imagem com botão sobreposto */}
      <div className="relative flex-shrink-0">
        <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted">
          {item.imagemUrl ? (
            <Image
              src={item.imagemUrl}
              alt={item.nome}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <span className="text-xs text-gray-400">Sem foto</span>
            </div>
          )}
        </div>
        <Button
          size="sm"
          className="absolute bottom-1 right-1 h-7 w-7 p-0 rounded-full bg-white hover:bg-white/90 text-primary shadow-sm border border-gray-100 z-10"
          onClick={(e) => { e.stopPropagation(); onAdd(item) }}
          aria-label={`Adicionar ${item.nome}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
