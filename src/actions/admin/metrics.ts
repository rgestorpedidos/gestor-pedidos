'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ADMIN_ROLES } from '@/lib/roles'
import type { Role } from '@/lib/roles'

export interface DashboardMetrics {
  // Mesas
  mesasLivres: number | null
  mesasOcupadas: number | null
  // Usuários
  totalUsuarios: number | null
  usuariosAtivos: number | null
  // Pedidos
  pedidosAbertos: number | null
  pedidosFechadosHoje: number | null
  ticketMedio: number | null
  itensNaCozinha: number | null
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Não autorizado')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, active: true },
  })

  if (!dbUser || !dbUser.active || !ADMIN_ROLES.includes(dbUser.role as Role)) {
    throw new Error('Acesso negado')
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [
    mesasLivresResult,
    mesasOcupadasResult,
    totalUsuariosResult,
    usuariosAtivosResult,
    pedidosAbertosResult,
    pedidosFechadosHojeResult,
    itensNaCozinhaResult,
    ticketMedioResult,
  ] = await Promise.allSettled([
    prisma.mesa.count({ where: { status: 'LIVRE' } }),
    prisma.mesa.count({ where: { status: 'OCUPADA' } }),
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.pedido.count({ where: { status: 'ABERTO' } }),
    prisma.pedido.count({ where: { status: 'FECHADO', updatedAt: { gte: startOfDay } } }),
    prisma.pedidoItem.count({
      where: {
        status: 'ENVIADO',
        pedido: { status: 'ABERTO' },
      },
    }),
    // Ticket médio: busca pedidos FECHADOS hoje com seus itens para calcular totais
    prisma.pedido.findMany({
      where: { status: 'FECHADO', updatedAt: { gte: startOfDay } },
      select: {
        itens: { select: { precoUnitario: true, quantidade: true } },
      },
    }),
  ])

  let ticketMedio: number | null = null
  if (ticketMedioResult.status === 'fulfilled') {
    const pedidos = ticketMedioResult.value
    if (pedidos.length > 0) {
      const totalGeral = pedidos.reduce((soma, pedido) => {
        const totalPedido = pedido.itens.reduce(
          (s, item) => s + item.precoUnitario * item.quantidade,
          0
        )
        return soma + totalPedido
      }, 0)
      ticketMedio = totalGeral / pedidos.length
    } else {
      ticketMedio = 0
    }
  }

  return {
    mesasLivres:         mesasLivresResult.status         === 'fulfilled' ? mesasLivresResult.value         : null,
    mesasOcupadas:       mesasOcupadasResult.status       === 'fulfilled' ? mesasOcupadasResult.value       : null,
    totalUsuarios:       totalUsuariosResult.status       === 'fulfilled' ? totalUsuariosResult.value       : null,
    usuariosAtivos:      usuariosAtivosResult.status      === 'fulfilled' ? usuariosAtivosResult.value      : null,
    pedidosAbertos:      pedidosAbertosResult.status      === 'fulfilled' ? pedidosAbertosResult.value      : null,
    pedidosFechadosHoje: pedidosFechadosHojeResult.status === 'fulfilled' ? pedidosFechadosHojeResult.value : null,
    itensNaCozinha:      itensNaCozinhaResult.status      === 'fulfilled' ? itensNaCozinhaResult.value      : null,
    ticketMedio,
  }
}
