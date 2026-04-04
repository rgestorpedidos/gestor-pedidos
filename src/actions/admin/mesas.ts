'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ADMIN_ROLES } from '@/lib/roles'
import type { Role } from '@/lib/roles'

// ─── Guard reutilizável ───────────────────────────────────────────────────────

async function requireAdmin() {
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

  if (!dbUser || !dbUser.active || !ADMIN_ROLES.includes(dbUser.role as Role)) {
    throw new Error('Acesso negado')
  }
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createMesaSchema = z.object({
  numero: z.coerce.number().int().positive('O número da mesa deve ser positivo'),
})

const updateMesaSchema = z.object({
  numero: z.coerce.number().int().positive('O número da mesa deve ser positivo').optional(),
  status: z.enum(['LIVRE', 'OCUPADA', 'RESERVADA']).optional(),
})

// ─── Actions ─────────────────────────────────────────────────────────────────

export type MesaActionResult =
  | { success: true }
  | { success: false; error: string }

export async function createMesa(
  formData: FormData
): Promise<MesaActionResult> {
  try {
    await requireAdmin()

    const parsed = createMesaSchema.safeParse({
      numero: formData.get('numero'),
    })

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { numero } = parsed.data

    const exists = await prisma.mesa.findUnique({ where: { numero } })
    if (exists) {
      return { success: false, error: `Mesa ${numero} já existe` }
    }

    await prisma.mesa.create({ data: { numero } })
    revalidatePath('/admin/mesas')
    revalidatePath('/admin')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar mesa'
    return { success: false, error: message }
  }
}

export async function updateMesa(
  id: string,
  formData: FormData
): Promise<MesaActionResult> {
  try {
    await requireAdmin()

    const parsed = updateMesaSchema.safeParse({
      numero: formData.get('numero') || undefined,
      status: formData.get('status') || undefined,
    })

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { numero, status } = parsed.data

    if (numero !== undefined) {
      const conflict = await prisma.mesa.findFirst({
        where: { numero, NOT: { id } },
      })
      if (conflict) {
        return { success: false, error: `Mesa ${numero} já existe` }
      }
    }

    await prisma.mesa.update({
      where: { id },
      data: { ...(numero !== undefined && { numero }), ...(status && { status }) },
    })

    revalidatePath('/admin/mesas')
    revalidatePath('/admin')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar mesa'
    return { success: false, error: message }
  }
}

export async function deleteMesa(id: string): Promise<MesaActionResult> {
  try {
    await requireAdmin()

    await prisma.mesa.delete({ where: { id } })

    revalidatePath('/admin/mesas')
    revalidatePath('/admin')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir mesa'
    return { success: false, error: message }
  }
}
