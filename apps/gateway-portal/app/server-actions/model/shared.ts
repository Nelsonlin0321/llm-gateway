import { models, type Model } from "@/lib/db";
import { toModelListItem } from "@/lib/model/service";

export type ModelActionResult =
  | {
      ok: true;
      model: ReturnType<typeof toModelListItem>;
      message: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export type ModelSelect = Pick<
  Model,
  | "id"
  | "name"
  | "alias"
  | "inputPrice"
  | "outputPrice"
  | "inputCachePrice"
  | "providerId"
  | "createdAt"
  | "updatedAt"
>;

export const modelReturning = {
  id: models.id,
  name: models.name,
  alias: models.alias,
  inputPrice: models.inputPrice,
  outputPrice: models.outputPrice,
  inputCachePrice: models.inputCachePrice,
  providerId: models.providerId,
  createdAt: models.createdAt,
  updatedAt: models.updatedAt,
};

export function modelValidationError(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
): ModelActionResult {
  return {
    ok: false,
    error,
    fieldErrors,
  };
}
