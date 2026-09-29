import type { AuthUser } from "../api/auth";

export const maskedPhoneNumber = "********";

export function isAdminUser(user: AuthUser) {
  return user.email?.toLowerCase() === "admin@rowad.local";
}

export function canViewFullTravelerPhone(user: AuthUser) {
  return isAdminUser(user);
}

export function displayTravelerPhone(user: AuthUser, phoneNumber: string | null | undefined) {
  if (!phoneNumber) {
    return "-";
  }

  return canViewFullTravelerPhone(user) ? phoneNumber : maskedPhoneNumber;
}
