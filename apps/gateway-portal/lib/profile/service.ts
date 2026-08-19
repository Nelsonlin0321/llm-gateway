import { z } from "zod";

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or less."),
  image: z
    .string()
    .trim()
    .max(2048, "Image URL must be 2048 characters or less.")
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export function validateUpdateProfileInput(input: unknown) {
  return updateProfileSchema.safeParse(input);
}
