import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export async function generateMetadata() {
  const t = await getTranslations('donar');
  return { title: t('exito_title') };
}

interface Search { searchParams: Promise<{ id?: string }> }

export default async function ExitoPage({ searchParams }: Search) {
  const { id } = await searchParams;
  const t = await getTranslations('donar');
  return (
    <>
      <SiteHeader />
      <main className="container max-w-md py-16 md:py-24 text-center">
        <Card>
          <CardContent className="space-y-4 p-8">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t('exito_title')}</h1>
            <p className="text-sm text-muted-foreground">{t('exito_subtitle')}</p>
            {id && (
              <p className="font-mono text-xs text-muted-foreground">
                {t('exito_id_label')} <span className="select-all">{id}</span>
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild>
                <Link href="/publico">{t('exito_ver_panel')}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/donar/registrar-entrega">{t('exito_registrar_otra')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
