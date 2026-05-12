'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import AddEquipmentForm from '@/components/AddEquipmentForm';
import { useAuth } from '@/contexts/AuthContext';
import { isLoggedIn } from '@/lib/api';

export default function AddEquipmentPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <AddEquipmentForm />
      </main>
    </div>
  );
}
