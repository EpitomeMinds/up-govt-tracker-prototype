"use client";

import { useEffect, useState } from "react";
import { getPortalLanguage, switchPortalLanguage, type PortalLang } from "@/lib/googleTranslate";
import { sessionInitials, type PortalSession } from "@/lib/portalAuth";
import GoogleTranslateLoader from "./GoogleTranslateLoader";
import UpGovtLogo from "./UpGovtLogo";

interface Props {
  onSync?: () => void;
  syncing?: boolean;
  session?: PortalSession | null;
}

export default function PortalHeader({ onSync, syncing, session }: Props) {
  const [lang, setLang] = useState<PortalLang>("en");
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    setLang(getPortalLanguage());
    if (wasTranslatingOnLoad()) {
      setTranslating(true);
    }
  }, []);

  const switchLang = (next: PortalLang) => {
    if (next === getPortalLanguage() || translating) return;
    setTranslating(true);
    switchPortalLanguage(next);
  };

  return (
    <>
      <GoogleTranslateLoader
        onLoadStart={() => setTranslating(true)}
        onReady={() => setTranslating(false)}
      />

      {translating && (
        <div className="portal-translate-overlay notranslate" translate="no" role="status">
          <div className="portal-translate-overlay-card">
            <div className="portal-spinner mb-3" />
            <p className="text-sm font-semibold text-slate-800">Translating…</p>
            <p className="mt-1 text-xs text-slate-500">Please wait while the page updates</p>
          </div>
        </div>
      )}

      <header className="portal-header">
        <div className="flex min-w-0 items-center gap-3">
          <UpGovtLogo size="sm" className="hidden sm:inline-flex" />
          <div className="min-w-0">
            <h1 className="portal-header-title">Employment Portal</h1>
            <p className="portal-header-subtitle">Integrated Dashboard for All Departments</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onSync && (
            <button
              type="button"
              onClick={onSync}
              disabled={syncing || translating}
              className="hidden rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/25 disabled:opacity-60 sm:block"
            >
              {syncing ? "Syncing…" : "Sync data"}
            </button>
          )}
          <div
            className="portal-lang-toggle notranslate flex items-center rounded-xl bg-white/15 p-1 backdrop-blur"
            translate="no"
          >
            <button
              type="button"
              onClick={() => switchLang("en")}
              disabled={translating}
              aria-pressed={lang === "en"}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                lang === "en" ? "bg-white text-[#4a7fd4]" : "text-white hover:bg-white/10"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => switchLang("hi")}
              disabled={translating}
              aria-pressed={lang === "hi"}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                lang === "hi" ? "bg-white text-[#4a7fd4]" : "text-white hover:bg-white/10"
              }`}
            >
              Hindi
            </button>
          </div>
          <div className="portal-admin-chip notranslate" translate="no">
            <div className="portal-admin-avatar">
              {session ? sessionInitials(session) : "—"}
            </div>
            <span className="hidden max-w-[140px] truncate text-sm font-semibold text-white sm:inline">
              {session?.email ?? "Guest"}
            </span>
          </div>
        </div>
      </header>
    </>
  );
}

function wasTranslatingOnLoad(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem("portal-translating") === "1";
}
