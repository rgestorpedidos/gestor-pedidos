'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ADMIN_ROLES } from '@/lib/roles'
import type { Role } from '@/lib/roles'

// ─── Guard ────────────────────────────────────────────────────────────────────

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

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CardapioActionResult =
  | { success: true }
  | { success: false; error: string }

// ─── Schemas ──────────────────────────────────────────────────────────────────

const booleanSchema = z.preprocess((val) => val === 'true', z.boolean())

const categoriaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(60),
  ordem: z.coerce.number().int().min(0).optional(),
  ativo: booleanSchema.optional(),
})

const itemCardapioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().max(300).optional().nullable(),
  preco: z.coerce.number().positive('Preço deve ser positivo'),
  imagemUrl: z.string().url('URL inválida').optional().nullable(),
  vaiParaCozinha: booleanSchema.default(true),
  ativo: booleanSchema.default(true),
  categoriaId: z.string().min(1, 'Categoria é obrigatória'),
})

const opcaoGrupoSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório').max(60),
    obrigatorio: booleanSchema.default(false),
    minSelecoes: z.coerce.number().int().min(0).default(0),
    maxSelecoes: z.coerce.number().int().min(1).default(1),
    itemCardapioId: z.string().min(1, 'Item do cardápio é obrigatório'),
  })
  .refine((d) => d.maxSelecoes >= d.minSelecoes, {
    message: 'Máximo de seleções deve ser ≥ mínimo',
    path: ['maxSelecoes'],
  })

const opcaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(60),
  precoAdicional: z.coerce.number().min(0, 'Preço adicional não pode ser negativo').default(0),
  ativo: booleanSchema.default(true),
  opcaoGrupoId: z.string().min(1, 'Grupo é obrigatório'),
})

// ─── Helper: mensagem de FK ────────────────────────────────────────────────────

function fkErrorMsg(err: unknown, entity: string): string {
  if (err instanceof Error) {
    // Prisma P2003 = FK constraint failed (RESTRICT)
    if (err.message.includes('P2003') || err.message.includes('Foreign key constraint')) {
      return `Não é possível excluir: ${entity} possui registros vinculados`
    }
    return err.message
  }
  return `Erro ao excluir ${entity}`
}

// ─── Categoria ────────────────────────────────────────────────────────────────

export async function createCategoria(
  formData: FormData
): Promise<CardapioActionResult> {
  try {
    await requireAdmin()

    const parsed = categoriaSchema.safeParse({
      nome: formData.get('nome'),
      ordem: formData.get('ordem') || 0,
      ativo: formData.get('ativo') ?? true,
    })
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    await prisma.categoria.create({ data: parsed.data })
    revalidatePath('/admin/cardapio')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar categoria'
    return { success: false, error: msg }
  }
}

export async function updateCategoria(
  id: string,
  formData: FormData
): Promise<CardapioActionResult> {
  try {
    await requireAdmin()

    const parsed = categoriaSchema.safeParse({
      nome: formData.get('nome'),
      ordem: formData.get('ordem') ?? undefined,
      ativo: formData.get('ativo') ?? undefined,
    })
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    await prisma.categoria.update({ where: { id }, data: parsed.data })
    revalidatePath('/admin/cardapio')
    revalidatePath('/garcom')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar categoria'
    return { success: false, error: msg }
  }
}

export async function deleteCategoria(id: string): Promise<CardapioActionResult> {
  try {
    await requireAdmin()
    await prisma.categoria.delete({ where: { id } })
    revalidatePath('/admin/cardapio')
    revalidatePath('/garcom')
    return { success: true }
  } catch (err) {
    return { success: false, error: fkErrorMsg(err, 'categoria') }
  }
}

// ─── ItemCardapio ─────────────────────────────────────────────────────────────

export async function createItemCardapio(
  formData: FormData
): Promise<CardapioActionResult> {
  try {
    await requireAdmin()

    const parsed = itemCardapioSchema.safeParse({
      nome: formData.get('nome'),
      descricao: formData.get('descricao') || null,
      preco: formData.get('preco'),
      imagemUrl: formData.get('imagemUrl') || null,
      vaiParaCozinha: formData.get('vaiParaCozinha') ?? true,
      ativo: formData.get('ativo') ?? true,
      categoriaId: formData.get('categoriaId'),
    })
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    await prisma.itemCardapio.create({ data: parsed.data })
    revalidatePath('/admin/cardapio')
    revalidatePath('/garcom')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar item'
    return { success: false, error: msg }
  }
}

