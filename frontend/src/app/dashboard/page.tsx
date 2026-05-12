"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { useAuth } from "@/contexts/AuthContext";
import { getReports, isLoggedIn } from "@/lib/api";
import type { Reports } from "@/lib/api";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Reports | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn()) router.replace("/login");
  }, [authLoading, router]);

  useEffect(() => {
    // Only admin role should request report data
    if (!isLoggedIn() || user?.role !== "admin") {
      return;
    }

    getReports().then(setStats).catch(() => router.replace("/login"));
  }, [router, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  const statValue = (value?: number) => (typeof value === "number" ? value : 0);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="app-shell fade-up overflow-hidden rounded-[1.75rem] px-6 py-6 sm:px-8 sm:py-7">
          <h1 className="text-3xl font-display font-semibold tracking-tight text-white sm:text-[2rem]">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">Overview of inventory, borrowing activity, and admin actions.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="app-panel rounded-2xl p-4">
              <p className="text-sm font-medium text-slate-300">Total Equipment Types</p>
              <p className="mt-2 text-3xl font-semibold leading-none text-cyan-300">{statValue(stats?.total_equipment)}</p>
            </article>

            <article className="app-panel rounded-2xl p-4">
              <p className="text-sm font-medium text-slate-300">Total Units</p>
              <p className="mt-2 text-3xl font-semibold leading-none text-white">{statValue(stats?.total_units)}</p>
            </article>

            <article className="app-panel rounded-2xl p-4">
              <p className="text-sm font-medium text-slate-300">Available Units</p>
              <p className="mt-2 text-3xl font-semibold leading-none text-emerald-400">{statValue(stats?.available_units)}</p>
            </article>

            <article className="app-panel rounded-2xl p-4">
              <p className="text-sm font-medium text-slate-300">Borrowed Units</p>
              <p className="mt-2 text-3xl font-semibold leading-none text-amber-300">{statValue(stats?.borrowed_units)}</p>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="app-panel rounded-2xl p-4">
              <p className="text-sm font-medium text-slate-300">Pending Requests</p>
              <p className="mt-2 text-3xl font-semibold leading-none text-white">{statValue(stats?.pending_requests)}</p>
            </article>
            <article className="app-panel rounded-2xl p-4">
              <p className="text-sm font-medium text-slate-300">Active Borrows</p>
              <p className="mt-2 text-3xl font-semibold leading-none text-white">{statValue(stats?.active_transactions)}</p>
            </article>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-display font-semibold text-white">Quick Actions</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/equipment"
                className="app-btn-primary inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                Browse Equipment
              </Link>
              <Link
                href="/transactions"
                className="app-btn-secondary inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                My Transactions
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="app-btn-secondary inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
