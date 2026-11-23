'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TabDef {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

/** Accessible tabs: roving tabindex, ←/→ (logical, RTL-aware), Home/End, sliding underline. */
export function SimpleTabs({ tabs, label, initial }: { tabs: TabDef[]; label: string; initial?: string }) {
  const [active, setActive] = React.useState(initial ?? tabs[0]?.id);
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const uid = React.useId();

  const move = (id: string) => {
    setActive(id);
    refs.current[id]?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((x) => x.id === active);
    const rtl = document.documentElement.dir === 'rtl';
    const next = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
    if (next) {
      e.preventDefault();
      move(tabs[(i + next + tabs.length) % tabs.length].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      move(tabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      move(tabs[tabs.length - 1].id);
    }
  };

  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKey} className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
        {tabs.map((tab) => {
          const on = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el;
              }}
              id={`${uid}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`${uid}-panel-${tab.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cn(
                'relative shrink-0 whitespace-nowrap rounded-t-sm px-4 py-3 text-sm font-semibold transition-colors duration-fast',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {on && (
                <motion.span layoutId={`${uid}-underline`} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent shadow-glow" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
              )}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${uid}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="pt-6 focus-visible:outline-none"
        >
          {tab.id === active && tab.content}
        </div>
      ))}
    </div>
  );
}
