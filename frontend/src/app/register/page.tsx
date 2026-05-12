"use client";

import { useState } from "react";
import Link from "next/link";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password_confirm: passwordConfirm,
      });
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => (window.location.href = "/login"), 1500);
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
          "Registration failed"
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
          <h1 className="text-2xl font-display font-semibold tracking-tight text-white">Create Account</h1>
          <p className="mt-1 text-sm text-slate-300">Sport Equipment Borrowing System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
              placeholder="Choose a username"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
              placeholder="Enter your email"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="Last name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={8}
              className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
              placeholder="Confirm password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-sm text-emerald-200">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="app-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-cyan-300 transition hover:text-cyan-200 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
