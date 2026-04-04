'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ROLES, type Role } from '@/lib/roles'
import { Prisma } from '@prisma/client'

// ─── Guard ────────────────────────────────────────────────────────────────────

const GARCOM_ROLES: Role[] = [ROLES.GARCOM, ROLES.ADMIN, ROLES.SUPERADMIN]

async function requireGarcom() {
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

  if (!dbUser || !dbUser.active || !GARCOM_ROLES.includes(dbUser.role as Role)) {
    throw new Error('Acesso negado')
  }
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type GarcomActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ─── Schemas ──────────────────────────────────────────────────────────────────

const rodadaItemSchema = z.object({
  itemCardapioId: z.string().min(1),
  quantidade: z.number().int().positive('Quantidade deve ser positiva'),
  observacao: z.string().max(200).optional(),
  opcoesSelecionadas: z.record(z.string(), z.array(z.string())).optional(),
})

const enviarRodadaSchema = z
  .array(rodadaItemSchema)
  .min(1, 'Adicione pelo menos um item à rodada')

// ─── Helper: verificar acesso ao pedido ──────────────────────────────────────

async function assertPedidoAcessivel(mesaId: string, pedidoId: string) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { mesaId: true, status: true },
  })

  if (!pedido) throw new Error('Pedido não encontrado')
  if (pedido.mesaId !== mesaId) throw new Error('Pedido não pertence a esta mesa')
  if (pedido.status !== 'ABERTO') throw new Error('Pedido já foi fechado')
}

// ─── Abrir ou obter pedido ABERTO da mesa ────────────────────────────────────

export async function abrirOuObterPedido(
  mesaId: string
): Promise<GarcomActionResult<{ pedidoId: string }>> {
  try {
    await requireGarcom()

    const result = await prisma.$transaction(async (tx) => {
      const mesa = await tx.mesa.findUnique({
        where: { id: mesaId },
        select: { status: true },
      })

      if (!mesa) throw new Error('Mesa não encontrada')
      if (mesa.status === 'RESERVADA') throw new Error('Mesa está reservada')

      const pedidoExistente = await tx.pedido.findFirst({
        where: { mesaId, status: 'ABERTO' },
        select: { id: true },
      })

      if (pedidoExistente) return { pedidoId: pedidoExistente.id }

      const novoPedido = await tx.pedido.create({
        data: { mesaId, status: 'ABERTO' },
        select: { id: true },
      })

      await tx.mesa.update({
        where: { id: mesaId },
        data: { status: 'OCUPADA' },
      })

      return { pedidoId: novoPedido.id }
    })

    revalidatePath('/garcom')
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao abrir pedido'
    return { success: false, error: msg }
  }
}

// ─── Enviar rodada de itens ───────────────────────────────────────────────────

