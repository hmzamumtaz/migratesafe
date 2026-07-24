// ============================================================================
// MigrateSafe API Client — Typed interface + Mock implementation
// ============================================================================
// REST endpoints (implemented by backend team):
//
// POST   /api/v1/repositories/connect          → connectRepository
// GET    /api/v1/repositories                   → listRepositories
// POST   /api/v1/repositories/:id/database     → connectDatabase
// GET    /api/v1/repositories/:id/checks        → listMigrationChecks
// GET    /api/v1/checks/:checkId               → getMigrationCheck
// GET    /api/v1/checks/:checkId/risk-report   → getRiskReport
// GET    /api/v1/checks/:checkId/rollout-plan   → getSafeRolloutPlan
// GET    /api/v1/checks/:checkId/rollback       → getRollbackScript
// POST   /api/v1/checks/:checkId/override       → overrideVerdict
// GET    /api/v1/repositories/:id/audit-log     → getAuditLog
// GET    /api/v1/usage                          → getUsage
// GET    /api/v1/subscription                   → getSubscription

// ── Domain Types ────────────────────────────────────────────────────────────

export type Provider = "github" | "gitlab";
export type Dialect = "postgres" | "mysql";
export type Verdict = "safe" | "caution" | "dangerous";
export type CheckStatus = "queued" | "analyzing" | "complete";
export type Severity = "info" | "warning" | "critical";
export type FindingCategory =
  | "breaking-change"
  | "lock-risk"
  | "data-loss"
  | "performance";
export type UserRole = "admin" | "member" | "viewer";
export type PlanTier = "free" | "pro" | "team" | "enterprise";

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  provider: Provider;
  defaultBranch: string;
  dbConnected: boolean;
  checksEnabled: boolean;
  lastCheckAt: string | null;
  openPrCount: number;
}

export interface DatabaseConnection {
  id: string;
  repositoryId: string;
  dialect: Dialect;
  host: string;
  port: number;
  database: string;
  schema: string;
  status: "connected" | "error" | "testing";
  schemaSnapshotAt: string | null;
  tableCount: number;
  totalSizeBytes: number;
}

