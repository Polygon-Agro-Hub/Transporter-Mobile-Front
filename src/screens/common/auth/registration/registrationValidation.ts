import { FormData } from "./types";
import { getEmailError } from "./Step1PersonalInfo";

/**
 * File extension validation for document and photo uploads.
 * Allowed: .jpg, .jpeg, .png, .heic, .heif
 */
export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "heic", "heif"];

export const isAllowedImageUri = (uri: string | null | undefined): boolean => {
  if (!uri) return false;
  // If remote URL, allow
  if (uri.startsWith("http://") || uri.startsWith("https://")) return true;
  const filename = uri.split("?")[0].split("/").pop() || "";
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : "jpg";
  return ALLOWED_IMAGE_EXTENSIONS.includes(ext);
};

/**
 * Driving License ID Validation:
 * - Minimum length: 7 characters
 * - Maximum length: 9 characters (depending on licence series)
 * - Characters: Alphanumeric
 * - Letters: English uppercase letters
 * - Special characters: Allow
 * - Spaces: Not allowed
 * Examples supported:
 *   - Older format: B1234567 (1 letter + 7 digits = 8 chars)
 *   - Documented format: A123456 (1 letter + 6 digits = 7 chars)
 *   - Newer series: 85-12345 (8 chars) / 85-123456 (9 chars)
 */
export const getDrivingLicenseError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) {
    return "Driving license ID is required";
  }
  if (/\s/.test(value)) {
    return "Spaces are not allowed";
  }
  if (value.length < 7) {
    return "Minimum length is 7 characters";
  }
  if (value.length > 9) {
    return "Maximum length is 9 characters";
  }
  if (/[a-z]/.test(value)) {
    return "Only English uppercase letters are allowed";
  }
  return "";
};

export const getConfirmDrivingLicenseError = (
  confirmVal: string | undefined | null,
  licenseVal: string | undefined | null
): string => {
  if (!confirmVal || confirmVal.trim().length === 0) {
    return "Confirm Driving license ID is required";
  }
  if ((confirmVal || "").trim().toUpperCase() !== (licenseVal || "").trim().toUpperCase()) {
    return "Driving license IDs do not match";
  }
  return "";
};

/**
 * Vehicle Registration Number Validation:
 * - Minimum length: 5 characters
 * - Maximum length: 10 characters
 * - Allowed characters: Uppercase English letters (A–Z), digits (0–9)
 * - Special characters: Hyphen (-)
 * - Spaces: Not allowed
 */
export const getVehicleNumberError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) {
    return "Vehicle registration number is required";
  }
  if (/\s/.test(value)) {
    return "Spaces are not allowed";
  }
  if (value.length < 5) {
    return "Minimum length is 5 characters";
  }
  if (value.length > 10) {
    return "Maximum length is 10 characters";
  }
  if (!/^[A-Z0-9-]+$/.test((value || "").toUpperCase())) {
    return "Only uppercase English letters (A–Z), digits (0–9), and hyphens (-) are allowed";
  }
  return "";
};

export const getConfirmVehicleNumberError = (
  confirmVal: string | undefined | null,
  vehicleVal: string | undefined | null
): string => {
  if (!confirmVal || confirmVal.trim().length === 0) {
    return "Confirm Registration Number is required";
  }
  if ((confirmVal || "").trim().toUpperCase() !== (vehicleVal || "").trim().toUpperCase()) {
    return "Vehicle registration numbers do not match";
  }
  return "";
};

/**
 * Personal Info Validations (Step 1)
 */
export const getFirstNameError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) return "First name is required";
  return "";
};

export const getLastNameError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) return "Last name is required";
  return "";
};

/**
 * Phone number validation:
 * - Format: 7######## (exactly 9 digits starting with 7)
 * - Leading 0 is stripped
 */
export const getPhone1Error = (value: string | undefined | null): string => {
  const clean = (value || "").replace(/\s/g, "").replace(/^0+/, "");
  if (!clean) {
    return "Primary phone number is required";
  }
  if (!clean.startsWith("7")) {
    return "Phone number must start with 7 (e.g. 7XXXXXXXX)";
  }
  if (clean.length !== 9) {
    return "Phone number must be exactly 9 digits (7XXXXXXXX)";
  }
  if (!/^7\d{8}$/.test(clean)) {
    return "Please enter a valid 9-digit phone number starting with 7";
  }
  return "";
};

