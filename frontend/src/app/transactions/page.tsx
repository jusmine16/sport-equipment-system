"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Nav from "@/components/Nav";
import Notification from "@/components/Notification";
import {
  getTransactions,
  returnEquipment,
  isLoggedIn,
  type Transaction,
} from "@/lib/api";

function shortDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function thumbnailFor(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("basket")) return "/images/equipment/basketball.jpg";
  if (lower.includes("tennis")) return "/images/equipment/tennis-racket.jpg";
  if (lower.includes("yoga")) return "/images/equipment/yoga-mat.jpg";
  return "/images/equipment/placeholder.jpg";
}

function calculateOverdueCharge(expectedReturnDate: string | null) {
  if (!expectedReturnDate) return 0;

  const today = new Date();
  const due = new Date(expectedReturnDate);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const daysLate = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLate <= 0) return 0;
  if (daysLate === 1) return 20;
  if (daysLate <= 3) return 50;
  return 100;
}

function calculateDamageCharge(condition: string) {
  if (condition === "fair") return 50;
  if (condition === "poor") return 100;
  return 0;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [returnModal, setReturnModal] = useState<Transaction | null>(null);
  const [returnCondition, setReturnCondition] = useState("good");
  const [notification, setNotification] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    getTransactions()
      .then(setTransactions)
      .catch((error) => {
        setNotification({
          msg: error instanceof Error ? error.message : "Failed to load borrowed items",
          type: "error",
        });
      });
  }, []);

  const activeTransactions = transactions.filter((transaction) => !transaction.return_date);
  const overdueCharge = returnModal ? calculateOverdueCharge(returnModal.expected_return_date) : 0;
  const damageCharge = calculateDamageCharge(returnCondition);
  const totalCharge = overdueCharge + damageCharge;

  const notify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
  };

  const submitReturn = async () => {
    if (!returnModal) return;

    try {
      await returnEquipment({
        transaction_id: returnModal.id,
        condition_on_return: returnCondition,
      });
      notify("Equipment returned successfully");
      setReturnModal(null);
      const refreshed = await getTransactions();
      setTransactions(refreshed);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed", "error");
    }
  };

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6/6 shadow-[0_20px_55px_rgba(3,10,26,0.25)] backdrop-blur">
          <div className="border-b border-white/10 px-6 py-6 sm:px-8">
            <div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  My Borrowed Items
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
                  Manage your currently borrowed equipment.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Borrowed Items</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {activeTransactions.length} open item{activeTransactions.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {activeTransactions.length > 0 ? (
              <div className="space-y-4">
                {activeTransactions.map((transaction) => (
                  <article
                    key={transaction.id}
                    className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]"
                  >
                    <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
                          <Image
                            src={thumbnailFor(transaction.equipment_name)}
                            alt={transaction.equipment_name}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">{transaction.equipment_name}</h3>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${transaction.is_late ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {transaction.is_late ? "Overdue" : "Active"}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-400">Quantity: {transaction.quantity}</p>

                          <div className="mt-3 space-y-1.5 text-sm text-slate-300">
                            <p className="flex items-center gap-2">
                              <span className="text-slate-400">📅</span>
                              Borrowed: {shortDate(transaction.borrow_date)}
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="text-slate-400">📅</span>
                              Due: {shortDate(transaction.expected_return_date)}
                            </p>
                            {transaction.is_late && (
                              <p className="flex items-center gap-2 text-amber-600">
                                <span>⚠️</span>
                                Due in 0 days
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="sm:self-center sm:pl-4">
                        <button
                          onClick={() => {
                            setReturnModal(transaction);
                            setReturnCondition("good");
                          }}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          Return
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-slate-400">
                No borrowed items yet.
              </div>
            )}
          </div>
        </section>
      </main>

      {returnModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={() => setReturnModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-white/6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Return Equipment</h2>
              <button
                type="button"
                onClick={() => setReturnModal(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="flex gap-4">
                <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-slate-100">
                  <img
                    src={thumbnailFor(returnModal.equipment_name)}
                    alt={returnModal.equipment_name}
                    className="h-full w-full rounded-lg object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{returnModal.equipment_name}</h3>
                  <p className="text-sm text-slate-300">Borrowed: {new Date(returnModal.borrow_date).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-300">Due: {shortDate(returnModal.expected_return_date)}</p>
                  <p className="text-sm text-slate-300">Quantity: {returnModal.quantity}</p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Quantity Returned *</label>
                <input
                  type="number"
                  value={returnModal.quantity}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Equipment Condition *</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white/6 px-3 py-2 text-sm text-white"
                >
                  <option value="new">New - No damage (₱0)</option>
                  <option value="good">Good - No damage (₱0)</option>
                  <option value="fair">Fair - Minor damage (₱50)</option>
                  <option value="poor">Poor - Major damage (₱100)</option>
                </select>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="mb-3 font-semibold text-white">Return Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Return Date:</span>
                    <span className="font-medium text-white">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Status:</span>
                    <span className={`font-medium ${overdueCharge > 0 ? "text-red-600" : "text-green-600"}`}>
                      {overdueCharge > 0 ? "Overdue" : "On Time"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Overdue Charge:</span>
                    <span className={`font-medium ${overdueCharge > 0 ? "text-red-600" : "text-white"}`}>
                      ₱{overdueCharge.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Damage Charge:</span>
                    <span className={`font-medium ${damageCharge > 0 ? "text-red-600" : "text-white"}`}>
                      ₱{damageCharge.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 border-t border-slate-200 pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-white">Total Charges:</span>
                      <span className={`font-semibold ${totalCharge > 0 ? "text-red-600" : "text-emerald-700"}`}>
                        ₱{totalCharge.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setReturnModal(null)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white/6 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReturn}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  Complete Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
