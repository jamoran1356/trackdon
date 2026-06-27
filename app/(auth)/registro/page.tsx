import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignupForm } from './signup-form';

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return { title: t('signup_title') };
}

export default async function RegistroPage() {
  const t = await getTranslations('auth');
  return (
    <>
      <SiteHeader />
      <main className="container max-w-md py-10 md:py-16">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{t('signup_title')}</CardTitle>
            <CardDescription>{t('signup_subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t('have_account')}{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">{t('go_login')}</Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
