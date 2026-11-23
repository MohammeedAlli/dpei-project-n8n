import * as React from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Toggled-on state (filters, quick searches) */
  selected?: boolean;
  /** Shows a trailing ✕ (logical end side) and calls this when it is clicked */
  onRemove?: () => void;
  icon?: React.ReactNode;
}

/** Filter / quick-search chip. Toggle with `selected`, optionally removable. */
const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, onRemove, icon, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border ps-3.5 text-sm font-medium',
        onRemove ? 'pe-1.5' : 'pe-3.5',
        'transition-[transform,background-color,border-color,box-shadow,color] duration-base ease-out motion-safe:active:scale-95',
        selected
          ? 'border-accent/60 bg-accent/15 text-foreground shadow-glow'
          : 'border-border bg-card/70 text-muted-foreground hover:border-accent/40 hover:bg-accent/10 hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
      {children}
      {onRemove && (
        <span
          role="button"
          tabIndex={-1}
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ms-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-foreground/10"
        >
          <X className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  )
);
Chip.displayName = 'Chip';

export { Chip };
