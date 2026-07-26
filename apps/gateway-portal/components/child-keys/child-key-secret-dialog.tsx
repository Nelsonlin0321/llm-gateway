"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

type ChildKeySecretDialogProps = {
  open: boolean;
  apiKey: string;
  keyName: string;
  /** "created" after issuance; "reveal" when re-showing a stored secret. */
  mode?: "created" | "reveal";
  onClose: () => void;
};

export function ChildKeySecretDialog({
  open,
  apiKey,
  keyName,
  mode = "created",
  onClose,
}: ChildKeySecretDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!open) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success("API key copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy. Select the key and copy manually.");
    }
  };

  const title =
    mode === "reveal" ? "Child API key" : "Child key created";
  const description =
    mode === "reveal" ? (
      <>
        Full secret for{" "}
        <span className="font-medium text-text-primary">{keyName}</span>. Treat
        this like a password — anyone with it can call the gateway.
      </>
    ) : (
      <>
        Copy the secret for{" "}
        <span className="font-medium text-text-primary">{keyName}</span> now.
        You can also reveal it later from the list.
      </>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--or-ink)_72%,transparent)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="child-key-secret-title"
        className="w-full max-w-lg rounded-xl border border-border-visible bg-popover shadow-hero"
      >
        <div className="space-y-1 border-b border-border px-5 py-4">
          <h2
            id="child-key-secret-title"
            className="font-heading text-[1.2rem] font-semibold tracking-[-0.02em]"
          >
            {title}
          </h2>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-lg border border-warning/30 bg-warning-bg px-3.5 py-3 text-sm text-warning">
            Store this key securely. Anyone with it can call the gateway under
            this key&apos;s identity and tags.
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.08em] text-text-tertiary uppercase">
              API key
            </p>
            <div className="flex items-start gap-2">
              <code className="min-w-0 flex-1 break-all rounded-md border border-border bg-surface-2 px-3 py-2.5 font-mono text-xs leading-5 text-text-primary">
                {apiKey}
              </code>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void handleCopy()}
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
