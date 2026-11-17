import AsyncStorage from "@react-native-async-storage/async-storage";
import { FormData, INITIAL_FORM_DATA } from "./types";

const SQLITE_DB_NAME = "govi_transport_registration.db";
const ASYNC_STORAGE_FALLBACK_KEY = "@govi_transport_registration_draft_sqlite";

export interface RegistrationDraftRecord {
  id: number;
  currentStep: number;
  formData: FormData;
  updatedAt: string;
}

let sqliteModule: any = null;
let sqliteDbInstance: any = null;
let isSqliteInitialized = false;

// Safe dynamic detection of expo-sqlite so playstore builds are never affected
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sqliteModule = require("expo-sqlite");
} catch {
  sqliteModule = null;
}

/**
 * Initializes SQLite database table if expo-sqlite is available
 */
export async function initRegistrationDatabase(): Promise<boolean> {
  if (isSqliteInitialized && sqliteDbInstance) return true;
  if (!sqliteModule || typeof sqliteModule.openDatabaseAsync !== "function") {
    return false;
  }

  try {
    sqliteDbInstance = await sqliteModule.openDatabaseAsync(SQLITE_DB_NAME);
    await sqliteDbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS registration_draft (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_step INTEGER NOT NULL,
        form_data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    isSqliteInitialized = true;
    return true;
  } catch (err) {
    console.warn("[SQLite] Failed to initialize SQLite table, fallback active:", err);
    sqliteDbInstance = null;
    return false;
  }
}

/**
 * Save draft data to SQLite (disabled to ensure registration always starts fresh on reload)
 */
export async function saveRegistrationDraft(
  _currentStep: number,
  _formData: FormData
): Promise<void> {
  // Intentionally no-op: Drafts are not persisted so registration always starts fresh on reload.
}

/**
 * Load draft data from SQLite (always returns null so registration starts fresh)
 */
export async function loadRegistrationDraft(): Promise<{
  currentStep: number;
  formData: FormData;
} | null> {
  // Always return null: Registration form must be reset and start fresh on reload.
  return null;
}

/**
 * Clear draft data from SQLite and fallback storage
 */
export async function clearRegistrationDraft(): Promise<void> {
  try {
    const isReady = await initRegistrationDatabase();
    if (isReady && sqliteDbInstance) {
      await sqliteDbInstance.runAsync(`DELETE FROM registration_draft WHERE id = 1;`);
    }
  } catch (err) {
    console.warn("[SQLite] Delete error:", err);
  }

  try {
    await AsyncStorage.removeItem(ASYNC_STORAGE_FALLBACK_KEY);
  } catch (err) {
    console.warn("[Storage] Failed to clear draft fallback:", err);
  }
}

/**
 * Helper to check whether any fields have been filled by user
 */
export function isFormDirty(formData: FormData): boolean {
  if (!formData) return false;
  return (
    Boolean(formData.profilePhoto) ||
    Boolean(formData.firstName?.trim()) ||
    Boolean(formData.lastName?.trim()) ||
    Boolean(formData.phone1?.trim()) ||
    Boolean(formData.phone2?.trim()) ||
    Boolean(formData.nic?.trim()) ||
    Boolean(formData.email?.trim()) ||
    Boolean(formData.houseNumber?.trim()) ||
    Boolean(formData.streetName?.trim()) ||
    Boolean(formData.city?.trim()) ||
    Boolean(formData.district?.trim()) ||
    Boolean(formData.bankAccountHolder?.trim()) ||
    Boolean(formData.bankAccountNumber?.trim()) ||
    Boolean(formData.confirmBankAccountNumber?.trim()) ||
    Boolean(formData.bankName?.trim()) ||
    Boolean(formData.bankBranch?.trim()) ||
    Boolean(formData.licenseNumber?.trim()) ||
    Boolean(formData.confirmLicenseNumber?.trim()) ||
    Boolean(formData.licenseFrontPhoto) ||
    Boolean(formData.licenseBackPhoto) ||
    Boolean(formData.insurancePolicyNumber?.trim()) ||
    Boolean(formData.confirmInsurancePolicyNumber?.trim()) ||
    Boolean(formData.insuranceExpiry?.trim()) ||
    Boolean(formData.insuranceFrontPhoto) ||
    Boolean(formData.insuranceBackPhoto) ||
    Boolean(formData.vehicleNumber?.trim()) ||
    Boolean(formData.confirmVehicleNumber?.trim()) ||
    Boolean(formData.vehicleFrontPhoto) ||
    Boolean(formData.vehicleBackPhoto) ||
    Boolean(formData.vehicleLeftSidePhoto) ||
    Boolean(formData.vehicleRightSidePhoto) ||
    Boolean(formData.agreeDeclaration)
  );
}
