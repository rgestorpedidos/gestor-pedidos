import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function MetricCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16 mb-1" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  )
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Status Card Skeleton */}
      <Card className="border-l-4 border-l-gray-200">
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Ações Rápidas */}
      <Skeleton className="h-6 w-32" />
      <div className="flex gap-4">
        <Skeleton className="h-24 w-44 rounded-md" />
        <Skeleton className="h-24 w-44 rounded-md" />
      </div>

      {/* Links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
        <Card><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
      </div>
    </div>
  )
}
