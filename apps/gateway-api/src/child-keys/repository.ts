import { eq } from "drizzle-orm";

import { childKeys, db, type ChildKey } from "../lib/db";

/**
 * Mutable lookup surface so unit tests can stub DB access without Prisma-style
 * method reassignment on a client singleton.
 */
export const childKeyRepository = {
  async findById(id: string): Promise<ChildKey | null> {
    const [record] = await db
      .select()
      .from(childKeys)
      .where(eq(childKeys.id, id))
      .limit(1);
    return record ?? null;
  },
};

export type ChildKeyFindById = typeof childKeyRepository.findById;
