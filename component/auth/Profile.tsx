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
  Alert,
  Modal,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import CustomHeader from "../common/CustomHeader";
import { useSelector, useDispatch } from "react-redux";
import { 
  selectAuthToken, 
  logoutUser, 
  updateProfileImage // Import the update action
} from "@/store/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import axios from "axios";

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

  const token = useSelector(selectAuthToken);
  const dispatch = useDispatch(); // Get dispatch function

  const formatJoinedDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setProfileData(data.data);
      } else {
        setError(data.message || "Failed to fetch profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to update your profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        
        Alert.alert(
          "Update Profile Picture",
          "Do you want to update your profile picture?",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Upload", 
              onPress: () => uploadProfileImage(selectedImage) 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert("Error", "Failed to open image picker");
    }
  };

  const uploadProfileImage = async (selectedImage: ImagePicker.ImagePickerAsset) => {
    if (!token) {
      Alert.alert("Error", "Authentication required");
      return;
    }

    try {
      setUploading(true);

      // Create FormData
      const formData = new FormData();
      
      // Get filename from URI
      const uriParts = selectedImage.uri.split('/');
      const filename = uriParts[uriParts.length - 1];
      
      // Determine mime type
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Append image to FormData
      formData.append('profileImage', {
        uri: selectedImage.uri,
        name: filename,
        type: type,
      } as any);

      console.log('Uploading to:', `${environment.API_BASE_URL}api/auth/update-profile-image`);

      const response = await axios.post(
        `${environment.API_BASE_URL}api/auth/update-profile-image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );

      console.log('Response:', response.data);

      if (response.data.success) {
        const newImageUrl = response.data.data.imageUrl;
        
        // Update local state
        setProfileData((prev: any) => ({
          ...prev,
          image: newImageUrl,
        }));
        
        // UPDATE REDUX STATE
        dispatch(updateProfileImage(newImageUrl));
        
        Alert.alert("Success", "Profile picture updated successfully!");
      } else {
        Alert.alert("Error", response.data.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error details:", error);
      
      let errorMessage = "Failed to upload image";
      
      if (error.response) {
        console.log("Status:", error.response.status);
        console.log("Data:", error.response.data);
        
        if (error.response.status === 404) {
          errorMessage = "Update profile endpoint not found (404). Please check the backend route.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = error.message || "Unknown error occurred";
      }
      
      Alert.alert("Upload Error", errorMessage);
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
      Alert.alert("Error", "Failed to logout. Please try again.");
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
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FFC83D" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={fetchProfileData}
          className="bg-[#FFC83D] px-6 py-3 rounded-full"
        >
          <Text className="font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView>
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
                <View style={{
                  width: wp(30),
                  height: wp(30),
                  borderRadius: wp(30) / 2,
                  borderWidth: 2,
                  borderColor: "#FFC83D",
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#f3f3f3'
                }}>
                  <ActivityIndicator size="large" color="#FFC83D" />
                  <Text className="text-xs text-gray-500 mt-2">Uploading...</Text>
                </View>
              ) : (
                <Image
                  source={
                    profileData?.image
                      ? { uri: profileData.image }
                      : require("@/assets/images/home/profile.webp")
                  }
                  style={{
                    width: wp(30),
                    height: wp(30),
                    borderRadius: wp(30) / 2,
                    borderWidth: 2,
                    borderColor: "#FFC83D",
                  }}
                />
              )}

              <TouchableOpacity
                onPress={handleImageUpload}
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
              <Text className="text-md font-bold text-black mt-2">
                Joined {formatJoinedDate(profileData.createdAt)}
              </Text>
            )}
          </View>

          <View style={{ paddingHorizontal: wp(6), marginTop: hp(4) }}>
            <InfoCard
              label="Full Name"
              value={
                profileData
                  ? `${profileData.firstNameEnglish || ""} ${
                      profileData.lastNameEnglish || ""
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
                profileData?.phoneNumber01
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