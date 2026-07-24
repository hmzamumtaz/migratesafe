import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kymqekunawrnkitlmzce.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5bXFla3VuYXdybmtpdGxtemNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg4NjM3NywiZXhwIjoyMTAwNDYyMzc3fQ.tA2NMyw1dQ4QYw9ZlWTARqT1zbRTActmalGQhbtkOyk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SUPER_ADMIN = {
  name: "Hamza Mumtaz",
  email: "hamza.mumtaz1@gmail.com",
  password: "Hamza@789",
  role: "super_admin" as const,
};

async function seed() {
  console.log("Clearing all existing data...");

  await supabase.from("findings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("audit_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("migration_checks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("database_connections").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("repositories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("  Cleared all custom data.");

  const { data: existingAuth } = await supabase.auth.admin.listUsers();
  for (const u of existingAuth?.users || []) {
    await supabase.auth.admin.deleteUser(u.id);
  }
  console.log("  Cleared all auth users.");

  console.log("\nCreating super admin account...");
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: SUPER_ADMIN.email,
    password: SUPER_ADMIN.password,
    email_confirm: true,
    user_metadata: { name: SUPER_ADMIN.name, role: SUPER_ADMIN.role },
  });

  if (authError) {
    console.error("  Error creating auth user:", authError.message);
    return;
  }

  console.log(`  Auth user created: ${SUPER_ADMIN.email} (${authData.user.id})`);

  const { error: customError } = await supabase.from("users").insert({
    id: authData.user.id,
    email: SUPER_ADMIN.email,
    name: SUPER_ADMIN.name,
    password: "",
    role: SUPER_ADMIN.role,
    emailVerified: true,
  });

  if (customError) {
    console.error("  Error creating custom user:", customError.message);
    return;
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  await supabase.from("subscriptions").insert({
    userId: authData.user.id,
    plan: "team",
    analysesIncluded: 500,
    periodEnd: periodEnd.toISOString(),
  });

  console.log(`  Custom user + subscription created.`);

  console.log("\n========================================");
  console.log("Seed complete!");
  console.log("========================================\n");
  console.log("Super admin account:");
  console.log(`  Email:    ${SUPER_ADMIN.email}`);
  console.log(`  Password: ${SUPER_ADMIN.password}`);
  console.log(`  Role:     ${SUPER_ADMIN.role}`);
}

seed().catch(console.error);