export interface MigrationCheck {
  id: string;
  repositoryId: string;
  prTitle: string;
  prNumber: number;
  prUrl: string;
  branch: string;
  author: string;
  authorAvatar: string;
  commitSha: string;
  status: CheckStatus;
  verdict: Verdict | null;
  findingsCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface Finding {
  id: string;
  severity: Severity;
  category: FindingCategory;
  title: string;
  offendingSql: string;
  explanation: string;
  suggestedFix: string;
  suggestedFixSql: string | null;
  affectedTable: string;
  estimatedImpact: string | null;
}

export interface RiskReport {
  checkId: string;
  verdict: Verdict;
  summary: string;
  findings: Finding[];
  analyzedAt: string;
  analysisTimeMs: number;
}

export interface RolloutStep {
  order: number;
  title: string;
  description: string;
  sql: string;
  whySafe: string;
}

export interface RolloutPlan {
  checkId: string;
  steps: RolloutStep[];
  estimatedDowntime: string;
  estimatedTotalTime: string;
}

export interface RollbackScript {
  checkId: string;
  sql: string;
  destructiveWarning: string | null;
  reversible: boolean;
  notes: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorAvatar: string;
  action: string;
  details: string;
  checkId?: string;
  repositoryName?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  joinedAt: string;
}

export interface UsageData {
  plan: PlanTier;
  analysesUsed: number;
  analysesIncluded: number;
  periodStart: string;
  periodEnd: string;
  overageRate: number;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  description: string;
}

export interface Subscription {
  plan: PlanTier;
  seatCount: number;
  monthlyPrice: number;
  nextBillingDate: string;
  paymentMethod: { brand: string; last4: string; expMonth: number; expYear: number } | null;
  invoices: Invoice[];
}

export interface PlatformStats {
  totalAccounts: number;
  totalRepos: number;
  totalChecksRun: number;
  dangerousCaughtRate: number;
  aiCostThisMonth: number;
  revenueThisMonth: number;
  avgAnalysisTimeMs: number;
}

// ── API Interface ───────────────────────────────────────────────────────────

export interface MigrateSafeAPI {
  connectRepository(provider: Provider, repoUrl: string): Promise<Repository>;
  listRepositories(): Promise<Repository[]>;
  connectDatabase(repoId: string, config: { dialect: Dialect; host: string; port: number; database: string; user: string; password: string; schema?: string }): Promise<DatabaseConnection>;
  listMigrationChecks(repoId: string): Promise<MigrationCheck[]>;
  getMigrationCheck(checkId: string): Promise<MigrationCheck>;
  getRiskReport(checkId: string): Promise<RiskReport>;
  getSafeRolloutPlan(checkId: string): Promise<RolloutPlan>;
  getRollbackScript(checkId: string): Promise<RollbackScript>;
  overrideVerdict(checkId: string, reason: string): Promise<void>;
  getAuditLog(repoId: string): Promise<AuditEntry[]>;
  getUsage(): Promise<UsageData>;
  getSubscription(): Promise<Subscription>;
  getTeamMembers(): Promise<TeamMember[]>;
  getPlatformStats(): Promise<PlatformStats>;
}

// ── Mock Implementation ─────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_REPOSITORIES: Repository[] = [
  {
    id: "repo-1",
    name: "acme-api",
    fullName: "acme-corp/acme-api",
    provider: "github",
    defaultBranch: "main",
    dbConnected: true,
    checksEnabled: true,
    lastCheckAt: "2026-07-24T09:12:00Z",
    openPrCount: 3,
  },
  {
    id: "repo-2",
    name: "acme-web",
    fullName: "acme-corp/acme-web",
    provider: "github",
    defaultBranch: "main",
    dbConnected: true,
    checksEnabled: true,
    lastCheckAt: "2026-07-23T16:45:00Z",
    openPrCount: 1,
  },
  {
    id: "repo-3",
    name: "billing-service",
    fullName: "acme-corp/billing-service",
    provider: "gitlab",
    defaultBranch: "master",
    dbConnected: false,
    checksEnabled: false,
    lastCheckAt: null,
    openPrCount: 0,
  },
];

const MOCK_CHECKS: MigrationCheck[] = [
  {
    id: "chk-1",
    repositoryId: "repo-1",
    prTitle: "Add NOT NULL column to orders without default",
    prNumber: 482,
    prUrl: "https://github.com/acme-corp/acme-api/pull/482",
    branch: "feat/add-order-status",
    author: "sarah.chen",
    authorAvatar: "",
    commitSha: "a3f7b2c",
    status: "complete",
    verdict: "dangerous",
    findingsCount: 3,
    createdAt: "2026-07-24T09:05:00Z",
    completedAt: "2026-07-24T09:12:00Z",
  },
  {
    id: "chk-2",
    repositoryId: "repo-1",
    prTitle: "Create index on payment_intents.created_at",
    prNumber: 481,
    prUrl: "https://github.com/acme-corp/acme-api/pull/481",
    branch: "perf/payment-index",
    author: "jordan.patel",
    authorAvatar: "",
    commitSha: "e9d1f4a",
    status: "complete",
    verdict: "caution",
    findingsCount: 1,
    createdAt: "2026-07-24T08:30:00Z",
    completedAt: "2026-07-24T08:34:00Z",
  },
  {
    id: "chk-3",
    repositoryId: "repo-1",
    prTitle: "Add nullable email_verified_at to users",
    prNumber: 480,
    prUrl: "https://github.com/acme-corp/acme-api/pull/480",
    branch: "feat/email-verification",
    author: "sarah.chen",
    authorAvatar: "",
    commitSha: "c4b8e1d",
    status: "complete",
    verdict: "safe",
    findingsCount: 0,
    createdAt: "2026-07-24T07:15:00Z",
    completedAt: "2026-07-24T07:16:00Z",
  },
  {
    id: "chk-4",
    repositoryId: "repo-1",
    prTitle: "Drop legacy sessions table",
    prNumber: 479,
    prUrl: "https://github.com/acme-corp/acme-api/pull/479",
    branch: "chore/cleanup-sessions",
    author: "alex.rivera",
    authorAvatar: "",
    commitSha: "f2a9c3e",
    status: "complete",
    verdict: "dangerous",
    findingsCount: 2,
    createdAt: "2026-07-23T14:20:00Z",
    completedAt: "2026-07-23T14:25:00Z",
  },
  {
    id: "chk-5",
    repositoryId: "repo-2",
    prTitle: "Add user_preferences JSONB column",
    prNumber: 112,
    prUrl: "https://github.com/acme-corp/acme-web/pull/112",
    branch: "feat/user-prefs",
    author: "jordan.patel",
    authorAvatar: "",
    commitSha: "d7e2b5a",
    status: "analyzing",
    verdict: null,
    findingsCount: 1,
    createdAt: "2026-07-24T10:00:00Z",
    completedAt: null,
  },
  {
    id: "chk-6",
    repositoryId: "repo-2",
    prTitle: "Rename column users.name to users.full_name",
    prNumber: 111,
    prUrl: "https://github.com/acme-corp/acme-web/pull/111",
    branch: "refactor/rename-name",
    author: "alex.rivera",
    authorAvatar: "",
    commitSha: "b1c4d8e",
    status: "queued",
    verdict: null,
    findingsCount: 0,
    createdAt: "2026-07-24T10:05:00Z",
    completedAt: null,
  },
];