export async function updateItemCardapio(
  id: string,
  formData: FormData
): Promise<CardapioActionResult> {
  try {
    await requireAdmin()

    const parsed = itemCardapioSchema.safeParse({
      nome: formData.get('nome'),
      descricao: formData.get('descricao') || null,
      preco: formData.get('preco'),
      imagemUrl: formData.get('imagemUrl') || null,
      vaiParaCozinha: formData.get('vaiParaCozinha') ?? true,
      ativo: formData.get('ativo') ?? true,
      categoriaId: formData.get('categoriaId'),
    })
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    await prisma.itemCardapio.update({ where: { id }, data: parsed.data })
    revalidatePath('/admin/cardapio')
    revalidatePath('/garcom')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar item'
    return { success: false, error: msg }
  }
}

export async function toggleItemAtivo(
  id: string,
  ativo: boolean
): Promise<CardapioActionResult> {
  try {
    await requireAdmin()
    await prisma.itemCardapio.update({ where: { id }, data: { ativo } })
    revalidatePath('/admin/cardapio')
    revalidatePath('/garcom')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao alterar disponibilidade'
    return { success: false, error: msg }
  }
}

export async function deleteItemCardapio(id: string): Promise<CardapioActionResult> {
  try {
    await requireAdmin()
    await prisma.itemCardapio.delete({ where: { id } })
    revalidatePath('/admin/cardapio')
    revalidatePath('/garcom')
    return { success: true }
  } catch (err) {
    return { success: false, error: fkErrorMsg(err, 'item') }
  }
}

// ─── OpcaoGrupo ───────────────────────────────────────────────────────────────

export async function createOpcaoGrupo(
  formData: FormData
): Promise<CardapioActionResult> {
  try {
    await requireAdmin()

    const parsed = opcaoGrupoSchema.safeParse({
      nome: formData.get('nome'),
      obrigatorio: formData.get('obrigatorio') ?? false,
      minSelecoes: formData.get('minSelecoes') ?? 0,
      maxSelecoes: formData.get('maxSelecoes') ?? 1,
      itemCardapioId: formData.get('itemCardapioId'),
    })
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    await prisma.opcaoGrupo.create({ data: parsed.data })
    revalidatePath('/admin/cardapio')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar grupo de opções'
    return { success: false, error: msg }
  }
}

export async function updateOpcaoGrupo(
  id: string,
  formData: FormData
): Promise<CardapioActionResult> {
  try {
    await requireAdmin()

    const parsed = opcaoGrupoSchema.safeParse({
      nome: formData.get('nome'),
      obrigatorio: formData.get('obrigatorio') ?? false,
      minSelecoes: formData.get('minSelecoes') ?? 0,
      maxSelecoes: formData.get('maxSelecoes') ?? 1,
      itemCardapioId: formData.get('itemCardapioId'),
    })
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    await prisma.opcaoGrupo.update({ where: { id }, data: parsed.data })
    revalidatePath('/admin/cardapio')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar grupo'
    return { success: false, error: msg }
  }
}

export async function deleteOpcaoGrupo(id: string): Promise<CardapioActionResult> {
  try {
    await requireAdmin()
    await prisma.opcaoGrupo.delete({ where: { id } })
    revalidatePath('/admin/cardapio')
    return { success: true }
  } catch (err) {
    return { success: false, error: fkErrorMsg(err, 'grupo de opções') }
  }
}

// ─── Opcao ────────────────────────────────────────────────────────────────────

export async function createOpcao(
  formData: FormData
): Promise<CardapioActionResult> {
  try {
    await requireAdmin()

    const parsed = opcaoSchema.safeParse({
      nome: formData.get('nome'),
      precoAdicional: formData.get('precoAdicional') ?? 0,
      ativo: formData.get('ativo') ?? true,
      opcaoGrupoId: formData.get('opcaoGrupoId'),
    })
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    await prisma.opcao.create({ data: parsed.data })
    revalidatePath('/admin/cardapio')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar opção'
    return { success: false, error: msg }
  }
}

export async function updateOpcao(
  id: string,
  formData: FormData
): Promise<CardapioActionResult> {
  try {
    await requireAdmin()

    const parsed = opcaoSchema.safeParse({
      nome: formData.get('nome'),
      precoAdicional: formData.get('precoAdicional') ?? 0,
      ativo: formData.get('ativo') ?? true,
      opcaoGrupoId: formData.get('opcaoGrupoId'),
    })
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    await prisma.opcao.update({ where: { id }, data: parsed.data })
    revalidatePath('/admin/cardapio')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar opção'
    return { success: false, error: msg }
  }
}

export async function deleteOpcao(id: string): Promise<CardapioActionResult> {
  try {
    await requireAdmin()
    await prisma.opcao.delete({ where: { id } })
    revalidatePath('/admin/cardapio')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao excluir opção'
    return { success: false, error: msg }
  }
}
