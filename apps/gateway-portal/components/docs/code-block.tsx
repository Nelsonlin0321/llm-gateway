import { CopyButton } from "@/components/docs/copy-button";
import {
  docsLangLabel,
  highlightDocsCode,
  type DocsCodeLang,
} from "@/lib/docs/highlight";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  lang?: DocsCodeLang;
  label?: string;
  className?: string;
};

export async function CodeBlock({
  code,
  lang,
  label,
  className,
}: CodeBlockProps) {
  const trimmed = code.replace(/\n$/, "");
  const html = lang ? await highlightDocsCode(trimmed, lang) : null;

  return (
    <div
      className={cn(
        "docs-code-block overflow-hidden rounded-lg border border-border bg-surface-2",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5">
        <p className="truncate font-mono text-[11px] tracking-[0.04em] text-text-tertiary uppercase">
          {lang ? `${docsLangLabel(lang)}${label ? ` · ${label}` : ""}` : (label ?? "Example")}
        </p>
        <CopyButton code={trimmed} />
      </div>
      {html ? (
        <div
          className="docs-code-highlight overflow-x-auto p-4 text-[12.5px] leading-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 text-[12.5px] leading-6">
          <code className="font-mono text-text-primary">{trimmed}</code>
        </pre>
      )}
    </div>
  );
}
