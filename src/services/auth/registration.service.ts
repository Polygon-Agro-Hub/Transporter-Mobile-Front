import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import axios from "axios";
import environment from "@/environment/environment";
import { FormData } from "@/screens/common/auth/registration/types";
import { optimizeImageForUpload } from "@/utils/imageOptimizer";

const getBaseApiUrl = (): string => {
  const base = environment.API_BASE_URL || "";
  return base.endsWith("/") ? base : `${base}/`;
};

/**
 * Upload a document or photo to Cloudflare R2 via backend.
 * Uses native FileSystem.uploadAsync on mobile devices for 100% reliable multipart upload.
 * If URI is already a remote URL (http/https), returns it as-is.
 */
export const uploadRegistrationDocument = async (
  uri: string,
  category: "profile" | "license" | "insurance" | "vehicle" | "documents" = "documents"
): Promise<string> => {
  if (!uri) return "";

  // If already uploaded to R2 or remote, skip uploading
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  // Optimize and reduce size before upload (and verify <= 10MB limit)
  const targetUri = await optimizeImageForUpload(uri);

  const apiUrl = `${getBaseApiUrl()}api/auth/upload-doc`;

  const uriParts = targetUri.split("/");
  const filename = uriParts[uriParts.length - 1] || "upload.jpg";
  const match = /\.(\w+)(?:\?.*)?$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : "jpg";

  const allowedExts = ["jpg", "jpeg", "png", "heic", "heif"];
  if (!allowedExts.includes(ext)) {
    throw new Error("Only .jpg, .jpeg, .png, and .heic files are allowed.");
  }

  const mimeType =
    ext === "png"
      ? "image/png"
      : ext === "heic" || ext === "heif"
      ? "image/heic"
      : "image/jpeg";

  // On native mobile (Android / iOS), FileSystem.uploadAsync directly streams files
  // without React Native JS bridge FormData boundary issues
  if (Platform.OS !== "web" && FileSystem?.uploadAsync) {
    try {
      const uploadResult = await FileSystem.uploadAsync(apiUrl, targetUri, {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "file",
        mimeType,
        parameters: {
          category,
        },
      });

      if (uploadResult.status >= 200 && uploadResult.status < 300) {
        const parsed = JSON.parse(uploadResult.body);
        if (parsed.success && parsed.data?.url) {
          return parsed.data.url;
        }
        throw new Error(parsed.message || "Failed to upload document");
      } else {
        let errMsg = `Server returned status ${uploadResult.status}`;
        try {
          const parsed = JSON.parse(uploadResult.body);
          if (parsed.message) errMsg = parsed.message;
        } catch {}
        throw new Error(errMsg);
      }
    } catch (err: any) {
      console.warn(`[FileSystem.uploadAsync] Error uploading ${category}:`, err?.message || err);
      throw err;
    }
  }

  // Web fallback using standard fetch + FormData
  const formData = new FormData();
  formData.append("file", {
    uri: targetUri,
    name: filename,
    type: mimeType,
  } as any);
  formData.append("category", category);

  const response = await fetch(apiUrl, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (response.ok && data.success && data.data?.url) {
    return data.data.url;
  }

  throw new Error(data.message || "Failed to upload document");
};

/**
 * Submit the complete driver registration form to the backend
 */
export const submitDriverRegistration = async (
  formData: FormData,
  onProgress?: (message: string) => void
): Promise<{ success: boolean; referenceId: string; message: string }> => {
  const apiUrl = `${getBaseApiUrl()}api/auth/register-driver`;

  // 1. Ensure any remaining local file URIs are uploaded to R2
  onProgress?.("Uploading documents...");

  const uploadIfLocal = async (
    uri: string | null | undefined,
    category: "profile" | "license" | "insurance" | "vehicle"
  ): Promise<string | null> => {
    if (!uri) return null;
    if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
    try {
      return await uploadRegistrationDocument(uri, category);
    } catch (err: any) {
      console.warn(`Failed to upload ${category} image:`, err?.message || err);
      const detail = err?.message || "Please check your network connection.";
      throw new Error(`Failed to upload ${category} document: ${detail}`);
    }
  };

  const [
    profilePhotoUrl,
    licFrontUrl,
    licBackUrl,
    insFrontUrl,
    insBackUrl,
    vehFrontUrl,
    vehBackUrl,
    vehLeftUrl,
    vehRightUrl,
  ] = await Promise.all([
    uploadIfLocal(formData.profilePhoto, "profile"),
    uploadIfLocal(formData.licenseFrontPhoto, "license"),
    uploadIfLocal(formData.licenseBackPhoto, "license"),
    uploadIfLocal(formData.insuranceFrontPhoto, "insurance"),
    uploadIfLocal(formData.insuranceBackPhoto, "insurance"),
    uploadIfLocal(formData.vehicleFrontPhoto, "vehicle"),
    uploadIfLocal(formData.vehicleBackPhoto, "vehicle"),
    uploadIfLocal(formData.vehicleLeftSidePhoto, "vehicle"),
    uploadIfLocal(formData.vehicleRightSidePhoto, "vehicle"),
  ]);

  onProgress?.("Submitting application...");

  // 2. Prepare structured JSON payload
  const payload = {
    personal: {
      firstName: (formData.firstName || "").trim(),
      lastName: (formData.lastName || "").trim(),
      phone1: (formData.phone1 || "").replace(/\s+/g, "").replace(/^0+/, ""),
      phone2: (formData.phone2 || "").replace(/\s+/g, "").replace(/^0+/, ""),
      nic: (formData.nic || "").trim().toUpperCase(),
      email: (formData.email || "").trim(),
      languages: formData.languages || ["English"],
      jobRole: formData.jobRole || "Light Weight Driver",
      profilePhoto: profilePhotoUrl,
    },
    residential: {
      houseNumber: (formData.houseNumber || "").trim(),
      streetName: (formData.streetName || "").trim(),
      city: (formData.city || "").trim(),
      district: (formData.district || "").trim(),
      province: (formData.province || "").trim(),
      country: formData.country || "Sri Lanka",
    },
    bank: {
      bankAccountHolder: (formData.bankAccountHolder || "").trim(),
      bankAccountNumber: (formData.bankAccountNumber || "").trim(),
      bankName: (formData.bankName || "").trim(),
      bankBranch: (formData.bankBranch || "").trim(),
    },
    license: {
      licenseNumber: (formData.licenseNumber || "").trim().toUpperCase(),
      licenseFrontPhoto: licFrontUrl,
      licenseBackPhoto: licBackUrl,
    },
    insurance: {
      insurancePolicyNumber: (formData.insurancePolicyNumber || "").trim(),
      insuranceExpiry: (formData.insuranceExpiry || "").trim(),
      insuranceFrontPhoto: insFrontUrl,
      insuranceBackPhoto: insBackUrl,
    },
    vehicle: {
      vehicleNumber: (formData.vehicleNumber || "").trim().toUpperCase(),
      vehicleType: (formData.vehicleType || "").trim(),
      vehicleCapacity: formData.vehicleCapacity || 0,
      vehicleFrontPhoto: vehFrontUrl,
      vehicleBackPhoto: vehBackUrl,
      vehicleLeftSidePhoto: vehLeftUrl,
      vehicleRightSidePhoto: vehRightUrl,
    },
  };

  const response = await axios.post(apiUrl, payload, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  if (response.data && response.data.success) {
    return {
      success: true,
      referenceId:
        response.data.data?.referenceId ||
        `REG-DRV-${String(response.data.data?.coId || "").padStart(5, "0")}`,
      message: response.data.message || "Driver application submitted successfully",
    };
  }

  throw new Error(response.data?.message || "Registration failed");
};

export default {
  uploadRegistrationDocument,
  submitDriverRegistration,
};
