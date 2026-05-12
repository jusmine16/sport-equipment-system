"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Notification from "@/components/Notification";
import { getTransactions, isLoggedIn, type Transaction } from "@/lib/api";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function HistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notification, setNotification] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    getTransactions()
      .then((items) => setTransactions(items.filter((transaction) => Boolean(transaction.return_date))))
      .catch((error) => {
        setNotification({
          msg: error instanceof Error ? error.message : "Failed to load history",
          type: "error",
        });
      });
  }, []);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 shadow-[0_20px_55px_rgba(3,10,26,0.25)] backdrop-blur">
          <div className="border-b border-white/10 px-6 py-6 sm:px-8">
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white sm:text-4xl">
              Transaction History
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
              View all your borrowing and return records.
            </p>
          </div>

          <div className="px-6 py-0 sm:px-8">
            {transactions.length > 0 ? (
              <div className="divide-y divide-white/10">
                {transactions.map((transaction) => (
                  <article key={transaction.id} className="py-6 first:pt-5 last:pb-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold text-white">{transaction.equipment_name}</h2>
                          <span className="inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                            Returned
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-400">Quantity: {transaction.quantity}</p>

                        <div className="mt-4 grid gap-4 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-3">
                          <p className="flex items-center gap-2">
                            <span className="text-slate-400">📅</span>
                            Borrowed: {formatDate(transaction.borrow_date)}
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="text-slate-400">📅</span>
                            Due: {formatDate(transaction.expected_return_date)}
                          </p>
                          <p className="text-slate-300">
                            Returned: {formatDate(transaction.return_date)}
                            {transaction.penalty_amount ? (
                              <span className="ml-4 inline-flex flex-wrap gap-3 font-semibold text-red-400">
                                <span>Overdue: ₱{(transaction.overdue_charge ?? 0).toFixed(2)}</span>
                                <span>Damage: ₱{(transaction.damage_charge ?? 0).toFixed(2)}</span>
                                <span>Total: ₱{transaction.penalty_amount.toFixed(2)}</span>
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>

                      <div className="lg:pt-1">
                        <span className="inline-flex items-center rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-300">
                          Returned
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-0 py-10 text-center text-slate-400">No history records yet.</div>
            )}
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