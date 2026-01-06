'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: 'default' | 'gradient' | 'success' | 'warning' | 'danger'
  }
>(({ className, value, variant = 'default', ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-2 w-full overflow-hidden rounded-full',
      'bg-[hsl(225_25%_12%/0.8)]',
      'border border-border/30',
      'shadow-inner shadow-black/20',
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        'h-full w-full flex-1 rounded-full transition-all duration-500',
        // 默认渐变 - 霓虹青到蓝到紫
        variant === 'default' && [
          'bg-gradient-to-r from-[hsl(175,85%,45%)] via-[hsl(220,90%,60%)] to-[hsl(280,85%,60%)]',
          'shadow-[0_0_10px_hsl(175_85%_50%/0.5)]',
        ],
        // 渐变动画版本
        variant === 'gradient' && [
          'bg-gradient-to-r from-[hsl(175,85%,45%)] via-[hsl(220,90%,60%)] to-[hsl(280,85%,60%)]',
          'bg-[length:200%_100%]',
          'animate-[gradient-shift_3s_ease_infinite]',
          'shadow-[0_0_10px_hsl(175_85%_50%/0.5)]',
        ],
        // 成功 - 绿色
        variant === 'success' && [
          'bg-gradient-to-r from-[hsl(155,80%,45%)] to-[hsl(175,85%,45%)]',
          'shadow-[0_0_10px_hsl(155_80%_45%/0.5)]',
        ],
        // 警告 - 橙色
        variant === 'warning' && [
          'bg-gradient-to-r from-[hsl(40,95%,55%)] to-[hsl(30,95%,50%)]',
          'shadow-[0_0_10px_hsl(40_95%_55%/0.5)]',
        ],
        // 危险 - 红色
        variant === 'danger' && [
          'bg-gradient-to-r from-[hsl(0,85%,55%)] to-[hsl(350,85%,50%)]',
          'shadow-[0_0_10px_hsl(0_85%_55%/0.5)]',
        ],
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
