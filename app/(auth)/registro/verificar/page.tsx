import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificarForm } from './verificar-form';

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return { title: t('verify_title') };
}

interface Search { searchParams: Promise<{ email?: string }> }

export default async function VerificarPage({ searchParams }: Search) {
  const { email } = await searchParams;
  if (!email) redirect('/registro');
  const t = await getTranslations('auth');

  return (
    <>
      <SiteHeader />
      <main className="container max-w-md py-10 md:py-16">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{t('verify_title')}</CardTitle>
            <CardDescription>
              {t('verify_subtitle', { email }).split(email).map((piece, i, arr) =>
                i === arr.length - 1 ? piece : (
                  <span key={i}>{piece}<strong className="text-foreground">{email}</strong></span>
                )
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VerificarForm email={email} />
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">{t('verify_help')}</p>
      </main>
      <SiteFooter />
    </>
  );
}
