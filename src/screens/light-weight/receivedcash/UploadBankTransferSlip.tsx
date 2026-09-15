import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { useNavigation, useRoute } from "@react-navigation/native";
import CustomHeader from "@/component/common/CustomHeader";
import { formatNumberWithCommas } from "@/utils/formatNumberWithCommas";
import { Ionicons, Feather, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
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
  amount: 9000.0,
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

const UploadBankTransferSlip: React.FC = () => {
  const navigation = useNavigation<UploadBankTransferSlipNavigationProp>();
  const route = useRoute();
  const routeParams = route.params as { amount?: number } | undefined;

  const rawAmount = routeParams?.amount;
  const numAmount: number =
    typeof rawAmount === "number" && !isNaN(rawAmount) && rawAmount > 0
      ? rawAmount
      : typeof rawAmount === "string" &&
          !isNaN(parseFloat(rawAmount)) &&
          parseFloat(rawAmount) > 0
        ? parseFloat(rawAmount)
        : (TRANSFER_DETAILS.amount ?? 9000.0);

  const [file, setFile] = useState<UploadedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("error");
  const [onAlertClose, setOnAlertClose] = useState<() => void>(() => () => {});

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" = "error",
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setOnAlertClose(() => () => setAlertVisible(false));
    setAlertVisible(true);
  };

  const showFileTooLargeAlert = () => {
    showAlert(
      "File Too Large",
      "File is too large. Please upload an image or file smaller than 5 MB.",
      "error",
    );
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted && permission.status !== ("limited" as any)) {
      showAlert(
        "Permission Required",
        "Please allow access to your photos to upload a transfer slip.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
        showFileTooLargeAlert();
        return;
      }

      let finalUri = asset.uri;
      try {
        const ext = asset.fileName?.split(".").pop() || "png";
        const localUri = `${FileSystem.cacheDirectory}transfer_slip_${Date.now()}.${ext}`;
        await FileSystem.copyAsync({
          from: asset.uri,
          to: localUri,
        });
        finalUri = localUri;
      } catch (e) {
        console.log("Copy image cache error:", e);
      }

      const sizeMB = asset.fileSize
        ? (asset.fileSize / (1024 * 1024)).toFixed(1)
        : "—";
      setFile({
        uri: finalUri,
        name: asset.fileName ?? "Transfer_Slip.png",
        sizeMB: `${sizeMB} MB`,
        type: "image",
      });
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    const isPdf =
      asset.mimeType === "application/pdf" || asset.name?.endsWith(".pdf");

    if (asset.size && asset.size > MAX_FILE_SIZE_BYTES) {
      showFileTooLargeAlert();
      return;
    }

    const sizeMB = asset.size ? (asset.size / (1024 * 1024)).toFixed(1) : "—";

    let finalUri = asset.uri;
    try {
      const ext = asset.name?.split(".").pop() || (isPdf ? "pdf" : "png");
      const localUri = `${FileSystem.cacheDirectory}doc_${Date.now()}.${ext}`;
      await FileSystem.copyAsync({
        from: asset.uri,
        to: localUri,
      });
      finalUri = localUri;
    } catch (err) {
      console.error("Failed to copy file:", err);
    }

    if (!asset.size) {
      try {
        const info = await FileSystem.getInfoAsync(finalUri);
        if (info.exists && info.size && info.size > MAX_FILE_SIZE_BYTES) {
          showFileTooLargeAlert();
          return;
        }
      } catch (err) {
        console.error("Failed to check file size:", err);
      }
    }

    setFile({
      uri: finalUri,
      name: asset.name ?? (isPdf ? "Transfer_Slip.pdf" : "Transfer_Slip.png"),
      sizeMB: `${sizeMB} MB`,
      type: isPdf ? "pdf" : "image",
    });
  };

  const handleUploadPress = () => {
    Alert.alert(
      "Select Upload Source",
      "Choose how you want to upload your bank transfer slip",
      [
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
    try {
      setSubmitting(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showAlert("Error", "Please login again");
        return;
      }

      const formData = new FormData();
      const fileUri = file.uri;
      const fileExt = (
        fileUri.split(".").pop() || (file.type === "pdf" ? "pdf" : "jpg")
      ).toLowerCase();
      const fileName = file.name || `transfer_slip.${fileExt}`;

      const IMAGE_MIME_MAP: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        heic: "image/heic",
        heif: "image/heif",
      };
      const fileMime =
        file.type === "pdf"
          ? "application/pdf"
          : (IMAGE_MIME_MAP[fileExt] ?? "image/jpeg");

      formData.append("slip", {
        uri: fileUri,
        name: fileName,
        type: fileMime,
      } as any);

      const amountToTransfer = numAmount;
      formData.append("amount", String(amountToTransfer));

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
        setAlertTitle("Success!");
        setAlertMessage("Bank transfer slip uploaded successfully.");
        setAlertType("success");
        setOnAlertClose(() => () => {
          setAlertVisible(false);
          navigation.navigate("BankTransferSlipStatus" as any, {
            status: "pending",
          });
        });
        setAlertVisible(true);
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
        {/* Amount to Transfer */}
        <View className="mt-6 self-center items-center rounded-2xl bg-[#FFFBE9] px-12 py-4">
          <Text numberOfLines={1} className="text-sm text-black">
            Amount to Transfer
          </Text>
          <Text
            className="mt-1 text-2xl font-bold text-gray-900"
            numberOfLines={1}
          >
            Rs. {formatNumberWithCommas(numAmount.toFixed(2))}
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
                JPG, PNG, PDF up to 5MB
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
          disabled={!file || submitting}
          onPress={handleSubmit}
          activeOpacity={0.8}
          className={`items-center rounded-full py-4 ${
            file ? "bg-amber-400" : "bg-gray-200"
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
              file ? "text-gray-900" : "text-gray-400"
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
      >
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
          {/* Header */}
          <View
            className="flex-row items-center justify-between bg-black px-4 pb-3"
            style={{
              paddingTop:
                Platform.OS === "android"
                  ? (StatusBar.currentHeight ?? 0) + 12
                  : 12,
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
        </SafeAreaView>
      </Modal>

      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={onAlertClose}
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
