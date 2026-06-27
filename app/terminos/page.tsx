import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';

export const metadata = {
  title: 'Términos y condiciones',
  description: 'Reglas de uso de trackdon.'
};

export default function TerminosPage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-8 md:py-14">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Términos y condiciones</h1>
          <p className="text-sm text-muted-foreground">Última actualización: 27 de junio de 2026</p>

          <h2 className="mt-8 text-xl font-semibold">1. Qué es trackdon</h2>
          <p>
            trackdon es un servicio público y gratuito que funciona como <strong>libro de registro</strong> de donaciones
            humanitarias. <strong>No recibimos, custodiamos, transferimos ni distribuimos fondos.</strong> Las donaciones
            ocurren entre el donante y la organización receptora por fuera de la plataforma (transferencia bancaria,
            Zelle, depósito en centros de acopio, etc.). trackdon solo permite registrar y trazar lo que ya pasó.
          </p>

          <h2 className="mt-6 text-xl font-semibold">2. Aceptación</h2>
          <p>
            Al registrarte o usar trackdon aceptás estos términos y la <a href="/privacidad" className="text-primary hover:underline">política de privacidad</a>.
            Si no estás de acuerdo, no uses el servicio.
          </p>

          <h2 className="mt-6 text-xl font-semibold">3. Cuenta y responsabilidad</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Tienes que ser mayor de 18 años.</li>
            <li>La información que cargás es bajo tu responsabilidad. No subas datos falsos, suplantes a otras personas u organizaciones, ni cargues comprobantes adulterados.</li>
            <li>Tu username es público. No puedes usar nombres que contengan groserías, suplantación de roles (admin, soporte), discursos de odio o referencias sexuales. Los intentos de cambiar el username a algo prohibido derivan en suspensión automática de la cuenta.</li>
            <li>El password es responsabilidad tuya. No la compartas.</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold">4. Donaciones y rendiciones</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Los donantes registran lo que entregaron y a quién. trackdon no verifica el evento real de la entrega; eso queda a cargo del rastro público + el cruce con la organización receptora.</li>
            <li>Las organizaciones receptoras (centros, fundaciones, influencers) cuando se registran y son validadas, pueden publicar rendiciones de gastos asociadas a las donaciones recibidas.</li>
            <li>Una rendición se considera verificada solo cuando un validador autorizado revisa el comprobante. Antes de eso, aparece como "pendiente" en el sistema.</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold">5. Denuncias</h2>
          <p>
            Cualquier usuario autenticado puede reportar irregularidades (máx 5 denuncias/24 h por cuenta).
            Las denuncias se revisan por validadores y, si son fundadas, las organizaciones afectadas pueden ser desactivadas o expuestas públicamente.
            Las denuncias falsas o de mala fe pueden derivar en suspensión de la cuenta que las emitió.
          </p>

          <h2 className="mt-6 text-xl font-semibold">6. Cuentas suspendidas y baneos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Comportamientos prohibidos: spam, scraping no autorizado, suplantación, intentos de bypass de RLS, ataques al sistema.</li>
            <li>Las cuentas suspendidas no pueden iniciar sesión y sus datos públicos quedan visibles con la marca "suspendido".</li>
            <li>Apelaciones a <a href="mailto:soporte@trackdonations.xyz" className="text-primary hover:underline">soporte@trackdonations.xyz</a>.</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold">7. Propiedad intelectual</h2>
          <p>
            El código de trackdon es open source (MIT, en <a href="https://github.com/jamoran1356/trackdon" target="_blank" className="text-primary hover:underline">GitHub</a>).
            El contenido que tú subís (textos, fotos de comprobantes) sigue siendo tuyo; nos otorgás una licencia
            no exclusiva para mostrarlo en la plataforma con los permisos que tú definas (público o privado).
          </p>

          <h2 className="mt-6 text-xl font-semibold">8. Sin garantías</h2>
          <p>
            trackdon se ofrece <em>como está</em>, sin garantías de disponibilidad permanente.
            No somos responsables de las decisiones de donar o no donar que tomes en base a la información mostrada.
            La verificación de cualquier organización receptora es responsabilidad final del donante.
          </p>

          <h2 className="mt-6 text-xl font-semibold">9. Limitación de responsabilidad</h2>
          <p>
            Como trackdon no custodia fondos, no somos parte ni intermediario en ninguna transacción de dinero o bienes.
            Cualquier conflicto sobre lo donado se resuelve directamente entre donante y organización receptora.
            Podemos colaborar como registro público pero no actuamos como árbitro ni garantes.
          </p>

          <h2 className="mt-6 text-xl font-semibold">10. Cambios</h2>
          <p>
            Podemos actualizar estos términos. Cambios sustantivos se notifican por email con 14 días de anticipación.
            El uso continuado tras los cambios implica aceptación.
          </p>

          <h2 className="mt-6 text-xl font-semibold">11. Contacto</h2>
          <p>
            <a href="mailto:soporte@trackdonations.xyz" className="text-primary hover:underline">soporte@trackdonations.xyz</a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
