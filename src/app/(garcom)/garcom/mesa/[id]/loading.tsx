import { Skeleton } from '@/components/ui/skeleton'

export default function MesaGarcomLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-48 max-w-2xl rounded-xl" />
      <Skeleton className="h-64 max-w-2xl rounded-xl" />
    </div>
  )
}
