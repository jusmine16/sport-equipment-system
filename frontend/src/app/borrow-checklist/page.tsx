'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { isLoggedIn } from '@/lib/api';

export default function BorrowChecklistPage() {
  const router = useRouter();
  const [items, setItems] = useState([
    { id: 1, label: 'Check student ID card', done: true },
    { id: 2, label: 'Verify equipment condition before borrowing', done: false },
    { id: 3, label: 'Sign borrowing agreement form', done: true },
    { id: 4, label: 'Set return reminder on phone', done: false },
    { id: 5, label: 'Take photo of equipment condition', done: true },
    { id: 6, label: 'Read equipment usage guidelines', done: false },
  ]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
    }
  }, [router]);

  const completedCount = useMemo(
    () => items.filter((item) => item.done).length,
    [items]
  );

  const progressPercent = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round((completedCount / items.length) * 100);
  }, [completedCount, items.length]);

  const toggleItem = (id: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-white/8">
      <Nav />
      <main className="mx-auto max-w-7xl p-6 md:p-8">
        <section className="mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Borrowing Process Checklist
            </h1>
            <p className="mt-2 text-xl text-slate-300">
              Complete these steps for a smooth borrowing experience
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-sm">
            <h2 className="text-4xl font-semibold tracking-tight text-white">
              Before Borrowing Equipment
            </h2>

            <div className="mt-6 flex items-center gap-4">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-3xl font-medium text-slate-300">
                {completedCount}/{items.length}
              </span>
            </div>

            <ul className="mt-8 space-y-4">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition ${
                      item.done ? 'bg-white/8' : 'bg-transparent hover:bg-white/8'
                    }`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                        item.done
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-400 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={`text-3xl ${
                        item.done ? 'text-slate-400 line-through' : 'text-slate-200'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
