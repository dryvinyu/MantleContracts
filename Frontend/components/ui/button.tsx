import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        // 主按钮 - 青->蓝->紫渐变
        default:
          'bg-[linear-gradient(135deg,hsl(175_80%_50%)_0%,hsl(200_80%_50%)_50%,hsl(270_70%_60%)_100%)] text-[hsl(220_20%_6%)] shadow-[0_0_25px_-5px_hsl(175_80%_50%/0.4)] hover:shadow-[0_0_35px_-5px_hsl(175_80%_50%/0.6)] hover:brightness-110 active:scale-[0.98]',
        // 危险按钮
        destructive:
          'bg-destructive text-destructive-foreground shadow-[0_0_20px_-5px_hsl(0_72%_51%/0.4)] hover:shadow-[0_0_30px_-5px_hsl(0_72%_51%/0.6)] hover:bg-destructive/90 active:scale-[0.98]',
        // 轮廓按钮 - 玻璃边框
        outline:
          'border border-border/60 bg-transparent text-foreground backdrop-blur-sm hover:bg-primary/10 hover:border-primary/60 hover:text-primary hover:shadow-[0_0_20px_-8px_hsl(175_80%_50%/0.3)]',
        // 次级按钮 - 玻璃拟态
        secondary:
          'bg-secondary/80 text-secondary-foreground backdrop-blur-sm border border-border/30 hover:bg-secondary hover:border-primary/30',
        // 幽灵按钮
        ghost:
          'text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
        // 链接样式
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80',
        // 成功按钮
        success:
          'bg-success text-success-foreground shadow-[0_0_20px_-5px_hsl(142_71%_45%/0.4)] hover:shadow-[0_0_30px_-5px_hsl(142_71%_45%/0.6)] hover:bg-success/90 active:scale-[0.98]',
        // 警告按钮
        warning:
          'bg-warning text-warning-foreground shadow-[0_0_20px_-5px_hsl(38_92%_50%/0.4)] hover:shadow-[0_0_30px_-5px_hsl(38_92%_50%/0.6)] hover:bg-warning/90 active:scale-[0.98]',
        // 强调色按钮 - 紫色
        accent:
          'bg-accent text-accent-foreground shadow-[0_0_20px_-5px_hsl(270_70%_60%/0.4)] hover:shadow-[0_0_30px_-5px_hsl(270_70%_60%/0.6)] hover:bg-accent/90 active:scale-[0.98]',
      },
      size: {
        default: 'h-10 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-9 gap-1.5 px-4 text-xs has-[>svg]:px-3',
        lg: 'h-12 px-7 text-base has-[>svg]:px-5',
        xl: 'h-14 px-8 text-lg has-[>svg]:px-6',
        icon: 'size-10',
        'icon-sm': 'size-9',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