export const getPhone2Error = (value: string | undefined | null): string => {
  const clean = (value || "").replace(/\s/g, "").replace(/^0+/, "");
  if (!clean) {
    return ""; // Optional
  }
  if (!clean.startsWith("7")) {
    return "Phone number must start with 7 (e.g. 7XXXXXXXX)";
  }
  if (clean.length !== 9) {
    return "Phone number must be exactly 9 digits (7XXXXXXXX)";
  }
  if (!/^7\d{8}$/.test(clean)) {
    return "Please enter a valid 9-digit phone number starting with 7";
  }
  return "";
};

export const getNICError = (value: string | undefined | null): string => {
  const clean = (value || "").trim().toUpperCase();
  if (!clean) return "National Identity Card (NIC) is required";
  const oldNic = /^[0-9]{9}[VvXx]$/;
  const newNic = /^[0-9]{12}$/;
  if (!oldNic.test(clean) && !newNic.test(clean)) {
    return "Enter 9 digits + V (e.g. 123456789V) or 12 digits";
  }
  return "";
};

/**
 * Residential & Bank Validations (Step 2)
 */
export const getHouseNumberError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) return "House / Plot Number is required";
  return "";
};

export const getStreetNameError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) return "Street Name is required";
  return "";
};

export const getDistrictError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) return "District is required";
  return "";
};

export const getBankAccountHolderError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) return "Account holder name is required";
  return "";
};

export const getBankAccountNumberError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) return "Account number is required";
  return "";
};

export const getConfirmBankAccountNumberError = (
  confirmVal: string | undefined | null,
  accountVal: string | undefined | null
): string => {
  if (!confirmVal || confirmVal.trim().length === 0) return "Confirm Account number is required";
  if (confirmVal.trim() !== (accountVal || "").trim()) return "Account numbers do not match";
  return "";
};

export const getBankNameError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) return "Bank name is required";
  return "";
};

export const getBankBranchError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) return "Branch name is required";
  return "";
};

/**
 * Insurance Validations (Step 3)
 * - Minimum length: 5 characters
 * - Maximum length: 30 characters
 * - Allowed characters: Alphanumeric
 * - Special characters: Hyphen (-) and slash (/)
 * - Spaces: Not allowed
 */
export const getInsurancePolicyNumberError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) {
    return "Insurance Policy Number is required.";
  }
  if (/\s/.test(value)) {
    return "Spaces are not allowed";
  }
  if (value.length < 5) {
    return "Minimum length is 5 characters";
  }
  if (value.length > 30) {
    return "Maximum length is 30 characters";
  }
  if (!/^[A-Za-z0-9\/-]+$/.test(value)) {
    return "Only alphanumeric characters, hyphens (-), and slashes (/) are allowed";
  }
  return "";
};

export const getConfirmInsurancePolicyNumberError = (
  confirmVal: string | undefined | null,
  policyVal: string | undefined | null
): string => {
  if (!confirmVal || confirmVal.trim().length === 0) return "Confirm Insurance Number is required";
  if ((confirmVal || "").trim().toUpperCase() !== (policyVal || "").trim().toUpperCase()) {
    return "Insurance policy numbers do not match";
  }
  return "";
};

export const getInsuranceExpiryError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) return "Insurance expiry date is required";
  return "";
};

/**
 * Vehicle Selection & Declaration Validations (Step 4)
 */
export const getVehicleTypeError = (value: string | undefined | null): string => {
  if (!value || value.trim().length === 0) return "Please select a vehicle type";
  return "";
};

export const getVehicleFrontPhotoError = (value: string | undefined | null): string => {
  if (!value) return "Front image of vehicle is required";
  return "";
};

export const getVehicleBackPhotoError = (value: string | undefined | null): string => {
  if (!value) return "Back image of vehicle is required";
  return "";
};

export const getVehicleLeftSidePhotoError = (value: string | undefined | null): string => {
  if (!value) return "Left side image of vehicle is required";
  return "";
};

export const getVehicleRightSidePhotoError = (value: string | undefined | null): string => {
  if (!value) return "Right side image of vehicle is required";
  return "";
};

export const getAgreeDeclarationError = (value: boolean | undefined | null): string => {
  if (!value) return "You must confirm this declaration";
  return "";
};

