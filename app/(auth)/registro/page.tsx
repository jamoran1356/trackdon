import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignupForm } from './signup-form';

export const metadata = { title: 'Crear cuenta' };

export default function RegistroPage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-md py-10 md:py-16">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Crear cuenta</CardTitle>
            <CardDescription>
              Te creamos un perfil de donante. Si vienes como centro de
              acopio o influencer, te lo cambiamos después.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
