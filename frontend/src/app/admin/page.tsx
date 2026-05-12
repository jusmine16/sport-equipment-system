"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Notification from "@/components/Notification";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteEquipment,
  getEquipment,
  getReports,
  isLoggedIn,
  type Equipment,
  type Reports,
} from "@/lib/api";

const categoryLocation: Record<string, string> = {
  balls: "Field Storage",
  rackets: "Court Equipment Room",
  fitness: "Fitness Center",
  protective: "Gym Storage A",
  other: "Recreation Room",
};

const conditionClass: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-700",
  good: "bg-blue-100 text-blue-700",
  fair: "bg-amber-100 text-amber-700",
  poor: "bg-rose-100 text-rose-700",
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Reports | null>(null);
  const [inventory, setInventory] = useState<Equipment[]>([]);
  const [notification, setNotification] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const load = async () => {
    const [reportData, equipmentData] = await Promise.all([
      getReports(),
      getEquipment(),
    ]);
    setStats(reportData);
    setInventory(equipmentData);
  };

  const showLoadError = (error: unknown) => {
    setNotification({
      msg: error instanceof Error ? error.message : "Failed to load admin dashboard",
      type: "error",
    });
  };

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch(showLoadError);
  }, [user?.role, router]);

  const totals = useMemo(() => {
    const totalTypes = inventory.length;
    const availableNow = inventory.reduce((sum, row) => sum + row.available_quantity, 0);
    const borrowedNow = inventory.reduce(
      (sum, row) => sum + Math.max(row.quantity - row.available_quantity, 0),
      0
    );
    const overdueItems = inventory.filter((row) => row.status !== "available").length;

    return {
      totalTypes,
      availableNow,
      borrowedNow,
      overdueItems,
    };
  }, [inventory]);

  const onDelete = async (equipment: Equipment) => {
    const confirmed = confirm(`Delete ${equipment.name}?`);
    if (!confirmed) return;

    try {
      await deleteEquipment(equipment.id);
      setNotification({ msg: "Equipment deleted", type: "success" });
      load();
    } catch (error) {
      setNotification({
        msg: error instanceof Error ? error.message : "Delete failed",
        type: "error",
      });
    }
  };

  if (user?.role !== "admin") return null;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 shadow-[0_20px_55px_rgba(3,10,26,0.25)] backdrop-blur">
          <div className="px-6 py-6 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: "Total Equipment",
                  value: totals.totalTypes,
                  hint: `${totals.totalTypes} types`,
                  color: "bg-blue-600",
                },
                {
                  title: "Available Now",
                  value: totals.availableNow,
                  hint: `${stats?.available_units ?? totals.availableNow} available`,
                  color: "bg-emerald-600",
                },
                {
                  title: "Currently Borrowed",
                  value: totals.borrowedNow,
                  hint: "Active items",
                  color: "bg-violet-600",
                },
                {
                  title: "Overdue Items",
                  value: totals.overdueItems,
                  hint: "Needs review",
                  color: "bg-red-600",
                },
              ].map((card) => (
                <article key={card.title} className="rounded-2xl border border-white/10 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">{card.title}</p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{card.value}</p>
                      <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
                    </div>
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-white ${card.color}`}>
                      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v10l-7 4-7-4V7l7-4z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v9" />
                      </svg>
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8">
              <h1 className="text-3xl font-semibold tracking-tight text-white">Admin Dashboard</h1>
              <p className="mt-2 text-sm text-slate-300">Manage equipment inventory and monitor system activity</p>
            </div>

            <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <h2 className="text-xl font-semibold text-white">Equipment Inventory</h2>
                <Link
                  href="/equipment/add"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  + Add Equipment
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-white/8 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">Category</th>
                      <th className="px-5 py-3 font-semibold">Availability</th>
                      <th className="px-5 py-3 font-semibold">Location</th>
                      <th className="px-5 py-3 font-semibold">Condition</th>
                      <th className="px-5 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-200">
                    {inventory.map((row) => (
                      <tr key={row.id} className="hover:bg-white/8/70">
                        <td className="px-5 py-4 font-medium text-white">{row.name}</td>
                        <td className="px-5 py-4">{row.category_display}</td>
                        <td className="px-5 py-4">
                          {row.available_quantity} / {row.quantity}
                        </td>
                        <td className="px-5 py-4">{categoryLocation[row.category] ?? categoryLocation.other}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${conditionClass[row.condition] ?? conditionClass.good}`}>
                            {row.condition_display.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Link
                              href="/equipment"
                              className="text-cyan-300 transition hover:text-blue-800"
                              title="Edit in equipment page"
                            >
                              ✎
                            </Link>
                            <button
                              onClick={() => onDelete(row)}
                              className="text-red-600 transition hover:text-red-800"
                              title="Delete equipment"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </main>

      {notification && (
        <Notification
          message={notification.msg}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}
