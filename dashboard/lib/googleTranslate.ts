export type PortalLang = "en" | "hi";

const COOKIE = "googtrans";
const LANG_KEY = "portal-lang";
const TRANSLATING_KEY = "portal-translating";

let loadPromise: Promise<void> | null = null;

function setGoogTransCookie(value: string) {
  document.cookie = `${COOKIE}=${value};path=/`;
  const host = window.location.hostname;
  if (host && !host.startsWith("localhost")) {
    document.cookie = `${COOKIE}=${value};path=/;domain=.${host.replace(/^www\./, "")}`;
  }
}

function clearGoogTransCookie() {
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
  document.cookie = `${COOKIE}=;${expired};path=/`;
  const host = window.location.hostname;
  if (host) {
    document.cookie = `${COOKIE}=;${expired};path=/;domain=${host}`;
    document.cookie = `${COOKIE}=;${expired};path=/;domain=.${host.replace(/^www\./, "")}`;
  }
}

function persistLanguage(lang: PortalLang) {
  localStorage.setItem(LANG_KEY, lang);
  if (lang === "hi") {
    setGoogTransCookie("/en/hi");
  } else {
    clearGoogTransCookie();
    setGoogTransCookie("/en/en");
  }
}

export function getPortalLanguage(): PortalLang {
  if (typeof window === "undefined") return "en";

  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "hi" || stored === "en") return stored;

  if (document.cookie.includes(`${COOKIE}=/en/hi`)) return "hi";
  if (
    document.documentElement.classList.contains("translated-ltr") ||
    document.documentElement.classList.contains("translated-rtl")
  ) {
    return "hi";
  }

  return "en";
}

export function isPageTranslated(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.documentElement.classList.contains("translated-ltr") ||
    document.documentElement.classList.contains("translated-rtl")
  );
}

export function wasTranslatingBeforeReload(): boolean {
  return sessionStorage.getItem(TRANSLATING_KEY) === "1";
}

export function clearTranslatingFlag() {
  sessionStorage.removeItem(TRANSLATING_KEY);
}

function markTranslatingForReload() {
  sessionStorage.setItem(TRANSLATING_KEY, "1");
}

/** User clicked a language — always reload for a clean, consistent page. */
export function switchPortalLanguage(lang: PortalLang): void {
  if (typeof window === "undefined") return;
  if (lang === getPortalLanguage()) return;

  persistLanguage(lang);
  markTranslatingForReload();
  window.location.reload();
}

function waitForTranslateSelect(timeoutMs = 8000): Promise<HTMLSelectElement | null> {
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (select) {
        window.clearInterval(timer);
        resolve(select);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        window.clearInterval(timer);
        resolve(null);
      }
    }, 100);
  });
}

export function loadGoogleTranslate(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  if (document.getElementById("google-translate-script")) {
    return loadPromise ?? Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    window.googleTranslateElementInit = () => {
      try {
        const google = (
          window as unknown as {
            google?: {
              translate?: {
                TranslateElement: new (
                  opts: {
                    pageLanguage: string;
                    includedLanguages: string;
                    autoDisplay: boolean;
                  },
                  id: string
                ) => void;
              };
            };
          }
        ).google;

        if (!google?.translate) {
          resolve();
          return;
        }

        new google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi",
            autoDisplay: false,
          },
          "google_translate_host"
        );

        resolve();
      } catch (err) {
        reject(err);
      }
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => reject(new Error("Google Translate failed to load"));
    document.body.appendChild(script);
  });

  return loadPromise;
}

/** Apply Hindi after script is ready (used on page load only). */
export async function activateHindiTranslation(): Promise<void> {
  if (typeof window === "undefined") return;

  await loadGoogleTranslate();
  const select = await waitForTranslateSelect();
  if (!select) return;

  select.value = "hi";
  select.dispatchEvent(new Event("change"));
}

/** Re-translate newly loaded dynamic content while staying in Hindi. */
export function refreshHindiTranslation(): void {
  if (getPortalLanguage() !== "hi") return;
  if (!isPageTranslated()) return;

  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!select) return;

  select.value = "hi";
  select.dispatchEvent(new Event("change"));
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
  }
}