export async function enviarRodada(
  mesaId: string,
  itensRaw: unknown
): Promise<GarcomActionResult> {
  try {
    await requireGarcom()

    const parsed = enviarRodadaSchema.safeParse(itensRaw)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const itens = parsed.data
    const idsUnicos = [...new Set(itens.map((i) => i.itemCardapioId))]

    // Busca itens com grupos de opções em uma query
    const itemsDb = await prisma.itemCardapio.findMany({
      where: { id: { in: idsUnicos }, ativo: true },
      include: {
        opcaoGrupos: {
          include: { opcoes: { where: { ativo: true }, select: { id: true } } },
        },
      },
    })

    const itemsDbMap = new Map(itemsDb.map((i) => [i.id, i]))

    // Validações por item
    for (const item of itens) {
      const dbItem = itemsDbMap.get(item.itemCardapioId)
      if (!dbItem) {
        return { success: false, error: `Item não encontrado ou indisponível` }
      }

      // Verificar grupos obrigatórios
      for (const grupo of dbItem.opcaoGrupos) {
        if (!grupo.obrigatorio) continue

        const selecionadas: string[] = item.opcoesSelecionadas?.[grupo.id] ?? []
        if (selecionadas.length < grupo.minSelecoes) {
          return {
            success: false,
            error: `"${dbItem.nome}": grupo "${grupo.nome}" requer pelo menos ${grupo.minSelecoes} opção(ões)`,
          }
        }
        if (selecionadas.length > grupo.maxSelecoes) {
          return {
            success: false,
            error: `"${dbItem.nome}": grupo "${grupo.nome}" permite no máximo ${grupo.maxSelecoes} opção(ões)`,
          }
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // Garante pedido ABERTO (cria se não existir)
      let pedido = await tx.pedido.findFirst({
        where: { mesaId, status: 'ABERTO' },
        select: { id: true },
      })

      if (!pedido) {
        const mesa = await tx.mesa.findUnique({
          where: { id: mesaId },
          select: { status: true },
        })
        if (!mesa) throw new Error('Mesa não encontrada')
        if (mesa.status === 'RESERVADA') throw new Error('Mesa está reservada')

        pedido = await tx.pedido.create({
          data: { mesaId, status: 'ABERTO' },
          select: { id: true },
        })

        await tx.mesa.update({ where: { id: mesaId }, data: { status: 'OCUPADA' } })
      }

      // Cria os PedidoItems com snapshots
      await tx.pedidoItem.createMany({
        data: itens.map((item) => {
          const dbItem = itemsDbMap.get(item.itemCardapioId)!
          return {
            pedidoId: pedido!.id,
            itemCardapioId: item.itemCardapioId,
            nomeSnapshot: dbItem.nome,
            precoUnitario: dbItem.preco,
            quantidade: item.quantidade,
            observacao: item.observacao ?? null,
            opcoesSelecionadas: item.opcoesSelecionadas
              ? (item.opcoesSelecionadas as Prisma.InputJsonValue)
              : Prisma.DbNull,
            // Items sem cozinha já saem como PRONTO
            status: dbItem.vaiParaCozinha ? 'ENVIADO' : 'PRONTO',
          }
        }),
      })
    })

    revalidatePath('/garcom')
    revalidatePath(`/garcom/mesa/${mesaId}`)
    revalidatePath('/cozinha')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao enviar rodada'
    return { success: false, error: msg }
  }
}

// ─── Cancelar item (somente ENVIADO) ─────────────────────────────────────────

export async function cancelarItem(
  mesaId: string,
  itemId: string
): Promise<GarcomActionResult> {
  try {
    await requireGarcom()

    const item = await prisma.pedidoItem.findUnique({
      where: { id: itemId },
      select: { status: true, pedido: { select: { mesaId: true, status: true } } },
    })

    if (!item) return { success: false, error: 'Item não encontrado' }
    if (item.pedido.mesaId !== mesaId) return { success: false, error: 'Acesso negado' }
    if (item.pedido.status !== 'ABERTO') return { success: false, error: 'Pedido já fechado' }
    if (item.status === 'PRONTO') {
      return { success: false, error: 'Item já pronto — não pode ser cancelado' }
    }

    await prisma.pedidoItem.delete({ where: { id: itemId } })

    revalidatePath(`/garcom/mesa/${mesaId}`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao cancelar item'
    return { success: false, error: msg }
  }
}

// ─── Fechar pedido ────────────────────────────────────────────────────────────

export async function fecharPedido(
  mesaId: string,
  pedidoId: string,
  metodoPagamento?: string
): Promise<GarcomActionResult> {
  try {
    await requireGarcom()
    await assertPedidoAcessivel(mesaId, pedidoId)

    // Bloqueia se ainda há itens ENVIADO (não prontos)
    const itensEnviados = await prisma.pedidoItem.count({
      where: { pedidoId, status: 'ENVIADO' },
    })

    if (itensEnviados > 0) {
      return {
        success: false,
        error: `Ainda há ${itensEnviados} item(s) aguardando preparo na cozinha`,
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: 'FECHADO', metodoPagamento: metodoPagamento ?? null },
      })

      await tx.mesa.update({
        where: { id: mesaId },
        data: { status: 'LIVRE' },
      })
    })

    revalidatePath('/garcom')
    revalidatePath(`/garcom/mesa/${mesaId}`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao fechar pedido'
    return { success: false, error: msg }
  }
}

// ─── Confirmar reserva (RESERVADA → LIVRE) ───────────────────────────────────

export async function confirmarReserva(mesaId: string): Promise<GarcomActionResult> {
  try {
    await requireGarcom()

    const mesa = await prisma.mesa.findUnique({
      where: { id: mesaId },
      select: { status: true },
    })

    if (!mesa) return { success: false, error: 'Mesa não encontrada' }
    if (mesa.status !== 'RESERVADA') {
      return { success: false, error: 'Mesa não está reservada' }
    }

    await prisma.mesa.update({
      where: { id: mesaId },
      data: { status: 'LIVRE' },
    })

    revalidatePath('/garcom')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao confirmar reserva'
    return { success: false, error: msg }
  }
}
