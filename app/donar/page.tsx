import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Box, Banknote, ArrowRight } from 'lucide-react';

export async function generateMetadata() {
  const t = await getTranslations('common');
  return { title: t('donar') };
}

export default async function DonarPage() {
  const t = await getTranslations('donar');
  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-8 md:py-14">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('hub_title')}</h1>
        <p className="mt-3 text-muted-foreground">{t('hub_subtitle')}</p>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <Card className="group transition-colors hover:border-primary/40">
            <CardContent className="p-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Box className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{t('hub_bienes_title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('hub_bienes_desc')}</p>
              <Button asChild variant="ghost" size="sm" className="mt-4 px-0 text-primary hover:bg-transparent hover:text-primary/80">
                <Link href="/donar/registrar-entrega">
                  {t('hub_bienes_cta')} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group transition-colors hover:border-primary/40">
            <CardContent className="p-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Banknote className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{t('hub_transfer_title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('hub_transfer_desc')}</p>
              <Button asChild variant="ghost" size="sm" className="mt-4 px-0 text-primary hover:bg-transparent hover:text-primary/80">
                <Link href="/donar/registrar-entrega?tipo=transferencia">
                  {t('hub_transfer_cta')} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-base">{t('hub_no_cripto_title')}</CardTitle>
            <CardDescription>{t('hub_no_cripto_body')}</CardDescription>
          </CardHeader>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
