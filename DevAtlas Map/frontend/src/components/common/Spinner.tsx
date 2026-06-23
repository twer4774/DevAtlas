import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-600 border-t-blue-500 w-5 h-5', className)} />
  )
}
