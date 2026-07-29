import { z } from "zod";

/** Free-form key/value tags (project, team, env, or any custom label). */
export type ChildKeyTags = Record<string, string>;

const TAG_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_.-]*$/;
const MAX_TAGS = 24;
const MAX_TAG_KEY_LENGTH = 64;
const MAX_TAG_VALUE_LENGTH = 128;

export function normalizeChildKeyTags(value: unknown): ChildKeyTags {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const tags: ChildKeyTags = {};

  for (const [rawKey, rawValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const key = rawKey.trim();
    if (!key || key.length > MAX_TAG_KEY_LENGTH) {
      continue;
    }
    if (typeof rawValue !== "string") {
      continue;
    }
    const trimmedValue = rawValue.trim();
    if (!trimmedValue || trimmedValue.length > MAX_TAG_VALUE_LENGTH) {
      continue;
    }
    tags[key] = trimmedValue;
  }

  return tags;
}

export const childKeyTagsSchema = z
  .record(z.string(), z.string())
  .default({})
  .superRefine((record, ctx) => {
    const entries = Object.entries(record);
    if (entries.length > MAX_TAGS) {
      ctx.addIssue({
        code: "custom",
        message: `You can define at most ${MAX_TAGS} tags.`,
      });
      return;
    }

    const seen = new Set<string>();

    for (const [rawKey, rawValue] of entries) {
      const key = rawKey.trim();
      const value = rawValue.trim();

      // Incomplete pairs are dropped by normalize — only validate filled tags.
      if (!key && !value) {
        continue;
      }
      if (key && !value) {
        continue;
      }

      if (!key && value) {
        ctx.addIssue({
          code: "custom",
          message: "Tag key is required when a value is set.",
          path: [rawKey],
        });
        continue;
      }

      if (!TAG_KEY_PATTERN.test(key)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Tag keys must start with a letter and use letters, numbers, underscores, dots, or hyphens.",
          path: [rawKey],
        });
      }

      if (key.length > MAX_TAG_KEY_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: `Tag keys must be ${MAX_TAG_KEY_LENGTH} characters or fewer.`,
          path: [rawKey],
        });
      }

      if (value.length > MAX_TAG_VALUE_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: `Tag values must be ${MAX_TAG_VALUE_LENGTH} characters or fewer.`,
          path: [rawKey],
        });
      }

      const normalized = key.toLowerCase();
      if (seen.has(normalized)) {
        ctx.addIssue({
          code: "custom",
          message: "Tag keys must be unique (case-insensitive).",
          path: [rawKey],
        });
      }
      seen.add(normalized);
    }
  })
  .transform(normalizeChildKeyTags);

export const createChildKeyInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(64, "Name must be 64 characters or fewer."),
  userEmail: z
    .string()
    .trim()
    .email("Enter a valid user email.")
    .max(254, "Email is too long."),
  tags: childKeyTagsSchema,
  policyId: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  expiresAt: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine(
      (value) => value === undefined || !Number.isNaN(Date.parse(value)),
      "Enter a valid expiration date.",
    )
    .refine(
      (value) => value === undefined || Date.parse(value) > Date.now(),
      "Expiration must be in the future.",
    ),
});

export const toggleChildKeyInputSchema = z.object({
  id: z.string().trim().min(1, "Child key id is required."),
  isActive: z.boolean(),
});

export type CreateChildKeyInput = z.infer<typeof createChildKeyInputSchema>;
export type ToggleChildKeyInput = z.infer<typeof toggleChildKeyInputSchema>;

export type ChildKeyJwtPayload = {
  key_id: string;
  name: string;
  creator_id: string;
  policy_id?: string;
  /** Unix timestamp (seconds). Changes on each key rotation. */
  issued_at: number;
  /** Optional absolute expiry (Unix seconds). Embedded as JWT `exp`. */
  exp?: number;
};

export type ChildKeyListItem = {
  id: string;
  name: string;
  userEmail: string;
  tags: ChildKeyTags;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Masked token for list views — never the full secret after create. */
  keyPreview: string;
};

export type CreateChildKeyResultItem = ChildKeyListItem & {
  /** Full `sk_…` token — returned only on create / rotate / reveal. */
  apiKey: string;
};

export type JWTClaim = {
  key_id: string;
  name: string;
  policy_id?: string;
  creator_id: string;
  issued_at: number;
};
