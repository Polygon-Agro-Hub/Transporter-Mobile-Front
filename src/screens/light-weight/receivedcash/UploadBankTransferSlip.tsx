import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  StatusBar,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { useNavigation, useRoute } from "@react-navigation/native";
import CustomHeader from "@/component/common/CustomHeader";
import { formatNumberWithCommas } from "@/utils/formatNumberWithCommas";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PdfViewer from "./PdfViewer";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AlertModal } from "@/component/common/AlertModal";

type UploadBankTransferSlipNavigationProp = StackNavigationProp<
  RootStackParamList,
  "UploadBankTransferSlip"
>;

const TRANSFER_DETAILS = {
  accountName: "Polygon Holdings Pvt Ltd",
  accountNumber: "701020161763",
  bankName: "Hatton National Bank",
  branchName: "Colombo Metro",
};

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type FileType = "image" | "pdf";

interface UploadedFile {
  uri: string;
  name: string;
  sizeMB: string;
  type: FileType;
}

const sanitizeFileName = (
  rawName: string | null | undefined,
  uri: string,
  fallback: string,
): string => {
  let candidate = rawName;
  if (!candidate || candidate.trim() === "") {
    const uriPart = uri.split("/").pop()?.split("?")[0];
    if (uriPart && uriPart.includes(".")) {
      candidate = uriPart;
    }
  }
  if (!candidate || candidate.trim() === "") {
    candidate = fallback;
  }
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // ignore decode error
  }
  return candidate.trim();
};

