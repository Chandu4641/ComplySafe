import PublicScanClient from "./publicScanClient";
import { requireSession } from "@/backend/auth/guard";

export default async function PublicScanPage() {
  await requireSession();
  return <PublicScanClient />;
}
