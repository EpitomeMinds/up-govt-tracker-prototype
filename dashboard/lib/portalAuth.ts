export const DEMO_EMAIL = "demo@epitome.com";
export const DEMO_PASSWORD = "Demo@123";

const SESSION_KEY = "portal-auth-session";

export interface PortalSession {
  email: string;
  name: string;
}

export function validatePortalLogin(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}

export function getPortalSession(): PortalSession | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortalSession;
  } catch {
    return null;
  }
}

export function isPortalAuthenticated(): boolean {
  return getPortalSession() !== null;
}

export function createPortalSession(): PortalSession {
  const session: PortalSession = {
    email: DEMO_EMAIL,
    name: "Demo Admin",
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearPortalSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function sessionInitials(session: PortalSession): string {
  const local = session.email.split("@")[0] ?? "";
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return session.name.slice(0, 2).toUpperCase();
}
