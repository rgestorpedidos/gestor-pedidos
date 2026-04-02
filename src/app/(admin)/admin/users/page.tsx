export const dynamic = 'force-dynamic'

import { Users, UserPlus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getUserRole } from '@/lib/auth'
import { ADMIN_ROLES } from '@/lib/roles'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserForm } from '@/components/app/users/user-form'
import { UsersTable, type UserRow } from '@/components/app/users/users-table'

export default async function UsersPage() {
  const role = await getUserRole()

  if (!role || !ADMIN_ROLES.includes(role)) {
    redirect('/login')
  }

  const users = await prisma.user.findMany({
    orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  })

  const usersData: UserRow[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRow['role'],
    active: user.active,
    createdAt: user.createdAt.toISOString(),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Gerencie acessos do sistema, roles e status dos colaboradores.
            Usuários inativos não conseguem autenticar.
          </p>
        </div>

        <UserForm currentRole={role}>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </UserForm>
      </div>

      {usersData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Users className="mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Nenhum usuário cadastrado</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em &quot;Novo Usuário&quot; para criar o primeiro acesso.
          </p>
        </div>
      ) : (
        <UsersTable users={usersData} currentRole={role} />
      )}
    </div>
  )
}
