import type { MembershipApprovalStatus } from "../types";

export function membershipStatusLabel(status: MembershipApprovalStatus): string {
  switch (status) {
    case "pending":
      return "Pending approval";
    case "active":
      return "Active";
    case "suspended":
      return "Suspended";
    case "expired":
      return "Revoked";
  }
}
