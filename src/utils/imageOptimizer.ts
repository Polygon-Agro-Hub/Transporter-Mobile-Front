import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const COMPRESSION_THRESHOLD_BYTES = 1.5 * 1024 * 1024; // 1.5MB

/**
 * Gets the file size in bytes for a local image URI.
 */
export const getImageFileSizeBytes = async (uri: string): Promise<number> => {
  if (!uri || uri.startsWith("http://") || uri.startsWith("https://")) {
    return 0;
  }

  try {
    if (Platform.OS !== "web" && FileSystem?.getInfoAsync) {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && typeof info.size === "number") {
        return info.size;
      }
    } else {
      const res = await fetch(uri);
      const blob = await res.blob();
      return blob.size;
    }
  } catch (err) {
    console.warn("[imageOptimizer] Could not get file size:", err);
  }
  return 0;
};

/**
 * Optimizes an image:
 * - If size > 1.5MB or if it's HEIC/HEIF or raw camera resolution, compresses and resizes down (max width 1600px, quality 0.8 JPEG).
 * - If still large, reduces further to guarantee smooth upload.
 * - Enforces that the final image does not exceed the 10MB limit.
 */
export const optimizeImageForUpload = async (uri: string): Promise<string> => {
  if (!uri || uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  try {
    const originalSize = await getImageFileSizeBytes(uri);
    const isHeic = /\.(heic|heif)$/i.test(uri.split("?")[0]);
    const isLarge = originalSize > COMPRESSION_THRESHOLD_BYTES;

    // If small and standard format, return directly
    if (!isLarge && !isHeic && originalSize > 0 && originalSize <= MAX_IMAGE_SIZE_BYTES) {
      return uri;
    }

    // Step 1: Compress & resize to max width 1600px with 0.8 JPEG quality
    const actions: ImageManipulator.Action[] = [{ resize: { width: 1600 } }];
    const pass1 = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    let currentUri = pass1.uri;
    let currentSize = await getImageFileSizeBytes(currentUri);

    // Step 2: If still > 10MB, compress aggressively (width 1200px, quality 0.6)
    if (currentSize > MAX_IMAGE_SIZE_BYTES) {
      const pass2 = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ resize: { width: 1200 } }],
        {
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      currentUri = pass2.uri;
      currentSize = await getImageFileSizeBytes(currentUri);
    }

    // Final check against the 10MB limit
    if (currentSize > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("Image file size exceeds the 10MB limit. Please select a smaller photo.");
    }

    return currentUri;
  } catch (err: any) {
    if (err?.message?.includes("10MB limit")) {
      throw err;
    }
    console.warn("[imageOptimizer] Optimization error, continuing with original URI:", err?.message || err);
    return uri;
  }
};

