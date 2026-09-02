import { codeToHtml } from "shiki";

export const DOCS_CODE_LANGS = [
  "shell",
  "json",
  "typescript",
  "python",
] as const;
export type DocsCodeLang = (typeof DOCS_CODE_LANGS)[number];

/** Shiki bundled ids. `shell` is shown in the UI; bash is the grammar. */
const SHIKI_LANG: Record<DocsCodeLang, "bash" | "json" | "typescript" | "python"> =
  {
    shell: "bash",
    json: "json",
    typescript: "typescript",
    python: "python",
  };

export function docsLangLabel(lang: DocsCodeLang): string {
  return lang;
}

export async function highlightDocsCode(
  code: string,
  lang: DocsCodeLang,
): Promise<string> {
  return codeToHtml(code.replace(/\n$/, ""), {
    lang: SHIKI_LANG[lang],
    theme: "one-dark-pro",
  });
}
