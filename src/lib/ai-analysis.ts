export interface Finding {
  severity: "critical" | "warning" | "info" | "suggestion";
  category: string;
  title: string;
  offendingSql: string;
  explanation: string;
  suggestedFix: string;
  suggestedFixSql: string | null;
  affectedTable: string;
  estimatedImpact: string | null;
}

export interface AnalysisResult {
  verdict: "safe" | "caution" | "dangerous";
  findings: Finding[];
  summary: string;
  totalChanges: number;
  riskScore: number;
}

export function analyzeMigration(sql: string): AnalysisResult {
  const findings: Finding[] = [];
  const lowerSql = sql.toLowerCase();
  const lines = sql.split("\n");
  let riskScore = 0;

  const extractTable = (line: string): string => {
    const m = line.match(/(?:FROM|JOIN|INTO|UPDATE|ALTER|TABLE|DROP)\s+(\w+)/i);
    return m ? m[1] : "unknown";
  };

  const extractLine = (idx: number): string => lines[idx]?.trim() || "";

  // Rule 1: DROP TABLE
  const dropTableRegex = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/gi;
  let match;
  while ((match = dropTableRegex.exec(sql))) {
    const lineNum = sql.substring(0, match.index).split("\n").length - 1;
    findings.push({
      severity: "critical",
      category: "dangerous-drop",
      title: "DROP TABLE Detected",
      offendingSql: extractLine(lineNum),
      explanation: `Table "${match[1]}" will be permanently deleted. All data will be lost.`,
      suggestedFix: "Create a backup before dropping. Use DROP TABLE IF EXISTS to prevent errors.",
      suggestedFixSql: null,
      affectedTable: match[1],
      estimatedImpact: "Data loss — all rows permanently deleted",
    });
    riskScore += 40;
  }

  // Rule 2: DROP COLUMN
  const dropColumnRegex = /ALTER\s+TABLE\s+(\w+)\s+DROP\s+(?:COLUMN\s+)?(\w+)/gi;
  while ((match = dropColumnRegex.exec(sql))) {
    const lineNum = sql.substring(0, match.index).split("\n").length - 1;
    findings.push({
      severity: "critical",
      category: "dangerous-drop",
      title: "DROP COLUMN Detected",
      offendingSql: extractLine(lineNum),
      explanation: `Column "${match[2]}" on table "${match[1]}" will be permanently deleted. All data in this column will be lost.`,
      suggestedFix: "Create a backup first. Consider deprecating the column instead.",
      suggestedFixSql: null,
      affectedTable: match[1],
      estimatedImpact: "Data loss — column values permanently deleted",
    });
    riskScore += 35;
  }

  // Rule 3: Data type changes (lossy)
  const typeChangeRegex = /ALTER\s+TABLE\s+(\w+)\s+ALTER\s+(?:COLUMN\s+)?(\w+)\s+(?:SET\s+DATA\s+)?TYPE\s+(\w+)/gi;
  const lossyTypes = ["text", "varchar", "char", "integer", "bigint", "smallint", "serial", "bigserial", "decimal", "numeric", "real", "double"];
  while ((match = typeChangeRegex.exec(sql))) {
    const newType = match[3].toLowerCase();
    if (lossyTypes.includes(newType)) {
      const lineNum = sql.substring(0, match.index).split("\n").length - 1;
      findings.push({
        severity: "critical",
        category: "type-change-lossy",
        title: "Lossy Data Type Change",
        offendingSql: extractLine(lineNum),
        explanation: `Column "${match[2]}" is being changed to ${match[3]}. This may cause data truncation or conversion errors.`,
        suggestedFix: "Verify the new type can accommodate all existing data. Consider a safer migration path.",
        suggestedFixSql: null,
        affectedTable: match[1],
        estimatedImpact: "Data truncation or conversion errors on existing rows",
      });
      riskScore += 30;
    }
  }

  // Rule 4: NOT NULL without default
  const notNullRegex = /ALTER\s+TABLE\s+(\w+)\s+ALTER\s+(?:COLUMN\s+)?(\w+)\s+SET\s+NOT\s+NULL/gi;
  while ((match = notNullRegex.exec(sql))) {
    const table = match[1];
    const column = match[2];
    const hasDefault = lowerSql.includes(`alter table ${table.toLowerCase()} alter`) &&
      lowerSql.includes(`${column.toLowerCase()}`) &&
      lowerSql.includes("set default");
    if (!hasDefault) {
      const lineNum = sql.substring(0, match.index).split("\n").length - 1;
      findings.push({
        severity: "warning",
        category: "not-null-no-default",
        title: "NOT NULL Without Default",
        offendingSql: extractLine(lineNum),
        explanation: `Column "${column}" is set to NOT NULL. Existing rows may have NULL values causing failures.`,
        suggestedFix: "Add a default value or update existing rows before setting NOT NULL.",
        suggestedFixSql: `UPDATE ${table} SET ${column} = COALESCE(${column}, 'default_value');`,
        affectedTable: table,
        estimatedImpact: "Migration failure if NULL values exist in existing rows",
      });
      riskScore += 25;
    }
  }

  // Rule 5: Large table alterations
  const alterTableRegex = /ALTER\s+TABLE\s+(\w+)/gi;
  while ((match = alterTableRegex.exec(sql))) {
    const tableName = match[1].toLowerCase();
    const largePatterns = ["users", "accounts", "orders", "payments", "transactions", "events", "logs", "sessions"];
    if (largePatterns.some((p) => tableName.includes(p))) {
      const lineNum = sql.substring(0, match.index).split("\n").length - 1;
      findings.push({
        severity: "warning",
        category: "large-table",
        title: "Large Table Alteration",
        offendingSql: extractLine(lineNum),
        explanation: `Table "${match[1]}" may contain millions of rows. ALTER TABLE can lock the table and cause downtime.`,
        suggestedFix: "Use online schema migration tools (gh-ost, pt-online-schema-change).",
        suggestedFixSql: null,
        affectedTable: match[1],
        estimatedImpact: "Table lock during migration — potential downtime",
      });
      riskScore += 15;
    }
  }

  // Rule 6: Index removal
  const dropIndexRegex = /DROP\s+INDEX\s+(?:IF\s+EXISTS\s+)?(\w+)/gi;
  while ((match = dropIndexRegex.exec(sql))) {
    const lineNum = sql.substring(0, match.index).split("\n").length - 1;
    findings.push({
      severity: "warning",
      category: "remove-index",
      title: "Index Removal",
      offendingSql: extractLine(lineNum),
      explanation: `Index "${match[1]}" is being dropped. Queries using this index will slow down significantly.`,
      suggestedFix: "Verify no critical queries depend on this index. Monitor query performance after deployment.",
      suggestedFixSql: null,
      affectedTable: "unknown",
      estimatedImpact: "Query performance degradation for queries using this index",
    });
    riskScore += 15;
  }

  // Rule 7: Foreign key additions
  const addFkRegex = /ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY/gi;
  while ((match = addFkRegex.exec(sql))) {
    const lineNum = sql.substring(0, match.index).split("\n").length - 1;
    const affectedTable = extractTable(lines[lineNum] || "");
    findings.push({
      severity: "info",
      category: "foreign-key",
      title: "Foreign Key Addition",
      offendingSql: extractLine(lineNum),
      explanation: "New foreign key constraint added. This enforces referential integrity but may slow writes.",
      suggestedFix: "Ensure the referenced table is indexed on the foreign key column.",
      suggestedFixSql: null,
      affectedTable,
      estimatedImpact: "Slight write performance overhead for referential integrity checks",
    });
    riskScore += 5;
  }

  // Rule 8: Default value changes
  const alterDefaultRegex = /ALTER\s+TABLE\s+(\w+)\s+ALTER\s+(?:COLUMN\s+)?(\w+)\s+SET\s+DEFAULT\s+(\S+)/gi;
  while ((match = alterDefaultRegex.exec(sql))) {
    const lineNum = sql.substring(0, match.index).split("\n").length - 1;
    findings.push({
      severity: "info",
      category: "default-change",
      title: "Default Value Change",
      offendingSql: extractLine(lineNum),
      explanation: `Default value for "${match[2]}" is changing to ${match[3]}. New rows will use this default.`,
      suggestedFix: "No action required — existing rows are unaffected.",
      suggestedFixSql: null,
      affectedTable: match[1],
      estimatedImpact: "New rows will use updated default; existing rows unchanged",
    });
    riskScore += 3;
  }

  // Rule 9: Suggestions
  const createIndexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS)(\w+)\s+ON\s+(\w+)/gi;
  while ((match = createIndexRegex.exec(sql))) {
    const lineNum = sql.substring(0, match.index).split("\n").length - 1;
    findings.push({
      severity: "suggestion",
      category: "create-index",
      title: "CREATE INDEX Suggestion",
      offendingSql: extractLine(lineNum),
      explanation: `Index "${match[1]}" on "${match[2]}" — consider using CREATE INDEX CONCURRENTLY for zero-downtime deployment.`,
      suggestedFix: `CREATE INDEX CONCURRENTLY ${match[1]} ON ${match[2]}(...);`,
      suggestedFixSql: null,
      affectedTable: match[2],
      estimatedImpact: null,
    });
  }

  // Rule 10: No transaction wrapping
  const hasTransaction = lowerSql.includes("begin") && lowerSql.includes("commit");
  if (!hasTransaction && sql.trim().length > 100) {
    findings.push({
      severity: "suggestion",
      category: "no-transaction",
      title: "No Transaction Wrapper",
      offendingSql: "",
      explanation: "Migration is not wrapped in BEGIN/COMMIT. If it fails midway, the database may be left in an inconsistent state.",
      suggestedFix: "Wrap the migration in BEGIN; ... COMMIT; for atomicity.",
      suggestedFixSql: "BEGIN;\n  -- your migration here\nCOMMIT;",
      affectedTable: "all affected tables",
      estimatedImpact: null,
    });
  }

  // Rule 11: No rollback instructions
  if (!lowerSql.includes("-- rollback:") && !lowerSql.includes("-- rollback script")) {
    findings.push({
      severity: "suggestion",
      category: "no-rollback",
      title: "No Rollback Instructions",
      offendingSql: "",
      explanation: "Migration does not include rollback instructions. Add a comment with the rollback plan.",
      suggestedFix: "-- Rollback: <describe how to safely reverse this migration>",
      suggestedFixSql: null,
      affectedTable: "all affected tables",
      estimatedImpact: null,
    });
  }

  riskScore = Math.min(100, riskScore);

  let verdict: "safe" | "caution" | "dangerous";
  if (riskScore >= 50 || findings.some((f) => f.severity === "critical")) {
    verdict = "dangerous";
  } else if (riskScore >= 20 || findings.some((f) => f.severity === "warning")) {
    verdict = "caution";
  } else {
    verdict = "safe";
  }

  const totalChanges =
    (sql.match(/ALTER\s+TABLE/gi) || []).length +
    (sql.match(/CREATE\s+TABLE/gi) || []).length +
    (sql.match(/DROP\s+TABLE/gi) || []).length +
    (sql.match(/INSERT\s+INTO/gi) || []).length +
    (sql.match(/CREATE\s+INDEX/gi) || []).length;

  const summary = generateSummary(verdict, findings, totalChanges);

  return {
    verdict,
    findings,
    summary,
    totalChanges,
    riskScore,
  };
}

