"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Nav from "@/components/Nav";
import Notification from "@/components/Notification";
import { useAuth } from "@/contexts/AuthContext";
import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  createBorrow,
  isLoggedIn,
  type Equipment,
} from "@/lib/api";

export default function EquipmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [borrowModal, setBorrowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [selectedBorrowEquipment, setSelectedBorrowEquipment] = useState<Equipment | null>(null);
  const [borrowForm, setBorrowForm] = useState({
    borrowerName: user?.username ?? "",
    idNumber: "",
    departmentCourse: "",
    contactNumber: "",
    quantity: 1,
    purpose: "",
    expectedReturnDate: "",
    conditionBefore: "good",
    remarks: "",
    agreementAccepted: false,
  });
  const [form, setForm] = useState({
    name: "",
    category: "other",
    quantity: 0,
    condition: "good",
    status: "available",
  });
  const [notification, setNotification] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const load = useCallback(() => {
    getEquipment(search, category).then(setEquipment).catch(console.error);
  }, [search, category]);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
  };

  const resetBorrowForm = (eq: Equipment) => {
    const defaultReturnDate = new Date();
    defaultReturnDate.setDate(defaultReturnDate.getDate() + 7);

    setSelectedBorrowEquipment(eq);
    setBorrowForm({
      borrowerName: user?.username ?? "",
      idNumber: "",
      departmentCourse: "",
      contactNumber: "",
      quantity: 1,
      purpose: "",
      expectedReturnDate: defaultReturnDate.toISOString().slice(0, 10),
      conditionBefore: "good",
      remarks: "",
      agreementAccepted: false,
    });
  };

  const submitBorrow = async () => {
    if (!selectedBorrowEquipment) {
      notify("Select an equipment item first", "error");
      return;
    }

    if (!borrowForm.borrowerName.trim() || !borrowForm.idNumber.trim() || !borrowForm.departmentCourse.trim() || !borrowForm.contactNumber.trim()) {
      notify("Complete the borrower information", "error");
      return;
    }

    if (!borrowForm.agreementAccepted) {
      notify("Accept the borrowing agreement", "error");
      return;
    }

    const quantity = Number(borrowForm.quantity || 0);
    if (!Number.isFinite(quantity) || quantity < 1) {
      notify("Quantity must be at least 1", "error");
      return;
    }

    if (quantity > selectedBorrowEquipment.available_quantity) {
      notify(`Only ${selectedBorrowEquipment.available_quantity} unit(s) available`, "error");
      return;
    }

    try {
      await createBorrow(
        [{ equipment: selectedBorrowEquipment.id, quantity }],
        {
          borrowerName: borrowForm.borrowerName.trim(),
          idNumber: borrowForm.idNumber.trim(),
          departmentCourse: borrowForm.departmentCourse.trim(),
          contactNumber: borrowForm.contactNumber.trim(),
          expectedReturnDate: borrowForm.expectedReturnDate || undefined,
          purpose: borrowForm.purpose.trim() || undefined,
        }
      );
      notify("Borrow request submitted!");
      setBorrowModal(false);
      setSelectedBorrowEquipment(null);
    } catch (e) {
      notify((e as Error).message || "Failed", "error");
    }
  };

  const submitEquipment = async () => {
    try {
      if (editing) {
        await updateEquipment(editing.id, form);
        notify("Equipment updated");
      } else {
        await createEquipment(form);
        notify("Equipment added");
      }
      setEditModal(false);
      setEditing(null);
      load();
    } catch (e) {
      notify((e as Error).message || "Failed", "error");
    }
  };

  const deleteEquip = async (eq: Equipment) => {
    if (!confirm(`Delete ${eq.name}?`)) return;
    try {
      await deleteEquipment(eq.id);
      notify("Equipment deleted");
      load();
    } catch (e) {
      notify((e as Error).message || "Failed", "error");
    }
  };

  const categoryPalette: Record<string, string> = {
    balls: "bg-sky-100 text-sky-700 border-sky-200",
    rackets: "bg-violet-100 text-violet-700 border-violet-200",
    protective: "bg-amber-100 text-amber-700 border-amber-200",
    fitness: "bg-emerald-100 text-emerald-700 border-emerald-200",
    other: "bg-white/8 text-slate-200 border-slate-200",
  };

  const conditionPalette: Record<string, string> = {
    new: "bg-emerald-100 text-emerald-700 border-emerald-200",
    good: "bg-sky-100 text-sky-700 border-sky-200",
    fair: "bg-amber-100 text-amber-700 border-amber-200",
    poor: "bg-red-100 text-red-700 border-red-200",
  };

  const statusPalette: Record<string, string> = {
    available: "bg-emerald-600 text-white",
    maintenance: "bg-amber-500 text-white",
    retired: "bg-white/80 text-white",
  };

  const openBorrowModal = (equipmentItem?: Equipment) => {
    const target = equipmentItem ?? equipment.find((item) => item.available_quantity > 0 && item.status === "available");
    if (!target) {
      notify("No available equipment to borrow", "error");
      return;
    }
    resetBorrowForm(target);
    setBorrowModal(true);
  };

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 shadow-[0_20px_55px_rgba(3,10,26,0.25)] backdrop-blur">
          <div className="border-b border-white/10 px-6 py-6 sm:px-8">
            <div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Equipment Catalog
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Borrow equipment with a cleaner, faster layout.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Browse available gear, filter by category, and submit borrow requests from a single catalog view.
                </p>


              </div>
            </div>
          </div>

          <div className="border-b border-white/10 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Equipment Catalog</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Search by name or code and filter by category.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <label className="relative min-w-[280px] flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
                      <circle cx="11" cy="11" r="6.5" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search equipment by name or code..."
                    className="w-full rounded-full border border-white/10 bg-white/8 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white/10 focus:ring-4 focus:ring-cyan-400/20"
                  />
                </label>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-full border border-white/10 bg-white px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                >
                  <option value="">All Categories</option>
                  <option value="balls">Balls</option>
                  <option value="rackets">Rackets</option>
                  <option value="protective">Protective Gear</option>
                  <option value="fitness">Fitness Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { value: "", label: "All" },
                { value: "balls", label: "Balls" },
                { value: "rackets", label: "Rackets" },
                { value: "protective", label: "Protective" },
                { value: "fitness", label: "Fitness" },
              ].map((item) => {
                const active = category === item.value;
                return (
                  <button
                    key={item.value || "all"}
                    type="button"
                    onClick={() => setCategory(item.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-300 hover:border-white/10 hover:bg-white/8"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {equipment.length > 0 ? (
              <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {equipment.map((eq, index) => {
                  const isAvailable = eq.available_quantity > 0 && eq.status === "available";
                  const availabilityPercent = eq.quantity > 0 ? Math.round((eq.available_quantity / eq.quantity) * 100) : 0;

                  return (
                    <article
                      key={eq.id}
                      className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-white/8">
                        {eq.image ? (
                          <Image
                            src={eq.image}
                            alt={eq.name}
                            fill
                            sizes="(max-width: 1280px) 50vw, 25vw"
                            priority={index === 0}
                            loading={index === 0 ? "eager" : "lazy"}
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" stroke="currentColor" strokeWidth="1.6">
                              <rect x="4" y="5" width="16" height="14" rx="2.5" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="m8 15 2.5-3 2.5 2 3-4 2 3.5" />
                            </svg>
                          </div>
                        )}

                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryPalette[eq.category] ?? categoryPalette.other}`}>
                            {eq.category_display}
                          </span>
                        </div>

                        <div className="absolute right-3 top-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${conditionPalette[eq.condition] ?? conditionPalette.good}`}>
                            {eq.condition_display.toLowerCase()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 p-5">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-white">{eq.name}</h3>
                              <p className="mt-1 text-sm text-slate-400">Code: {eq.id.toString().padStart(3, "0")}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPalette[eq.status] ?? statusPalette.available}`}>
                              {eq.status_display}
                            </span>
                          </div>

                          <div className="mt-4 space-y-3 text-sm text-slate-300">
                            <div className="flex items-center justify-between">
                              <span>Available</span>
                              <span className="font-semibold text-white">
                                {eq.available_quantity} / {eq.quantity}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/8">
                              <div
                                className={`h-full rounded-full ${isAvailable ? "bg-emerald-500" : "bg-slate-400"}`}
                                style={{ width: `${Math.max(availabilityPercent, eq.quantity === 0 ? 0 : 4)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (!isAvailable) return;
                              openBorrowModal(eq);
                            }}
                            disabled={!isAvailable}
                            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                              isAvailable
                                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                : "cursor-not-allowed bg-slate-200 text-slate-400"
                            }`}
                          >
                            {isAvailable ? "Borrow Now" : "Not Available"}
                          </button>

                          {user?.role === "admin" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditing(eq);
                                  setForm({
                                    name: eq.name,
                                    category: eq.category,
                                    quantity: eq.quantity,
                                    condition: eq.condition,
                                    status: eq.status,
                                  });
                                  setEditModal(true);
                                }}
                                className="rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/20 hover:bg-cyan-400/10 hover:text-cyan-300"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteEquip(eq)}
                                className="rounded-full border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/8 px-6 py-14 text-center text-slate-400">
                No equipment found.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Borrow Modal */}
      {borrowModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={() => setBorrowModal(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-5 sm:px-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">Borrow Equipment</h2>
                <p className="mt-2 text-sm text-slate-400">Review the item and complete the borrowing form before submitting.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBorrowModal(false);
                  setSelectedBorrowEquipment(null);
                }}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/8 hover:text-slate-200"
                aria-label="Close borrow modal"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[0.88fr_1.12fr]">
              <div className="space-y-4">
                {selectedBorrowEquipment && (
                  <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/8">
                    <div className="relative aspect-[16/9] bg-white/8">
                      {selectedBorrowEquipment.image ? (
                        <Image
                          src={selectedBorrowEquipment.image}
                          alt={selectedBorrowEquipment.name}
                          fill
                          sizes="(max-width: 1024px) 100vw, 45vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                          <svg viewBox="0 0 24 24" fill="none" className="h-12 w-12" stroke="currentColor" strokeWidth="1.6">
                            <rect x="4" y="5" width="16" height="14" rx="2.5" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8 15 2.5-3 2.5 2 3-4 2 3.5" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute right-3 top-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${conditionPalette[selectedBorrowEquipment.condition] ?? conditionPalette.good}`}>
                          {selectedBorrowEquipment.condition_display.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white">{selectedBorrowEquipment.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">Code: {selectedBorrowEquipment.id.toString().padStart(3, "0")}</p>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                        <span>Available</span>
                        <span className="font-semibold text-white">{selectedBorrowEquipment.available_quantity} units</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/60 p-4">
                  <h4 className="text-sm font-semibold text-white">Borrower Information</h4>
                  <div className="mt-3 grid gap-3 text-sm text-slate-300">
                    <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                      <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Name</span>
                      <span className="mt-1 block font-medium text-white">{borrowForm.borrowerName || user?.username || "Borrower"}</span>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                      <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Account</span>
                      <span className="mt-1 block font-medium text-white">{user?.role === "admin" ? "Admin User" : "Borrower"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-400 text-[10px] text-amber-600">i</span>
                    Borrowing Agreement
                  </h4>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-amber-900/80">
                    <li>I will return the equipment in the same condition.</li>
                    <li>I will return the equipment by the expected return date.</li>
                    <li>I am responsible for any damage or loss.</li>
                    <li>Late returns may incur penalties.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Borrower Name *</label>
                    <input
                      type="text"
                      value={borrowForm.borrowerName}
                      onChange={(e) => setBorrowForm({ ...borrowForm, borrowerName: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                      placeholder="Borrower name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">ID Number *</label>
                    <input
                      type="text"
                      value={borrowForm.idNumber}
                      onChange={(e) => setBorrowForm({ ...borrowForm, idNumber: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                      placeholder="Student or staff ID"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Department / Course *</label>
                    <input
                      type="text"
                      value={borrowForm.departmentCourse}
                      onChange={(e) => setBorrowForm({ ...borrowForm, departmentCourse: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                      placeholder="Department or course"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Contact Number *</label>
                    <input
                      type="text"
                      value={borrowForm.contactNumber}
                      onChange={(e) => setBorrowForm({ ...borrowForm, contactNumber: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                      placeholder="Contact number"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Quantity to Borrow *</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedBorrowEquipment?.available_quantity ?? 1}
                      value={borrowForm.quantity}
                      onChange={(e) => setBorrowForm({ ...borrowForm, quantity: parseInt(e.target.value, 10) || 1 })}
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Expected Return Date *</label>
                    <input
                      type="date"
                      value={borrowForm.expectedReturnDate}
                      onChange={(e) => setBorrowForm({ ...borrowForm, expectedReturnDate: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Purpose of Borrowing *</label>
                  <textarea
                    value={borrowForm.purpose}
                    onChange={(e) => setBorrowForm({ ...borrowForm, purpose: e.target.value })}
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                    placeholder="e.g., Physical Education class, basketball practice, personal training..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Equipment Condition *</label>
                  <select
                    value={borrowForm.conditionBefore}
                    onChange={(e) => setBorrowForm({ ...borrowForm, conditionBefore: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                  >
                    <option value="new">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Remarks (Optional)</label>
                  <textarea
                    value={borrowForm.remarks}
                    onChange={(e) => setBorrowForm({ ...borrowForm, remarks: e.target.value })}
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                    placeholder="Any additional notes or observations..."
                  />
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={borrowForm.agreementAccepted}
                    onChange={(e) => setBorrowForm({ ...borrowForm, agreementAccepted: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-white/10 text-cyan-300 focus:ring-blue-500"
                  />
                  <span>I accept the borrowing agreement and understand that late returns, damage, or loss may incur penalties.</span>
                </label>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setBorrowModal(false);
                      setSelectedBorrowEquipment(null);
                    }}
                    className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/8 sm:w-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitBorrow}
                    className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:flex-1"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={() => setEditModal(false)}
        >
          <div
            className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-white">
              {editing ? "Edit Equipment" : "Add Equipment"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">Update equipment details and availability.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-2.5 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-2.5 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                >
                  <option value="balls">Balls</option>
                  <option value="rackets">Rackets</option>
                  <option value="protective">Protective Gear</option>
                  <option value="fitness">Fitness Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">
                  Quantity
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: parseInt(e.target.value) || 0 })
                  }
                  min={0}
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-2.5 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">
                  Condition
                </label>
                <select
                  value={form.condition}
                  onChange={(e) =>
                    setForm({ ...form, condition: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-2.5 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-2.5 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                >
                  <option value="available">Available</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={submitEquipment}
                  className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditModal(false)}
                  className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/8"
                >
                  Cancel
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
