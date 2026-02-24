import { ISO_27001_2022 } from "./iso27001";
import { SOC2_TSC } from "./soc2";
import { PCI_DSS_V4 } from "./pci";
import { HIPAA_SECURITY_RULE } from "./hipaa";
import type { FrameworkCatalog } from "./types";

export const PHASE2_FRAMEWORK_CATALOGS: FrameworkCatalog[] = [
  ISO_27001_2022,
  SOC2_TSC,
  PCI_DSS_V4,
  HIPAA_SECURITY_RULE
];

export function getFrameworkCatalogByKey(frameworkKey: string) {
  const key = frameworkKey.trim().toUpperCase();
  return PHASE2_FRAMEWORK_CATALOGS.find((fw) => fw.key.toUpperCase() === key) ?? null;
}
