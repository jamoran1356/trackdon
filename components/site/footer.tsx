import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40">
      <div className="container py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-foreground">trackdon</p>
          <p>Open source · MIT · sin fines de lucro.</p>
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/publico" className="hover:text-foreground">Panel público</Link>
          <Link href="/sobre" className="hover:text-foreground">Sobre el proyecto</Link>
          <Link
            href="https://github.com/jamoran1356/trackdon"
            target="_blank"
            className="hover:text-foreground"
          >
            Código (GitHub)
          </Link>
        </nav>
      </div>
    </footer>
  );
}
