import { prisma } from "../db/client";

export async function syncAws(orgId: string) {
  const assets = [
    { type: "S3", name: "prod-logs-bucket", dataClass: "restricted" },
    { type: "EC2", name: "api-cluster", dataClass: "internal" }
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
    where: { orgId, type: "AWS" },
    data: { lastSync: new Date(), status: "connected" }
  });

  return { assets: assets.length };
}
