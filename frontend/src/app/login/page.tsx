"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      const d = (err as { data?: { error?: string; data?: Record<string, string | string[]> } })?.data;
      const fields = d?.data ?? {};
      const firstFieldError = Object.values(fields).find(Boolean);
      const normalizedFieldError = Array.isArray(firstFieldError)
        ? firstFieldError[0]
        : firstFieldError;
      setError(
        (typeof normalizedFieldError === "string" && normalizedFieldError) ||
          d?.error ||
          (err as Error).message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(29,78,216,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0,transparent_26%,rgba(7,17,31,0.28)_100%)]" />
      
      <div className="relative w-full max-w-md rounded-[1.6rem] border border-white/10 bg-white/6 p-7 shadow-[0_18px_55px_rgba(3,10,26,0.45)] backdrop-blur-xl sm:p-8">
        <div className="mb-7 text-center">
          <div className="flex justify-center mb-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-xl font-black text-slate-950 shadow-lg shadow-cyan-500/25">
              SB
            </span>
          </div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-white">Sport Equipment</h1>
          <p className="mt-1 text-sm text-slate-300">Borrowing System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Username or Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
              placeholder="Enter username or email"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="app-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-cyan-300 transition hover:text-cyan-200 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
