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
            'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300': variant === 'default',
            'border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-300': variant === 'outline',
            'hover:bg-gray-50 text-gray-700': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-300': variant === 'destructive',
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
