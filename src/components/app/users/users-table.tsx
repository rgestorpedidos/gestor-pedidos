'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateUserRole, setUserActive } from '@/actions/admin/users'
import { ALL_ROLES, ROLES, type Role } from '@/lib/roles'

const ROLE_LABELS: Record<Role, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  GARCOM: 'Garçom',
  COZINHA: 'Cozinha',
}

export interface UserRow {
  id: string
  email: string
  name: string
  role: Role
  active: boolean
  createdAt: string
}

interface UsersTableProps {
  users: UserRow[]
  currentRole: Role
}

function RoleCell({ user, currentRole }: { user: UserRow; currentRole: Role }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const canEditProtectedUser = currentRole === ROLES.SUPERADMIN || user.role !== ROLES.SUPERADMIN
  const roleOptions = ALL_ROLES

  function handleChange(role: string) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('role', role)
      const result = await updateUserRole(user.id, formData)

      if (result.success) {
        toast.success('Role atualizada')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Select
      defaultValue={user.role}
      onValueChange={handleChange}
      disabled={isPending || !canEditProtectedUser}
    >
      <SelectTrigger className="h-9 w-[160px]">
        <SelectValue placeholder="Role" />
      </SelectTrigger>
      <SelectContent>
        {roleOptions.map((role) => (
          <SelectItem
            key={role}
            value={role}
            disabled={role === ROLES.SUPERADMIN && currentRole !== ROLES.SUPERADMIN}
          >
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ActiveCell({ user, currentRole }: { user: UserRow; currentRole: Role }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const canEditProtectedUser = currentRole === ROLES.SUPERADMIN || user.role !== ROLES.SUPERADMIN

  function handleChange(active: boolean) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('active', String(active))
      const result = await setUserActive(user.id, formData)

      if (result.success) {
        toast.success(active ? 'Usuário ativado' : 'Usuário desativado')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Switch
      checked={user.active}
      onCheckedChange={handleChange}
      disabled={isPending || !canEditProtectedUser}
    />
  )
}

export function UsersTable({ users, currentRole }: UsersTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <RoleCell user={user} currentRole={currentRole} />
                  {user.role === ROLES.SUPERADMIN && (
                    <Badge variant="secondary">Protegido</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <ActiveCell user={user} currentRole={currentRole} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
