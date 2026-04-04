'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Settings2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { deleteCategoria, deleteItemCardapio, toggleItemAtivo } from '@/actions/admin/cardapio'
import { CategoriaForm } from './categoria-form'
import { ItemForm } from './item-form'
import { OpcaoGrupoSheet } from './opcao-grupo-sheet'
import type { CategoriaData } from './categoria-form'
import type { ItemData, CategoriaOption } from './item-form'
import type { GrupoData } from './opcao-grupo-sheet'

interface ItemWithCategoria extends ItemData {
  categoriaNome: string
  opcaoGrupos: GrupoData[]
}

interface CardapioTabsProps {
  categorias: CategoriaData[]
  itens: ItemWithCategoria[]
}

// ─── Toggle de disponibilidade ───────────────────────────────────────────────

function ToggleAtivo({ id, ativo }: { id: string; ativo: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleItemAtivo(id, checked)
      if (!result.success) toast.error(result.error)
    })
  }

  return <Switch checked={ativo} onCheckedChange={handleToggle} disabled={isPending} />
}

// ─── Delete de categoria ──────────────────────────────────────────────────────

function DeleteCategoriaButton({ id, nome }: { id: string; nome: string }) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteCategoria(id)
      if (result.success) {
        toast.success('Categoria excluída')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir &quot;{nome}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Categorias com itens vinculados não podem ser excluídas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Delete de item ───────────────────────────────────────────────────────────

function DeleteItemButton({ id, nome }: { id: string; nome: string }) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteItemCardapio(id)
      if (result.success) {
        toast.success('Item excluído')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir &quot;{nome}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Itens vinculados a pedidos não podem ser excluídos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Tabs principal ───────────────────────────────────────────────────────────

export function CardapioTabs({ categorias, itens }: CardapioTabsProps) {
  const categoriaOptions: CategoriaOption[] = categorias.map((c) => ({
    id: c.id,
    nome: c.nome,
  }))

  return (
    <Tabs defaultValue="itens">
      <TabsList>
        <TabsTrigger value="itens">Itens ({itens.length})</TabsTrigger>
        <TabsTrigger value="categorias">Categorias ({categorias.length})</TabsTrigger>
      </TabsList>

      {/* ── Tab Itens ──────────────────────────────────────────────────────── */}
      <TabsContent value="itens" className="mt-4">
        <div className="flex justify-end mb-4">
          <ItemForm categorias={categoriaOptions}>
            <Button size="sm" disabled={categorias.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </ItemForm>
        </div>

        {itens.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <p className="text-sm">Nenhum item cadastrado.</p>
            {categorias.length === 0 && (
              <p className="text-xs mt-1">Crie uma categoria primeiro.</p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Cozinha</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="w-[80px]">Grupos</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.categoriaNome}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.preco.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </TableCell>
                    <TableCell>
                      {item.vaiParaCozinha ? (
                        <Badge variant="secondary">Sim</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Não
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <ToggleAtivo id={item.id} ativo={item.ativo} />
                    </TableCell>
                    <TableCell>
                      <OpcaoGrupoSheet itemId={item.id} itemNome={item.nome} grupos={item.opcaoGrupos}>
                        <Button variant="ghost" size="icon" title="Grupos de opções">
                          <Settings2 className="h-4 w-4" />
                          {item.opcaoGrupos.length > 0 && (
                            <span className="ml-1 text-xs">{item.opcaoGrupos.length}</span>
                          )}
                        </Button>
                      </OpcaoGrupoSheet>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ItemForm item={item} categorias={categoriaOptions}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </ItemForm>
                        <DeleteItemButton id={item.id} nome={item.nome} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* ── Tab Categorias ─────────────────────────────────────────────────── */}
      <TabsContent value="categorias" className="mt-4">
        <div className="flex justify-end mb-4">
          <CategoriaForm>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </CategoriaForm>
        </div>

        {categorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <p className="text-sm">Nenhuma categoria cadastrada.</p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.nome}</TableCell>
                    <TableCell>{cat.ordem}</TableCell>
                    <TableCell>
                      {cat.ativo ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inativa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CategoriaForm categoria={cat}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </CategoriaForm>
                        <DeleteCategoriaButton id={cat.id} nome={cat.nome} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
