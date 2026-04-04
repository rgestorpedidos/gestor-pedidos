export const dynamic = 'force-dynamic'

import { ShieldCheck, Users, ShoppingBag, DoorOpen, DoorClosed, CheckCircle, Clock, Receipt, UserPlus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUserSession } from '@/lib/auth'
import { ROLES } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { getDashboardMetrics } from '@/actions/admin/metrics'
import { UserForm } from '@/components/app/users/user-form'
import { UsersTable, type UserRow } from '@/components/app/users/users-table'

function fmt(value: number | null) {
  return value != null ? String(value) : '—'
}

function formatCurrency(value: number | null) {
  if (value === null) return '—'
  if (value === 0) return 'sem dados'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title: string
  value: React.ReactNode
  description: string
  icon: React.ElementType
  iconClass?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconClass ?? 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default async function SuperAdminPage() {
  const session = await getUserSession()

  if (session?.role !== ROLES.SUPERADMIN) {
    redirect('/admin')
  }

  const { role, userId: currentUserId } = session

  const [users, metrics] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { active: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    }),
    getDashboardMetrics(),
  ])

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
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">Super Admin</h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Visão consolidada do sistema. Esta área é exclusiva para Superadmins.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Sistema
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Mesas Livres"      value={fmt(metrics.mesasLivres)}      description="Disponíveis agora"          icon={DoorOpen}    iconClass="text-green-500"  />
          <MetricCard title="Mesas Ocupadas"    value={fmt(metrics.mesasOcupadas)}    description="Com clientes no momento"    icon={DoorClosed}  iconClass="text-orange-500" />
          <MetricCard title="Pedidos Abertos"   value={fmt(metrics.pedidosAbertos)}   description="Em andamento agora"         icon={ShoppingBag} iconClass="text-orange-500" />
          <MetricCard title="Itens na Cozinha"  value={fmt(metrics.itensNaCozinha)}   description="Aguardando preparo"         icon={Clock}       iconClass="text-yellow-500" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Pedidos Fechados Hoje" value={fmt(metrics.pedidosFechadosHoje)} description="Finalizados hoje"               icon={CheckCircle} iconClass="text-green-500" />
          <MetricCard title="Ticket Médio"          value={formatCurrency(metrics.ticketMedio)} description="Média dos pedidos fechados"  icon={Receipt}                               />
          <MetricCard title="Total de Usuários"     value={fmt(metrics.totalUsuarios)}   description="Cadastrados no sistema"         icon={Users}                                  />
          <MetricCard title="Usuários Ativos"       value={fmt(metrics.usuariosAtivos)}  description="Com acesso habilitado"          icon={Users}       iconClass="text-blue-500"  />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Todos os Usuários</h2>
            <p className="text-sm text-muted-foreground">
              Como Superadmin você pode excluir usuários permanentemente.
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
          </div>
        ) : (
          <UsersTable
            users={usersData}
            currentRole={role}
            currentUserId={currentUserId}
            showDelete
          />
        )}
      </div>
    </div>
  )
}
