'use client';

import { FormEvent, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: password }),
      });
      if (!response.ok) {
        setError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
        return;
      }
      const next = searchParams.get('next');
      router.replace(next?.startsWith('/admin') ? next : '/admin');
      router.refresh();
    } catch {
      setError('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="admin-password" className="block text-xs font-bold text-slate-300 mb-1.5">
          รหัสผ่านผู้ดูแลระบบ
        </label>
        <input
          id="admin-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
        />
      </div>
      {error && <p className="text-xs text-red-400 font-semibold" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-60 text-slate-950 font-black text-xs transition-colors cursor-pointer"
      >
        {submitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ Admin Console'}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid h-10 w-10 place-items-center bg-amber-400 text-slate-950 text-sm font-black">TD</span>
          <div>
            <h1 className="font-black text-sm tracking-tight">TRIPDEE ADMIN CONSOLE</h1>
            <p className="text-xs text-slate-400">ยืนยันตัวตนผู้ดูแลระบบ</p>
          </div>
        </div>
        <Suspense fallback={<div className="text-xs text-slate-400 text-center py-6">กำลังโหลด...</div>}>
          <AdminLoginForm />
        </Suspense>
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-white">← กลับสู่หน้าหลัก TripDee</Link>
        </div>
      </div>
    </main>
  );
}
