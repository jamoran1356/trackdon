import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'trackdon — tracking de donaciones humanitarias',
    template: '%s · trackdon'
  },
  description:
    'Open source. Mobile-first. Tracking transparente de donaciones humanitarias: quién donó, qué centro recibió, qué responsable lo movió, cómo llegó al damnificado.',
  metadataBase: new URL('https://trackdon.app'),
  openGraph: {
    title: 'trackdon — tracking de donaciones humanitarias',
    description: 'Transparencia hacia quien maneja, dignidad para quien recibe.',
    type: 'website'
  },
  applicationName: 'trackdon',
  category: 'humanitarian',
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f0c' }
  ]
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var pref = localStorage.getItem('trackdon-theme');
                  if (pref === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-dvh bg-background font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
