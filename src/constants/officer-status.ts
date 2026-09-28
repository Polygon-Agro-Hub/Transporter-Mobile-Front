/**
 * Official officer account statuses used across the mobile application and database.
 * Exactly matches the ENUM values stored in the MySQL collectionofficer table:
 * - "Approved"
 * - "Not Approved"
 * - "Rejected"
 */
export const OFFICER_STATUS = {
  APPROVED: "Approved",
  NOT_APPROVED: "Not Approved",
  REJECTED: "Rejected",
} as const;

export type OfficerStatus = (typeof OFFICER_STATUS)[keyof typeof OFFICER_STATUS];
