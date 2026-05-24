import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClerkWebhookService } from "./clerk-webhook.service";

describe("ClerkWebhookService", () => {
  const prisma = {
    tenant: {
      upsert: vi.fn(),
      update: vi.fn()
    },
    user: {
      upsert: vi.fn(),
      update: vi.fn()
    }
  };

  let service: ClerkWebhookService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClerkWebhookService(prisma as never);
  });

  it("upserts tenant on organization.created", async () => {
    await service.handleEvent({
      type: "organization.created",
      data: { id: "org_abc", name: "Acme", slug: "acme" }
    });

    expect(prisma.tenant.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "org_abc" },
        create: expect.objectContaining({ id: "org_abc", slug: "acme" })
      })
    );
  });

  it("upserts user on organizationMembership.created", async () => {
    await service.handleEvent({
      type: "organizationMembership.created",
      data: {
        organization: { id: "org_abc" },
        public_user_data: {
          user_id: "user_xyz",
          identifier: "ana@acme.com",
          first_name: "Ana",
          last_name: "López"
        },
        role: "org:admin"
      }
    });

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          id: "user_xyz",
          tenantId: "org_abc",
          role: "admin"
        })
      })
    );
  });
});
