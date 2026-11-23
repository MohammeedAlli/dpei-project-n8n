import { cn } from '@/lib/utils';

/** Shimmering placeholder. Shimmer direction flips in RTL and is disabled under reduced motion. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn('skeleton', className)} {...props} />;
}

export { Skeleton };
