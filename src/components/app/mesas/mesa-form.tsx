'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { createMesa, updateMesa } from '@/actions/admin/mesas'
import type { Mesa } from './mesa-card'

interface MesaFormProps {
  mesa?: Mesa
  children: React.ReactNode
}

export function MesaForm({ mesa, children }: MesaFormProps) {
  const isEdit = !!mesa
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = isEdit
        ? await updateMesa(mesa.id, formData)
        : await createMesa(formData)

      if (result.success) {
        toast.success(isEdit ? 'Mesa atualizada' : 'Mesa criada')
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
          <SheetTitle>{isEdit ? `Editar Mesa ${mesa.numero}` : 'Nova Mesa'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Altere o número ou o status da mesa.'
              : 'Preencha o número da nova mesa.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-4 py-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="numero">Número da Mesa</Label>
            <Input
              id="numero"
              name="numero"
              type="number"
              min={1}
              defaultValue={mesa?.numero}
              placeholder="Ex: 1"
              required
            />
          </div>

          {isEdit && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={mesa.status}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIVRE">Livre</SelectItem>
                  <SelectItem value="OCUPADA">Ocupada</SelectItem>
                  <SelectItem value="RESERVADA">Reservada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <SheetFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar mesa'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
