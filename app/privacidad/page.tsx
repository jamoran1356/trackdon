import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';

export const metadata = {
  title: 'Política de privacidad',
  description: 'Cómo trackdon trata tus datos personales.'
};

export default function PrivacidadPage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-8 md:py-14">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Política de privacidad</h1>
          <p className="text-sm text-muted-foreground">Última actualización: 27 de junio de 2026</p>

          <h2 className="mt-8 text-xl font-semibold">1. Quiénes somos</h2>
          <p>
            <strong>trackdon</strong> (trackdonations.xyz) es un libro público de donaciones humanitarias.
            Permite a donantes registrar a quién entregaron ayuda y a organizaciones receptoras publicar
            en qué la invirtieron. <strong>No custodiamos fondos en ningún momento.</strong>
          </p>

          <h2 className="mt-6 text-xl font-semibold">2. Qué datos recopilamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Datos públicos:</strong> nombre de usuario (que tú eliges), <code>anon_id</code> generado, donaciones registradas, rendiciones, denuncias.</li>
            <li><strong>Datos privados:</strong> tu nombre real (si lo cargás), email, hash de la contraseña, archivos que subas como comprobantes.</li>
            <li><strong>Técnicos:</strong> logs de servidor (IP, user-agent, timestamps) que se retienen hasta 90 días para fines de auditoría y prevención de abuso.</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold">3. Cómo se usan los datos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Username y donaciones:</strong> se exponen públicamente para mantener el rastro de cada donación.</li>
            <li><strong>Nombre real:</strong> solo es visible para vos y, si pedís KYC, para el equipo de validación. Nunca aparece en URLs, listados públicos ni en el feed.</li>
            <li><strong>Email:</strong> se usa exclusivamente para verificación de cuenta y notificaciones de la plataforma. No se vende, alquila ni comparte con terceros.</li>
            <li><strong>Comprobantes:</strong> los archivos privados (facturas, recibos, fotos KYC) viven en almacenamiento con permisos estrictos y solo los pueden ver el dueño y los validadores autorizados.</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold">4. Cookies</h2>
          <p>
            Usamos solamente cookies estrictamente necesarias: tu sesión de autenticación y la preferencia de idioma.
            No usamos cookies de analytics, publicidad ni tracking de terceros.
          </p>

          <h2 className="mt-6 text-xl font-semibold">5. Tus derechos</h2>
          <p>
            Podés ejercer tus derechos de <strong>acceso, rectificación, cancelación y portabilidad</strong> en cualquier momento:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Editar tu username, email, contraseña y nombre real desde <code>/cuenta</code>.</li>
            <li>Solicitar el borrado completo de tu cuenta enviando un correo desde tu email registrado.</li>
            <li>Pedir un export de tus datos en JSON.</li>
          </ul>
          <p className="mt-2">
            Las donaciones ya registradas como públicas no se eliminan, pero pueden anonimizarse a tu pedido:
            tu username se reemplaza por <code>u_xxxxx</code> sin vincular más a tu identidad.
          </p>

          <h2 className="mt-6 text-xl font-semibold">6. Edad mínima</h2>
          <p>
            trackdon es para mayores de 18 años. Si descubrimos cuentas de menores las cerramos.
          </p>

          <h2 className="mt-6 text-xl font-semibold">7. Cambios en esta política</h2>
          <p>
            Si cambia algo importante avisamos por email a todas las cuentas activas con al menos 14 días de anticipación.
            El historial de cambios queda en el repositorio público.
          </p>

          <h2 className="mt-6 text-xl font-semibold">8. Contacto</h2>
          <p>
            Para reclamos o solicitudes de privacidad: <a href="mailto:soporte@trackdonations.xyz" className="text-primary hover:underline">soporte@trackdonations.xyz</a>.
            Para reportes de seguridad: <a href="mailto:security@trackdonations.xyz" className="text-primary hover:underline">security@trackdonations.xyz</a>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
