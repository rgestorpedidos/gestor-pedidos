'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  UtensilsCrossed,
  Users,
  ChefHat,
  DoorOpen,
  DoorClosed,
  Activity,
  ArrowRight,
  ShoppingBag,
  CheckCircle,
  Clock,
  Receipt,
} from 'lucide-react'
import Link from 'next/link'
import type { DashboardMetrics } from '@/actions/admin/metrics'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/admin/metrics')
        if (!res.ok) throw new Error('Erro ao buscar métricas')
        const data = await res.json()
        setMetrics(data)
      } catch {
        setMetrics({
          mesasLivres: null,
          mesasOcupadas: null,
          totalUsuarios: null,
          usuariosAtivos: null,
          pedidosAbertos: null,
          pedidosFechadosHoje: null,
          ticketMedio: null,
          itensNaCozinha: null,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  const totalMesas =
    metrics?.mesasLivres != null && metrics?.mesasOcupadas != null
      ? metrics.mesasLivres + metrics.mesasOcupadas
      : null

  const taxaOcupacao =
    totalMesas != null && totalMesas > 0 && metrics?.mesasOcupadas != null
      ? Math.round((metrics.mesasOcupadas / totalMesas) * 100)
      : null

  const sistemaAtivo = metrics !== null

  function formatCurrency(value: number | null) {
    if (value === null) return null
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Status Card */}
      <Card className={`border-l-4 ${sistemaAtivo ? 'border-l-green-500' : 'border-l-gray-400'}`}>
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={`text-2xl font-bold ${sistemaAtivo ? 'text-green-600' : 'text-muted-foreground'}`}>
                {loading ? 'Carregando...' : 'SISTEMA ATIVO'}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {loading
                ? 'Buscando informações do sistema...'
                : taxaOcupacao !== null
                ? `Taxa de ocupação atual: ${taxaOcupacao}% das mesas`
                : 'Nenhuma mesa cadastrada ainda'}
            </p>
          </div>
          <Activity className={`h-8 w-8 ${sistemaAtivo ? 'text-green-500' : 'text-muted-foreground'}`} />
        </CardContent>
      </Card>

      {/* Métricas de Mesas */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">Mesas</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mesas Livres</CardTitle>
              <DoorOpen className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {metrics?.mesasLivres ?? <span className="text-muted-foreground">—</span>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Disponíveis para atendimento</p>
            </CardContent>
          </Card>

          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mesas Ocupadas</CardTitle>
              <DoorClosed className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {metrics?.mesasOcupadas ?? <span className="text-muted-foreground">—</span>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Com clientes no momento</p>
            </CardContent>
          </Card>

          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {metrics?.totalUsuarios ?? <span className="text-muted-foreground">—</span>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
            </CardContent>
          </Card>

          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {metrics?.usuariosAtivos ?? <span className="text-muted-foreground">—</span>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Com acesso habilitado</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Métricas de Pedidos */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">Pedidos — hoje</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Abertos</CardTitle>
              <ShoppingBag className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {metrics?.pedidosAbertos ?? <span className="text-muted-foreground">—</span>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Em andamento agora</p>
            </CardContent>
          </Card>

          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Fechados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {metrics?.pedidosFechadosHoje ?? <span className="text-muted-foreground">—</span>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Finalizados hoje</p>
            </CardContent>
          </Card>

          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {metrics?.ticketMedio != null
                    ? metrics.ticketMedio === 0
                      ? <span className="text-muted-foreground text-base">sem dados</span>
                      : formatCurrency(metrics.ticketMedio)
                    : <span className="text-muted-foreground">—</span>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Média dos pedidos fechados</p>
            </CardContent>
          </Card>

          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens na Cozinha</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {metrics?.itensNaCozinha ?? <span className="text-muted-foreground">—</span>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Aguardando preparo</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ações Rápidas */}
      <h3 className="text-lg font-semibold">Ações Rápidas</h3>
      <div className="flex gap-4 flex-wrap">
        <Link href="/garcom">
          <Button variant="outline" className="h-24 w-44 flex flex-col gap-2">
            <UtensilsCrossed className="h-6 w-6" />
            Atendimento
          </Button>
        </Link>
        <Link href="/cozinha">
          <Button variant="outline" className="h-24 w-44 flex flex-col gap-2">
            <ChefHat className="h-6 w-6" />
            Cozinha
          </Button>
        </Link>
      </div>

      {/* Links de Administração */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="hover:bg-muted/50 hover:border-primary/40 transition-all cursor-pointer">
          <Link href="/admin/users">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Gerenciar Usuários</p>
                  <p className="text-xs text-muted-foreground">Controle de acesso e permissões</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 hover:border-primary/40 transition-all cursor-pointer">
          <Link href="/admin/mesas">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Gerenciar Mesas</p>
                  <p className="text-xs text-muted-foreground">Configurar mesas do restaurante</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}