const MOCK_RISK_REPORT: RiskReport = {
  checkId: "chk-1",
  verdict: "dangerous",
  summary:
    "This migration adds a NOT NULL column to orders (4.2M rows) without a default value. It will acquire an ACCESS EXCLUSIVE lock on the table, blocking all inserts and updates for an estimated 40–90 seconds. The deployed application version does not populate this column, so all new inserts will fail immediately after migration.",
  findings: [
    {
      id: "fnd-1",
      severity: "critical",
      category: "lock-risk",
      title: "Table lock on orders for 40–90 seconds",
      offendingSql: "ALTER TABLE orders ADD COLUMN status VARCHAR(50) NOT NULL;",
      explanation:
        "Adding a NOT NULL column without a default forces a full table rewrite on PostgreSQL < 11 and an ACCESS EXCLUSIVE lock on all versions. With 4.2M rows, this will block all concurrent inserts and updates to orders for 40–90 seconds.",
      suggestedFix:
        "Add the column as nullable first, backfill in batches, then apply the NOT NULL constraint.",
      suggestedFixSql:
        "ALTER TABLE orders ADD COLUMN status VARCHAR(50);\n-- backfill in batches of 10,000\nUPDATE orders SET status = 'pending' WHERE id BETWEEN 1 AND 10000;\n-- ... repeat for remaining rows\nALTER TABLE orders ALTER COLUMN status SET NOT NULL;",
      affectedTable: "orders",
      estimatedImpact: "40–90 second table lock, all writes blocked",
    },
    {
      id: "fnd-2",
      severity: "critical",
      category: "breaking-change",
      title: "Deployed app version does not populate status column",
      offendingSql: "ALTER TABLE orders ADD COLUMN status VARCHAR(50) NOT NULL;",
      explanation:
        "The currently deployed application code does not include the status column in its INSERT statements. Since the column is NOT NULL with no default, every INSERT into orders will fail with a null value violation immediately after this migration runs.",
      suggestedFix:
        "Deploy application code that populates the status column first, or add a DEFAULT clause to the migration.",
      suggestedFixSql:
        "ALTER TABLE orders ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';",
      affectedTable: "orders",
      estimatedImpact: "100% of new order inserts will fail",
    },
    {
      id: "fnd-3",
      severity: "warning",
      category: "performance",
      title: "No index on new status column",
      offendingSql: "ALTER TABLE orders ADD COLUMN status VARCHAR(50) NOT NULL;",
      explanation:
        "The new status column will likely be queried and filtered on. Without an index, queries like SELECT * FROM orders WHERE status = 'pending' will require a full table scan on 4.2M rows.",
      suggestedFix:
        "Add a concurrent index after the column is added and backfilled.",
      suggestedFixSql:
        "CREATE INDEX CONCURRENTLY idx_orders_status ON orders (status);",
      affectedTable: "orders",
      estimatedImpact: "Slow queries on status column without index",
    },
  ],
  analyzedAt: "2026-07-24T09:12:00Z",
  analysisTimeMs: 6840,
};

