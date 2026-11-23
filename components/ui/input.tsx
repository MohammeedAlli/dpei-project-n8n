import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// Styling lives in the `.field` class (globals.css) so native <select> and <textarea>
// can share exactly the same look.
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'field h-11 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
