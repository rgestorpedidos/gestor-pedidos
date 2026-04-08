'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ChevronDown, ChevronRight, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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
import {
  createOpcaoGrupo,
  deleteOpcaoGrupo,
  createOpcao,
  deleteOpcao,
} from '@/actions/admin/cardapio'

export type OpcaoData = {
  id: string
  nome: string
  precoAdicional: number
  ativo: boolean
}

export type GrupoData = {
  id: string
  nome: string
  obrigatorio: boolean
  minSelecoes: number
  maxSelecoes: number
  opcoes: OpcaoData[]
}

// ─── Delete opcao ─────────────────────────────────────────────────────────────

function DeleteOpcaoButton({ id, nome }: { id: string; nome: string }) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteOpcao(id)
      if (result.success) toast.success('Opção excluída')
      else toast.error(result.error)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir opção &quot;{nome}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
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

// ─── Delete grupo ─────────────────────────────────────────────────────────────

function DeleteGrupoButton({ id, nome }: { id: string; nome: string }) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteOpcaoGrupo(id)
      if (result.success) toast.success('Grupo excluído')
      else toast.error(result.error)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir grupo &quot;{nome}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Todas as opções deste grupo também serão excluídas.
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

// ─── Formulário de nova opção ─────────────────────────────────────────────────

function AddOpcaoForm({ grupoId, onClose }: { grupoId: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('opcaoGrupoId', grupoId)
    startTransition(async () => {
      const result = await createOpcao(formData)
      if (result.success) {
        toast.success('Opção adicionada')
        onClose()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end mt-2">
      <div className="flex-1">
        <Input name="nome" placeholder="Nome da opção" required disabled={isPending} />
      </div>
      <div className="w-28 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm flex items-center pointer-events-none">
          R$
        </span>
        <Input
          name="precoAdicional"
          type="number"
          step="0.01"
          min="0"
          placeholder="0,00"
          defaultValue="0.00"
          className="pl-9"
          disabled={isPending}
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Salvando...' : 'Adicionar'}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
        Cancelar
      </Button>
    </form>
  )
}

// ─── Grupo expandido ──────────────────────────────────────────────────────────

function GrupoItem({ grupo }: { grupo: GrupoData }) {
  const [expanded, setExpanded] = useState(true)
  const [addingOpcao, setAddingOpcao] = useState(false)

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 flex-1 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-medium text-sm">{grupo.nome}</span>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          {grupo.obrigatorio && <Badge variant="secondary" className="text-xs">Obrigatório</Badge>}
          <span className="text-xs text-muted-foreground">
            {grupo.minSelecoes}–{grupo.maxSelecoes} seleções
          </span>
          <DeleteGrupoButton id={grupo.id} nome={grupo.nome} />
        </div>
      </div>

      {expanded && (
        <div className="border-t px-3 py-2 space-y-1.5">
          {grupo.opcoes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma opção. Adicione abaixo.</p>
          ) : (
            grupo.opcoes.map((opcao) => (
              <div key={opcao.id} className="flex items-center justify-between text-sm">
                <span>{opcao.nome}</span>
                <div className="flex items-center gap-2">
                  {opcao.precoAdicional > 0 && (
                    <span className="text-xs text-muted-foreground">
                      +{opcao.precoAdicional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  )}
                  <DeleteOpcaoButton id={opcao.id} nome={opcao.nome} />
                </div>
              </div>
            ))
          )}

          {addingOpcao ? (
            <AddOpcaoForm grupoId={grupo.id} onClose={() => setAddingOpcao(false)} />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setAddingOpcao(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar opção
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Formulário de novo grupo ─────────────────────────────────────────────────

function AddGrupoForm({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [obrigatorio, setObrigatorio] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('itemCardapioId', itemId)
    formData.set('obrigatorio', obrigatorio ? 'true' : 'false')
    startTransition(async () => {
      const result = await createOpcaoGrupo(formData)
      if (result.success) {
        toast.success('Grupo criado')
        onClose()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border p-3 space-y-3">
      <p className="text-sm font-medium">Novo grupo</p>
      <div className="space-y-1.5">
        <Label htmlFor="grupo-nome">Nome</Label>
        <Input id="grupo-nome" name="nome" placeholder="Ex: Ponto da carne" required disabled={isPending} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="grupo-min">Mín. seleções</Label>
          <Input id="grupo-min" name="minSelecoes" type="number" min="0" defaultValue="0" disabled={isPending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="grupo-max">Máx. seleções</Label>
          <Input id="grupo-max" name="maxSelecoes" type="number" min="1" defaultValue="1" disabled={isPending} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="grupo-obrigatorio"
          checked={obrigatorio}
          onCheckedChange={setObrigatorio}
          disabled={isPending}
        />
        <Label htmlFor="grupo-obrigatorio">Obrigatório</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Criando...' : 'Criar grupo'}
        </Button>
      </div>
    </form>
  )
}

// ─── Sheet principal ──────────────────────────────────────────────────────────

interface OpcaoGrupoSheetProps {
  itemId: string
  itemNome: string
  grupos: GrupoData[]
  children: React.ReactNode
}

export function OpcaoGrupoSheet({ itemId, itemNome, grupos, children }: OpcaoGrupoSheetProps) {
  const [addingGrupo, setAddingGrupo] = useState(false)

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Grupos de Opções
          </SheetTitle>
          <SheetDescription>{itemNome}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {grupos.length === 0 && !addingGrupo && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum grupo de opções. Crie o primeiro abaixo.
            </p>
          )}

          {grupos.map((grupo) => (
            <GrupoItem key={grupo.id} grupo={grupo} />
          ))}

          {addingGrupo ? (
            <AddGrupoForm itemId={itemId} onClose={() => setAddingGrupo(false)} />
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setAddingGrupo(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo grupo de opções
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
