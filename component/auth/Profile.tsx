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
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import CustomHeader from "../common/CustomHeader";
import { useSelector } from "react-redux";
import { selectAuthToken } from "@/store/authSlice";
import { environment } from "@/environment/environment";

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

  // Get token from Redux
  const token = useSelector(selectAuthToken);

  // Function to format the createdAt date like "Jun 1, 2026"
  const formatJoinedDate = (dateString: string) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);

      // Format the date like "Jun 1, 2026"
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

  // Fetch profile data when component mounts
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

      console.log("Fetching profile with token from Redux...");

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
      console.log("Profile API response:", data);

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

  const InfoCard = ({ label, value }: { label: string; value: string }) => (
    <View className="mb-4">
      <Text className="text-[#495D86] mb-1 font-medium">{label}</Text>
      <Text className="bg-[#F3F3F3] rounded-full px-5 py-4 text-[#000000] text-sm">
        {value}
      </Text>
    </View>
  );

  // Format phone number
  const formatPhoneNumber = (phoneCode: string, phoneNumber: string) => {
    if (!phoneCode && !phoneNumber) return "Not available";
    return `${phoneCode || ""} ${phoneNumber || ""}`.trim();
  };

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FFC83D" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  // Show error state
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
          {/* Back Button */}
          <CustomHeader
            title="My Profile"
            showBackButton={true}
            showLanguageSelector={false}
            navigation={navigation}
          />

          {/* Profile Image Section */}
          <View className="items-center">
            <View style={{ position: "relative" }}>
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

              {/* Edit Icon */}
              <TouchableOpacity
                style={{
                  position: "absolute",
                  bottom: 5,
                  right: 5,
                  backgroundColor: "#000",
                  padding: 6,
                  borderRadius: 20,
                }}
              >
                <MaterialCommunityIcons name="pencil" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Show joined date from API */}
            {profileData?.createdAt && (
              <Text className="text-md font-bold text-black mt-2">
                Joined {formatJoinedDate(profileData.createdAt)}
              </Text>
            )}
          </View>

          {/* Details Section */}
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
              value={profileData?.vehicle || "Not available"}
            />
            <InfoCard
              label="Vehicle's Registration Number"
              value={profileData?.vehicleNo || "Not available"}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfileScreen;
