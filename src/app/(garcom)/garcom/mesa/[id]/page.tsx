export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MesaGarcomView } from '@/components/app/garcom/mesa-garcom-view'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MesaGarcomPage({ params }: PageProps) {
  const { id } = await params

  const [mesa, pedidoAtivo, categorias] = await Promise.all([
    prisma.mesa.findUnique({
      where: { id },
      select: { id: true, numero: true, status: true },
    }),

    prisma.pedido.findFirst({
      where: { mesaId: id, status: 'ABERTO' },
      select: {
        id: true,
        itens: {
          select: {
            id: true,
            nomeSnapshot: true,
            precoUnitario: true,
            quantidade: true,
            observacao: true,
            status: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),

    prisma.categoria.findMany({
      where: { 
        ativo: true,
        itens: { some: { ativo: true } }
      },
      orderBy: { ordem: 'asc' },
      include: {
        itens: {
          where: { ativo: true },
          orderBy: { nome: 'asc' },
          include: {
            opcaoGrupos: {
              orderBy: { nome: 'asc' },
              include: {
                opcoes: {
                  where: { ativo: true },
                  orderBy: { nome: 'asc' },
                  select: { id: true, nome: true, precoAdicional: true },
                },
              },
            },
          },
        },
      },
    }),
  ])

  if (!mesa) notFound()

  return (
    <MesaGarcomView
      mesaId={mesa.id}
      mesaNumero={mesa.numero}
      pedidoAtivo={pedidoAtivo}
      categorias={categorias.map((cat) => ({
        id: cat.id,
        nome: cat.nome,
        itens: cat.itens.map((item) => ({
          id: item.id,
          nome: item.nome,
          descricao: item.descricao,
          preco: item.preco,
          imagemUrl: item.imagemUrl,
          vaiParaCozinha: item.vaiParaCozinha,
          opcaoGrupos: item.opcaoGrupos.map((grupo) => ({
            id: grupo.id,
            nome: grupo.nome,
            obrigatorio: grupo.obrigatorio,
            minSelecoes: grupo.minSelecoes,
            maxSelecoes: grupo.maxSelecoes,
            opcoes: grupo.opcoes,
          })),
        })),
      }))}
    />
  )
}
