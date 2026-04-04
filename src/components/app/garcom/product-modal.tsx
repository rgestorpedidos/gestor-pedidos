'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useCarrinhoGarcomStore } from '@/stores/carrinho-garcom'
import type { ItemCardapioData, OpcaoGrupoData } from './types'

interface ProductModalProps {
  item: ItemCardapioData
  mesaId: string
  onClose: () => void
}

// ─── Grupo Radio (maxSelecoes === 1) ──────────────────────────────────────────

function RadioGrupo({
  grupo,
  selected,
  onChange,
}: {
  grupo: OpcaoGrupoData
  selected: string | undefined
  onChange: (opcaoId: string) => void
}) {
  return (
    <RadioGroup value={selected ?? ''} onValueChange={onChange}>
      {grupo.opcoes.map((opcao) => (
        <div key={opcao.id} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <RadioGroupItem value={opcao.id} id={opcao.id} />
            <Label htmlFor={opcao.id} className="cursor-pointer font-normal">
              {opcao.nome}
            </Label>
          </div>
          {opcao.precoAdicional > 0 && (
            <span className="text-sm text-muted-foreground">
              +{opcao.precoAdicional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          )}
        </div>
      ))}
    </RadioGroup>
  )
}

// ─── Grupo Checkbox (maxSelecoes > 1) ────────────────────────────────────────

function CheckboxGrupo({
  grupo,
  selected,
  onChange,
}: {
  grupo: OpcaoGrupoData
  selected: string[]
  onChange: (opcaoId: string, checked: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      {grupo.opcoes.map((opcao) => {
        const isChecked = selected.includes(opcao.id)
        const reachedMax = !isChecked && selected.length >= grupo.maxSelecoes

        return (
          <div key={opcao.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id={opcao.id}
                checked={isChecked}
                disabled={reachedMax}
                onCheckedChange={(checked) => onChange(opcao.id, !!checked)}
              />
              <Label
                htmlFor={opcao.id}
                className={`cursor-pointer font-normal ${reachedMax ? 'text-muted-foreground' : ''}`}
              >
                {opcao.nome}
              </Label>
            </div>
            {opcao.precoAdicional > 0 && (
              <span className="text-sm text-muted-foreground">
                +{opcao.precoAdicional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── ProductModal ─────────────────────────────────────────────────────────────

export function ProductModal({ item, mesaId, onClose }: ProductModalProps) {
  const [quantidade, setQuantidade] = useState(1)
  const [observacao, setObservacao] = useState('')
  // Record<grupoId, opcaoIds[]>
  const [selecoes, setSelecoes] = useState<Record<string, string[]>>({})

  const adicionarItem = useCarrinhoGarcomStore((state) => state.adicionarItem)

  // Preço total em tempo real
  const totalItem = useMemo(() => {
    const adicionais = Object.entries(selecoes).flatMap(([grupoId, opcaoIds]) => {
      const grupo = item.opcaoGrupos.find((g) => g.id === grupoId)
      if (!grupo) return []
      return opcaoIds.map(
        (opcaoId) => grupo.opcoes.find((o) => o.id === opcaoId)?.precoAdicional ?? 0
      )
    })
    const totalOpcoes = adicionais.reduce((acc, v) => acc + v, 0)
    return (item.preco + totalOpcoes) * quantidade
  }, [item, selecoes, quantidade])

  function handleRadioChange(grupoId: string, opcaoId: string) {
    setSelecoes((prev) => ({ ...prev, [grupoId]: [opcaoId] }))
  }

  function handleCheckboxChange(grupoId: string, opcaoId: string, checked: boolean) {
    setSelecoes((prev) => {
      const atual = prev[grupoId] ?? []
      return {
        ...prev,
        [grupoId]: checked
          ? [...atual, opcaoId]
          : atual.filter((id) => id !== opcaoId),
      }
    })
  }

  function validate(): string | null {
    for (const grupo of item.opcaoGrupos) {
      if (!grupo.obrigatorio) continue
      const selecionadas = selecoes[grupo.id] ?? []
      if (selecionadas.length < grupo.minSelecoes) {
        return `"${grupo.nome}": selecione pelo menos ${grupo.minSelecoes} opção(ões)`
      }
    }
    return null
  }

  function handleAdicionar() {
    const erro = validate()
    if (erro) {
      toast.error(erro)
      return
    }

    // Calcula precoUnitario com adicionais
    const adicionais = Object.entries(selecoes).flatMap(([grupoId, opcaoIds]) => {
      const grupo = item.opcaoGrupos.find((g) => g.id === grupoId)
      if (!grupo) return []
      return opcaoIds.map(
        (opcaoId) => grupo.opcoes.find((o) => o.id === opcaoId)?.precoAdicional ?? 0
      )
    })
    const precoComAdicionais = item.preco + adicionais.reduce((acc, v) => acc + v, 0)

    const opcoesSelecionadas =
      Object.keys(selecoes).length > 0 ? selecoes : undefined

    adicionarItem(mesaId, {
      itemCardapioId: item.id,
      nomeSnapshot: item.nome,
      precoUnitario: precoComAdicionais,
      quantidade,
      observacao: observacao.trim() || undefined,
      opcoesSelecionadas,
    })

    toast.success(`${item.nome} adicionado ao carrinho`)
    onClose()
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[85vh]">
          <div className="px-4 pt-5 pb-2">
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl">{item.nome}</SheetTitle>
              {item.descricao && (
                <SheetDescription className="text-sm">
                  {item.descricao}
                </SheetDescription>
              )}
              <p className="font-bold text-lg text-primary">
                {item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </SheetHeader>
          </div>

          <Separator />

          {/* ── Grupos de opções ──────────────────────────────────────────── */}
          {item.opcaoGrupos.map((grupo) => (
            <div key={grupo.id} className="px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">{grupo.nome}</p>
                {grupo.obrigatorio ? (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Obrigatório
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Opcional</span>
                )}
              </div>

              {grupo.maxSelecoes === 1 ? (
                <RadioGrupo
                  grupo={grupo}
                  selected={selecoes[grupo.id]?.[0]}
                  onChange={(opcaoId) => handleRadioChange(grupo.id, opcaoId)}
                />
              ) : (
                <CheckboxGrupo
                  grupo={grupo}
                  selected={selecoes[grupo.id] ?? []}
                  onChange={(opcaoId, checked) =>
                    handleCheckboxChange(grupo.id, opcaoId, checked)
                  }
                />
              )}

              <Separator className="mt-3" />
            </div>
          ))}

          {/* ── Observação ───────────────────────────────────────────────── */}
          <div className="px-4 py-4">
            <Label htmlFor="observacao" className="font-semibold text-sm">
              Alguma observação?
            </Label>
            <Textarea
              id="observacao"
              placeholder="Ex: sem cebola, bem passado..."
              className="mt-2 resize-none"
              rows={2}
              maxLength={200}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          {/* ── Quantidade + Botão ───────────────────────────────────────── */}
          <div className="px-4 pb-6 flex items-center gap-4">
            {/* Contador de quantidade */}
            <div className="flex items-center gap-3 border rounded-xl px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                disabled={quantidade <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center font-semibold">{quantidade}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantidade((q) => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Adicionar */}
            <Button
              className="flex-1 h-12 text-base font-semibold rounded-xl"
              onClick={handleAdicionar}
            >
              Adicionar&nbsp;·&nbsp;
              {totalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
