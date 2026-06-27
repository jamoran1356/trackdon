import { NextResponse } from 'next/server';
import { LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from '@/i18n/request';

export async function POST(req: Request) {
  const { locale } = await req.json().catch(() => ({ locale: null }));
  if (!locale || !(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return NextResponse.json({ error: 'bad locale' }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set(LOCALE_COOKIE, locale as Locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  });
  return res;
}
