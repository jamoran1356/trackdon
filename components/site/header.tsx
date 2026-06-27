import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground text-sm">td</span>
          <span className="text-base">trackdon</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <Link href="/publico" className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground">
            Panel público
          </Link>
          <Link href="/donar" className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground">
            Donar
          </Link>
          <Link href="/dashboard/centro" className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground">
            Centros
          </Link>
          <Link href="/dashboard/influencer" className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground">
            Influencers
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Link href="https://github.com/jamoran1356/trackdon" target="_blank" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/donar">Donar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
