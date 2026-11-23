import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap',
    'rounded-sm text-sm font-semibold',
    'transition-[transform,box-shadow,background-color,border-color,color] duration-base ease-out',
    'motion-safe:active:scale-[0.97] active:duration-fast',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:shrink-0 [&_svg]:pointer-events-none',
  ].join(' '),
  {
    variants: {
      variant: {
        // Brand teal, glows on hover
        default:
          'bg-primary text-primary-foreground shadow-1 hover:shadow-glow-md hover:brightness-105',
        // Amber "best price" call-to-action
        deal: 'bg-deal text-deal-foreground shadow-1 hover:shadow-glow-deal hover:brightness-105',
        destructive:
          'bg-destructive text-destructive-foreground shadow-1 hover:brightness-110 hover:shadow-2',
        // Glass-edged secondary
        secondary:
          'border border-border bg-secondary text-secondary-foreground shadow-1 hover:border-accent/50 hover:bg-accent/10 hover:text-foreground',
        outline:
          'border border-input bg-transparent text-foreground hover:border-accent/60 hover:bg-accent/10 hover:shadow-glow',
        ghost: 'text-foreground/80 hover:bg-accent/10 hover:text-foreground',
        link: 'h-auto rounded-xs px-0 text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-3.5 text-[13px]',
        lg: 'h-12 px-7 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
