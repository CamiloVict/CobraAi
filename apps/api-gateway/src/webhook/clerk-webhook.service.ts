import { Injectable, Logger } from "@nestjs/common";
import { PrismaService, TenantPlan, type UserRole } from "@cobrai/db";
import { normalizeClerkRole } from "../common/types/clerk-request";

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleEvent(event: ClerkWebhookEvent): Promise<void> {
    switch (event.type) {
      case "organization.created":
        await this.onOrganizationCreated(
          event.data as OrganizationEventData
        );
        break;
      case "organization.updated":
        await this.onOrganizationUpdated(
          event.data as OrganizationEventData
        );
        break;
      case "organization.deleted":
        await this.onOrganizationDeleted(
          event.data as OrganizationEventData
        );
        break;
      case "organizationMembership.created":
        await this.onMembershipCreated(event.data as MembershipEventData);
        break;
      case "organizationMembership.updated":
        await this.onMembershipUpdated(event.data as MembershipEventData);
        break;
      case "organizationMembership.deleted":
        await this.onMembershipDeleted(event.data as MembershipEventData);
        break;
      case "user.created":
      case "user.updated":
        this.logger.debug(`Evento ${event.type} recibido (sin acción adicional)`);
        break;
      default:
        this.logger.debug(`Evento no manejado: ${event.type}`);
    }
  }

  private async onOrganizationCreated(
    data: OrganizationEventData
  ): Promise<void> {
    await this.prisma.tenant.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        name: data.name,
        slug: data.slug ?? slugify(data.name),
        plan: TenantPlan.trial,
        isActive: true
      },
      update: {
        name: data.name,
        slug: data.slug ?? slugify(data.name),
        isActive: true
      }
    });
  }

  private async onOrganizationUpdated(
    data: OrganizationEventData
  ): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug ?? slugify(data.name)
      }
    });
  }

  private async onOrganizationDeleted(
    data: OrganizationEventData
  ): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: data.id },
      data: { isActive: false, deletedAt: new Date() }
    });
  }

  private async onMembershipCreated(
    data: MembershipEventData
  ): Promise<void> {
    const role = mapClerkRole(data.role);
    const name = formatUserName(data.public_user_data);

    await this.prisma.user.upsert({
      where: { id: data.public_user_data.user_id },
      create: {
        id: data.public_user_data.user_id,
        tenantId: data.organization.id,
        email: data.public_user_data.identifier ?? `${data.public_user_data.user_id}@clerk.local`,
        name,
        role,
        isActive: true
      },
      update: { role, name, isActive: true }
    });
  }

  private async onMembershipUpdated(
    data: MembershipEventData
  ): Promise<void> {
    const role = mapClerkRole(data.role);
    await this.prisma.user.update({
      where: { id: data.public_user_data.user_id },
      data: { role }
    });
  }

  private async onMembershipDeleted(
    data: MembershipEventData
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: data.public_user_data.user_id },
      data: { isActive: false, deletedAt: new Date() }
    });
  }
}

function mapClerkRole(role: string): UserRole {
  const normalized = normalizeClerkRole(role) as UserRole;
  if (["admin", "manager", "agent", "viewer"].includes(normalized)) {
    return normalized;
  }
  return "viewer";
}

function formatUserName(
  user: MembershipEventData["public_user_data"]
): string {
  return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Usuario";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export interface ClerkWebhookEvent {
  type: string;
  data: OrganizationEventData | MembershipEventData;
}

interface OrganizationEventData {
  id: string;
  name: string;
  slug?: string;
}

interface MembershipEventData {
  organization: { id: string };
  public_user_data: {
    user_id: string;
    identifier?: string;
    first_name?: string;
    last_name?: string;
  };
  role: string;
}
