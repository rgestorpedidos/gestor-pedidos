'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { createCategoria, updateCategoria } from '@/actions/admin/cardapio'

export interface CategoriaData {
  id: string
  nome: string
  ordem: number
  ativo: boolean
}

interface CategoriaFormProps {
  categoria?: CategoriaData
  children: React.ReactNode
}

export function CategoriaForm({ categoria, children }: CategoriaFormProps) {
  const isEdit = !!categoria
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = isEdit
        ? await updateCategoria(categoria.id, formData)
        : await createCategoria(formData)

      if (result.success) {
        toast.success(isEdit ? 'Categoria atualizada' : 'Categoria criada')
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Categoria' : 'Nova Categoria'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Altere os dados da categoria.' : 'Preencha os dados da nova categoria.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              defaultValue={categoria?.nome}
              placeholder="Ex: Bebidas"
              required
              maxLength={60}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ordem">Ordem de exibição</Label>
            <Input
              id="ordem"
              name="ordem"
              type="number"
              min={0}
              defaultValue={categoria?.ordem ?? 0}
            />
          </div>

          <input type="hidden" name="ativo" value={String(categoria?.ativo ?? true)} />

          <SheetFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar categoria'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
