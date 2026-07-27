"use client";

import { config } from "@/lib/config";
import { useState } from "react";

export default function DeviceAuthClient({ code, isLoggedIn }: { code: string; isLoggedIn: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuthorize = async () => {
    if (!isLoggedIn) {
      window.location.href = `${config.apiUrl}/auth/github`;
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`${config.apiUrl}/auth/device/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify device code");

      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <p className="text-gray-500 mb-6">You need to log in to authorize this device.</p>
        <button
          onClick={handleAuthorize}
          className="w-full py-2 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Log in with GitHub
        </button>
      </>
    );
  }

  if (status === "success") {
    return (
      <>
        <div className="text-green-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-700 font-medium">Successfully authorized!</p>
        <p className="text-gray-500 text-sm mt-2">You can close this window and return to your terminal.</p>
      </>
    );
  }

  return (
    <>
      <p className="text-gray-600 mb-6">
        The Akara CLI is requesting access to your account.
        <br />
        <span className="text-xs text-gray-400">Device Code: {code}</span>
      </p>

      {status === "error" && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      <button
        onClick={handleAuthorize}
        disabled={status === "loading"}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Authorizing..." : "Authorize CLI"}
      </button>
    </>
  );
}
