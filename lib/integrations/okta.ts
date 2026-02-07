import { prisma } from "../db/client";

export async function syncOkta(orgId: string) {
  const assets = [
    { type: "Identity", name: "Okta Directory", dataClass: "restricted" }
  ];

  for (const asset of assets) {
    await prisma.asset.create({
      data: {
        orgId,
        type: asset.type,
        name: asset.name,
        dataClass: asset.dataClass
      }
    });
  }

  await prisma.integration.updateMany({
    where: { orgId, type: "Okta" },
    data: { lastSync: new Date(), status: "connected" }
  });

  return { assets: assets.length };
}
