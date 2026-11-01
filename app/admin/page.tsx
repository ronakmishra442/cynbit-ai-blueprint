import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { login, logout, updateStatus } from "./actions";

export const metadata: Metadata = {
  title: "Leads | Cynbit Admin",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Lead = {
  id: string;
  created_at: string;
  service: string;
  industry: string | null;
  budget: string;
  timeline: string;
  name: string;
  email: string;
  company: string | null;
  description: string;
  brief: string;
  brief_source: string;
  status: string;
  priority: string | null;
  priority_reason: string | null;
};

const PRIORITY_STYLE: Record<string, string> = {
  hot: "bg-red-100 text-red-700",
  warm: "bg-amber-100 text-amber-800",
  cold: "bg-sky-100 text-sky-700",
  unscored: "bg-slate-100 text-slate-600",
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function filterHref(priority?: string, status?: string) {
  const q = new URLSearchParams();
  if (priority) q.set("priority", priority);
  if (status) q.set("status", status);
  const s = q.toString();
  return s ? `/admin?${s}` : "/admin";
}

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm ${
    active
      ? "border-teal-800 bg-teal-800 text-white"
      : "border-slate-300 bg-white text-slate-700 hover:border-teal-700"
  }`;

export default function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <Suspense fallback={<p className="text-center text-slate-500">Loading…</p>}>
        <AdminContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function LoginForm({ error }: { error?: string }) {
  const message =
    error === "rate"
      ? "Too many attempts. Please wait a minute."
      : error
        ? "Incorrect password."
        : null;

  return (
    <form action={login} className="mx-auto max-w-sm rounded-2xl bg-white p-6 shadow">
      <h1 className="text-xl font-semibold text-slate-900">Cynbit Leads</h1>
      <p className="mt-1 text-sm text-slate-600">Enter the admin password to continue.</p>
      <input
        type="password"
        name="password"
        required
        autoFocus
        autoComplete="current-password"
        className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-700 focus:outline-none"
      />
      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
      <button type="submit" className="mt-4 w-full rounded-full bg-teal-800 py-2 text-white">
        Sign in
      </button>
    </form>
  );
}

async function AdminContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  if (!(await isAdmin())) {
    return <LoginForm error={first(sp.error)} />;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return <p className="text-center text-red-600">Database is not configured.</p>;
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return <p className="text-center text-red-600">Could not load leads: {error.message}</p>;
  }

  const all = (data ?? []) as Lead[];
  const priority = first(sp.priority);
  const status = first(sp.status);

  const rows = all.filter(
    (l) =>
      (!priority || (l.priority ?? "unscored") === priority) &&
      (!status || l.status === status)
  );

  const count = (f: (l: Lead) => boolean) => all.filter(f).length;
  const stats = [
    { label: "Total", value: all.length },
    { label: "Hot", value: count((l) => l.priority === "hot") },
    { label: "Warm", value: count((l) => l.priority === "warm") },
    { label: "Cold", value: count((l) => l.priority === "cold") },
    { label: "New", value: count((l) => l.status === "new") },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
        <form action={logout}>
          <button type="submit" className="text-sm text-slate-600 underline">
            Log out
          </button>
        </form>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Priority:</span>
        <Link href={filterHref(undefined, status)} className={chip(!priority)}>All</Link>
        {["hot", "warm", "cold", "unscored"].map((p) => (
          <Link key={p} href={filterHref(p, status)} className={chip(priority === p)}>
            {p}
          </Link>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Status:</span>
        <Link href={filterHref(priority, undefined)} className={chip(!status)}>All</Link>
        {["new", "contacted", "closed"].map((s) => (
          <Link key={s} href={filterHref(priority, s)} className={chip(status === s)}>
            {s}
          </Link>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {rows.length === 0 && (
          <li className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">
            No leads match these filters.
          </li>
        )}
        {rows.map((l) => {
          const pr = l.priority ?? "unscored";
          return (
            <li key={l.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                        PRIORITY_STYLE[pr] ?? PRIORITY_STYLE.unscored
                      }`}
                    >
                      {pr}
                    </span>
                    <span className="font-medium text-slate-900">{l.name}</span>
                    {l.company && <span className="text-slate-500">· {l.company}</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {l.service} · {l.budget} · {l.timeline}
                  </p>
                  <p className="text-sm text-slate-500">
                    <a href={`mailto:${l.email}`} className="underline">{l.email}</a>
                    {" · "}
                    {formatDate(l.created_at)} IST
                  </p>
                </div>

                <form action={updateStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={l.id} />
                  <select
                    name="status"
                    defaultValue={l.status}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="new">new</option>
                    <option value="contacted">contacted</option>
                    <option value="closed">closed</option>
                  </select>
                  <button type="submit" className="rounded-full bg-teal-800 px-3 py-1 text-sm text-white">
                    Save
                  </button>
                </form>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-teal-800">
                  View inquiry and brief
                </summary>
                <div className="mt-2 space-y-3 text-sm text-slate-700">
                  {l.priority_reason && (
                    <p><span className="font-medium">Why this priority:</span> {l.priority_reason}</p>
                  )}
                  {l.industry && (
                    <p><span className="font-medium">Industry:</span> {l.industry}</p>
                  )}
                  <p className="whitespace-pre-wrap">
                    <span className="font-medium">Request:</span> {l.description}
                  </p>
                  <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{l.brief}</p>
                  <p className="text-xs text-slate-400">Brief source: {l.brief_source}</p>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}