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
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { RefreshControl } from "react-native";
import LoadingPage from "../common/LoadingPage";

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Profile"
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [profileData, setProfileData] = useState<any>(null);
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

  useEffect(() => {
    fetchProfileData();
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

          return; // Exit early
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      navigation.navigate("Login");
      setShowLogoutModal(false);
    } catch (error) {
      console.error("Error during logout:", error);
      setModalMessage("Failed to logout. Please try again.");
      setShowErrorModal(true);
    }
  };

  const InfoCard = ({ label, value }: { label: string; value: string }) => (
    <View className="mb-4">
      <Text className="text-[#495D86] mb-1 font-medium">{label}</Text>
      <Text className="bg-[#F3F3F3] rounded-full px-5 py-4 text-[#000000] text-sm">
        {value}
      </Text>
    </View>
  );

  const formatPhoneNumber = (phoneCode: string, phoneNumber: string) => {
    if (!phoneCode && !phoneNumber) return "Not available";
    return `${phoneCode || ""} ${phoneNumber || ""}`.trim();
  };

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
        >
          <CustomHeader
            title="My Profile"
            showBackButton={true}
            showLanguageSelector={false}
            showLogoutButton={true}
            navigation={navigation}
            onLogoutPress={handleLogoutConfirm}
          />

          <View className="items-center">
            <View style={{ position: "relative" }}>
              {uploading ? (
                <View className="w-30 h-30 rounded-full border-2 border-[#FFC83D] justify-center items-center bg-[#f3f3f3]">
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

          <View className="px-6 mt-8">
            <InfoCard
              label="Full Name"
              value={
                profileData
                  ? `${profileData.firstNameEnglish || ""} ${profileData.lastNameEnglish || ""
                    }`.trim()
                  : "Not available"
              }
            />
            <InfoCard
              label="Employee ID"
              value={profileData?.empId || "Not available"}
            />
            <InfoCard
              label="Phone Number"
              value={formatPhoneNumber(
                profileData?.phoneCode01,
                profileData?.phoneNumber01,
              )}
            />
            <InfoCard
              label="NIC Number"
              value={profileData?.nic || "Not available"}
            />
            <InfoCard
              label="Vehicle"
              value={profileData?.vType || "Not available"}
            />
            <InfoCard
              label="Vehicle's Registration Number"
              value={profileData?.vRegNo || "Not available"}
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
              >
                <MaterialIcons name="close" size={20} color="black" />
                <Text className="text-center font-medium ml-2">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={performLogout}
                className="flex flex-row ml-2 py-3 px-4 bg-[#FF0000] rounded-full w-[48%] justify-center items-center"
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