'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ROLES, type Role } from '@/lib/roles'

// ─── Guard ────────────────────────────────────────────────────────────────────

const COZINHA_ROLES: Role[] = [ROLES.COZINHA, ROLES.ADMIN, ROLES.SUPERADMIN]

async function requireCozinha() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) throw new Error('Não autorizado')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, active: true },
  })

  if (!dbUser || !dbUser.active || !COZINHA_ROLES.includes(dbUser.role as Role)) {
    throw new Error('Acesso negado')
  }
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CozinhaActionResult =
  | { success: true }
  | { success: false; error: string }

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function marcarItemPronto(itemId: string): Promise<CozinhaActionResult> {
  try {
    await requireCozinha()

    const item = await prisma.pedidoItem.findUnique({
      where: { id: itemId },
      select: { status: true },
    })

    if (!item) return { success: false, error: 'Item não encontrado' }
    if (item.status !== 'ENVIADO') {
      return { success: false, error: 'Item não está pendente de preparo' }
    }

    await prisma.pedidoItem.update({
      where: { id: itemId },
      data: { status: 'PRONTO' },
    })

    revalidatePath('/cozinha')
    revalidatePath('/garcom')

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao marcar item como pronto'
    return { success: false, error: msg }
  }
}

export async function marcarTodosProntos(pedidoId: string): Promise<CozinhaActionResult> {
  try {
    await requireCozinha()

    await prisma.pedidoItem.updateMany({
      where: { pedidoId, status: 'ENVIADO' },
      data: { status: 'PRONTO' },
    })

    revalidatePath('/cozinha')
    revalidatePath('/garcom')

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao marcar pedido como pronto'
    return { success: false, error: msg }
  }
}
