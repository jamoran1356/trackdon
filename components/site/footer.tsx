import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function SiteFooter() {
  const tCommon = await getTranslations('common');
  const tFoot = await getTranslations('footer');
  return (
    <footer className="border-t border-border/40">
      <div className="container py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-foreground">trackdon</p>
          <p>{tFoot('tagline')}</p>
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/publico" className="hover:text-foreground">{tCommon('panel_publico')}</Link>
          <Link href="/denunciar" className="hover:text-foreground">{tCommon('denunciar')}</Link>
          <Link href="/sobre" className="hover:text-foreground">{tCommon('sobre')}</Link>
          <Link href="/privacidad" className="hover:text-foreground">Privacidad</Link>
          <Link href="/terminos" className="hover:text-foreground">Términos</Link>
          <Link
            href="https://github.com/jamoran1356/trackdon"
            target="_blank"
            className="hover:text-foreground"
          >
            {tCommon('codigo_github')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
