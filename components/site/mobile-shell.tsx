'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

interface Props {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  brandLabel?: string;
}

export function MobileShell({ sidebar, children, brandLabel = 'trackdon' }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar al navegar
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock scroll cuando está abierto
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="flex min-h-dvh bg-muted/30">
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        {sidebar}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative h-full">
          {sidebar}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-md border border-border/60 bg-background"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="grid h-9 w-9 place-items-center rounded-md border border-input"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground text-sm">td</span>
            <span className="text-sm">{brandLabel}</span>
          </Link>
          <span className="w-9" />
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-10 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
