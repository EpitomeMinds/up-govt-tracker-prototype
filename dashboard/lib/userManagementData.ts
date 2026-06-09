import { DEMO_EMAIL } from "./portalAuth";

export type UserRole = "Applicant" | "Dept Officer" | "Admin" | "Verifier";
export type UserStatus = "Active" | "Pending" | "Inactive";

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: UserRole;
  department: string;
  district: string;
  registered: string;
  lastActive: string;
  status: UserStatus;
}

export const PORTAL_USERS: PortalUser[] = [
  {
    id: "1",
    name: "Rahul Agarwal",
    email: "rahulagarwal92@gmail.com",
    initials: "RA",
    role: "Applicant",
    department: "—",
    district: "Lucknow",
    registered: "2026-05-12",
    lastActive: "2 min ago",
    status: "Active",
  },
  {
    id: "2",
    name: "Sunita Kumari",
    email: "sunitakumari.up@gmail.com",
    initials: "SK",
    role: "Dept Officer",
    department: "Health",
    district: "Kanpur",
    registered: "2025-11-20",
    lastActive: "1 hour ago",
    status: "Active",
  },
  {
    id: "3",
    name: "Vikram Patel",
    email: "vikrampatel.admin@gmail.com",
    initials: "VP",
    role: "Admin",
    department: "IT Cell",
    district: "Lucknow",
    registered: "2024-03-15",
    lastActive: "Just now",
    status: "Active",
  },
  {
    id: "8",
    name: "Demo Admin",
    email: DEMO_EMAIL,
    initials: "DA",
    role: "Admin",
    department: "IT Cell",
    district: "Lucknow",
    registered: "2024-01-01",
    lastActive: "Just now",
    status: "Active",
  },
  {
    id: "4",
    name: "Priya Sharma",
    email: "priyasharma.verifier@gmail.com",
    initials: "PS",
    role: "Verifier",
    department: "UPPSC",
    district: "Prayagraj",
    registered: "2026-01-08",
    lastActive: "3 days ago",
    status: "Pending",
  },
  {
    id: "5",
    name: "Amit Kumar",
    email: "amitkumar.jobs@gmail.com",
    initials: "AK",
    role: "Applicant",
    department: "—",
    district: "Agra",
    registered: "2026-06-01",
    lastActive: "Never",
    status: "Inactive",
  },
  {
    id: "6",
    name: "Sneha Rao",
    email: "sneharrao.education@gmail.com",
    initials: "SR",
    role: "Dept Officer",
    department: "Education",
    district: "Varanasi",
    registered: "2025-08-14",
    lastActive: "5 hours ago",
    status: "Active",
  },
  {
    id: "7",
    name: "Raj Singh",
    email: "rajsingh.meerut@gmail.com",
    initials: "RS",
    role: "Applicant",
    department: "—",
    district: "Meerut",
    registered: "2026-02-20",
    lastActive: "1 week ago",
    status: "Pending",
  },
];

export const USER_SUMMARY = {
  totalUsers: PORTAL_USERS.length,
  activeToday: PORTAL_USERS.filter((u) => u.status === "Active").length,
  newRegistrations: PORTAL_USERS.filter((u) => u.registered >= "2026-01-01").length,
  pendingVerification: PORTAL_USERS.filter((u) => u.status === "Pending").length,
};

export const ROLE_CHART_DATA = [
  { name: "Applicants", value: PORTAL_USERS.filter((u) => u.role === "Applicant").length, fill: "#2563eb" },
  { name: "Dept Officers", value: PORTAL_USERS.filter((u) => u.role === "Dept Officer").length, fill: "#8b5cf6" },
  { name: "Admins", value: PORTAL_USERS.filter((u) => u.role === "Admin").length, fill: "#ef4444" },
  { name: "Verifiers", value: PORTAL_USERS.filter((u) => u.role === "Verifier").length, fill: "#10b981" },
];

export const REGISTRATION_TREND = [
  { month: "Jan", count: 1 },
  { month: "Feb", count: 1 },
  { month: "Mar", count: 0 },
  { month: "Apr", count: 1 },
  { month: "May", count: 1 },
  { month: "Jun", count: 1 },
];

export const ROLE_BADGE: Record<UserRole, string> = {
  Applicant: "portal-user-role-applicant",
  "Dept Officer": "portal-user-role-officer",
  Admin: "portal-user-role-admin",
  Verifier: "portal-user-role-verifier",
};

export const STATUS_DOT: Record<UserStatus, string> = {
  Active: "bg-emerald-500",
  Pending: "bg-amber-400",
  Inactive: "bg-red-500",
};
