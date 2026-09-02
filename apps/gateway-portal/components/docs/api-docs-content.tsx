import type { ReactNode } from "react";
import Link from "next/link";

import { CodeBlock } from "@/components/docs/code-block";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ANTHROPIC_PREFIX,
  EXAMPLE_CHILD_KEY,
  EXAMPLE_MODEL,
  OPENAI_PREFIX,
  PROXY_API_URL_ENV,
  anthropicMessagesCurl,
  anthropicMessagesPayloadJson,
  anthropicMessagesStreamCurl,
  anthropicPythonSdk,
  docsNav,
  exampleAnthropicPaths,
  exampleOpenaiPaths,
  getProxyApiUrl,
  healthCurl,
  listAnthropicModelsCurl,
  listOpenaiModelsCurl,
  openaiChatCurl,
  openaiChatPayloadJson,
  openaiChatStreamCurl,
  openaiEmbeddingsCurl,
  openaiEmbeddingsPayloadJson,
  openaiNodeSdk,
  openaiPythonSdk,
  proxyApiUrlForExamples,
  proxyRoutes,
  readyCurl,
} from "@/lib/docs/api-guide";
import { cn } from "@/lib/utils";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] text-text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ApiDocsContent() {
  const proxyUrl = proxyApiUrlForExamples();
  const configuredUrl = getProxyApiUrl();

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      <nav
        aria-label="On this page"
        className="hidden lg:sticky lg:top-20 lg:block"
      >
        <p className="mb-3 text-[11px] font-medium tracking-[0.14em] text-text-tertiary uppercase">
          On this page
        </p>
        <ul className="space-y-1 border-l border-border">
          {docsNav.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="block border-l-2 border-transparent py-1 pl-3 text-[13px] text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-12">
        <Section id="quick-start" title="Quick start">
          <p className="text-sm leading-6 text-text-secondary">
            Point any OpenAI- or Anthropic-compatible client at the gateway
            origin from{" "}
            <code className="font-mono text-[13px] text-text-primary">
              {PROXY_API_URL_ENV}
            </code>
            . Authenticate with a portal child key. Set{" "}
            <code className="font-mono text-[13px] text-text-primary">
              model
            </code>{" "}
            to the org alias{" "}
            <code className="font-mono text-[13px] text-text-primary">
              provider/name
            </code>
            .{" "}
            <code className="font-mono text-[13px] text-text-primary">
              {`POST ${OPENAI_PREFIX}/*`}
            </code>{" "}
            and{" "}
            <code className="font-mono text-[13px] text-text-primary">
              {`POST ${ANTHROPIC_PREFIX}/*`}
            </code>{" "}
            forward to the upstream provider — any path that host supports, not
            only chat or messages.
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-text-secondary">
            <li>
              In the{" "}
              <Link href="/workspace" className="text-accent hover:underline">
                console
              </Link>
              , add a provider, register a model, and mint a child API key.
            </li>
            <li>
              Copy the <code className="font-mono text-text-primary">sk_…</code>{" "}
              secret (shown once).
            </li>
            <li>
              Call{" "}
              <code className="font-mono text-text-primary">{proxyUrl}</code>
              {configuredUrl
                ? "."
                : ` after setting ${PROXY_API_URL_ENV} on the portal.`}
            </li>
          </ol>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[36rem] text-left text-[13px]">
              <thead className="border-b border-border bg-surface-2 text-text-tertiary">
                <tr>
                  <th className="px-3 py-2 font-medium">Method</th>
                  <th className="px-3 py-2 font-medium">Path</th>
                  <th className="px-3 py-2 font-medium">Auth</th>
                  <th className="px-3 py-2 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {proxyRoutes.map((route) => (
                  <tr
                    key={`${route.method}:${route.path}`}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-3 py-2 font-mono text-[12px] text-accent">
                      {route.method}
                    </td>
                    <td className="px-3 py-2 font-mono text-[12px] text-text-primary">
                      {route.path}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {route.auth ? "Child key" : "None"}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {route.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CodeBlock code={healthCurl()} lang="shell" label="health" />
          <CodeBlock code={readyCurl()} lang="shell" label="ready" />
        </Section>

        <Section id="base-url" title="Base URL">
          <p className="text-sm leading-6 text-text-secondary">
            The gateway origin is the portal environment variable{" "}
            <code className="font-mono text-[13px] text-text-primary">
              {PROXY_API_URL_ENV}
            </code>
            . Examples on this page use the value configured for this
            deployment.
          </p>
          <CodeBlock
            code={`${PROXY_API_URL_ENV}=${proxyUrl}`}
            lang="shell"
            label="origin"
          />
          {!configuredUrl ? (
            <p className="text-sm leading-6 text-text-secondary">
              This deployment has not set{" "}
              <code className="font-mono text-text-primary">
                {PROXY_API_URL_ENV}
              </code>{" "}
              yet. Export it to the public gateway origin before copying the
              snippets below.
            </p>
          ) : null}
        </Section>

        <Section id="auth" title="Authentication">
          <p className="text-sm leading-6 text-text-secondary">
            Send the plaintext child key from the portal. The database stores
            ciphertext only — never put the encrypted value on the wire.
          </p>
          <CodeBlock
            code={`-H "Authorization: Bearer ${EXAMPLE_CHILD_KEY}"`}
            lang="shell"
            label="header"
          />
          <p className="text-sm leading-6 text-text-secondary">
            Missing, unknown, disabled, or expired keys return{" "}
            <code className="font-mono text-text-primary">401</code> or{" "}
            <code className="font-mono text-text-primary">403</code> with an
            OpenAI-style{" "}
            <code className="font-mono text-text-primary">error</code> object.
          </p>
        </Section>

        <Section id="models" title="Model IDs">
          <p className="text-sm leading-6 text-text-secondary">
            Every proxied JSON body must set{" "}
            <code className="font-mono text-text-primary">model</code> to{" "}
            <code className="font-mono text-text-primary">
              providerName/alias
            </code>
            . The provider name is the portal provider row; the alias is the
            gateway model alias in that organization. The gateway rewrites{" "}
            <code className="font-mono text-text-primary">model</code> to the
            upstream id before the hop.
          </p>
          <p className="rounded-lg border border-border bg-surface-2 px-3.5 py-3 font-mono text-[13px] text-text-primary">
            {EXAMPLE_MODEL}
          </p>
          <p className="text-sm leading-6 text-text-secondary">
            List the aliases this child key can call. Response{" "}
            <code className="font-mono text-text-primary">id</code> values are
            already in{" "}
            <code className="font-mono text-text-primary">provider/alias</code>{" "}
            form.
          </p>
          <CodeBlock
            code={listOpenaiModelsCurl()}
            lang="shell"
            label="OpenAI models"
          />
          <CodeBlock
            code={listAnthropicModelsCurl()}
            lang="shell"
            label="Anthropic models"
          />
        </Section>

        <Section id="proxy" title="Proxy routes">
          <p className="text-sm leading-6 text-text-secondary">
            <code className="font-mono text-text-primary">
              {`POST ${OPENAI_PREFIX}/*`}
            </code>{" "}
            and{" "}
            <code className="font-mono text-text-primary">
              {`POST ${ANTHROPIC_PREFIX}/*`}
            </code>{" "}
            are catch-all. The gateway authenticates the child key, resolves{" "}
            <code className="font-mono text-text-primary">provider/alias</code>{" "}
            in that organization, strips the{" "}
            <code className="font-mono text-text-primary">{OPENAI_PREFIX}</code>{" "}
            or{" "}
            <code className="font-mono text-text-primary">
              {ANTHROPIC_PREFIX}
            </code>{" "}
            prefix, and forwards the remainder to the provider{" "}
            <code className="font-mono text-text-primary">apiUrl</code>. If the
            upstream implements the path, the gateway will proxy it. If it does
            not, you get the provider’s error.
          </p>
          <p className="text-sm leading-6 text-text-secondary">
            These are common paths, not a closed list:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-2 px-3.5 py-3">
              <p className="mb-2 text-[11px] font-medium tracking-[0.12em] text-text-tertiary uppercase">
                OpenAI-compatible
              </p>
              <ul className="space-y-1 font-mono text-[12.5px] text-text-primary">
                {exampleOpenaiPaths.map((path) => (
                  <li key={path}>{path}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 px-3.5 py-3">
              <p className="mb-2 text-[11px] font-medium tracking-[0.12em] text-text-tertiary uppercase">
                Anthropic-compatible
              </p>
              <ul className="space-y-1 font-mono text-[12.5px] text-text-primary">
                {exampleAnthropicPaths.map((path) => (
                  <li key={path}>{path}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="openai" title="OpenAI examples">
          <p className="text-sm leading-6 text-text-secondary">
            Chat completions is the usual first call. Embeddings shows the same
            prefix working for another upstream route. Point the official OpenAI
            SDK{" "}
            <code className="font-mono text-text-primary">baseURL</code> at{" "}
            <code className="font-mono text-text-primary">
              {proxyUrl}
              {OPENAI_PREFIX}
            </code>
            .
          </p>
          <CodeBlock
            code={openaiChatPayloadJson()}
            lang="json"
            label="chat completions"
          />
          <CodeBlock
            code={openaiChatCurl()}
            lang="shell"
            label="POST /openai/chat/completions"
          />
          <CodeBlock
            code={openaiEmbeddingsPayloadJson()}
            lang="json"
            label="embeddings"
          />
          <CodeBlock
            code={openaiEmbeddingsCurl()}
            lang="shell"
            label="POST /openai/v1/embeddings"
          />
        </Section>

        <Section id="anthropic" title="Anthropic examples">
          <p className="text-sm leading-6 text-text-secondary">
            Messages is the usual first call. Anthropic-compatible hosts require{" "}
            <code className="font-mono text-text-primary">max_tokens</code> on
            that path. Point the official Anthropic SDK{" "}
            <code className="font-mono text-text-primary">base_url</code> at{" "}
            <code className="font-mono text-text-primary">
              {proxyUrl}
              {ANTHROPIC_PREFIX}
            </code>
            .
          </p>
          <CodeBlock
            code={anthropicMessagesPayloadJson()}
            lang="json"
            label="messages"
          />
          <CodeBlock
            code={anthropicMessagesCurl()}
            lang="shell"
            label="POST /anthropic/v1/messages"
          />
        </Section>

        <Section id="streaming" title="Streaming">
          <p className="text-sm leading-6 text-text-secondary">
            Set <code className="font-mono text-text-primary">stream: true</code>{" "}
            for SSE. Use{" "}
            <code className="font-mono text-text-primary">curl -N</code> so the
            client does not buffer the stream. For OpenAI chat completions
            paths, the gateway forces{" "}
            <code className="font-mono text-text-primary">
              stream_options.include_usage
            </code>{" "}
            so a final usage chunk is available for cost accounting.
          </p>
          <CodeBlock
            code={openaiChatStreamCurl()}
            lang="shell"
            label="OpenAI stream"
          />
          <CodeBlock
            code={anthropicMessagesStreamCurl()}
            lang="shell"
            label="Anthropic stream"
          />
        </Section>

        <Section id="metadata" title="Metadata">
          <p className="text-sm leading-6 text-text-secondary">
            Optional{" "}
            <code className="font-mono text-text-primary">metadata</code> is a
            JSON object on the client body. The gateway strips it before the
            upstream call and stores it on the request log for analytics
            filters (for example{" "}
            <code className="font-mono text-text-primary">user_email</code>,{" "}
            <code className="font-mono text-text-primary">env</code>,{" "}
            <code className="font-mono text-text-primary">team</code>). It never
            reaches the provider.
          </p>
        </Section>

        <Section id="sdks" title="Official SDKs">
          <p className="text-sm leading-6 text-text-secondary">
            Keep using the vendor SDK. Set the base URL to{" "}
            <code className="font-mono text-text-primary">
              {proxyUrl}
              {OPENAI_PREFIX}
            </code>{" "}
            or{" "}
            <code className="font-mono text-text-primary">
              {proxyUrl}
              {ANTHROPIC_PREFIX}
            </code>
            , use the child key, and keep{" "}
            <code className="font-mono text-text-primary">model</code> as the
            gateway alias. Other SDK methods (embeddings, images, and so on)
            work when the upstream supports that route.
          </p>
          <CodeBlock
            code={openaiPythonSdk()}
            lang="python"
            label="openai"
          />
          <CodeBlock
            code={openaiNodeSdk()}
            lang="typescript"
            label="openai"
          />
          <CodeBlock
            code={anthropicPythonSdk()}
            lang="python"
            label="anthropic"
          />
        </Section>

        <Section id="errors" title="Errors and rate limits">
          <p className="text-sm leading-6 text-text-secondary">
            Auth and routing failures return JSON{" "}
            <code className="font-mono text-text-primary">
              {`{ "error": { "message", "type" } }`}
            </code>
            . Upstream errors are passed through when possible. Redis log
            failures never change the client status.
          </p>
          <p className="text-sm leading-6 text-text-secondary">
            Each child key is capped at a requests-per-minute window (default{" "}
            <code className="font-mono text-text-primary">600</code>, or the
            per-key override). Over the cap the proxy returns{" "}
            <code className="font-mono text-text-primary">429</code> with{" "}
            <code className="font-mono text-text-primary">retry-after</code>,{" "}
            <code className="font-mono text-text-primary">x-ratelimit-limit</code>
            , and{" "}
            <code className="font-mono text-text-primary">
              x-ratelimit-remaining
            </code>
            . If Redis is down, the limiter fails open so traffic still
            completes.
          </p>
        </Section>

        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <Badge variant="info" className="w-fit">
              Console
            </Badge>
            <CardTitle>Need a key?</CardTitle>
            <CardDescription>
              Create a provider, register a model alias, and mint a child key
              in the organization console. Then paste{" "}
              <code className="font-mono">{EXAMPLE_CHILD_KEY}</code> into the
              examples above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/workspace"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Open console
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
