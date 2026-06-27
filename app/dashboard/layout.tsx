import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="container py-6 md:py-10">{children}</main>
      <SiteFooter />
    </>
  );
}
