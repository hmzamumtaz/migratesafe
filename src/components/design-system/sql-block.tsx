"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

interface SQLBlockProps {
  code: string;
  variant?: "default" | "diff";
  className?: string;
  title?: string;
}

function highlightSQL(line: string, isAdded?: boolean, isRemoved?: boolean): React.ReactNode {
  if (isAdded || isRemoved) {
    return <span>{line}</span>;
  }

  const keywords = /\b(ALTER|TABLE|ADD|COLUMN|DROP|INDEX|CREATE|UPDATE|SET|WHERE|INSERT|INTO|VALUES|DELETE|FROM|SELECT|NOT|NULL|DEFAULT|IF|EXISTS|CONCURRENTLY|PRIMARY|KEY|REFERENCES|CONSTRAINT|CHECK|UNIQUE|ON|AND|OR|IN|BETWEEN|LIKE|IS|AS|RENAME|TO|TYPE|USING|WITH|WITHOUT|CASCADE|RESTRICT|REPLACE|SEQUENCE|TRIGGER|FUNCTION|PROCEDURE|BEGIN|END|RETURN|RETURNS|LANGUAGE|PLPGSQL|DECLAR|EXECUTE|GRANT|REVOKE|COMMIT|ROLLBACK|START|TRANSACTION|COMMENT|OWNED|BY|TEMPORARY|TEMP|VIEW|MATERIALIZED|SCHEMA|GRANT|ROLE|EXTENSION|ENUM|VAL|FORCE|LOCK|ACCESS|EXCLUSIVE|SHARE|ROW|EXCLUSIVE)\b/gi;
  const strings = /('[^']*')/g;
  const numbers = /\b(\d+(?:\.\d+)?)\b/g;
  const comments = /(--.*$)/gm;

  const parts: React.ReactNode[] = [];
  const remaining = line;

  // Handle comments
  const commentMatch = remaining.match(comments);
  if (commentMatch) {
    const idx = remaining.indexOf("--");
    const before = remaining.slice(0, idx);
    const comment = remaining.slice(idx);
    return (
      <>
        {highlightSQL(before)}
        <span className="text-[var(--text-tertiary)] italic">{comment}</span>
      </>
    );
  }

  // Simple token highlighting
  const tokens = remaining.split(/(\s+|[(),;=.*])/g);
  return (
    <>
      {tokens.map((token, i) => {
        if (keywords.test(token)) {
          keywords.lastIndex = 0;
          return <span key={i} className="text-[#7C3AED] dark:text-[#A78BFA] font-medium">{token}</span>;
        }
        if (strings.test(token)) {
          strings.lastIndex = 0;
          return <span key={i} className="text-[#059669] dark:text-[#34D399]">{token}</span>;
        }
        if (numbers.test(token)) {
          numbers.lastIndex = 0;
          return <span key={i} className="text-[#D97706] dark:text-[#FBBF24]">{token}</span>;
        }
        return <span key={i}>{token}</span>;
      })}
    </>
  );
}

export function SQLBlock({ code, variant = "default", className, title }: SQLBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div className={cn("rounded-lg border border-[var(--border)] overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface)] border-b border-[var(--border)]">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{title}</span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <div className="relative">
        {!title && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-[var(--surface)] rounded px-2 py-1 border border-[var(--border)] transition-colors"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
        <pre className="p-3 overflow-x-auto text-[13px] leading-relaxed font-mono bg-[var(--surface)]">
          <code>
            {variant === "diff"
              ? lines.map((line, i) => {
                  const isAdded = line.startsWith("+");
                  const isRemoved = line.startsWith("-");
                  return (
                    <div
                      key={i}
                      className={cn(
                        "px-1 -mx-1",
                        isAdded && "bg-[#1E7A46]/8 dark:bg-[#1E7A46]/12 text-[#1E7A46] dark:text-[#34D27B]",
                        isRemoved && "bg-[#B3261E]/8 dark:bg-[#B3261E]/12 text-[#B3261E] dark:text-[#F87171]"
                      )}
                    >
                      <span className="inline-block w-6 text-right mr-3 text-[var(--text-tertiary)] select-none text-xs">
                        {isAdded ? "+" : isRemoved ? "-" : " "}
                      </span>
                      {highlightSQL(line.slice(1) || " ", isAdded, isRemoved)}
                    </div>
                  );
                })
              : lines.map((line, i) => (
                  <div key={i}>
                    <span className="inline-block w-6 text-right mr-3 text-[var(--text-tertiary)] select-none text-xs">
                      {i + 1}
                    </span>
                    {highlightSQL(line)}
                  </div>
                ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
