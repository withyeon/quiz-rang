import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-gradient-to-r from-pink-500 via-yellow-400 to-purple-500 text-white hover:from-pink-600 hover:via-yellow-500 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white/50': variant === 'default',
            'border-2 border-pink-300 bg-white/90 hover:bg-pink-50 text-pink-600 hover:border-pink-400 shadow-md hover:shadow-lg transition-all duration-300': variant === 'outline',
            'hover:bg-pink-50 text-gray-700': variant === 'ghost',
            'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300': variant === 'destructive',
            'h-10 px-4 py-2 rounded-xl': size === 'default',
            'h-9 px-3 text-sm rounded-lg': size === 'sm',
            'h-12 px-8 rounded-2xl': size === 'lg',
            'h-10 w-10 rounded-xl': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
