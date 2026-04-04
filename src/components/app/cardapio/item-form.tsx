'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { createItemCardapio, updateItemCardapio } from '@/actions/admin/cardapio'

export interface ItemData {
  id: string
  nome: string
  descricao: string | null
  preco: number
  imagemUrl: string | null
  vaiParaCozinha: boolean
  ativo: boolean
  categoriaId: string
}

export interface CategoriaOption {
  id: string
  nome: string
}

interface ItemFormProps {
  item?: ItemData
  categorias: CategoriaOption[]
  children: React.ReactNode
}

export function ItemForm({ item, categorias, children }: ItemFormProps) {
  const isEdit = !!item
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [vaiParaCozinha, setVaiParaCozinha] = useState(item?.vaiParaCozinha ?? true)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('vaiParaCozinha', String(vaiParaCozinha))

    startTransition(async () => {
      const result = isEdit
        ? await updateItemCardapio(item.id, formData)
        : await createItemCardapio(formData)

      if (result.success) {
        toast.success(isEdit ? 'Item atualizado' : 'Item criado')
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Item' : 'Novo Item'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Altere os dados do item.' : 'Preencha os dados do novo item do cardápio.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              defaultValue={item?.nome}
              placeholder="Ex: X-Burguer"
              required
              maxLength={100}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              name="descricao"
              defaultValue={item?.descricao ?? ''}
              placeholder="Descreva o item (opcional)"
              maxLength={300}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="preco">Preço (R$)</Label>
            <Input
              id="preco"
              name="preco"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={item?.preco}
              placeholder="0,00"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="categoriaId">Categoria</Label>
            <Select name="categoriaId" defaultValue={item?.categoriaId} required>
              <SelectTrigger id="categoriaId">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="imagemUrl">URL da imagem (opcional)</Label>
            <Input
              id="imagemUrl"
              name="imagemUrl"
              type="url"
              defaultValue={item?.imagemUrl ?? ''}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Vai para a cozinha</Label>
              <p className="text-xs text-muted-foreground">
                Desative para itens que não precisam de preparo (ex: bebidas geladas)
              </p>
            </div>
            <Switch
              checked={vaiParaCozinha}
              onCheckedChange={setVaiParaCozinha}
            />
          </div>

          <input type="hidden" name="ativo" value={String(item?.ativo ?? true)} />

          <SheetFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar item'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
