import { createSupabaseAdmin } from '@/lib/supabase/server';
import { SmtpForm } from './smtp-form';

export const metadata = { title: 'SMTP — admin' };
export const dynamic = 'force-dynamic';

export default async function AdminSmtpPage() {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from('smtp_config')
    .select('host, port, username, from_email, from_name, secure, enabled')
    .eq('id', 1)
    .maybeSingle();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">SMTP</h1>
        <p className="text-sm text-muted-foreground">
          Cuando "Activado" esté ON la app usa este SMTP en vez de Resend.
        </p>
      </div>
      <SmtpForm initial={data} />
    </>
  );
}
