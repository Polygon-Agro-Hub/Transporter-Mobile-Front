export const ROLES = {
  LIGHT_WEIGHT_DRIVER: "Light Weight Driver",
  HEAVY_WEIGHT_DRIVER: "Heavy Weight Driver",
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
