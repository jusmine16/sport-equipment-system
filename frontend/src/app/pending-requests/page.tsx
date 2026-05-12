"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Notification from "@/components/Notification";
import { useAuth } from "@/contexts/AuthContext";
import {
  approveBorrow,
  getBorrows,
  isLoggedIn,
  rejectBorrow,
  type BorrowRequest,
} from "@/lib/api";

function shortDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
}

export default function PendingRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadRequests = async () => {
    try {
      const all = await getBorrows();
      setRequests(all);
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load pending requests",
      });
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    if (user?.role && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    if (user?.role === "admin") {
      loadRequests();
    }
  }, [router, user?.role]);

  const pendingRequests = useMemo(
    () => requests.filter((item) => item.status.toLowerCase() === "pending"),
    [requests]
  );

  const onApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await approveBorrow(id);
      setNotification({ type: "success", message: "Request approved" });
      await loadRequests();
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Approve failed",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const onReject = async (id: number) => {
    setProcessingId(id);
    try {
      await rejectBorrow(id);
      setNotification({ type: "success", message: "Request rejected" });
      await loadRequests();
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Reject failed",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (user?.role && user.role !== "admin") {
    return null;
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-white shadow-sm">
          {pendingRequests.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-8 py-10 text-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-20 w-20 text-slate-400" stroke="currentColor" strokeWidth="1.6">
                <path d="m3 11 9-5 9 5-9 5-9-5Z" />
                <path d="M12 16v5" />
              </svg>
              <h1 className="mt-6 text-4xl font-semibold text-white">No Pending Requests</h1>
              <p className="mt-4 text-xl text-slate-400">All borrow requests have been processed</p>
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-semibold tracking-tight text-white">Pending Requests</h1>
                <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">
                  {pendingRequests.length}
                </span>
              </div>

              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <article key={request.id} className="rounded-2xl border border-white/10 bg-white p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white">{request.borrower_name || request.user_name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {request.department_course || "-"} | {request.contact_number || "-"}
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          Requested: {shortDate(request.request_date)} | Return: {shortDate(request.expected_return_date)}
                        </p>
                        <p className="mt-2 text-sm text-slate-200">
                          {request.items.map((item) => `${item.equipment_name} x${item.quantity}`).join(", ")}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={processingId === request.id}
                          onClick={() => onApprove(request.id)}
                          className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={processingId === request.id}
                          onClick={() => onReject(request.id)}
                          className="inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}
