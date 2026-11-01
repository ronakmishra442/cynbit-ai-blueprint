"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, isAdmin, makeToken, passwordMatches } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";

const STATUSES = ["new", "contacted", "closed"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function login(formData: FormData) {
  if (!rateLimit("admin-login", 5, 60_000)) redirect("/admin?error=rate");

  const password = String(formData.get("password") ?? "");
  const token = makeToken();
  if (!token || !passwordMatches(password)) redirect("/admin?error=1");

  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 8,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).set(ADMIN_COOKIE, "", { path: "/admin", maxAge: 0 });
  redirect("/admin");
}

export async function updateStatus(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!UUID_RE.test(id) || !STATUSES.includes(status)) return;

  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) console.error("updateStatus failed:", error.message);
  revalidatePath("/admin");
}