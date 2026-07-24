import { createClient, supabaseAdmin } from "@/lib/supabase";

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data: appUser } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role")
      .eq("email", authUser.email)
      .single();

    if (!appUser) return null;

    return {
      userId: appUser.id,
      email: appUser.email,
      name: appUser.name,
      role: appUser.role,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
