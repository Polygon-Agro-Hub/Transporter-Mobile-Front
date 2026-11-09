export interface FormData {
  // Step 1: Personal & Job Info
  profilePhoto: string | null;
  languages: string[];
  jobRole: "Light Weight Driver" | "Heavy Weight Driver";
  firstName: string;
  lastName: string;
  phone1: string;
  phone2: string;
  nic: string;
  email: string;

  // Step 2: Residential & Bank Info
  houseNumber: string;
  streetName: string;
  city: string;
  country: string;
  district: string;
  province: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  confirmBankAccountNumber: string;
  bankName: string;
  bankBranch: string;

  // Optional legacy fields for backward compatibility
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;

  // Step 3: License & Insurance Info
  licenseNumber: string;
  confirmLicenseNumber: string;
  licenseFrontPhoto: string | null;
  licenseBackPhoto: string | null;
  insurancePolicyNumber: string;
  confirmInsurancePolicyNumber: string;
  insuranceExpiry: string;
  insuranceFrontPhoto: string | null;
  insuranceBackPhoto: string | null;

  licenseExpiry?: string;
  licenseCategories?: string[];
  insuranceProvider?: string;
  insuranceCoverageType?: string;
  insuranceCardPhoto?: string | null;

  // Step 4: Vehicle Info
  vehicleNumber: string;
  confirmVehicleNumber: string;
  vehicleType: string;
  vehicleCapacity: string;
  vehicleFrontPhoto: string | null;
  vehicleBackPhoto: string | null;
  vehicleLeftSidePhoto: string | null;
  vehicleRightSidePhoto: string | null;
  agreeDeclaration: boolean;

  vehicleModel?: string;
  fuelType?: string;
  ownershipType?: string;
  revenueLicenseNumber?: string;
  revenueExpiry?: string;
  revenuePhoto?: string | null;
  vehiclePhoto?: string | null;
  agreeTerms?: boolean;
}

export const INITIAL_FORM_DATA: FormData = {
  profilePhoto: null,
  languages: ["English"],
  jobRole: "Light Weight Driver",
  firstName: "",
  lastName: "",
  phone1: "",
  phone2: "",
  nic: "",
  email: "",

  houseNumber: "",
  streetName: "",
  city: "",
  country: "Sri Lanka",
  district: "",
  province: "Western Province",
  bankAccountHolder: "",
  bankAccountNumber: "",
  confirmBankAccountNumber: "",
  bankName: "",
  bankBranch: "",

  licenseNumber: "",
  confirmLicenseNumber: "",
  licenseFrontPhoto: null,
  licenseBackPhoto: null,
  insurancePolicyNumber: "",
  confirmInsurancePolicyNumber: "",
  insuranceExpiry: "",
  insuranceFrontPhoto: null,
  insuranceBackPhoto: null,

  vehicleNumber: "",
  confirmVehicleNumber: "",
  vehicleType: "Three Wheeler",
  vehicleCapacity: "500 kg",
  vehicleFrontPhoto: null,
  vehicleBackPhoto: null,
  vehicleLeftSidePhoto: null,
  vehicleRightSidePhoto: null,
  agreeDeclaration: false,
};

export const THEME = {
  primaryYellow: "#F7CA21",
  primaryYellowHover: "#E5B813",
  bgDark: "#191919",
  cardBg: "#191919",
  cardBorder: "#2E2E2E",
  inputBg: "#232326",
  inputBorder: "#38383C",
  inputBorderError: "#EF4444",
  textWhite: "#FFFFFF",
  textMuted: "#9CA3AF",
  textSub: "#71717A",
  successGreen: "#10B981",
};

export interface StepProps {
  formData: FormData;
  errors: Record<string, string>;
  updateField: (field: keyof FormData, value: any) => void;
  toggleArrayItem?: (field: "languages" | "licenseCategories", item: string) => void;
  openImagePicker: (field: keyof FormData) => void;
}