/**
 * Instance-by-instance live validation router.
 * Evaluates the modified field and any tightly coupled confirmation field.
 */
export const validateFieldLive = (
  field: keyof FormData,
  value: any,
  allData: FormData
): { fieldError: string; relatedUpdates?: Record<string, string> } => {
  let fieldError = "";
  const relatedUpdates: Record<string, string> = {};

  switch (field) {
    // Step 1
    case "firstName":
      fieldError = getFirstNameError(value);
      break;
    case "lastName":
      fieldError = getLastNameError(value);
      break;
    case "phone1":
      fieldError = getPhone1Error(value);
      break;
    case "phone2":
      fieldError = getPhone2Error(value);
      break;
    case "nic":
      fieldError = getNICError(value);
      break;
    case "email":
      fieldError = getEmailError(value ?? "");
      break;

    // Step 2
    case "houseNumber":
      fieldError = getHouseNumberError(value);
      break;
    case "streetName":
      fieldError = getStreetNameError(value);
      break;
    case "district":
      fieldError = getDistrictError(value);
      break;
    case "bankAccountHolder":
      fieldError = getBankAccountHolderError(value);
      break;
    case "bankAccountNumber":
      fieldError = getBankAccountNumberError(value);
      if (allData.confirmBankAccountNumber) {
        relatedUpdates.confirmBankAccountNumber = getConfirmBankAccountNumberError(
          allData.confirmBankAccountNumber,
          value
        );
      }
      break;
    case "confirmBankAccountNumber":
      fieldError = getConfirmBankAccountNumberError(value, allData.bankAccountNumber);
      break;
    case "bankName":
      fieldError = getBankNameError(value);
      break;
    case "bankBranch":
      fieldError = getBankBranchError(value);
      break;

    // Step 3
    case "licenseNumber":
      fieldError = getDrivingLicenseError(value);
      if (allData.confirmLicenseNumber) {
        relatedUpdates.confirmLicenseNumber = getConfirmDrivingLicenseError(
          allData.confirmLicenseNumber,
          value
        );
      }
      break;
    case "confirmLicenseNumber":
      fieldError = getConfirmDrivingLicenseError(value, allData.licenseNumber);
      break;
    case "insurancePolicyNumber":
      fieldError = getInsurancePolicyNumberError(value);
      if (allData.confirmInsurancePolicyNumber) {
        relatedUpdates.confirmInsurancePolicyNumber = getConfirmInsurancePolicyNumberError(
          allData.confirmInsurancePolicyNumber,
          value
        );
      }
      break;
    case "confirmInsurancePolicyNumber":
      fieldError = getConfirmInsurancePolicyNumberError(value, allData.insurancePolicyNumber);
      break;
    case "insuranceExpiry":
      fieldError = getInsuranceExpiryError(value);
      break;
    case "licenseFrontPhoto":
      if (!value) fieldError = "Front image of driving license is required";
      break;
    case "licenseBackPhoto":
      if (!value) fieldError = "Back image of driving license is required";
      break;
    case "insuranceFrontPhoto":
      if (!value) fieldError = "Front image of insurance certificate is required";
      break;
    case "insuranceBackPhoto":
      if (!value) fieldError = "Back image of insurance certificate is required";
      break;

    // Step 4
    case "vehicleNumber":
      fieldError = getVehicleNumberError(value);
      if (allData.confirmVehicleNumber) {
        relatedUpdates.confirmVehicleNumber = getConfirmVehicleNumberError(
          allData.confirmVehicleNumber,
          value
        );
      }
      break;
    case "confirmVehicleNumber":
      fieldError = getConfirmVehicleNumberError(value, allData.vehicleNumber);
      break;
    case "vehicleType":
      fieldError = getVehicleTypeError(value);
      break;
    case "vehicleFrontPhoto":
      fieldError = getVehicleFrontPhotoError(value);
      break;
    case "vehicleBackPhoto":
      fieldError = getVehicleBackPhotoError(value);
      break;
    case "vehicleLeftSidePhoto":
      fieldError = getVehicleLeftSidePhotoError(value);
      break;
    case "vehicleRightSidePhoto":
      fieldError = getVehicleRightSidePhotoError(value);
      break;
    case "agreeDeclaration":
      fieldError = getAgreeDeclarationError(value);
      break;

    default:
      fieldError = "";
      break;
  }

  return { fieldError, relatedUpdates };
};

