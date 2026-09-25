import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  BackHandler,
  ScrollView,
  RefreshControl,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUserProfile,
  selectJobRole,
  setUserProfile,
  selectAuthToken,
} from "@/store/authSlice";
import { ROLES } from "@/constants/user-roles";
import CustomHeader from "@/component/common/CustomHeader";
import LoadingPage from "@/component/common/LoadingPage";
import { AlertModal } from "@/component/common/AlertModal";
import DownloadShareButtons from "@/component/common/DownloadShareButtons";
import { saveImageToGallery } from "@/utils/mediaSave";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import { useFocusEffect } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";

type MyQRCodeNavigationProp = StackNavigationProp<RootStackParamList, "MyQRCode">;

interface MyQRCodeProps {
  navigation: MyQRCodeNavigationProp;
}

const MyQRCode: React.FC<MyQRCodeProps> = ({ navigation }) => {
  const userProfile = useSelector(selectUserProfile);
  const jobRole = useSelector(selectJobRole);
  const token = useSelector(selectAuthToken);
  const dispatch = useDispatch();

  const printableCardRef = useRef<View>(null);

  const [qrUrl, setQrUrl] = useState<string>(
    userProfile?.QRcode || userProfile?.qrCode || ""
  );
  const [companyLogo, setCompanyLogo] = useState<string>(
    (userProfile as any)?.company?.logo || ""
  );
  const [loading, setLoading] = useState<boolean>(!userProfile?.QRcode && !userProfile?.qrCode);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);

  // AlertModal state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalMessage, setModalMessage] = useState<string>("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const showModal = (title: string, message: string, type: "success" | "error" = "success") => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const fetchProfileAndQR = async () => {
    try {
      const storedToken = token || (await AsyncStorage.getItem("token"));
      const storedQr = await AsyncStorage.getItem("@user_qr");
      const storedLogo = await AsyncStorage.getItem("@company_logo");

      if (storedQr && !qrUrl) {
        setQrUrl(storedQr);
      }
      if (storedLogo && !companyLogo) {
        setCompanyLogo(storedLogo);
      }

      if (!storedToken) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/get-profile`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );

      console.log(response.data.data)

      if (response.data && response.data.success && response.data.data) {
        const profileData = response.data.data;
        const fetchedQR = profileData.QRcode || profileData.qrCode || "";
        const fetchedLogo = profileData.company?.logo || "";

        if (fetchedQR) {
          setQrUrl(fetchedQR);
          await AsyncStorage.setItem("@user_qr", fetchedQR);
        }

        // Company logo is optional — only store/display it if the API actually returned one.
        if (fetchedLogo) {
          setCompanyLogo(fetchedLogo);
          await AsyncStorage.setItem("@company_logo", fetchedLogo);
        } else {
          setCompanyLogo("");
          await AsyncStorage.removeItem("@company_logo");
        }

        if (userProfile) {
          dispatch(
            setUserProfile({
              ...userProfile,
              firstName: profileData.firstNameEnglish || userProfile.firstName,
              lastName: profileData.lastNameEnglish || userProfile.lastName,
              profileImg: profileData.image || userProfile.profileImg,
              QRcode: fetchedQR,
              qrCode: fetchedQR,
              company: profileData.company || (userProfile as any).company,
            } as any)
          );
        }
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem("@user_qr").then((cached) => {
      if (cached && !qrUrl) {
        setQrUrl(cached);
        setLoading(false);
      }
    });
    AsyncStorage.getItem("@company_logo").then((cached) => {
      if (cached && !companyLogo) {
        setCompanyLogo(cached);
      }
    });

    fetchProfileAndQR();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfileAndQR();
  }, []);

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      if (jobRole === ROLES.HEAVY_WEIGHT_DRIVER) {
        navigation.navigate("HeavyDriverHome");
      } else {
        navigation.navigate("Home");
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        handleBackPress();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBack
      );
      return () => subscription.remove();
    }, [navigation, jobRole])
  );

  const downloadQRCode = async () => {
    try {
      if (!qrUrl) {
        showModal("Error", "No QR Code available to download.", "error");
        return;
      }

      setProcessing(true);
      await new Promise((resolve) => setTimeout(resolve, 150));

      let captureUri = "";
      if (printableCardRef.current) {
        captureUri = await captureRef(printableCardRef, {
          format: "png",
          quality: 1.0,
        });
      } else {
        captureUri = qrUrl;
      }

      const success = await saveImageToGallery(
        captureUri,
        `Driver_QR_${userProfile?.empId || "Card"}`
      );
      if (success) {
        showModal("Success", "Formatted QR Code card has been saved to your device.", "success");
      }
    } catch (error) {
      console.error("Download QR error:", error);
      showModal("Error", "Failed to save QR Code.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const shareQRCode = async () => {
    try {
      if (!qrUrl) {
        showModal("Error", "No QR Code available to share.", "error");
        return;
      }

      setProcessing(true);
      await new Promise((resolve) => setTimeout(resolve, 150));

      let shareUri = "";
      if (printableCardRef.current) {
        shareUri = await captureRef(printableCardRef, {
          format: "png",
          quality: 1.0,
        });
      } else {
        if (qrUrl.startsWith("http://") || qrUrl.startsWith("https://")) {
          const fileUri = `${(FileSystem as any).documentDirectory}QRCode_${Date.now()}.png`;
          const downloadRes = await FileSystem.downloadAsync(qrUrl, fileUri);
          shareUri = downloadRes.uri;
        } else {
          shareUri = qrUrl;
        }
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, {
          mimeType: "image/png",
          dialogTitle: "Share Driver QR Code",
        });
      } else {
        showModal("Notice", "Sharing is not available on this device.", "error");
      }
    } catch (error) {
      console.error("Share QR error:", error);
      showModal("Error", "Failed to share QR Code.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const getFullName = () => {
    const firstName = userProfile?.firstName || "Driver";
    const lastName = userProfile?.lastName || "";
    return `${firstName} ${lastName}`.trim();
  };

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="My QR Code"
        showBackButton={true}
        navigation={navigation}
        onBackPress={handleBackPress}
      />

      {loading ? (
        <LoadingPage message="Loading QR Code..." fullScreen={true} />
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="flex-1 justify-center px-4">
            {/* Company Logo — only shown when the API actually returns one */}
            {companyLogo ? (
              <View className="items-center mb-4">
                <Image
                  source={{ uri: companyLogo }}
                  className="w-[180px] h-[54px]"
                  resizeMode="contain"
                />
              </View>
            ) : null}

            {/* Driver Name and ID */}
            <View className="items-center mb-6">
              <Text className="text-2xl font-bold text-gray-900 text-center">
                {getFullName()}
              </Text>
              {userProfile?.empId ? (
                <Text className="text-base font-semibold text-gray-500 text-center mt-1">
                  Driver ID: {userProfile.empId}
                </Text>
              ) : null}
            </View>

            {/* On-Screen UI: QR Code Container */}
            <View className="items-center mb-8">
              <View className="bg-white p-5 rounded-3xl border-2 border-[#FAE432] items-center justify-center shadow-md">
                {qrUrl &&
                (qrUrl.startsWith("http://") ||
                  qrUrl.startsWith("https://") ||
                  qrUrl.startsWith("data:image")) ? (
                  <Image
                    source={{ uri: qrUrl }}
                    className="w-[270px] h-[270px]"
                    resizeMode="contain"
                  />
                ) : qrUrl ? (
                  <QRCode value={qrUrl} size={270} />
                ) : (
                  <View className="w-[270px] h-[270px] items-center justify-center">
                    <Text className="text-gray-500 text-center">
                      No QR Code available
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Download and Share Buttons */}
            <DownloadShareButtons
              onDownload={downloadQRCode}
              onShare={shareQRCode}
              downloadLabel="Download"
              shareLabel="Share"
              disabled={!qrUrl || processing}
            />
          </View>
        </ScrollView>
      )}

      {/* Off-screen Printable Card (used strictly for downloading & sharing) */}
      <View
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          width: 440,
          backgroundColor: "#FFFFFF",
        }}
      >
        <View
          ref={printableCardRef}
          collapsable={false}
          style={{
            width: 440,
            backgroundColor: "#FFFFFF",
            paddingTop: 40,
            paddingBottom: 56,
            paddingHorizontal: 30,
            alignItems: "center",
            borderWidth: 2,
            borderColor: "#E5E7EB",
            borderRadius: 24,
          }}
        >
          {/* Top: Company logo — only rendered when the API actually returns one, otherwise nothing is shown */}
          {companyLogo ? (
            <View style={{ alignItems: "center", marginBottom: 22 }}>
              <Image
                source={{ uri: companyLogo }}
                style={{ width: 240, height: 72 }}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {/* Middle: QR Code Container */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              padding: 16,
              borderRadius: 20,
              borderWidth: 2.5,
              borderColor: "#FAE432",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {qrUrl &&
            (qrUrl.startsWith("http://") ||
              qrUrl.startsWith("https://") ||
              qrUrl.startsWith("data:image")) ? (
              <Image
                source={{ uri: qrUrl }}
                style={{ width: 270, height: 270 }}
                resizeMode="contain"
              />
            ) : qrUrl ? (
              <QRCode value={qrUrl} size={270} />
            ) : (
              <View
                style={{
                  width: 270,
                  height: 270,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#9CA3AF" }}>No QR Code available</Text>
              </View>
            )}
          </View>

          {/* Bottom: Driver Info (Pure text without background or border on ID) */}
          <View style={{ alignItems: "center", marginTop: 22, width: "100%" }}>
            <Text
              style={{
                fontSize: 23,
                fontWeight: "bold",
                color: "#111827",
                textAlign: "center",
              }}
            >
              {getFullName()}
            </Text>

            {userProfile?.empId ? (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#4B5563",
                  letterSpacing: 0.5,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                Driver ID: {userProfile.empId}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* AlertModal */}
      <AlertModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

export default MyQRCode;