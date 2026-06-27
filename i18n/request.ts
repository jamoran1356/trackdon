import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';
export const LOCALE_COOKIE = 'trackdon-locale';

function pickAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const lower = header.toLowerCase();
  for (const part of lower.split(',')) {
    const lang = part.split(';')[0].trim().slice(0, 2);
    if ((SUPPORTED_LOCALES as readonly string[]).includes(lang)) return lang as Locale;
  }
  return DEFAULT_LOCALE;
}

export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie && (SUPPORTED_LOCALES as readonly string[]).includes(fromCookie)) {
    return fromCookie as Locale;
  }
  const h = await headers();
  return pickAcceptLanguage(h.get('accept-language'));
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
