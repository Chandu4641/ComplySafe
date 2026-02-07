import { requireSession } from "@/lib/auth/guard";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await requireSession();

  return (
    <main className="container" style={{ padding: "64px 0" }}>
      <OnboardingForm orgId={session.orgId} orgName={session.org.name} />
    </main>
  );
}
