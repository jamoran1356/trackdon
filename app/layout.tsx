import type { Metadata, Viewport } from 'next';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-419" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var pref = localStorage.getItem('trackdon-theme');
                  var sys = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (pref === 'dark' || (!pref && sys)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-dvh bg-background font-sans">
        {children}
      </body>
    </html>
  );
}
