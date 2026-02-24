export type UserRole = "owner" | "admin" | "compliance_manager" | "auditor" | "member";

export function hasAdminAccess(role: UserRole) {
  return role === "owner" || role === "admin" || role === "compliance_manager";
}

export function assertAdmin(session: { user: { role: UserRole } }) {
  if (!hasAdminAccess(session.user.role)) {
    throw new Error("Forbidden");
  }
}
