import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 基础样式
        'h-10 w-full min-w-0 rounded-lg px-4 py-2 text-base md:text-sm',
        'text-foreground placeholder:text-muted-foreground',
        // 玻璃拟态背景
        'bg-secondary/50 backdrop-blur-sm',
        'border border-border/50',
        // 阴影
        'shadow-sm shadow-black/10',
        // 过渡动画
        'transition-all duration-200 outline-none',
        // 聚焦状态 - 发光
        'focus-visible:border-primary/60',
        'focus-visible:ring-2 focus-visible:ring-primary/20',
        'focus-visible:bg-secondary/70',
        'focus-visible:shadow-[0_0_20px_-5px_hsl(175_80%_50%/0.2)]',
        // 选中文本
        'selection:bg-primary selection:text-primary-foreground',
        // 文件输入
        'file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        // 禁用状态
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        // 错误状态
        'aria-invalid:border-destructive/60 aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
