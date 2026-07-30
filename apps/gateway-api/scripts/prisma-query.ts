/// <reference types="node" />

import prisma from "../src/lib/prisma";

async function main(): Promise<void> {
  const name = "deepinfra";
  const compatibilityType = "openai" as const;
  const modelAlias = "glm-5.2";

  const llmAndModel = await prisma.model.findFirst({
    where: {
      alias: `${name}/${modelAlias}`,
      provider: { name, compatibilityType },
    },
    include: { provider: true },
  });

  console.log(llmAndModel);
}
main();
