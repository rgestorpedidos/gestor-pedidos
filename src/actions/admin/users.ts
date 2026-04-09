'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { ADMIN_ROLES, ROLES, type Role } from '@/lib/roles'

type AdminContext = {
  role: Role
  userId: string
}

type UserActionResult =
  | { success: true }
  | { success: false; error: string }

const ROLE_VALUES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.GARCOM, ROLES.COZINHA] as const

const booleanSchema = z.preprocess((val) => val === 'true', z.boolean())

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.enum(ROLE_VALUES),
  active: booleanSchema.default(true),
})

const updateRoleSchema = z.object({
  role: z.enum(ROLE_VALUES),
})

const updateActiveSchema = z.object({
  active: booleanSchema,
})

async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) throw new Error('Não autorizado')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, active: true },
  })

  if (!dbUser || !dbUser.active || !ADMIN_ROLES.includes(dbUser.role as Role)) {
    throw new Error('Acesso negado')
  }

  return { role: dbUser.role as Role, userId: user.id }
}

async function requireSuperAdmin(): Promise<AdminContext> {
  const ctx = await requireAdmin()
  if (ctx.role !== ROLES.SUPERADMIN) throw new Error('Acesso negado: requer SUPERADMIN')
  return ctx
}

async function findAuthUserByEmail(email: string) {
  const adminClient = await createAdminClient()
  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw new Error('Falha ao consultar usuários do Supabase Auth')
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
}

function canAssignRole(actorRole: Role, targetRole: Role) {
  if (targetRole === ROLES.SUPERADMIN) {
    return actorRole === ROLES.SUPERADMIN
  }

  return true
}

export async function createUser(formData: FormData): Promise<UserActionResult> {
  try {
    const actor = await requireAdmin()
    const parsed = createUserSchema.safeParse({
      email: formData.get('email'),
      name: formData.get('name'),
      role: formData.get('role'),
      active: formData.get('active') ?? true,
    })

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { email, name, role, active } = parsed.data

    if (!canAssignRole(actor.role, role)) {
      return {
        success: false,
        error: 'Apenas SUPERADMIN pode criar usuários com role SUPERADMIN',
      }
    }

    const existingDbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingDbUser) {
      return { success: false, error: 'Já existe um usuário com este email' }
    }

    const adminClient = await createAdminClient()
    const existingAuthUser = await findAuthUserByEmail(email)

    let authUserId = existingAuthUser?.id

    if (!authUserId) {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name },
      })

      if (authError || !authData.user) {
        return {
          success: false,
          error: authError?.message ?? 'Falha ao criar usuário no Supabase Auth',
        }
      }

      authUserId = authData.user.id
    }

    await prisma.user.create({
      data: {
        id: authUserId,
        email,
        name,
        role,
        active,
      },
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar usuário'
    return { success: false, error: message }
  }
}

export async function updateUserRole(
  userId: string,
  formData: FormData
): Promise<UserActionResult> {
  try {
    const actor = await requireAdmin()
    const parsed = updateRoleSchema.safeParse({
      role: formData.get('role'),
    })

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { role } = parsed.data

    if (!canAssignRole(actor.role, role)) {
      return {
        success: false,
        error: 'Apenas SUPERADMIN pode atribuir role SUPERADMIN',
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return { success: false, error: 'Usuário não encontrado' }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar role'
    return { success: false, error: message }
  }
}

export async function deleteUser(userId: string): Promise<UserActionResult> {
  try {
    const actor = await requireSuperAdmin()

    if (actor.userId === userId) {
      return { success: false, error: 'Não é possível excluir sua própria conta' }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return { success: false, error: 'Usuário não encontrado' }
    }

    // Prisma é a fonte de verdade do RBAC: sem registro aqui o login é bloqueado no check-auth
    await prisma.user.delete({ where: { id: userId } })

    // best-effort: falha aqui não reabilita o login pois o Prisma já removeu o registro
    const adminClient = await createAdminClient()
    await adminClient.auth.admin.deleteUser(userId)

    revalidatePath('/admin/super')
    revalidatePath('/admin/users')
    revalidatePath('/admin')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir usuário'
    return { success: false, error: message }
  }
}

export async function setUserActive(
  userId: string,
  formData: FormData
): Promise<UserActionResult> {
  try {
    await requireAdmin()
    const parsed = updateActiveSchema.safeParse({
      active: formData.get('active'),
    })

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { active } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return { success: false, error: 'Usuário não encontrado' }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { active },
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin')

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar status'
    return { success: false, error: message }
  }
}
