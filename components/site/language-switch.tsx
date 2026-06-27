'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function LanguageSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    const next = locale === 'es' ? 'en' : 'es';
    start(async () => {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale: next })
      });
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-2 text-xs font-medium uppercase hover:bg-accent disabled:opacity-50"
      aria-label="Switch language"
    >
      {locale === 'es' ? 'EN' : 'ES'}
    </button>
  );
}
