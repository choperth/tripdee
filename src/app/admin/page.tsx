import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminConsoleContent } from '@/components/portals/admin/AdminConsoleContent';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/authGuard';

export const metadata: Metadata = {
  title: 'ระบบจัดการส่วนกลาง (Admin Console) | TripDee',
  description: 'ศูนย์ควบคุมและบริหารจัดการระบบ TripDee',
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || session.role !== 'admin') redirect('/admin/login');

  return <AdminConsoleContent isModal={false} />;
}
