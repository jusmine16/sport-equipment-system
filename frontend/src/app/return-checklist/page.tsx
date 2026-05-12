'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { ReturnChecklistForm } from '@/components/ReturnChecklistForm';
import { isLoggedIn } from '@/lib/api';

export default function ReturnChecklistPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900">
      <Nav />
      <main className="max-w-7xl mx-auto p-6">
        <section className="mb-6 rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-xl">
          <h1 className="text-2xl font-bold text-white">Return Checklist</h1>
          <p className="mt-2 text-slate-300">
            Use this checklist to verify item condition, completeness, and staff confirmation after the equipment is returned.
          </p>
        </section>
        <ReturnChecklistForm />
      </main>
    </div>
  );
}
