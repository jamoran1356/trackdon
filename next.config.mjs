import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverActions: { bodySizeLimit: '4mb' },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' }
    ]
  }
};

export default withNextIntl(nextConfig);
