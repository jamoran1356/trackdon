import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './login-form';

export const metadata = { title: 'Iniciar sesión' };

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-md py-10 md:py-16">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
            <CardDescription>
              Usa tu correo para entrar a tu dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Aún no tienes cuenta?{' '}
              <Link href="/registro" className="text-primary hover:underline font-medium">
                Regístrate
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
