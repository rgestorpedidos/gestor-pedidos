import { Skeleton } from '@/components/ui/skeleton'

export default function CardapioLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}
