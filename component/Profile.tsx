import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import CustomHeader from "./CustomHeader";

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Profile"
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  /* ------- STATIC DATA -------- */
  const data = {
    fullName: "Lashan Pieris",
    employeeId: "DRV00001",
    phone: "+94 77 3344555",
    nic: "993500077V",
    vehicle: "Piaggio Three Wheeler",
    vehicleNo: "SW1100223388",
    joinedDate: "June 1, 2026",
  };

  const InfoCard = ({ label, value }: { label: string; value: string }) => (
    <View className="mb-4">
      <Text className="text-[#495D86] mb-1 font-medium">{label}</Text>
      <Text className="bg-[#F3F3F3] rounded-full px-5 py-4 text-[#000000] text-sm">
        {value}
      </Text>
    </View>
  );

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    // You can add logic here to change app language
    console.log("Language changed to:", languageCode);
  };

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
            onLanguageChange={handleLanguageChange}
          />

          {/* Profile Image Section */}
          <View className="items-center mt-10">
            <View style={{ position: "relative" }}>
              <Image
                source={require("@/assets/images/home/profile.webp")}
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

            <Text className="text-md font-bold text-black mt-2">
              Joined {data.joinedDate}
            </Text>
          </View>

          {/* Details Section */}
          <View style={{ paddingHorizontal: wp(6), marginTop: hp(4) }}>
            <InfoCard label="Full Name" value={data.fullName} />
            <InfoCard label="Employee ID" value={data.employeeId} />
            <InfoCard label="Phone Number" value={data.phone} />
            <InfoCard label="NIC Number" value={data.nic} />
            <InfoCard label="Vehicle" value={data.vehicle} />
            <InfoCard
              label="Vehicle’s Registration Number"
              value={data.vehicleNo}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfileScreen;
