import Link from 'next/link';

interface DriverLoginPageProps {
  searchParams: Promise<{ next?: string; auth_error?: string }>;
}

export default async function DriverLoginPage({ searchParams }: DriverLoginPageProps) {
  const params = await searchParams;
  const next = params.next?.startsWith('/driver') ? params.next : '/driver';
  const encodedNext = encodeURIComponent(next);

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-300 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <span className="grid h-10 w-10 place-items-center bg-emerald-600 text-white font-black">TD</span>
          <div>
            <h1 className="font-black text-slate-950">ศูนย์จัดการคนขับ TripDee</h1>
            <p className="text-xs text-slate-500">เข้าสู่ระบบด้วยบัญชีที่ใช้ลงทะเบียนรถ</p>
          </div>
        </div>
        {params.auth_error && (
          <p className="mb-4 border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700" role="alert">
            {params.auth_error}
          </p>
        )}
        <div className="space-y-3">
          <a
            href={`/api/auth/line/login?role=driver&next=${encodedNext}`}
            className="flex w-full items-center justify-center bg-[#06C755] px-4 py-3 text-xs font-black text-white"
          >
            เข้าสู่ระบบด้วย LINE
          </a>
          <a
            href={`/api/auth/google/login?role=driver&next=${encodedNext}`}
            className="flex w-full items-center justify-center border border-slate-300 bg-white px-4 py-3 text-xs font-black text-slate-900"
          >
            เข้าสู่ระบบด้วย Google
          </a>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          ระบบไม่รองรับการเข้าสู่ระบบด้วยเบอร์โทร เพื่อป้องกันผู้อื่นเข้าถึงข้อมูลรถของคุณ
        </p>
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <Link href="/" className="text-xs font-bold text-slate-600 hover:text-slate-950">← กลับสู่หน้าหลัก TripDee</Link>
        </div>
      </div>
    </main>
  );
}
