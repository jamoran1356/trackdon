import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { UserMenu } from './user-menu';
import { LanguageSwitch } from './language-switch';
import { ThemeToggle } from './theme-toggle';
import { Github } from 'lucide-react';

export async function SiteHeader() {
  const t = await getTranslations('header');
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground text-sm">td</span>
          <span className="text-base">trackdon</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <Link href="/publico" className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground">
            {t('nav_panel_publico')}
          </Link>
          <Link href="/donar" className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground">
            {t('nav_donar')}
          </Link>
          <Link href="/explorar?tipo=centros" className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground">
            {t('nav_centros')}
          </Link>
          <Link href="/explorar?tipo=influencers" className="px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground">
            {t('nav_influencers')}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitch />
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="GitHub">
            <Link href="https://github.com/jamoran1356/trackdon" target="_blank">
              <Github className="h-4 w-4" />
            </Link>
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
