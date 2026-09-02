"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  label?: string;
  className?: string;
};

export function CodeBlock({ code, label, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const trimmed = code.replace(/\n$/, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-surface-2",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5">
        <p className="truncate font-mono text-[11px] tracking-[0.04em] text-text-tertiary uppercase">
          {label ?? "Example"}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy example"}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-6">
        <code className="font-mono text-text-primary">{trimmed}</code>
      </pre>
    </div>
  );
}
