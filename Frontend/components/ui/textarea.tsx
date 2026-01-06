import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // 基础样式
        'flex min-h-[120px] w-full rounded-xl px-4 py-3 text-base md:text-sm',
        'text-foreground placeholder:text-muted-foreground',
        // 玻璃拟态背景
        'bg-secondary/50 backdrop-blur-sm',
        'border border-border/50',
        // 阴影
        'shadow-sm shadow-black/10',
        // 过渡动画
        'transition-all duration-200 outline-none',
        'ring-offset-background',
        // 聚焦状态 - 发光
        'focus-visible:border-primary/60',
        'focus-visible:ring-2 focus-visible:ring-primary/20',
        'focus-visible:bg-secondary/70',
        'focus-visible:shadow-[0_0_20px_-5px_hsl(175_80%_50%/0.2)]',
        // 选中文本
        'selection:bg-primary selection:text-primary-foreground',
        // 禁用状态
        'disabled:cursor-not-allowed disabled:opacity-50',
        // 错误状态
        'aria-invalid:border-destructive/60 aria-invalid:ring-destructive/20',
        // resize
        'resize-none',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
