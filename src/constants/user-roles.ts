export const ROLES = {
  LIGHT_WEIGHT_DRIVER: "Light Weight Driver",
  HEAVY_WEIGHT_DRIVER: "Heavy Weight Driver",
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const normalizeDriverRole = (role?: string | null): string => {
  if (role === ROLES.HEAVY_WEIGHT_DRIVER) {
    return ROLES.HEAVY_WEIGHT_DRIVER;
  }
  return ROLES.LIGHT_WEIGHT_DRIVER;
};
