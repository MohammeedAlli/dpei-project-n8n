import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-accent',
        secondary: 'border-border bg-secondary text-secondary-foreground',
        outline: 'border-input text-foreground',
        success: 'border-success/30 bg-success/12 text-success',
        warning: 'border-warning/30 bg-warning/15 text-warning',
        destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
        // Amber "best price" — solid, with glow
        deal: 'border-transparent bg-deal text-deal-foreground shadow-glow-deal',
        // Spec / SKU tag
        mono: 'border-border bg-muted font-mono font-medium text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
