import { Metadata } from 'next';
import { AdminConsoleContent } from '@/components/portals/admin/AdminConsoleContent';

export const metadata: Metadata = {
  title: 'ระบบจัดการส่วนกลาง (Admin Console) | TripDee',
  description: 'ศูนย์ควบคุมและบริหารจัดการระบบ TripDee',
};

export default function AdminPage() {
  return <AdminConsoleContent isModal={false} />;
}