const MOCK_CAUTION_REPORT: RiskReport = {
  checkId: "chk-2",
  verdict: "caution",
  summary:
    "This migration creates an index on payment_intents.created_at. The table has 8.1M rows — the index build will take approximately 15–25 seconds and hold a SHARE lock, blocking writes but allowing reads.",
  findings: [
    {
      id: "fnd-4",
      severity: "warning",
      category: "lock-risk",
      title: "Index build locks payment_intents for 15–25 seconds",
      offendingSql:
        "CREATE INDEX idx_payment_intents_created_at ON payment_intents (created_at);",
      explanation:
        "CREATE INDEX (without CONCURRENTLY) acquires a SHARE lock on the table, blocking all INSERT, UPDATE, and DELETE operations for the duration of the index build. On 8.1M rows this takes 15–25 seconds.",
      suggestedFix: "Use CREATE INDEX CONCURRENTLY to avoid blocking writes.",
      suggestedFixSql:
        "CREATE INDEX CONCURRENTLY idx_payment_intents_created_at ON payment_intents (created_at);",
      affectedTable: "payment_intents",
      estimatedImpact: "15–25 second write lock on payment_intents",
    },
  ],
  analyzedAt: "2026-07-24T08:34:00Z",
  analysisTimeMs: 4120,
};

const MOCK_SAFE_REPORT: RiskReport = {
  checkId: "chk-3",
  verdict: "safe",
  summary:
    "This migration adds a nullable column to users. No table lock, no data rewrite, no breaking changes. The operation completes instantly on PostgreSQL.",
  findings: [],
  analyzedAt: "2026-07-24T07:16:00Z",
  analysisTimeMs: 1840,
};

const MOCK_ROLLOUT_PLAN: RolloutPlan = {
  checkId: "chk-1",
  steps: [
    {
      order: 1,
      title: "Add nullable column",
      description:
        "Add the status column as nullable so existing rows are unaffected and inserts continue to work.",
      sql: "ALTER TABLE orders ADD COLUMN status VARCHAR(50);",
      whySafe:
        "Adding a nullable column is instant on PostgreSQL — no table rewrite, no lock beyond a brief metadata update.",
    },
    {
      order: 2,
      title: "Backfill existing rows in batches",
      description:
        "Update existing rows in batches of 10,000 to avoid long-running transactions and lock contention.",
      sql: `UPDATE orders SET status = 'pending'\nWHERE status IS NULL AND id BETWEEN 1 AND 10000;\n-- Repeat for subsequent batches:\n-- WHERE id BETWEEN 10001 AND 20000\n-- WHERE id BETWEEN 20001 AND 30000\n-- ... until all rows are updated`,
      whySafe:
        "Batched updates keep transaction time short (under 100ms per batch) and avoid holding locks that block other operations.",
    },
    {
      order: 3,
      title: "Apply NOT NULL constraint",
      description:
        "Now that all rows have a value, enforce the constraint. On PostgreSQL 12+ this is validated without a full table rewrite.",
      sql: "ALTER TABLE orders ALTER COLUMN status SET NOT NULL;",
      whySafe:
        "PostgreSQL 12+ validates the constraint without rewriting the table — just a brief ACCESS EXCLUSIVE lock for metadata update.",
    },
    {
      order: 4,
      title: "Deploy application code",
      description:
        "Deploy the application version that populates the status column in INSERT statements.",
      sql: "-- Application deployment (not a SQL migration)\n-- Ensure INSERT statements include: status = 'pending'",
      whySafe:
        "By this point the column exists and is backfilled, so the app code can immediately start writing to it.",
    },
  ],
  estimatedDowntime: "0 seconds",
  estimatedTotalTime: "15–25 minutes (backfill dependent on row count)",
};

