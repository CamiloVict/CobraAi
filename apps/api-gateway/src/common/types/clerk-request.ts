import type { Request } from "express";

export interface ClerkJwtPayload {
  sub: string;
  org_id?: string;
  org_role?: string;
  o?: { id?: string; rol?: string };
}

export interface AuthenticatedRequest extends Request {
  clerkUserId?: string;
  clerkOrgId?: string;
  clerkOrgRole?: string;
  clerkPayload?: ClerkJwtPayload;
  requestId?: string;
}

export function extractOrgId(payload: ClerkJwtPayload): string | undefined {
  return payload.org_id ?? payload.o?.id;
}

export function extractOrgRole(payload: ClerkJwtPayload): string | undefined {
  return payload.org_role ?? payload.o?.rol;
}

export function normalizeClerkRole(role?: string): string {
  if (!role) {
    return "viewer";
  }
  return role.replace(/^org:/, "");
}
