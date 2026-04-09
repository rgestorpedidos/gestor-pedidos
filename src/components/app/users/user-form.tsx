'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { createUser } from '@/actions/admin/users'
import { ALL_ROLES, ROLES, type Role } from '@/lib/roles'

const ROLE_LABELS: Record<Role, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  GARCOM: 'Garçom',
  COZINHA: 'Cozinha',
}

interface UserFormProps {
  currentRole: Role
  children: React.ReactNode
}

export function UserForm({ currentRole, children }: UserFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(true)
  const [role, setRole] = useState<Role>(ROLES.GARCOM)
  const [isPending, startTransition] = useTransition()

  const roleOptions = ALL_ROLES.filter((value) => value !== ROLES.SUPERADMIN || currentRole === ROLES.SUPERADMIN)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('active', String(active))
    formData.set('role', role)

    startTransition(async () => {
      const result = await createUser(formData)

      if (result.success) {
        toast.success('Usuário criado')
        form.reset()
        setOpen(false)
        setActive(true)
        setRole(ROLES.GARCOM)
        router.refresh()
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
          <SheetTitle>Novo usuário</SheetTitle>
          <SheetDescription>
            Crie um usuário autorizado para acessar o sistema.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nome@exemplo.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              placeholder="Nome do usuário"
              required
              minLength={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione uma role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {ROLE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Status ativo</Label>
              <p className="text-xs text-muted-foreground">
                Usuários inativos não conseguem fazer login.
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <SheetFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Criando...' : 'Criar usuário'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