const MOCK_ROLLBACK: RollbackScript = {
  checkId: "chk-1",
  sql: "-- Rollback: Remove status column from orders\n-- WARNING: This will destroy all status data\n\nDROP INDEX IF EXISTS idx_orders_status;\nALTER TABLE orders DROP COLUMN IF EXISTS status;",
  destructiveWarning:
    "This rollback permanently deletes all data in the status column. Ensure you have a backup before proceeding.",
  reversible: false,
  notes:
    "After rollback, deploy the previous application version that does not reference the status column.",
};

const MOCK_DANGEROUS_ROLLBACK: RollbackScript = {
  checkId: "chk-4",
  sql: "-- Rollback: Recreate sessions table\n-- WARNING: Table data was not backed up by this migration\n\nCREATE TABLE sessions (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id BIGINT NOT NULL REFERENCES users(id),\n  token VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW(),\n  expires_at TIMESTAMP NOT NULL\n);\n\nCREATE INDEX idx_sessions_token ON sessions (token);\nCREATE INDEX idx_sessions_user_id ON sessions (user_id);",
  destructiveWarning:
    "The original sessions table data was not preserved. You will need to restore from a database backup to recover session data.",
  reversible: false,
  notes:
    "This DROP was irreversible. The table structure has been recreated but all session data is lost. Users will need to re-authenticate.",
};

const MOCK_AUDIT_LOG: AuditEntry[] = [
  {
    id: "aud-1",
    timestamp: "2026-07-24T09:12:00Z",
    actor: "MigrateSafe Bot",
    actorAvatar: "",
    action: "verdict-issued",
    details: 'Dangerous verdict on PR #482 "Add NOT NULL column to orders without default"',
    checkId: "chk-1",
    repositoryName: "acme-api",
  },
  {
    id: "aud-2",
    timestamp: "2026-07-24T08:34:00Z",
    actor: "MigrateSafe Bot",
    actorAvatar: "",
    action: "verdict-issued",
    details: 'Caution verdict on PR #481 "Create index on payment_intents.created_at"',
    checkId: "chk-2",
    repositoryName: "acme-api",
  },
  {
    id: "aud-3",
    timestamp: "2026-07-24T07:16:00Z",
    actor: "MigrateSafe Bot",
    actorAvatar: "",
    action: "verdict-issued",
    details: 'Safe verdict on PR #480 "Add nullable email_verified_at to users"',
    checkId: "chk-3",
    repositoryName: "acme-api",
  },
  {
    id: "aud-4",
    timestamp: "2026-07-23T15:00:00Z",
    actor: "sarah.chen",
    actorAvatar: "",
    action: "verdict-overridden",
    details:
      'Overrode Dangerous verdict on PR #479 "Drop legacy sessions table" — Reason: "Table has been verified empty and unused for 6 months. Approved by DBA team."',
    checkId: "chk-4",
    repositoryName: "acme-api",
  },
  {
    id: "aud-5",
    timestamp: "2026-07-23T14:25:00Z",
    actor: "MigrateSafe Bot",
    actorAvatar: "",
    action: "verdict-issued",
    details: 'Dangerous verdict on PR #479 "Drop legacy sessions table"',
    checkId: "chk-4",
    repositoryName: "acme-api",
  },
  {
    id: "aud-6",
    timestamp: "2026-07-22T10:00:00Z",
    actor: "alex.rivera",
    actorAvatar: "",
    action: "database-connected",
    details: "Connected read-only database (PostgreSQL) for acme-api",
    repositoryName: "acme-api",
  },
  {
    id: "aud-7",
    timestamp: "2026-07-22T09:30:00Z",
    actor: "alex.rivera",
    actorAvatar: "",
    action: "repository-connected",
    details: "Connected repository acme-corp/acme-api via GitHub",
    repositoryName: "acme-api",
  },
];

