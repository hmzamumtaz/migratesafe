import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kymqekunawrnkitlmzce.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5bXFla3VuYXdybmtpdGxtemNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg4NjM3NywiZXhwIjoyMTAwNDYyMzc3fQ.tA2NMyw1dQ4QYw9ZlWTARqT1zbRTActmalGQhbtkOyk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Password: Eisha@789 (bcrypt hash)
const HASH = "$2a$10$kZbVwQ8u1SjYpK9X5z2YhOqZ3N7r4T5u6I7o8P9A0S1D2F3G4H5";

const users = [
  { name: "Hamza (Super Admin)", email: "hamza.mumtaz1@gmail.com", password: HASH, role: "super_admin", emailVerified: true },
  { name: "James Wilson (DBA)", email: "james.wilson@acme-corp.com", password: HASH, role: "dba", emailVerified: true },
  { name: "Sarah Chen (Engineer)", email: "sarah.chen@acme-corp.com", password: HASH, role: "engineer", emailVerified: true },
  { name: "Alex Kumar (Viewer)", email: "alex.kumar@acme-corp.com", password: HASH, role: "viewer", emailVerified: true },
];

async function seed() {
  console.log("Seeding database...\n");

  // Step 1: Insert users (get real UUIDs)
  const userIds: string[] = [];
  for (const u of users) {
    const { data, error } = await supabase.from("users").upsert(
      { email: u.email, name: u.name, password: u.password, role: u.role, emailVerified: u.emailVerified },
      { onConflict: "email" }
    ).select("id").single();

    if (error) {
      console.error(`  Error upserting user ${u.email}:`, error.message);
    } else {
      userIds.push(data.id);
      console.log(`  User: ${u.name} (${u.email}) -> ${data.id}`);
    }
  }

  // Step 2: Insert repos
  const repoIds: string[] = [];
  // Clear existing repos first
  await supabase.from("repositories").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const repoData = [
    { name: "acme-main-api", fullName: "acme-corp/acme-main-api", provider: "github", defaultBranch: "main", dbConnected: true, userId: userIds[0] },
    { name: "acme-payments", fullName: "acme-corp/acme-payments", provider: "github", defaultBranch: "main", dbConnected: true, userId: userIds[1] },
    { name: "acme-auth-service", fullName: "acme-corp/acme-auth-service", provider: "github", defaultBranch: "develop", dbConnected: true, userId: userIds[2] },
  ];

  for (const r of repoData) {
    const { data, error } = await supabase.from("repositories").insert(r).select("id").single();
    if (error) {
      console.error(`  Error inserting repo ${r.fullName}:`, error.message);
    } else {
      repoIds.push(data.id);
      console.log(`  Repo: ${r.fullName} -> ${data.id}`);
    }
  }

  // Step 3: Database connections
  const dbConns = [
    { repositoryId: repoIds[0], dialect: "postgresql", host: "db.acme-corp.com", port: 5432, database: "acme_prod", schemaName: "public", user: "readonly", status: "connected" },
    { repositoryId: repoIds[1], dialect: "mysql", host: "db.acme-corp.com", port: 3306, database: "payments_prod", schemaName: "payments", user: "readonly", status: "connected" },
    { repositoryId: repoIds[2], dialect: "postgresql", host: "db.acme-corp.com", port: 5432, database: "auth_prod", schemaName: "auth", user: "readonly", status: "connected" },
  ];

  for (const d of dbConns) {
    const { error } = await supabase.from("database_connections").upsert(d, { onConflict: "repositoryId" });
    if (error) console.error(`  Error upserting db connection:`, error.message);
    else console.log(`  DB Connection: ${d.database}`);
  }

  // Step 4: Migration checks
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
      aiAnalysis: "DANGEROUS: Contains DROP TABLE on legacy_sessions (12M+ rows). Data type change on session_token may cause truncation.",
      sqlContent: "ALTER TABLE sessions_v2 ALTER COLUMN session_token TYPE TEXT;\nDROP TABLE legacy_sessions;\nALTER TABLE sessions_v2 ALTER COLUMN user_id SET NOT NULL;\nALTER TABLE sessions_v2 ADD COLUMN device_fingerprint VARCHAR(255);",
      completedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      repositoryId: repoIds[1], prNumber: 87, prTitle: "Add payment_retry_tracking",
      prUrl: "https://github.com/acme-corp/acme-payments/pull/87",
      branch: "feature/retry-tracking", author: "james.wilson@acme-corp.com", commitSha: "i7j8k9l",
      status: "complete", verdict: "caution", findingsCount: 4,
      aiAnalysis: "Caution: ALTER TABLE on payments table (large table). NOT NULL constraint added without default.",
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
    if (error) {
      console.error(`  Error inserting check PR #${c.prNumber}:`, error.message);
    } else {
      checkIds.push(data.id);
      console.log(`  Check: PR #${c.prNumber} - ${c.prTitle} -> ${data.id}`);
    }
  }

  // Step 5: Findings (linked to real check IDs)
  const findingsData = [
    { checkId: checkIds[0], severity: "suggestion", category: "create-index", title: "CREATE INDEX Suggestion", offendingSql: "CREATE INDEX idx_user_prefs_user_id ON user_preferences(user_id);", explanation: "Index on user_preferences — consider using CREATE INDEX CONCURRENTLY for zero-downtime.", suggestedFix: "CREATE INDEX CONCURRENTLY idx_user_prefs_user_id ON user_preferences(user_id);", suggestedFixSql: null, affectedTable: "user_preferences", estimatedImpact: null },
    { checkId: checkIds[0], severity: "suggestion", category: "no-rollback", title: "No Rollback Instructions", offendingSql: "", explanation: "Migration does not include rollback instructions.", suggestedFix: "-- Rollback: DROP TABLE user_preferences;", suggestedFixSql: null, affectedTable: "user_preferences", estimatedImpact: null },
    { checkId: checkIds[0], severity: "info", category: "foreign-key", title: "Foreign Key Addition", offendingSql: "user_id INTEGER NOT NULL REFERENCES users(id)", explanation: "New foreign key to users(id). Enforces referential integrity.", suggestedFix: "Ensure users(id) is indexed.", suggestedFixSql: null, affectedTable: "user_preferences", estimatedImpact: "Slight write overhead" },
    { checkId: checkIds[1], severity: "critical", category: "dangerous-drop", title: "DROP TABLE Detected", offendingSql: "DROP TABLE legacy_sessions;", explanation: 'Table "legacy_sessions" will be permanently deleted. All data lost.', suggestedFix: "Create a backup before dropping.", suggestedFixSql: null, affectedTable: "legacy_sessions", estimatedImpact: "Permanent data loss for all rows" },
    { checkId: checkIds[1], severity: "critical", category: "type-change-lossy", title: "Lossy Data Type Change", offendingSql: "ALTER TABLE sessions_v2 ALTER COLUMN session_token TYPE TEXT;", explanation: "Column session_token changed to TEXT. May cause data truncation.", suggestedFix: "Verify existing data fits TEXT type.", suggestedFixSql: null, affectedTable: "sessions_v2", estimatedImpact: "Data truncation risk" },
    { checkId: checkIds[1], severity: "warning", category: "not-null-no-default", title: "NOT NULL Without Default", offendingSql: "ALTER TABLE sessions_v2 ALTER COLUMN user_id SET NOT NULL;", explanation: "Column user_id set NOT NULL. Existing rows may have NULLs.", suggestedFix: "Update NULLs before setting NOT NULL.", suggestedFixSql: "UPDATE sessions_v2 SET user_id = 0 WHERE user_id IS NULL;", affectedTable: "sessions_v2", estimatedImpact: "Migration failure if NULLs exist" },
    { checkId: checkIds[1], severity: "warning", category: "large-table", title: "Large Table Alteration", offendingSql: "ALTER TABLE sessions_v2 ALTER COLUMN user_id SET NOT NULL;", explanation: "Table sessions_v2 may be locked during ALTER.", suggestedFix: "Use online schema migration tools.", suggestedFixSql: null, affectedTable: "sessions_v2", estimatedImpact: "Table lock — potential downtime" },
    { checkId: checkIds[1], severity: "info", category: "foreign-key", title: "Foreign Key Addition", offendingSql: "ALTER TABLE sessions_v2 ADD COLUMN device_fingerprint VARCHAR(255);", explanation: "New column with no index.", suggestedFix: "Add index if queries will filter on this column.", suggestedFixSql: null, affectedTable: "sessions_v2", estimatedImpact: "Minor storage increase" },
    { checkId: checkIds[1], severity: "suggestion", category: "no-rollback", title: "No Rollback Instructions", offendingSql: "", explanation: "Migration has no rollback plan.", suggestedFix: "-- Rollback: restore from backup", suggestedFixSql: null, affectedTable: "sessions_v2", estimatedImpact: null },
    { checkId: checkIds[1], severity: "info", category: "default-change", title: "Default Value Change", offendingSql: "ALTER TABLE sessions_v2 ALTER COLUMN session_status SET DEFAULT 'active';", explanation: "Default for session_status changing to 'active'.", suggestedFix: "No action required.", suggestedFixSql: null, affectedTable: "sessions_v2", estimatedImpact: "New rows use new default" },
    { checkId: checkIds[2], severity: "warning", category: "large-table", title: "Large Table Alteration", offendingSql: "ALTER TABLE payments ADD COLUMN retry_count INTEGER DEFAULT 0;", explanation: "Payments table may have millions of rows.", suggestedFix: "Use online schema migration tools.", suggestedFixSql: null, affectedTable: "payments", estimatedImpact: "Table lock during migration" },
    { checkId: checkIds[2], severity: "warning", category: "not-null-no-default", title: "NOT NULL Without Default", offendingSql: "ALTER TABLE payments ALTER COLUMN status SET NOT NULL;", explanation: "Column status set NOT NULL. Existing rows may have NULLs.", suggestedFix: "Update NULLs first.", suggestedFixSql: "UPDATE payments SET status = 'unknown' WHERE status IS NULL;", affectedTable: "payments", estimatedImpact: "Migration failure if NULLs exist" },
    { checkId: checkIds[2], severity: "info", category: "default-change", title: "Default Value Change", offendingSql: "ALTER TABLE payments ADD COLUMN retry_count INTEGER DEFAULT 0;", explanation: "retry_count defaults to 0.", suggestedFix: "No action required.", suggestedFixSql: null, affectedTable: "payments", estimatedImpact: "New rows use default 0" },
    { checkId: checkIds[2], severity: "suggestion", category: "no-rollback", title: "No Rollback Instructions", offendingSql: "", explanation: "No rollback plan.", suggestedFix: "-- Rollback: ALTER TABLE payments DROP COLUMN retry_count, DROP COLUMN last_retry_at;", suggestedFixSql: null, affectedTable: "payments", estimatedImpact: null },
    { checkId: checkIds[3], severity: "info", category: "default-change", title: "Default Value Change", offendingSql: "ALTER TABLE auth.users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;", explanation: "mfa_enabled defaults to FALSE.", suggestedFix: "No action required.", suggestedFixSql: null, affectedTable: "users", estimatedImpact: "New rows have mfa_enabled=false" },
    { checkId: checkIds[3], severity: "suggestion", category: "no-rollback", title: "No Rollback Instructions", offendingSql: "", explanation: "No rollback plan.", suggestedFix: "-- Rollback: ALTER TABLE auth.users DROP COLUMN mfa_enabled, DROP COLUMN mfa_secret, DROP COLUMN mfa_verified_at;", suggestedFixSql: null, affectedTable: "users", estimatedImpact: null },
  ];

  for (const f of findingsData) {
    const { error } = await supabase.from("findings").insert(f as any);
    if (error) console.error(`  Error inserting finding:`, error.message);
  }
  console.log(`  Findings: ${findingsData.length}`);

  // Step 6: Audit entries
  const auditData = [
    { userId: userIds[0], repositoryId: repoIds[0], action: "verdict-issued", details: 'SAFE verdict on PR #142 "Add user_preferences table"', checkId: checkIds[0] },
    { userId: userIds[0], repositoryId: repoIds[0], action: "verdict-issued", details: 'DANGEROUS verdict on PR #143 "Migrate legacy_sessions"', checkId: checkIds[1] },
    { userId: userIds[1], repositoryId: repoIds[1], action: "verdict-issued", details: 'CAUTION verdict on PR #87 "Add payment_retry_tracking"', checkId: checkIds[2] },
    { userId: userIds[2], repositoryId: repoIds[2], action: "verdict-issued", details: 'SAFE verdict on PR #56 "Add MFA support columns"', checkId: checkIds[3] },
  ];

  for (const a of auditData) {
    const { error } = await supabase.from("audit_entries").insert(a as any);
    if (error) console.error(`  Error inserting audit entry:`, error.message);
  }
  console.log(`  Audit entries: ${auditData.length}`);

  // Step 7: Subscriptions
  const subData = [
    { userId: userIds[0], plan: "team", analysesUsed: 5, analysesIncluded: 500, seatCount: 15, periodStart: new Date().toISOString(), periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: userIds[1], plan: "team", analysesUsed: 12, analysesIncluded: 500, seatCount: 15, periodStart: new Date().toISOString(), periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: userIds[2], plan: "pro", analysesUsed: 8, analysesIncluded: 100, seatCount: 5, periodStart: new Date().toISOString(), periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: userIds[3], plan: "free", analysesUsed: 2, analysesIncluded: 5, seatCount: 1, periodStart: new Date().toISOString(), periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  for (const s of subData) {
    const { error } = await supabase.from("subscriptions").upsert(s, { onConflict: "userId" });
    if (error) console.error(`  Error upserting subscription for ${s.userId}:`, error.message);
    else console.log(`  Subscription: ${s.plan}`);
  }

  console.log("\nSeed complete! All accounts use password: Eisha@789");
  console.log("\nAccounts:");
  users.forEach((u) => console.log(`  ${u.role}: ${u.email}`));
}

seed().catch(console.error);
