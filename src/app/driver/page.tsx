import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DriverPortalContent } from '@/components/portals/driver/DriverPortalContent';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/authGuard';

export default async function DriverDashboardPage() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session || session.role !== 'driver') redirect('/driver/login');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col font-body">
      <Navbar onOpenLoginModal={() => {}} />
      <div aria-hidden="true" className="h-16 shrink-0" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        <DriverPortalContent isModal={false} />
      </main>
      <Footer />
    </div>
  );
}