function generateSummary(verdict: string, findings: Finding[], totalChanges: number): string {
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;

  let summary = "";

  if (verdict === "dangerous") {
    summary = `This migration contains ${criticalCount} critical issue(s) that pose significant risk to data integrity. `;
    if (findings.some((f) => f.category === "dangerous-drop")) {
      summary += "Detected destructive operations (DROP TABLE/COLUMN) that will permanently delete data. ";
    }
    if (findings.some((f) => f.category === "type-change-lossy")) {
      summary += "Lossy data type changes detected that may cause data truncation. ";
    }
    summary += `Recommendation: DO NOT deploy this migration without addressing the critical findings.`;
  } else if (verdict === "caution") {
    summary = `This migration has ${warningCount} warning(s) that should be reviewed before deployment. `;
    if (findings.some((f) => f.category === "large-table")) {
      summary += "Large table alterations detected — may cause downtime. Consider online schema migration tools. ";
    }
    if (findings.some((f) => f.category === "not-null-no-default")) {
      summary += "NOT NULL constraints without defaults may fail on tables with existing data. ";
    }
    summary += "Recommendation: Review warnings carefully and test in staging before deploying.";
  } else {
    summary = `This migration looks safe with ${totalChanges} schema change(s). No critical or warning-level issues detected. `;
    const suggestions = findings.filter((f) => f.severity === "suggestion").length;
    if (suggestions > 0) {
      summary += `${suggestions} suggestion(s) available to improve the migration.`;
    } else {
      summary += "Good to deploy.";
    }
  }

  return summary;
}

