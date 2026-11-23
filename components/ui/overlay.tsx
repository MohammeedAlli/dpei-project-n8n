'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';

/** Portal to <body> (the sticky header's backdrop-filter would otherwise trap `position: fixed`). */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

/** Lock page scroll and close on Escape while open. */
export function useOverlayLock(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Mobile bottom sheet: drag the handle down (or tap the scrim) to dismiss. */
export function BottomSheet({ open, onClose, title, children, footer }: SheetProps) {
  const { dir } = useLanguage();
  const controls = useDragControls();
  useOverlayLock(open, onClose);
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-drawer bg-ink/55 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              key="sheet"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              dir={dir}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              drag="y"
              dragListener={false}
              dragControls={controls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => (info.offset.y > 120 || info.velocity.y > 600) && onClose()}
              className="glass fixed inset-x-0 bottom-0 z-drawer flex max-h-[88dvh] flex-col !rounded-b-none rounded-t-lg !bg-background/95"
            >
              <div className="flex shrink-0 touch-none flex-col items-center pt-2" onPointerDown={(e) => controls.start(e)}>
                <span className="h-1.5 w-10 rounded-full bg-foreground/20" />
                <div className="flex w-full items-center justify-between px-5 pb-2 pt-3">
                  <h2 className="font-display text-lg font-semibold">{title}</h2>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="rounded-full p-2 hover:bg-accent/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
                {children}
              </div>
              {footer && <div className="shrink-0 border-t border-border p-4">{footer}</div>}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/** Centered modal (quick view). */
export function Modal({
  open,
  onClose,
  label,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { dir } = useLanguage();
  useOverlayLock(open, onClose);
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-modal flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={label}
              dir={dir}
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'glass relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto !rounded-b-none rounded-lg !bg-background/95 sm:!rounded-b-lg',
                className
              )}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute end-3 top-3 z-10 rounded-full bg-background/80 p-2 hover:bg-accent/10"
              >
                <X className="h-5 w-5" />
              </button>
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
