import { user, type User } from "@/lib/db";

export type ProfileActionResult =
  | {
      ok: true;
      user: Pick<User, "id" | "name" | "email" | "image" | "updatedAt">;
      message: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export const profileReturning = {
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  updatedAt: user.updatedAt,
};

export function validationErrorResult(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
): ProfileActionResult {
  return {
    ok: false,
    error,
    fieldErrors,
  };
}
