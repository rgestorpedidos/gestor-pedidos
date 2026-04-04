'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { updateUserRole, setUserActive, deleteUser } from '@/actions/admin/users'
import { ALL_ROLES, ROLES, type Role } from '@/lib/roles'

type UserActionResult = { success: true } | { success: false; error: string }

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
  currentUserId?: string
  showDelete?: boolean
}

function canEditUser(actorRole: Role, targetRole: Role) {
  return actorRole === ROLES.SUPERADMIN || targetRole !== ROLES.SUPERADMIN
}

function useUserAction() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function run(action: () => Promise<UserActionResult>, successMsg: string) {
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        toast.success(successMsg)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return { isPending, run }
}

function RoleCell({ user, currentRole }: { user: UserRow; currentRole: Role }) {
  const { isPending, run } = useUserAction()

  function handleChange(role: string) {
    const fd = new FormData()
    fd.set('role', role)
    run(() => updateUserRole(user.id, fd), 'Role atualizada')
  }

  return (
    <Select
      defaultValue={user.role}
      onValueChange={handleChange}
      disabled={isPending || !canEditUser(currentRole, user.role)}
    >
      <SelectTrigger className="h-9 w-[160px]">
        <SelectValue placeholder="Role" />
      </SelectTrigger>
      <SelectContent>
        {ALL_ROLES.map((role) => (
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
  const { isPending, run } = useUserAction()

  function handleChange(active: boolean) {
    const fd = new FormData()
    fd.set('active', String(active))
    run(() => setUserActive(user.id, fd), active ? 'Usuário ativado' : 'Usuário desativado')
  }

  return (
    <Switch
      checked={user.active}
      onCheckedChange={handleChange}
      disabled={isPending || !canEditUser(currentRole, user.role)}
    />
  )
}

function DeleteCell({ user, currentUserId }: { user: UserRow; currentUserId?: string }) {
  const { isPending, run } = useUserAction()
  const isSelf = user.id === currentUserId

  function handleDelete() {
    run(() => deleteUser(user.id), 'Usuário removido')
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending || isSelf}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          title={isSelf ? 'Não é possível excluir sua própria conta' : 'Excluir usuário'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação removerá <strong>{user.name}</strong> ({user.email}) permanentemente do
            sistema e revogará o acesso imediatamente. Esta operação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            Excluir permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function UsersTable({ users, currentRole, currentUserId, showDelete = false }: UsersTableProps) {
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
            {showDelete && <TableHead className="w-12" />}
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
              {showDelete && (
                <TableCell>
                  <DeleteCell user={user} currentUserId={currentUserId} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
