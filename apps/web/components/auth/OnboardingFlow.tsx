"use client";

import { CreateOrganization, useAuth, useOrganizationList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  cobraiAuthShellStyle,
  cobraiClerkAppearance
} from "../../lib/clerk-appearance";

type OnboardingFlowProps = {
  /** Org ya creada (p. ej. durante SignUp) pero aún no activa en sesión */
  existingOrgId?: string;
};

function OnboardingShell({
  message = "Cargando…"
}: {
  message?: string;
}): React.ReactElement {
  return (
    <div style={cobraiAuthShellStyle}>
      <p className="text-sm text-[#9a9088]">{message}</p>
    </div>
  );
}

export function OnboardingFlow({
  existingOrgId
}: OnboardingFlowProps): React.ReactElement {
  const router = useRouter();
  const { orgId, isLoaded: authLoaded } = useAuth();
  const { isLoaded: orgListLoaded, setActive, userMemberships } =
    useOrganizationList({
      userMemberships: { infinite: true }
    });
  const activating = useRef(false);

  useEffect(() => {
    if (orgId) {
      router.replace("/dashboard");
      return;
    }

    if (!authLoaded || !orgListLoaded || activating.current) {
      return;
    }

    const membershipOrgId = userMemberships.data?.[0]?.organization.id;
    const targetOrgId = existingOrgId ?? membershipOrgId;

    if (!targetOrgId) {
      return;
    }

    activating.current = true;
    void setActive({ organization: targetOrgId })
      .then(() => {
        router.replace("/dashboard");
      })
      .catch(() => {
        activating.current = false;
      });
  }, [
    authLoaded,
    existingOrgId,
    orgId,
    orgListLoaded,
    router,
    setActive,
    userMemberships.data
  ]);

  if (!authLoaded || !orgListLoaded) {
    return <OnboardingShell />;
  }

  if (orgId) {
    return <OnboardingShell message="Redirigiendo al dashboard…" />;
  }

  const hasExistingOrg =
    Boolean(existingOrgId) || (userMemberships.data?.length ?? 0) > 0;

  if (hasExistingOrg) {
    return <OnboardingShell message="Activando tu organización…" />;
  }

  return (
    <div style={cobraiAuthShellStyle}>
      <CreateOrganization
        afterCreateOrganizationUrl="/dashboard"
        appearance={cobraiClerkAppearance}
        skipInvitationScreen
      />
    </div>
  );
}