export function generateRollbackScript(sql: string): {
  hasRollback: boolean;
  rollbackSql: string;
  confidence: number;
  warnings: string[];
} {
  const lowerSql = sql.toLowerCase();
  const warnings: string[] = [];
  const rollbackStatements: string[] = [];

  const dropTableRegex = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/gi;
  let match;
  while ((match = dropTableRegex.exec(sql))) {
    warnings.push(`Cannot auto-generate rollback for DROP TABLE "${match[1]}". Table data may be irrecoverable.`);
    rollbackStatements.push(`-- WARNING: Cannot rollback DROP TABLE "${match[1]}" without backup`);
  }

  const dropColumnRegex = /ALTER\s+TABLE\s+(\w+)\s+DROP\s+(?:COLUMN\s+)?(\w+)/gi;
  while ((match = dropColumnRegex.exec(sql))) {
    warnings.push(`Cannot auto-generate rollback for DROP COLUMN "${match[2]}" on table "${match[1]}". Column data may be lost.`);
    rollbackStatements.push(`-- WARNING: Cannot rollback DROP COLUMN "${match[2]}" without data backup`);
  }

  const addColumnRegex = /ALTER\s+TABLE\s+(\w+)\s+ADD\s+(?:COLUMN\s+)?(\w+)\s+(\w+)/gi;
  while ((match = addColumnRegex.exec(sql))) {
    rollbackStatements.push(`ALTER TABLE ${match[1]} DROP COLUMN ${match[2]};`);
  }

  const alterTypeRegex = /ALTER\s+TABLE\s+(\w+)\s+ALTER\s+(?:COLUMN\s+)?(\w+)\s+(?:SET\s+DATA\s+)?TYPE\s+(\w+)/gi;
  while ((match = alterTypeRegex.exec(sql))) {
    warnings.push(`Cannot determine original type for column "${match[2]}". Specify the original type manually.`);
    rollbackStatements.push(`-- ALTER TABLE ${match[1]} ALTER COLUMN ${match[2]} TYPE <ORIGINAL_TYPE>;`);
  }

  const dropConstraintRegex = /ALTER\s+TABLE\s+(\w+)\s+DROP\s+(?:CONSTRAINT|FOREIGN\s+KEY)\s+(\w+)/gi;
  while ((match = dropConstraintRegex.exec(sql))) {
    rollbackStatements.push(`ALTER TABLE ${match[1]} ADD CONSTRAINT ${match[2]};`);
  }

  const setNotNullRegex = /ALTER\s+TABLE\s+(\w+)\s+ALTER\s+(?:COLUMN\s+)?(\w+)\s+SET\s+NOT\s+NULL/gi;
  while ((match = setNotNullRegex.exec(sql))) {
    rollbackStatements.push(`ALTER TABLE ${match[1]} ALTER COLUMN ${match[2]} DROP NOT NULL;`);
  }

  const createIndexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)/gi;
  while ((match = createIndexRegex.exec(sql))) {
    rollbackStatements.push(`DROP INDEX ${match[1]};`);
  }

  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
  while ((match = createTableRegex.exec(sql))) {
    rollbackStatements.push(`DROP TABLE IF EXISTS ${match[1]};`);
  }

  const hasRollback = rollbackStatements.length > 0 && rollbackStatements.some((s) => !s.startsWith("-- WARNING"));

  return {
    hasRollback,
    rollbackSql: rollbackStatements.join("\n"),
    confidence: hasRollback ? (warnings.length === 0 ? 100 : 60) : 0,
    warnings,
  };
}

export function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case "safe":
      return "var(--color-verdict-safe)";
    case "caution":
      return "var(--color-verdict-caution)";
    case "dangerous":
      return "var(--color-verdict-dangerous)";
    default:
      return "var(--color-text-secondary)";
  }
}

export function getVerdictBg(verdict: string): string {
  switch (verdict) {
    case "safe":
      return "rgba(var(--color-verdict-safe-rgb), 0.1)";
    case "caution":
      return "rgba(var(--color-verdict-caution-rgb), 0.1)";
    case "dangerous":
      return "rgba(var(--color-verdict-dangerous-rgb), 0.1)";
    default:
      return "transparent";
  }
}
