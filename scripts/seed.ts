import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kymqekunawrnkitlmzce.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5bXFla3VuYXdybmtpdGxtemNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg4NjM3NywiZXhwIjoyMTAwNDYyMzc3fQ.tA2NMyw1dQ4QYw9ZlWTARqT1zbRTActmalGQhbtkOyk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const PASSWORD = "Hamza@789";

const accounts = [
  { name: "Hamza Mumtaz", email: "hamza.mumtaz1@gmail.com", role: "super_admin", plan: "team" as const },
  { name: "James Wilson", email: "james.wilson@acme-corp.com", role: "dba", plan: "team" as const },
  { name: "Sarah Chen", email: "sarah.chen@acme-corp.com", role: "engineer", plan: "pro" as const },
  { name: "Alex Kumar", email: "alex.kumar@acme-corp.com", role: "viewer", plan: "free" as const },
];

async function seed() {
  console.log("Setting up MigrateSafe demo accounts...\n");

  // Step 1: Create users in Supabase Auth
  console.log("Creating Supabase Auth users...");
  for (const a of accounts) {
    const { data: existingAuth } = await supabase.auth.admin.listUsers();
    const authUser = existingAuth?.users?.find((u) => u.email === a.email);

    if (authUser) {
      console.log(`  Auth user already exists: ${a.email}`);
      // Update password
      await supabase.auth.admin.updateUserById(authUser.id, { password: PASSWORD });
      console.log(`  Updated password for: ${a.email}`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: a.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: a.name, role: a.role },
      });
      if (error) {
        console.error(`  Error creating auth user ${a.email}:`, error.message);
      } else {
        console.log(`  Created auth user: ${a.email} (${data.user.id})`);
      }
    }
  }

  // Step 2: Get auth user IDs
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUserMap = new Map<string, string>();
  authUsers?.users?.forEach((u) => {
    if (u.email) authUserMap.set(u.email, u.id);
  });

  // Step 3: Delete old custom users first
  console.log("\nClearing old custom users...");
  await supabase.from("subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("findings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("audit_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("migration_checks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("database_connections").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("repositories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("  Cleared.");

  // Step 4: Insert custom users
  console.log("\nCreating custom users...");
  const customUserIds: string[] = [];
  for (const a of accounts) {
    const authId = authUserMap.get(a.email);
    if (!authId) {
      console.error(`  No auth user found for ${a.email}`);
      continue;
    }

    const { data, error } = await supabase.from("users").upsert({
      id: authId,
      email: a.email,
      name: a.name,
      password: "",
      role: a.role,
      emailVerified: true,
    }, { onConflict: "id" }).select("id").single();

    if (error) {
      console.error(`  Error creating user ${a.email}:`, error.message);
    } else {
      customUserIds.push(data.id);
      console.log(`  Custom user: ${a.name} (${a.email}) -> ${data.id}`);
    }
  }

  // Step 5: Create repos
  console.log("\nCreating repositories...");
  const repoIds: string[] = [];
  const repoData = [
    { name: "acme-main-api", fullName: "acme-corp/acme-main-api", provider: "github", defaultBranch: "main", dbConnected: true, userId: customUserIds[0] },
    { name: "acme-payments", fullName: "acme-corp/acme-payments", provider: "github", defaultBranch: "main", dbConnected: true, userId: customUserIds[1] },
    { name: "acme-auth-service", fullName: "acme-corp/acme-auth-service", provider: "github", defaultBranch: "develop", dbConnected: true, userId: customUserIds[2] },
  ];

  for (const r of repoData) {
    const { data, error } = await supabase.from("repositories").insert(r).select("id").single();
    if (error) console.error(`  Error: ${error.message}`);
    else { repoIds.push(data.id); console.log(`  Repo: ${r.fullName}`); }
  }

  // Step 6: DB connections
  console.log("\nCreating database connections...");
  const dbConns = [
    { repositoryId: repoIds[0], dialect: "postgresql", host: "db.acme-corp.com", port: 5432, database: "acme_prod", schemaName: "public", user: "readonly", status: "connected" },
    { repositoryId: repoIds[1], dialect: "mysql", host: "db.acme-corp.com", port: 3306, database: "payments_prod", schemaName: "payments", user: "readonly", status: "connected" },
    { repositoryId: repoIds[2], dialect: "postgresql", host: "db.acme-corp.com", port: 5432, database: "auth_prod", schemaName: "auth", user: "readonly", status: "connected" },
  ];

  for (const d of dbConns) {
    const { error } = await supabase.from("database_connections").insert(d);
    if (error) console.error(`  Error: ${error.message}`);
    else console.log(`  DB: ${d.database}`);
  }

  // Step 7: Migration checks
  console.log("\nCreating migration checks...");
  const checkData = [
    {
      repositoryId: repoIds[0], prNumber: 142, prTitle: "Add user_preferences table",
      prUrl: "https://github.com/acme-corp/acme-main-api/pull/142",
      branch: "feature/user-prefs", author: "sarah.chen@acme-corp.com", commitSha: "a1b2c3d",
      status: "complete", verdict: "safe", findingsCount: 3,
      aiAnalysis: "Safe migration. Creates a new table with proper constraints and indexes.",
      sqlContent: "CREATE TABLE user_preferences (\n  id SERIAL PRIMARY KEY,\n  user_id INTEGER NOT NULL REFERENCES users(id),\n  theme VARCHAR(20) DEFAULT 'light',\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\nCREATE INDEX idx_user_prefs_user_id ON user_preferences(user_id);",
      completedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      repositoryId: repoIds[0], prNumber: 143, prTitle: "Migrate legacy_sessions to sessions_v2",
      prUrl: "https://github.com/acme-corp/acme-main-api/pull/143",
      branch: "migration/sessions-v2", author: "james.wilson@acme-corp.com", commitSha: "e4f5g6h",
      status: "complete", verdict: "dangerous", findingsCount: 7,
      aiAnalysis: "DANGEROUS: Contains DROP TABLE on legacy_sessions (12M+ rows).",
      sqlContent: "ALTER TABLE sessions_v2 ALTER COLUMN session_token TYPE TEXT;\nDROP TABLE legacy_sessions;\nALTER TABLE sessions_v2 ALTER COLUMN user_id SET NOT NULL;\nALTER TABLE sessions_v2 ADD COLUMN device_fingerprint VARCHAR(255);",
      completedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      repositoryId: repoIds[1], prNumber: 87, prTitle: "Add payment_retry_tracking",
      prUrl: "https://github.com/acme-corp/acme-payments/pull/87",
      branch: "feature/retry-tracking", author: "james.wilson@acme-corp.com", commitSha: "i7j8k9l",
      status: "complete", verdict: "caution", findingsCount: 4,
      aiAnalysis: "Caution: ALTER TABLE on payments table (large table).",
      sqlContent: "ALTER TABLE payments ADD COLUMN retry_count INTEGER DEFAULT 0;\nALTER TABLE payments ADD COLUMN last_retry_at TIMESTAMP;\nALTER TABLE payments ALTER COLUMN status SET NOT NULL;\nCREATE INDEX idx_payments_retry ON payments(retry_count) WHERE retry_count > 0;",
      completedAt: new Date(Date.now() - 900000).toISOString(),
    },
    {
      repositoryId: repoIds[2], prNumber: 56, prTitle: "Add MFA support columns",
      prUrl: "https://github.com/acme-corp/acme-auth-service/pull/56",
      branch: "feature/mfa", author: "sarah.chen@acme-corp.com", commitSha: "m0n1o2p",
      status: "complete", verdict: "safe", findingsCount: 2,
      aiAnalysis: "Safe migration. Adds new columns with sensible defaults.",
      sqlContent: "ALTER TABLE auth.users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;\nALTER TABLE auth.users ADD COLUMN mfa_secret VARCHAR(255);\nALTER TABLE auth.users ADD COLUMN mfa_verified_at TIMESTAMP;",
      completedAt: new Date(Date.now() - 450000).toISOString(),
    },
    {
      repositoryId: repoIds[1], prNumber: 88, prTitle: "Refactor order_items table",
      prUrl: "https://github.com/acme-corp/acme-payments/pull/88",
      branch: "refactor/order-items", author: "alex.kumar@acme-corp.com", commitSha: "q3r4s5t",
      status: "queued", verdict: "", findingsCount: 0,
      aiAnalysis: "",
      sqlContent: "ALTER TABLE order_items DROP COLUMN legacy_price;\nALTER TABLE order_items ADD COLUMN price_cents INTEGER NOT NULL;\nALTER TABLE order_items ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';",
      completedAt: null,
    },
  ];

  const checkIds: string[] = [];
  for (const c of checkData) {
    const { data, error } = await supabase.from("migration_checks").insert(c as any).select("id").single();
    if (error) console.error(`  Error: ${error.message}`);
    else { checkIds.push(data.id); console.log(`  Check: PR #${c.prNumber} - ${c.prTitle}`); }
  }

  // Step 8: Findings
  console.log("\nCreating findings...");
  const findingsData = [
    { checkId: checkIds[0], severity: "suggestion", category: "create-index", title: "CREATE INDEX Suggestion", offendingSql: "CREATE INDEX idx_user_prefs_user_id ON user_preferences(user_id);", explanation: "Consider using CREATE INDEX CONCURRENTLY for zero-downtime.", suggestedFix: "CREATE INDEX CONCURRENTLY idx_user_prefs_user_id ON user_preferences(user_id);", suggestedFixSql: null, affectedTable: "user_preferences", estimatedImpact: null },
    { checkId: checkIds[0], severity: "suggestion", category: "no-rollback", title: "No Rollback Instructions", offendingSql: "", explanation: "Migration has no rollback plan.", suggestedFix: "-- Rollback: DROP TABLE user_preferences;", suggestedFixSql: null, affectedTable: "user_preferences", estimatedImpact: null },
    { checkId: checkIds[0], severity: "info", category: "foreign-key", title: "Foreign Key Addition", offendingSql: "user_id INTEGER NOT NULL REFERENCES users(id)", explanation: "New foreign key to users(id).", suggestedFix: "Ensure users(id) is indexed.", suggestedFixSql: null, affectedTable: "user_preferences", estimatedImpact: "Slight write overhead" },
    { checkId: checkIds[1], severity: "critical", category: "dangerous-drop", title: "DROP TABLE Detected", offendingSql: "DROP TABLE legacy_sessions;", explanation: 'Table "legacy_sessions" will be permanently deleted.', suggestedFix: "Create a backup before dropping.", suggestedFixSql: null, affectedTable: "legacy_sessions", estimatedImpact: "Permanent data loss" },
    { checkId: checkIds[1], severity: "critical", category: "type-change-lossy", title: "Lossy Data Type Change", offendingSql: "ALTER TABLE sessions_v2 ALTER COLUMN session_token TYPE TEXT;", explanation: "Column session_token changed to TEXT. May cause truncation.", suggestedFix: "Verify existing data fits TEXT type.", suggestedFixSql: null, affectedTable: "sessions_v2", estimatedImpact: "Data truncation risk" },
    { checkId: checkIds[1], severity: "warning", category: "not-null-no-default", title: "NOT NULL Without Default", offendingSql: "ALTER TABLE sessions_v2 ALTER COLUMN user_id SET NOT NULL;", explanation: "Column user_id set NOT NULL. Existing rows may have NULLs.", suggestedFix: "Update NULLs first.", suggestedFixSql: "UPDATE sessions_v2 SET user_id = 0 WHERE user_id IS NULL;", affectedTable: "sessions_v2", estimatedImpact: "Migration failure if NULLs exist" },
    { checkId: checkIds[1], severity: "warning", category: "large-table", title: "Large Table Alteration", offendingSql: "ALTER TABLE sessions_v2 ALTER COLUMN user_id SET NOT NULL;", explanation: "Table may be locked during ALTER.", suggestedFix: "Use online schema migration tools.", suggestedFixSql: null, affectedTable: "sessions_v2", estimatedImpact: "Table lock — potential downtime" },
    { checkId: checkIds[1], severity: "info", category: "foreign-key", title: "Foreign Key Addition", offendingSql: "ALTER TABLE sessions_v2 ADD COLUMN device_fingerprint VARCHAR(255);", explanation: "New column with no index.", suggestedFix: "Add index if queries filter on this column.", suggestedFixSql: null, affectedTable: "sessions_v2", estimatedImpact: "Minor storage increase" },
    { checkId: checkIds[1], severity: "suggestion", category: "no-rollback", title: "No Rollback Instructions", offendingSql: "", explanation: "No rollback plan.", suggestedFix: "-- Rollback: restore from backup", suggestedFixSql: null, affectedTable: "sessions_v2", estimatedImpact: null },
    { checkId: checkIds[1], severity: "info", category: "default-change", title: "Default Value Change", offendingSql: "ALTER TABLE sessions_v2 ALTER COLUMN session_status SET DEFAULT 'active';", explanation: "Default for session_status changing to 'active'.", suggestedFix: "No action required.", suggestedFixSql: null, affectedTable: "sessions_v2", estimatedImpact: "New rows use new default" },
    { checkId: checkIds[2], severity: "warning", category: "large-table", title: "Large Table Alteration", offendingSql: "ALTER TABLE payments ADD COLUMN retry_count INTEGER DEFAULT 0;", explanation: "Payments table may have millions of rows.", suggestedFix: "Use online schema migration tools.", suggestedFixSql: null, affectedTable: "payments", estimatedImpact: "Table lock during migration" },
    { checkId: checkIds[2], severity: "warning", category: "not-null-no-default", title: "NOT NULL Without Default", offendingSql: "ALTER TABLE payments ALTER COLUMN status SET NOT NULL;", explanation: "Column status set NOT NULL.", suggestedFix: "Update NULLs first.", suggestedFixSql: "UPDATE payments SET status = 'unknown' WHERE status IS NULL;", affectedTable: "payments", estimatedImpact: "Migration failure if NULLs exist" },
    { checkId: checkIds[2], severity: "info", category: "default-change", title: "Default Value Change", offendingSql: "ALTER TABLE payments ADD COLUMN retry_count INTEGER DEFAULT 0;", explanation: "retry_count defaults to 0.", suggestedFix: "No action required.", suggestedFixSql: null, affectedTable: "payments", estimatedImpact: "New rows use default 0" },
    { checkId: checkIds[2], severity: "suggestion", category: "no-rollback", title: "No Rollback Instructions", offendingSql: "", explanation: "No rollback plan.", suggestedFix: "-- Rollback: DROP COLUMN retry_count, last_retry_at;", suggestedFixSql: null, affectedTable: "payments", estimatedImpact: null },
    { checkId: checkIds[3], severity: "info", category: "default-change", title: "Default Value Change", offendingSql: "ALTER TABLE auth.users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;", explanation: "mfa_enabled defaults to FALSE.", suggestedFix: "No action required.", suggestedFixSql: null, affectedTable: "users", estimatedImpact: "New rows have mfa_enabled=false" },
    { checkId: checkIds[3], severity: "suggestion", category: "no-rollback", title: "No Rollback Instructions", offendingSql: "", explanation: "No rollback plan.", suggestedFix: "-- Rollback: DROP COLUMN mfa_enabled, mfa_secret, mfa_verified_at;", suggestedFixSql: null, affectedTable: "users", estimatedImpact: null },
  ];

  for (const f of findingsData) {
    const { error } = await supabase.from("findings").insert(f as any);
    if (error) console.error(`  Error: ${error.message}`);
  }
  console.log(`  ${findingsData.length} findings`);

  // Step 9: Audit entries
  console.log("\nCreating audit entries...");
  const auditData = [
    { userId: customUserIds[0], repositoryId: repoIds[0], action: "verdict-issued", details: 'SAFE verdict on PR #142 "Add user_preferences table"', checkId: checkIds[0] },
    { userId: customUserIds[0], repositoryId: repoIds[0], action: "verdict-issued", details: 'DANGEROUS verdict on PR #143 "Migrate legacy_sessions"', checkId: checkIds[1] },
    { userId: customUserIds[1], repositoryId: repoIds[1], action: "verdict-issued", details: 'CAUTION verdict on PR #87 "Add payment_retry_tracking"', checkId: checkIds[2] },
    { userId: customUserIds[2], repositoryId: repoIds[2], action: "verdict-issued", details: 'SAFE verdict on PR #56 "Add MFA support columns"', checkId: checkIds[3] },
  ];

  for (const a of auditData) {
    const { error } = await supabase.from("audit_entries").insert(a);
    if (error) console.error(`  Error: ${error.message}`);
  }
  console.log(`  ${auditData.length} audit entries`);

  // Step 10: Subscriptions
  console.log("\nCreating subscriptions...");
  const subData = [
    { userId: customUserIds[0], plan: "team", analysesUsed: 5, analysesIncluded: 500, seatCount: 15, periodStart: new Date().toISOString(), periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: customUserIds[1], plan: "team", analysesUsed: 12, analysesIncluded: 500, seatCount: 15, periodStart: new Date().toISOString(), periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: customUserIds[2], plan: "pro", analysesUsed: 8, analysesIncluded: 100, seatCount: 5, periodStart: new Date().toISOString(), periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: customUserIds[3], plan: "free", analysesUsed: 2, analysesIncluded: 5, seatCount: 1, periodStart: new Date().toISOString(), periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  for (const s of subData) {
    const { error } = await supabase.from("subscriptions").upsert(s as any, { onConflict: "userId" });
    if (error) console.error(`  Error: ${error.message}`);
  }
  console.log(`  ${subData.length} subscriptions`);

  console.log("\n========================================");
  console.log("Seed complete!");
  console.log("========================================\n");
  console.log("Demo accounts (password: Hamza@789):");
  for (const a of accounts) {
    console.log(`  ${a.role}: ${a.email}`);
  }
}

seed().catch(console.error);
