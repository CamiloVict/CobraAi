"use client";

import { CreateOrganization, useAuth, useOrganizationList } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import {
  cobraiAuthShellStyle,
  cobraiClerkAppearance
} from "../../lib/clerk-appearance";
import { useResolveLandingAndRedirect } from "../../hooks/use-landing-redirect";

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
  const { orgId, isLoaded: authLoaded } = useAuth();
  const { isLoaded: orgListLoaded, setActive, userMemberships } =
    useOrganizationList({
      userMemberships: { infinite: true }
    });
  const activating = useRef(false);

  useResolveLandingAndRedirect(Boolean(orgId));

  useEffect(() => {
    if (orgId) {
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
    void setActive({ organization: targetOrgId }).catch(() => {
      activating.current = false;
    });
  }, [
    authLoaded,
    existingOrgId,
    orgId,
    orgListLoaded,
    setActive,
    userMemberships.data
  ]);

  if (!authLoaded || !orgListLoaded) {
    return <OnboardingShell />;
  }

  if (orgId) {
    return <OnboardingShell message="Redirigiendo…" />;
  }

  const hasExistingOrg =
    Boolean(existingOrgId) || (userMemberships.data?.length ?? 0) > 0;

  if (hasExistingOrg) {
    return <OnboardingShell message="Activando tu organización…" />;
  }

  return (
    <div style={cobraiAuthShellStyle}>
      <CreateOrganization
        afterCreateOrganizationUrl="/portfolios"
        appearance={cobraiClerkAppearance}
        skipInvitationScreen
      />
    </div>
  );
}
