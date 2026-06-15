"use client";

import { FormEvent, useState } from "react";
import { createPortalSession, DEMO_EMAIL, validatePortalLogin } from "@/lib/portalAuth";
import type { PortalSession } from "@/lib/portalAuth";
import UpGovtLogo from "./UpGovtLogo";

interface Props {
  onLogin: (session: PortalSession) => void;
}

export default function PortalLoginModal({ onLogin }: Props) {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!validatePortalLogin(email, password)) {
      setError("Invalid email or password.");
      return;
    }

    setSubmitting(true);
    const session = createPortalSession();
    onLogin(session);
    setSubmitting(false);
  };

  return (
    <div className="portal-login-overlay notranslate" translate="no" role="dialog" aria-modal="true">
      <div className="portal-login-modal">
        <div className="mb-6 text-center">
          <UpGovtLogo size="md" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Sign in to Portal</h2>
          <p className="mt-1 text-sm text-slate-500">Employment Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="portal-login-email" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Email
            </label>
            <input
              id="portal-login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="portal-input"
              placeholder="demo@epitome.com"
              required
            />
          </div>

          <div>
            <label htmlFor="portal-login-password" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Password
            </label>
            <input
              id="portal-login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="portal-input"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button type="submit" disabled={submitting} className="portal-btn-primary w-full justify-center py-3">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
