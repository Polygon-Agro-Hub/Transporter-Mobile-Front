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
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  bankAccountHolder: string;
  bankName: string;
  bankBranch: string;
  bankAccountNumber: string;
  confirmBankAccountNumber: string;

  // Step 3: License & Insurance Info
  licenseNumber: string;
  licenseExpiry: string;
  licenseCategories: string[];
  licenseFrontPhoto: string | null;
  licenseBackPhoto: string | null;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceCoverageType: string;
  insuranceExpiry: string;
  insuranceCardPhoto: string | null;

  // Step 4: Vehicle Info
  vehicleNumber: string;
  vehicleModel: string;
  fuelType: string;
  ownershipType: string;
  revenueLicenseNumber: string;
  revenueExpiry: string;
  revenuePhoto: string | null;
  vehiclePhoto: string | null;
  agreeTerms: boolean;
  agreeDeclaration: boolean;
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

  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "Gampaha",
  postalCode: "",
  emergencyName: "",
  emergencyRelationship: "Spouse",
  emergencyPhone: "",
  bankAccountHolder: "",
  bankName: "Commercial Bank",
  bankBranch: "",
  bankAccountNumber: "",
  confirmBankAccountNumber: "",

  licenseNumber: "",
  licenseExpiry: "",
  licenseCategories: ["Light Vehicles (B/B1)"],
  licenseFrontPhoto: null,
  licenseBackPhoto: null,
  insuranceProvider: "Sri Lanka Insurance",
  insurancePolicyNumber: "",
  insuranceCoverageType: "Comprehensive",
  insuranceExpiry: "",
  insuranceCardPhoto: null,

  vehicleNumber: "",
  vehicleModel: "",
  fuelType: "Diesel",
  ownershipType: "Owned",
  revenueLicenseNumber: "",
  revenueExpiry: "",
  revenuePhoto: null,
  vehiclePhoto: null,
  agreeTerms: false,
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
