import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm',
        variant === 'primary' && 'bg-blue-600 hover:bg-blue-700 text-white',
        variant === 'ghost' && 'bg-transparent hover:bg-gray-700 text-gray-300 hover:text-white',
        variant === 'danger' && 'bg-transparent hover:bg-red-900/40 text-red-400 hover:text-red-300',
        className
      )}
    />
  )
}