const MOCK_DB_CONNECTION: DatabaseConnection = {
  id: "db-1",
  repositoryId: "repo-1",
  dialect: "postgres",
  host: "db.acme-corp.internal",
  port: 5432,
  database: "acme_production",
  schema: "public",
  status: "connected",
  schemaSnapshotAt: "2026-07-24T09:00:00Z",
  tableCount: 47,
  totalSizeBytes: 2_147_483_648,
};

const MOCK_USAGE: UsageData = {
  plan: "pro",
  analysesUsed: 342,
  analysesIncluded: 500,
  periodStart: "2026-07-01T00:00:00Z",
  periodEnd: "2026-07-31T23:59:59Z",
  overageRate: 0.15,
};

const MOCK_SUBSCRIPTION: Subscription = {
  plan: "pro",
  seatCount: 4,
  monthlyPrice: 156,
  nextBillingDate: "2026-08-01T00:00:00Z",
  paymentMethod: { brand: "visa", last4: "4242", expMonth: 12, expYear: 2027 },
  invoices: [
    { id: "inv-1", date: "2026-07-01T00:00:00Z", amount: 156, status: "paid", description: "Pro plan — 4 seats" },
    { id: "inv-2", date: "2026-06-01T00:00:00Z", amount: 156, status: "paid", description: "Pro plan — 4 seats" },
    { id: "inv-3", date: "2026-05-01T00:00:00Z", amount: 117, status: "paid", description: "Pro plan — 3 seats" },
  ],
};

const MOCK_TEAM: TeamMember[] = [
  { id: "u-1", name: "Sarah Chen", email: "sarah@acme-corp.com", avatar: "", role: "admin", joinedAt: "2026-07-22T09:30:00Z" },
  { id: "u-2", name: "Alex Rivera", email: "alex@acme-corp.com", avatar: "", role: "admin", joinedAt: "2026-07-22T09:30:00Z" },
  { id: "u-3", name: "Jordan Patel", email: "jordan@acme-corp.com", avatar: "", role: "member", joinedAt: "2026-07-22T11:00:00Z" },
  { id: "u-4", name: "Morgan Lee", email: "morgan@acme-corp.com", avatar: "", role: "viewer", joinedAt: "2026-07-23T14:00:00Z" },
];

const MOCK_PLATFORM_STATS: PlatformStats = {
  totalAccounts: 1247,
  totalRepos: 2891,
  totalChecksRun: 48_723,
  dangerousCaughtRate: 12.4,
  aiCostThisMonth: 8_340,
  revenueThisMonth: 47_200,
  avgAnalysisTimeMs: 4_200,
};

export class MockMigrateSafeAPI implements MigrateSafeAPI {
  async connectRepository(provider: Provider, repoUrl: string): Promise<Repository> {
    await delay(1200);
    return {
      id: `repo-${Date.now()}`,
      name: repoUrl.split("/").pop() || "new-repo",
      fullName: repoUrl.replace("https://github.com/", "").replace("https://gitlab.com/", ""),
      provider,
      defaultBranch: "main",
      dbConnected: false,
      checksEnabled: true,
      lastCheckAt: null,
      openPrCount: 0,
    };
  }

  async listRepositories(): Promise<Repository[]> {
    await delay(400);
    return [...MOCK_REPOSITORIES];
  }

  async connectDatabase(repoId: string, config: { dialect: Dialect; host: string; port: number; database: string; user: string; password: string; schema?: string }): Promise<DatabaseConnection> {
    await delay(2000);
    return { ...MOCK_DB_CONNECTION, repositoryId: repoId, dialect: config.dialect, host: config.host, port: config.port, database: config.database, schema: config.schema || "public" };
  }

  async listMigrationChecks(repoId: string): Promise<MigrationCheck[]> {
    await delay(500);
    return MOCK_CHECKS.filter((c) => c.repositoryId === repoId);
  }