const UploadBankTransferSlip: React.FC = () => {
  const navigation = useNavigation<UploadBankTransferSlipNavigationProp>();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const routeParams = route.params as { amount?: number | string } | undefined;

  const rawAmount = routeParams?.amount;
  const parsedAmount =
    typeof rawAmount === "number"
      ? rawAmount
      : parseFloat(String(rawAmount ?? ""));

  const receivedAmount: number | null =
    !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : null;

  const [file, setFile] = useState<UploadedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("error");
  const onAlertCloseCallback = useRef<(() => void) | null>(null);

  const canSubmit = !!file && receivedAmount !== null && !submitting;
  const buttonActive = !!file && receivedAmount !== null;

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" = "error",
    onClose?: () => void,
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    onAlertCloseCallback.current = onClose || null;
    setAlertVisible(true);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    if (onAlertCloseCallback.current) {
      const cb = onAlertCloseCallback.current;
      onAlertCloseCallback.current = null;
      cb();
    }
  };

  const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf", "heic", "heif"];
  const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
    "image/heic",
    "image/heif",
    "image/heic-sequence",
    "image/heif-sequence",
  ];

  const isSupportedFileFormat = (
    fileName?: string | null,
    mimeType?: string | null,
    uri?: string | null,
  ): boolean => {
    const nameToCheck =
      (fileName || "").trim() ||
      (uri || "").split("/").pop()?.split("?")[0] ||
      "";
    const hasDot = nameToCheck.includes(".");
    const ext = hasDot ? nameToCheck.split(".").pop()?.toLowerCase() : "";

    // If an explicit extension exists, verify it against allowed list
    if (ext) {
      return ALLOWED_EXTENSIONS.includes(ext);
    }

    // If MIME type is present
    if (mimeType) {
      const lowerMime = mimeType.toLowerCase();
      if (ALLOWED_MIME_TYPES.includes(lowerMime)) {
        return true;
      }
      if (lowerMime.startsWith("image/")) {
        return true;
      }
    }

    return false;
  };

  const isHeicImage = (
    fileName?: string | null,
    mimeType?: string | null,
    uri?: string | null,
  ): boolean => {
    const name = (fileName || "").toLowerCase();
    const u = (uri || "").toLowerCase();
    const mime = (mimeType || "").toLowerCase();

    return (
      name.endsWith(".heic") ||
      name.endsWith(".heif") ||
      u.endsWith(".heic") ||
      u.endsWith(".heif") ||
      mime.includes("heic") ||
      mime.includes("heif")
    );
  };

  const getFileSizeBytes = async (
    uri: string,
    reportedSize?: number | null,
  ): Promise<number> => {
    if (typeof reportedSize === "number" && reportedSize > 0) {
      return reportedSize;
    }
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && typeof info.size === "number" && info.size > 0) {
        return info.size;
      }
    } catch (e) {
      console.log("Error checking file size:", e);
    }
    return 0;
  };

  const showInvalidFormatAlert = () => {
    showAlert(
      "Unsupported File Format",
      "Please upload a valid file. Only PNG, JPG, HEIC, and PDF formats are supported.",
      "error",
    );
  };

  const showFileTooLargeAlert = () => {
    showAlert(
      "File Too Large",
      "File is too large. Please upload an image or file smaller than 5 MB.",
      "error",
    );
  };

  const processImage = async (
    uri: string,
    fileName?: string | null,
    mimeType?: string | null,
    reportedSize?: number | null,
  ): Promise<UploadedFile | null> => {
    if (!isSupportedFileFormat(fileName, mimeType, uri)) {
      showInvalidFormatAlert();
      return null;
    }

    // Check original file size against 5 MB limit
    const originalSizeBytes = await getFileSizeBytes(uri, reportedSize);
    if (originalSizeBytes > MAX_FILE_SIZE_BYTES) {
      showFileTooLargeAlert();
      return null;
    }

    const fallbackName = `Transfer_Slip_${Date.now()}.jpg`;
    const cleanFileName = sanitizeFileName(fileName, uri, fallbackName);

    // If image is HEIC/HEIF, convert to JPEG so that mobile preview and upload work reliably
    if (isHeicImage(cleanFileName, mimeType, uri)) {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [],
          {
            format: ImageManipulator.SaveFormat.JPEG,
            compress: 0.9,
          },
        );

        const baseName = cleanFileName.replace(/\.[^/.]+$/, "");
        const safeJpgName = `${baseName.replace(/[^a-zA-Z0-9._-]/g, "_")}.jpg`;

        let sizeMB =
          originalSizeBytes > 0
            ? (originalSizeBytes / (1024 * 1024)).toFixed(1)
            : "—";

        try {
          const manipInfo = await FileSystem.getInfoAsync(manipResult.uri);
          if (manipInfo.exists && typeof manipInfo.size === "number" && manipInfo.size > 0) {
            sizeMB = (manipInfo.size / (1024 * 1024)).toFixed(1);
          }
        } catch {}

        return {
          uri: manipResult.uri,
          name: safeJpgName,
          sizeMB: `${sizeMB} MB`,
          type: "image",
        };
      } catch (convErr) {
        console.warn("Could not convert HEIC to JPEG on client, fallback to original:", convErr);
        // Fallback to original HEIC file since backend s3upload converts HEIC server-side
        const sizeMB =
          originalSizeBytes > 0
            ? (originalSizeBytes / (1024 * 1024)).toFixed(1)
            : "—";
        return {
          uri,
          name: cleanFileName,
          sizeMB: `${sizeMB} MB`,
          type: "image",
        };
      }
    }

    // For non-HEIC images (JPG, PNG), keep original format without inflating to PNG
    let sizeMB =
      originalSizeBytes > 0
        ? (originalSizeBytes / (1024 * 1024)).toFixed(1)
        : "—";

    if (sizeMB === "—") {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && typeof fileInfo.size === "number" && fileInfo.size > 0) {
          sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(1);
        }
      } catch (e) {
        console.log("File size check error:", e);
      }
    }

    return {
      uri,
      name: cleanFileName,
      sizeMB: `${sizeMB} MB`,
      type: "image",
    };
  };

  const takePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(
          "Permission Required",
          "Camera permission is required to capture your bank transfer slip.",
          "error",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const processed = await processImage(
          asset.uri,
          asset.fileName,
          asset.mimeType,
          asset.fileSize,
        );
        if (processed) {
          setFile(processed);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const processed = await processImage(
          asset.uri,
          asset.fileName,
          asset.mimeType,
          asset.fileSize,
        );
        if (processed) {
          setFile(processed);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];

      const isPdf =
        asset.mimeType === "application/pdf" ||
        asset.name?.toLowerCase().endsWith(".pdf") ||
        asset.uri.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        const originalSizeBytes = await getFileSizeBytes(asset.uri, asset.size);
        if (originalSizeBytes > MAX_FILE_SIZE_BYTES) {
          showFileTooLargeAlert();
          return;
        }

        const safeName = sanitizeFileName(
          asset.name,
          asset.uri,
          `Transfer_Slip_${Date.now()}.pdf`,
        );

        let finalUri = asset.uri;
        try {
          const localUri = `${FileSystem.cacheDirectory}${safeName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          await FileSystem.copyAsync({
            from: asset.uri,
            to: localUri,
          });
          finalUri = localUri;
        } catch (err) {
          console.error("Failed to copy PDF file:", err);
        }

        let sizeMB =
          originalSizeBytes > 0
            ? (originalSizeBytes / (1024 * 1024)).toFixed(1)
            : "—";

        if (sizeMB === "—") {
          try {
            const info = await FileSystem.getInfoAsync(finalUri);
            if (info.exists && typeof info.size === "number" && info.size > 0) {
              sizeMB = (info.size / (1024 * 1024)).toFixed(1);
            }
          } catch (err) {
            console.error("Failed to check file size:", err);
          }
        }

        setFile({
          uri: finalUri,
          name: safeName,
          sizeMB: `${sizeMB} MB`,
          type: "pdf",
        });
      } else {
        const processed = await processImage(
          asset.uri,
          asset.name,
          asset.mimeType,
          asset.size,
        );
        if (processed) {
          setFile(processed);
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const handleUploadPress = () => {
    Alert.alert(
      "Select Upload Source",
      "Choose how you want to upload your bank transfer slip",
      [
        {
          text: "Take Photo",
          onPress: takePhoto,
        },
        {
          text: "Photo Library",
          onPress: pickImage,
        },
        {
          text: "Browse Files / PDF",
          onPress: pickDocument,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
    );
  };

  const removeFile = () => setFile(null);

  const openPdfExternally = async () => {
    if (!file || file.type !== "pdf") return;
    try {
      let targetUri = file.uri;
      if (targetUri.startsWith("http://") || targetUri.startsWith("https://")) {
        const fileFilename = `pdf_share_${Date.now()}.pdf`;
        const destination = `${FileSystem.cacheDirectory}${fileFilename}`;
        const downloadResult = await FileSystem.downloadAsync(
          targetUri,
          destination,
        );
        targetUri = downloadResult.uri;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare && targetUri.startsWith("file://")) {
        await Sharing.shareAsync(targetUri, {
          mimeType: "application/pdf",
          dialogTitle: file.name,
        });
      } else {
        await Linking.openURL(file.uri);
      }
    } catch (error) {
      console.log("Error opening PDF externally:", error);
      showAlert(
        "Couldn't open PDF",
        "Please make sure you have a PDF viewer app installed.",
      );
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    if (receivedAmount === null) {
      showAlert(
        "Error",
        "Transfer amount is missing. Please go back and try again.",
      );
      return;
    }

    if (!isSupportedFileFormat(file.name, null, file.uri)) {
      showInvalidFormatAlert();
      return;
    }

    try {
      setSubmitting(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showAlert("Error", "Please login again");
        return;
      }

      const formData = new FormData();
      const fileUri = file.uri;
      const ext =
        file.name.split(".").pop()?.toLowerCase() ||
        (file.type === "pdf" ? "pdf" : "jpg");
      let fileMime = "image/jpeg";
      if (file.type === "pdf" || ext === "pdf") {
        fileMime = "application/pdf";
      } else if (ext === "png") {
        fileMime = "image/png";
      } else if (ext === "heic") {
        fileMime = "image/heic";
      } else if (ext === "heif") {
        fileMime = "image/heif";
      } else {
        fileMime = "image/jpeg";
      }

      const fileName = file.name || `transfer_slip.${ext}`;

      formData.append("slip", {
        uri: fileUri,
        name: fileName,
        type: fileMime,
      } as any);

      formData.append("amount", String(receivedAmount));

      const response = await axios.post(
        `${environment.API_BASE_URL}api/home/upload-transfer-slip`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.status === "success") {
        const slipStatus: string | undefined =
          response.data?.data?.status ?? response.data?.slip_status;

        showAlert(
          "Success!",
          response.data.message || "Bank transfer slip uploaded successfully.",
          "success",
          () => {
            navigation.navigate(
              "BankTransferSlipStatus" as any,
              slipStatus ? ({ status: slipStatus } as any) : undefined,
            );
          },
        );
      } else {
        showAlert(
          "Upload Failed",
          response.data.message || "Please try again.",
        );
      }
    } catch (error: any) {
      console.log("Error uploading transfer slip:", error);
      showAlert(
        "Upload Failed",
        error.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Upload Bank Transfer Slip"
        navigation={navigation}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount to Transfer (full received amount from route params) */}
        <View className="mt-6 self-center items-center rounded-2xl bg-[#FFFBE9] px-12 py-4">
          <Text numberOfLines={1} className="text-sm text-black">
            Amount to Transfer
          </Text>
          <Text
            className="mt-1 text-2xl font-bold text-gray-900"
            numberOfLines={1}
          >
            {receivedAmount !== null
              ? `Rs. ${formatNumberWithCommas(receivedAmount.toFixed(2))}`
              : "—"}
          </Text>
        </View>

        {/* Account Details */}
        <View className="mt-5 rounded-2xl bg-[#F4F7FD] px-4 py-4">
          <DetailRow
            label="Account Name"
            value={TRANSFER_DETAILS.accountName}
          />
          <DetailRow
            label="Account Number"
            value={TRANSFER_DETAILS.accountNumber}
          />
          <DetailRow label="Bank Name" value={TRANSFER_DETAILS.bankName} />
          <DetailRow
            label="Branch Name"
            value={TRANSFER_DETAILS.branchName}
            isLast
          />
        </View>

        {/* Upload Area */}
        {!file ? (
          <View>
            <TouchableOpacity
              onPress={handleUploadPress}
              activeOpacity={0.7}
              className="mt-6 items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-white py-10"
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FF]">
                <FontAwesome5
                  name="cloud-upload-alt"
                  size={26}
                  color="#3B82F6"
                />
              </View>
              <Text className="mt-3 text-base font-semibold text-gray-900">
                Tap to Upload
              </Text>
              <Text className="mt-1 text-xs text-gray-400">
                PNG, JPG, HEIC, PDF up to 5MB
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mt-6 rounded-2xl border border-dashed border-blue-300 bg-white p-4">
            {/* File Uploaded badge */}
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text className="ml-1.5 text-sm font-medium text-green-500">
                File Uploaded
              </Text>
            </View>

            {file.type === "image" ? (
              <>
                {/* Image thumbnail */}
                <View
                  className="mt-3 items-center rounded-xl border border-gray-100 bg-white p-2"
                  style={{ width: "100%", height: 160 }}
                >
                  <Image
                    source={{ uri: file.uri }}
                    style={{ width: "100%", height: "100%" }}
                    className="rounded-lg"
                    resizeMode="contain"
                  />
                </View>

                {/* File row */}
                <View className="mt-3 flex-row items-center rounded-xl bg-[#F9F9F9] border border-[#DEDEDE] px-3 py-2.5">
                  <View className="h-9 w-9 items-center justify-center rounded-lg bg-pink-50">
                    <Ionicons name="image" size={18} color="#EC4899" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-sm font-medium text-gray-900"
                      numberOfLines={1}
                    >
                      {file.name}
                    </Text>
                    <Text className="text-xs text-gray-400">{file.sizeMB}</Text>
                  </View>
                  <TouchableOpacity onPress={removeFile} hitSlop={8}>
                    <Ionicons name="close" size={20} color="#111827" />
                  </TouchableOpacity>
                </View>

                {/* Preview button */}
                <TouchableOpacity
                  onPress={() => setPreviewVisible(true)}
                  activeOpacity={0.7}
                  className="mt-3 self-center flex-row items-center justify-center rounded-xl border border-blue-500 px-10 py-2.5"
                >
                  <Ionicons name="eye" size={16} color="#3B82F6" />
                  <Text className="ml-2 text-sm font-semibold text-blue-500">
                    Preview Full Image
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* PDF card */}
                <View className="mt-3 items-center rounded-xl border border-gray-100 bg-white px-4 py-6">
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-red-500">
                    <Ionicons name="document-text" size={22} color="#fff" />
                  </View>
                  <Text
                    className="mt-3 text-sm font-medium text-gray-900"
                    numberOfLines={1}
                  >
                    {file.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-400">
                    {file.sizeMB}
                  </Text>
                  <TouchableOpacity
                    onPress={removeFile}
                    hitSlop={8}
                    className="absolute right-2 top-2"
                  >
                    <Ionicons name="close" size={18} color="#111827" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setPreviewVisible(true)}
                  activeOpacity={0.7}
                  className="mt-3 self-center flex-row items-center justify-center rounded-xl border border-blue-500 px-10 py-2.5"
                >
                  <Ionicons name="eye" size={16} color="#3B82F6" />
                  <Text className="ml-2 text-sm font-semibold text-blue-500">
                    Preview PDF
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Submit */}
      <View className="px-5 pb-6 pt-2">
        <TouchableOpacity
          disabled={!canSubmit}
          onPress={handleSubmit}
          activeOpacity={0.8}
          className={`items-center rounded-full py-4 ${
            buttonActive ? "bg-amber-400" : "bg-gray-200"
          }`}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Text
            className={`text-base font-bold ${
              buttonActive ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full-screen preview modal */}
      <Modal
        visible={previewVisible}
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1, backgroundColor: "#000000" }}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          {/* Header */}
          <View
            className="flex-row items-center justify-between bg-black px-4 pb-3"
            style={{
              paddingTop:
                Platform.OS === "android"
                  ? (StatusBar.currentHeight ?? 0) + 12
                  : Math.max(insets.top, 44) + 8,
            }}
          >
            <Text
              className="flex-1 pr-3 text-sm font-medium text-white"
              numberOfLines={1}
            >
              {file?.name}
            </Text>
            <View className="flex-row items-center">
              {file?.type === "pdf" && (
                <TouchableOpacity
                  onPress={openPdfExternally}
                  className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-white/10"
                  hitSlop={8}
                >
                  <Ionicons name="open-outline" size={18} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setPreviewVisible(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-white/10"
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body */}
          <View
            style={{
              flex: 1,
              width: "100%",
              height: "100%",
              backgroundColor: "#f3f4f6",
              paddingBottom: Platform.OS === "ios" ? insets.bottom : 0,
            }}
          >
            {file?.type === "image" && (
              <Image
                source={{ uri: file.uri }}
                style={{ flex: 1, width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            )}

            {file?.type === "pdf" && <PdfViewer uri={file.uri} />}
          </View>
        </View>
      </Modal>

      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={handleAlertClose}
        autoClose={true}
      />
    </View>
  );
};

const DetailRow: React.FC<{
  label: string;
  value: string;
  isLast?: boolean;
}> = ({ label, value, isLast }) => (
  <View className={`flex-row ${isLast ? "" : "mb-2.5"}`}>
    <Text className="w-32 text-sm text-gray-500">{label}</Text>
    <Text className="text-sm text-gray-500">:</Text>
    <Text className="ml-2 flex-1 text-sm font-medium text-gray-900">
      {value}
    </Text>
  </View>
);

export default UploadBankTransferSlip;
