import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "../../../components/auth/OnboardingFlow";
import { resolveServerLandingPath } from "../../../lib/server/resolve-landing-path";

export default async function OnboardingPage(): Promise<React.ReactElement> {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  if (orgId) {
    redirect(await resolveServerLandingPath());
  }

  let existingOrgId: string | undefined;

  try {
    const client = await clerkClient();
    const { data } = await client.users.getOrganizationMembershipList({
      userId,
      limit: 1
    });
    existingOrgId = data[0]?.organization.id;
  } catch {
    // Si Clerk falla, el cliente intentará reconciliar membresías.
  }

  return <OnboardingFlow existingOrgId={existingOrgId} />;
}
