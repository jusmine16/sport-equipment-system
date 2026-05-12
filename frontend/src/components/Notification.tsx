"use client";

import { useEffect } from "react";

interface Props {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Notification({ message, type = "success", onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm font-medium text-white shadow-[0_14px_35px_rgba(0,0,0,0.24)] ${
        type === "error"
          ? "border-red-400/70 bg-red-600/95"
          : "border-emerald-400/70 bg-emerald-600/95"
      }`}
    >
      {message}
    </div>
  );
}