  async getMigrationCheck(checkId: string): Promise<MigrationCheck> {
    await delay(300);
    const check = MOCK_CHECKS.find((c) => c.id === checkId);
    if (!check) throw new Error(`Check not found: ${checkId}`);
    return { ...check };
  }

  async getRiskReport(checkId: string): Promise<RiskReport> {
    await delay(600);
    if (checkId === "chk-1") return { ...MOCK_RISK_REPORT, findings: MOCK_RISK_REPORT.findings.map((f) => ({ ...f })) };
    if (checkId === "chk-2") return { ...MOCK_CAUTION_REPORT, findings: MOCK_CAUTION_REPORT.findings.map((f) => ({ ...f })) };
    if (checkId === "chk-3") return { ...MOCK_SAFE_REPORT, findings: [] };
    return {
      checkId,
      verdict: "dangerous",
      summary: "This migration drops a table that may still have active foreign key references from 3 other tables.",
      findings: [
        {
          id: "fnd-x",
          severity: "critical",
          category: "breaking-change",
          title: "Active foreign key references detected",
          offendingSql: "DROP TABLE sessions;",
          explanation: "The sessions table is referenced by user_sessions, audit_logs, and api_keys via foreign keys.",
          suggestedFix: "Remove foreign key constraints first, or migrate dependent data.",
          suggestedFixSql: "ALTER TABLE user_sessions DROP CONSTRAINT FK_sessions;\nDROP TABLE sessions;",
          affectedTable: "sessions",
          estimatedImpact: "3 tables with active foreign keys will fail",
        },
      ],
      analyzedAt: new Date().toISOString(),
      analysisTimeMs: 5200,
    };
  }

  async getSafeRolloutPlan(checkId: string): Promise<RolloutPlan> {
    await delay(500);
    if (checkId === "chk-1") return { ...MOCK_ROLLOUT_PLAN, steps: MOCK_ROLLOUT_PLAN.steps.map((s) => ({ ...s })) };
    return {
      checkId,
      steps: [
        { order: 1, title: "Review the change", description: "Verify the migration is necessary and the SQL is correct.", sql: "-- No SQL needed for review", whySafe: "Review is always safe." },
      ],
      estimatedDowntime: "0 seconds",
      estimatedTotalTime: "N/A",
    };
  }

  async getRollbackScript(checkId: string): Promise<RollbackScript> {
    await delay(400);
    if (checkId === "chk-1") return { ...MOCK_ROLLBACK };
    if (checkId === "chk-4") return { ...MOCK_DANGEROUS_ROLLBACK };
    return {
      checkId,
      sql: "-- No rollback needed for this safe migration",
      destructiveWarning: null,
      reversible: true,
      notes: "This migration is fully reversible.",
    };
  }

  async overrideVerdict(checkId: string, reason: string): Promise<void> {
    await delay(600);
    // In production, this would POST to the API
    console.log(`Override verdict for ${checkId}: ${reason}`);
  }

  async getAuditLog(repoId: string): Promise<AuditEntry[]> {
    await delay(500);
    return [...MOCK_AUDIT_LOG];
  }

  async getUsage(): Promise<UsageData> {
    await delay(300);
    return { ...MOCK_USAGE };
  }

  async getSubscription(): Promise<Subscription> {
    await delay(300);
    return {
      ...MOCK_SUBSCRIPTION,
      paymentMethod: MOCK_SUBSCRIPTION.paymentMethod ? { ...MOCK_SUBSCRIPTION.paymentMethod } : null,
      invoices: MOCK_SUBSCRIPTION.invoices.map((i) => ({ ...i })),
    };
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    await delay(400);
    return [...MOCK_TEAM];
  }

  async getPlatformStats(): Promise<PlatformStats> {
    await delay(500);
    return { ...MOCK_PLATFORM_STATS };
  }
}

// Singleton for app usage
export const api: MigrateSafeAPI = new MockMigrateSafeAPI();
