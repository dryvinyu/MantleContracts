import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // 主色 - 青色发光
        default:
          'bg-primary/15 text-primary border-primary/40 shadow-[0_0_15px_-5px_hsl(175_80%_50%/0.3)]',
        // 次级
        secondary:
          'bg-secondary/80 text-secondary-foreground border-border/50 backdrop-blur-sm',
        // 危险 - 红色发光
        destructive:
          'bg-destructive/15 text-destructive border-destructive/40 shadow-[0_0_15px_-5px_hsl(0_72%_51%/0.3)]',
        // 成功 - 绿色发光
        success:
          'bg-[hsl(142_71%_45%/0.15)] text-[hsl(142_71%_45%)] border-[hsl(142_71%_45%/0.4)] shadow-[0_0_15px_-5px_hsl(142_71%_45%/0.3)]',
        // 警告 - 橙色发光
        warning:
          'bg-[hsl(38_92%_50%/0.15)] text-[hsl(38_92%_50%)] border-[hsl(38_92%_50%/0.4)] shadow-[0_0_15px_-5px_hsl(38_92%_50%/0.3)]',
        // 强调色 - 紫色发光
        accent:
          'bg-accent/15 text-accent border-accent/40 shadow-[0_0_15px_-5px_hsl(270_70%_60%/0.3)]',
        // 轮廓
        outline:
          'text-foreground border-border/60 bg-transparent hover:bg-secondary/50',
        // 信息 - 蓝色发光
        info: 'bg-[hsl(200_80%_50%/0.15)] text-[hsl(200_80%_50%)] border-[hsl(200_80%_50%/0.4)] shadow-[0_0_15px_-5px_hsl(200_80%_50%/0.3)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
