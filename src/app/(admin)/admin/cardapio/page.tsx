import { prisma } from '@/lib/prisma'
import { BookOpen } from 'lucide-react'
import { CardapioTabs } from '@/components/app/cardapio/cardapio-tabs'

export const dynamic = 'force-dynamic'

export default async function CardapioPage() {
  const [categorias, itens] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { ordem: 'asc' } }),
    prisma.itemCardapio.findMany({
      include: { categoria: { select: { nome: true } } },
      orderBy: [{ categoria: { ordem: 'asc' } }, { nome: 'asc' }],
    }),
  ])

  const categoriasData = categorias.map((c) => ({
    id: c.id,
    nome: c.nome,
    ordem: c.ordem,
    ativo: c.ativo,
  }))

  const itensData = itens.map((i) => ({
    id: i.id,
    nome: i.nome,
    descricao: i.descricao,
    preco: i.preco,
    imagemUrl: i.imagemUrl,
    vaiParaCozinha: i.vaiParaCozinha,
    ativo: i.ativo,
    categoriaId: i.categoriaId,
    categoriaNome: i.categoria.nome,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-muted-foreground" />
        <h1 className="text-3xl font-bold tracking-tight">Cardápio</h1>
      </div>

      <CardapioTabs categorias={categoriasData} itens={itensData} />
    </div>
  )
}
