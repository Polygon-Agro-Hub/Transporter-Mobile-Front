import { useState, useEffect } from "react";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

const sizeCache = new Map<string, string>();

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Associate the known file size of a local URI with its remote uploaded URL.
 */
export const linkRemoteFileSize = (localUri: string, remoteUrl: string) => {
  if (localUri && remoteUrl && sizeCache.has(localUri)) {
    sizeCache.set(remoteUrl, sizeCache.get(localUri)!);
  }
};

/**
 * Manually cache a size for a given URI.
 */
export const setCachedFileSize = (uri: string, formattedSize: string) => {
  if (uri && formattedSize) {
    sizeCache.set(uri, formattedSize);
  }
};

/**
 * Hook to retrieve formatted file size of a local or remote image URI.
 * Uses native FileSystem.getInfoAsync for local files (preventing React Native fetch(file://) 20B/40B bug).
 */
export const useFileSize = (uri?: string | null): string => {
  const [size, setSize] = useState<string>(() => {
    if (uri && sizeCache.has(uri)) {
      return sizeCache.get(uri)!;
    }
    return "";
  });

  useEffect(() => {
    let cancelled = false;
    if (!uri) {
      setSize("");
      return;
    }

    if (sizeCache.has(uri)) {
      setSize(sizeCache.get(uri)!);
      return;
    }

    (async () => {
      try {
        let bytes = 0;

        // 1. If local file URI on native mobile (file:// or content://), use FileSystem.getInfoAsync
        if (
          Platform.OS !== "web" &&
          FileSystem?.getInfoAsync &&
          !uri.startsWith("http://") &&
          !uri.startsWith("https://")
        ) {
          const info = await FileSystem.getInfoAsync(uri);
          if (info.exists && typeof info.size === "number" && info.size > 0) {
            bytes = info.size;
          }
        }

        // 2. If remote URL (http:// or https://)
        if (!bytes && (uri.startsWith("http://") || uri.startsWith("https://"))) {
          try {
            const headRes = await fetch(uri, { method: "HEAD" });
            const len = headRes.headers.get("content-length");
            if (len && parseInt(len, 10) > 0) {
              bytes = parseInt(len, 10);
            }
          } catch {}

          if (!bytes) {
            try {
              const res = await fetch(uri);
              const blob = await res.blob();
              if (blob && blob.size > 0) {
                bytes = blob.size;
              }
            } catch {}
          }
        }

        // 3. Fallback for web or blob URLs
        if (!bytes && Platform.OS === "web") {
          try {
            const res = await fetch(uri);
            const blob = await res.blob();
            if (blob && blob.size > 0) {
              bytes = blob.size;
            }
          } catch {}
        }

        if (bytes > 0 && !cancelled) {
          const formatted = formatBytes(bytes);
          sizeCache.set(uri, formatted);
          setSize(formatted);
        }
      } catch (err) {
        if (!cancelled) setSize("");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return size;
};

