import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './login-form';

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return { title: t('login_title') };
}

export default async function LoginPage() {
  const t = await getTranslations('auth');
  return (
    <>
      <SiteHeader />
      <main className="container max-w-md py-10 md:py-16">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{t('login_title')}</CardTitle>
            <CardDescription>{t('login_subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t('no_account')}{' '}
              <Link href="/registro" className="text-primary hover:underline font-medium">{t('go_signup')}</Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
