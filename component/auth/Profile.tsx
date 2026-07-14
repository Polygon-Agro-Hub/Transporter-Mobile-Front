import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import CustomHeader from "../common/CustomHeader";
import { useSelector, useDispatch } from "react-redux";
import { AlertModal } from "../common/AlertModal";
import {
  selectAuthToken,
  logoutUser,
  updateProfileImage,
} from "@/store/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import { FontAwesome5, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { RefreshControl } from "react-native";
import LoadingPage from "../common/LoadingPage";
import LottieView from "lottie-react-native";

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Profile"
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

interface EarningsData {
  todayDate: string;
  totalEarnings: number;
  cashEarnings: number;
  cashOrders: number;
  cardEarnings: number;
  cardOrders: number;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showAuthErrorModal, setShowAuthErrorModal] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState("");

  const token = useSelector(selectAuthToken);
  const dispatch = useDispatch();

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      const platformVersion =
        typeof Platform.Version === "string"
          ? parseInt(Platform.Version, 10)
          : Platform.Version;

      if (platformVersion >= 33) {
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          const { status: newStatus } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          return newStatus === "granted";
        }
        return true;
      } else {
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          const { status: newStatus } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          return newStatus === "granted";
        }
        return true;
      }
    } else {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        return newStatus === "granted";
      }
      return true;
    }
  };

  const formatJoinedDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const formatEarningsDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch (error) {
      return "";
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchEarningsData();
  }, []);

  const fetchProfileData = async () => {
    if (!token) {
      setError("No authentication token found");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${environment.API_BASE_URL}api/auth/get-profile`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setProfileData(data.data);
      } else {
        const errorMessage = data.message || "Failed to fetch profile data";

        // Check for 404 - User not found or not approved
        if (
          response.status === 404 ||
          errorMessage.includes("User not found") ||
          errorMessage.includes("account not approved")
        ) {
          // Clear storage first
          await AsyncStorage.multiRemove(["token", "refreshToken", "userData"]);
          dispatch(logoutUser());

          // Set error for UI (this will show on screen temporarily)
          setError("Account not found or not approved");

          // Show modal with auto-navigation
          setAuthErrorMessage(
            "Your account is not found or not approved. Redirecting to login...",
          );
          setShowAuthErrorModal(true);

          // Auto navigate after 3 seconds
          setTimeout(() => {
            setShowAuthErrorModal(false);
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          }, 3000);

          return;
        }

        // For other errors
        setError(errorMessage);
      }
    } catch (error: unknown) {
      console.error("Error fetching profile:", error);

      // Type guard to check error type
      const isErrorWithMessage = (
        err: unknown,
      ): err is { message?: string } => {
        return typeof err === "object" && err !== null;
      };

      let errorMessage = "Network error. Please try again.";

      if (isErrorWithMessage(error)) {
        errorMessage = error.message || errorMessage;

        // Check for network errors that might indicate auth issues
        if (
          errorMessage.includes("Network") ||
          errorMessage.includes("Failed to fetch")
        ) {
          // Try to clear storage and navigate to login
          try {
            await AsyncStorage.multiRemove([
              "token",
              "refreshToken",
              "userData",
            ]);
            dispatch(logoutUser());
          } catch (storageError) {
            console.error("Error clearing storage:", storageError);
          }
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // NOTE: adjust endpoint & response shape to match your actual backend contract.
  const fetchEarningsData = async (dateFilter?: string) => {
    if (!token) return;

    try {
      const url = dateFilter
        ? `${environment.API_BASE_URL}api/auth/get-earnings?date=${dateFilter}`
        : `${environment.API_BASE_URL}api/auth/get-earnings`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEarningsData(data.data);
      } else {
        // Fail quietly for earnings - profile still usable without it
        setEarningsData({
          todayDate: new Date().toISOString(),
          totalEarnings: 0,
          cashEarnings: 0,
          cashOrders: 0,
          cardEarnings: 0,
          cardOrders: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
      setEarningsData({
        todayDate: new Date().toISOString(),
        totalEarnings: 0,
        cashEarnings: 0,
        cashOrders: 0,
        cardEarnings: 0,
        cardOrders: 0,
      });
    }
  };

  const handleFilterByDate = () => {
    // Hook this up to your date-picker / earnings history screen
    navigation.navigate("MyEarnings" as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfileData(), fetchEarningsData()]);
    setRefreshing(false);
  };

  const handleAuthErrorModalClose = () => {
    setShowAuthErrorModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const handleImageUpload = async () => {
    try {
      const hasPermission = await requestPermissions();

      if (!hasPermission) {
        setModalMessage(
          Platform.OS === "ios"
            ? "Please allow access to your photo library to update your profile picture."
            : "Please allow access to your photos to update your profile picture.",
        );
        setShowErrorModal(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.POPOVER,
        allowsMultipleSelection: false,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];

        uploadProfileImage(selectedImage);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      setModalMessage("Failed to open image picker");
      setShowErrorModal(true);
    }
  };

  const handleImageUploadAndroidPicker = async () => {
    if (Platform.OS !== "android") {
      handleImageUpload();
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];

        uploadProfileImage(selectedImage);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      setModalMessage("Failed to open image picker");
      setShowErrorModal(true);
    }
  };

  const uploadProfileImage = async (
    selectedImage: ImagePicker.ImagePickerAsset,
  ) => {
    if (!token) {
      setModalMessage("Authentication required");
      setShowErrorModal(true);
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      const uriParts = selectedImage.uri.split("/");
      const filename = uriParts[uriParts.length - 1];

      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("profileImage", {
        uri: selectedImage.uri,
        name: filename,
        type: type,
      } as any);

      const response = await axios.post(
        `${environment.API_BASE_URL}api/auth/update-profile-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        },
      );

      if (response.data.success) {
        const newImageUrl = response.data.data.imageUrl;

        setProfileData((prev: any) => ({
          ...prev,
          image: newImageUrl,
        }));

        dispatch(updateProfileImage(newImageUrl));

        setModalMessage("Your profile picture has been updated successfully!");
        setShowSuccessModal(true);
      } else {
        setModalMessage(response.data.message || "Upload failed");
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error("Upload error details:", error);

      let errorMessage = "Failed to upload image";

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage =
            "Update profile endpoint not found. Please check the backend route.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = error.message || "Unknown error occurred";
      }

      setModalMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(true);
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "refreshToken", "userData"]);
      dispatch(logoutUser());
      setShowLogoutModal(false);

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Error during logout:", error);
      setModalMessage("Failed to logout. Please try again.");
      setShowErrorModal(true);
    }
  };

  const formatPhoneNumber = (phoneCode: string, phoneNumber: string) => {
    if (!phoneCode && !phoneNumber) return "Not available";
    return `${phoneCode || ""} ${phoneNumber || ""}`.trim();
  };

  // Icon + text row used in the details list card
  const InfoRow = ({
    icon,
    iconSet = "material",
    value,
    isLast = false,
  }: {
    icon: string;
    iconSet?: "material" | "community";
    value: string;
    isLast?: boolean;
  }) => (
    <View
      className={`flex-row items-center py-4 px-4 ${
        !isLast ? "border-b border-[#F0F0F0]" : ""
      }`}
    >
      <View className="w-8 items-center mr-3">
        {iconSet === "material" ? (
          <MaterialIcons name={icon as any} size={20} color="#495D86" />
        ) : (
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color="#495D86"
          />
        )}
      </View>
      <Text className="text-black text-sm flex-1" numberOfLines={1}>
        {value || "Not available"}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <CustomHeader
          title="My Profile"
          showBackButton={true}
          showLanguageSelector={false}
          navigation={navigation}
        />
        <LoadingPage message="Loading Profile..." fullScreen={true} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-red-500 text-center mb-4">{error}</Text>

        {/* Show retry button only if it's not an auth error */}
        {!error.includes("Account not found") &&
        !error.includes("No authentication token") ? (
          <TouchableOpacity
            onPress={fetchProfileData}
            className="bg-[#FFC83D] px-6 py-3 rounded-full"
          >
            <Text className="font-semibold">Retry</Text>
          </TouchableOpacity>
        ) : (
          // Show login button for auth errors
          <TouchableOpacity
            onPress={() => {
              // Clear storage and navigate to login
              AsyncStorage.multiRemove(["token", "refreshToken", "userData"])
                .then(() => {
                  dispatch(logoutUser());
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                })
                .catch(() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                });
            }}
            className="bg-[#FFC83D] px-6 py-3 rounded-full"
          >
            <Text className="font-semibold">Go to Login</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FFC83D"]}
              tintColor="#FFC83D"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <CustomHeader
            title="My Profile"
            showBackButton={true}
            showLanguageSelector={false}
            showLogoutButton={true}
            navigation={navigation}
            onLogoutPress={handleLogoutConfirm}
          />

          {/* Avatar + joined date */}
          <View className="items-center mt-2">
            <View style={{ position: "relative" }}>
              {uploading ? (
                <View className="w-32 h-32 rounded-full border-2 border-[#FFC83D] justify-center items-center bg-[#f3f3f3]">
                  <ActivityIndicator size="large" color="#FFC83D" />
                  <Text className="text-xs text-gray-500 mt-2">
                    Uploading...
                  </Text>
                </View>
              ) : (
                <Image
                  source={
                    profileData?.image
                      ? { uri: profileData.image }
                      : require("@/assets/images/home/profile.webp")
                  }
                  className="w-32 h-32 rounded-full border-2 border-[#FFC83D]"
                />
              )}

              <TouchableOpacity
                onPress={handleImageUploadAndroidPicker}
                disabled={uploading}
                style={{
                  position: "absolute",
                  bottom: 5,
                  right: 5,
                  backgroundColor: "#000",
                  padding: 6,
                  borderRadius: 20,
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={uploading ? "loading" : "pencil"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {profileData?.createdAt && (
              <Text className="text-md font-bold text-black mt-2 italic">
                Joined {formatJoinedDate(profileData.createdAt)}
              </Text>
            )}
          </View>

          {/* Earnings card */}
          <View className="mx-4 mt-6 bg-white rounded-2xl border border-[#EFEFEF] p-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F3F3]">
                <FontAwesome5
                  name="wallet"
                  size={18}
                  color="#000"
                />
                </View>
                <Text className="text-black font-bold text-base ml-2">
                  My Earnings
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleFilterByDate}
                className="flex-row items-center"
                activeOpacity={0.7}
              >
                <Text className="text-[#0122F5] font-medium mr-2 text-sm">
                  Filter By Date
                </Text>
                <FontAwesome6 name="arrow-up-right-from-square" size={14} color="#0122F5" />
              </TouchableOpacity>
            </View>

            <View className="bg-[#FFF8E6] rounded-xl px-4 py-3 mb-4">
              <Text className="text-[#7A7A7A] text-xs mb-1">
                Today's Earnings{"  |  "}
                {formatEarningsDate(
                  earningsData?.todayDate || new Date().toISOString(),
                )}
              </Text>
              <Text className="text-black font-bold text-xl">
                Rs. {(earningsData?.totalEarnings ?? 0).toFixed(2)}
              </Text>
            </View>

            <View className="flex-row">
              {/* Cash earnings */}
              <View className="flex-1 items-center">
                <LottieView
                  source={require("@/assets/json/coin.json")}
                  style={{
                    width: 40,
                    height: 40,
                  }}
                  autoPlay
                  loop
                />
                <Text className="text-[#7A7A7A] text-xs mb-1">
                  Cash Earnings
                </Text>
                <Text className="text-black font-bold text-base mb-2">
                  Rs. {(earningsData?.cashEarnings ?? 0).toFixed(2)}
                </Text>
                <View className="bg-[#FFF3D6] rounded-full px-3 py-1">
                  <Text className="text-[#8A6D1D] text-xs font-medium">
                    {earningsData?.cashOrders ?? 0} Order
                    {(earningsData?.cashOrders ?? 0) === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View className="w-[1px] bg-[#EAEAEA] mx-2" />

              {/* Card earnings */}
              <View className="flex-1 items-center">
                <LottieView
                  source={require("@/assets/json/card.json")}
                  style={{
                    width: 40,
                    height: 40,
                  }}
                  autoPlay
                  loop
                />
                <Text className="text-[#7A7A7A] text-xs mb-1">
                  Card Earnings
                </Text>
                <Text className="text-black font-bold text-base mb-2">
                  Rs. {(earningsData?.cardEarnings ?? 0).toFixed(2)}
                </Text>
                <View className="bg-[#E4F7EC] rounded-full px-3 py-1">
                  <Text className="text-[#1E8449] text-xs font-medium">
                    {earningsData?.cardOrders ?? 0} Order
                    {(earningsData?.cardOrders ?? 0) === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-start mt-4">
              <MaterialCommunityIcons
                name="information-outline"
                size={14}
                color="#7A7A7A"
                style={{ marginTop: 2, marginRight: 4 }}
              />
              <Text className="text-[#7A7A7A] text-xs flex-1">
                Card payment order earnings will be transferred within 7 days
                after the delivered date.
              </Text>
            </View>
          </View>

          {/* Details list card */}
          <View className="mx-4 mt-4 mb-8 bg-white rounded-2xl border border-[#EFEFEF] shadow-sm">
            <InfoRow
              icon="person"
              value={
                profileData
                  ? `${profileData.firstNameEnglish || ""} ${
                      profileData.lastNameEnglish || ""
                    }`.trim()
                  : "Not available"
              }
            />
            <InfoRow
              icon="card-account-details-outline"
              iconSet="community"
              value={profileData?.empId || "Not available"}
            />
            <InfoRow
              icon="phone"
              value={formatPhoneNumber(
                profileData?.phoneCode01,
                profileData?.phoneNumber01,
              )}
            />
            <InfoRow
              icon="shield-account-outline"
              iconSet="community"
              value={profileData?.nic || "Not available"}
            />
            <InfoRow
              icon="truck-outline"
              iconSet="community"
              value={profileData?.vType || "Not available"}
            />
            <InfoRow
              icon="card-text-outline"
              iconSet="community"
              value={profileData?.vRegNo || "Not available"}
              isLast
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Authentication Error Alert Modal */}
      <AlertModal
        visible={showAuthErrorModal}
        title="Session Expired"
        message={authErrorMessage}
        type="error"
        onClose={handleAuthErrorModalClose}
        autoClose={true}
        duration={4000}
      />

      {/* Success Alert Modal */}
      <AlertModal
        visible={showSuccessModal}
        title="Success!"
        message={modalMessage}
        type="success"
        onClose={() => setShowSuccessModal(false)}
        autoClose={true}
        duration={3000}
      />

      {/* Error Alert Modal */}
      <AlertModal
        visible={showErrorModal}
        title="Error"
        message={modalMessage}
        type="error"
        onClose={() => setShowErrorModal(false)}
        autoClose={true}
        duration={4000}
      />

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-black font-semibold text-center mb-6">
              Are you sure you want to logout?
            </Text>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                className="flex flex-row mr-2 py-3 px-4 rounded-full bg-[#DFE5F2] w-[48%] justify-center items-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <MaterialIcons name="close" size={20} color="black" />
                <Text className="text-center font-medium ml-2">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={performLogout}
                className="flex flex-row ml-2 py-3 px-4 bg-[#FF0000] rounded-full w-[48%] justify-center items-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <MaterialIcons name="logout" size={20} color="white" />
                <Text className="text-center font-medium text-white ml-2">
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;
