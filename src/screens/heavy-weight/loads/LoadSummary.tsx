import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  AppState,
  AppStateStatus,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "@/component/common/CustomHeader";
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { AlertModal } from "@/component/common/AlertModal";

type LoadSummaryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "LoadSummary"
>;

type LoadSummaryRouteProp = RouteProp<RootStackParamList, "LoadSummary">;

interface LoadSummaryProps {
  navigation: LoadSummaryScreenNavigationProp;
  route: LoadSummaryRouteProp;
}

interface GradeSetItem {
  grade: string;
  set: number;
  crates: number;
  weightKg: number;
}

interface CropLoadData {
  id: string;
  cropName: string;
  imageUri: string;
  totalWeightKg: number;
  totalCrates: number;
  gradeSets: GradeSetItem[];
}

const MOCK_SUMMARY_ITEMS: CropLoadData[] = [
  {
    id: "red_bell_pepper",
    cropName: "Red Bell Pepper",
    imageUri:
      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=150&auto=format&fit=crop&q=80",
    totalWeightKg: 25.92,
    totalCrates: 22,
    gradeSets: [
      { grade: "Grade A", set: 1, crates: 9, weightKg: 10.02 },
      { grade: "Grade A", set: 2, crates: 1, weightKg: 1.02 },
      { grade: "Grade B", set: 1, crates: 2, weightKg: 5.0 },
      { grade: "Grade C", set: 1, crates: 10, weightKg: 9.88 },
    ],
  },
  {
    id: "red_onion",
    cropName: "Red Onion",
    imageUri:
      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=150&auto=format&fit=crop&q=80",
    totalWeightKg: 111.87,
    totalCrates: 9,
    gradeSets: [
      { grade: "Grade A", set: 1, crates: 8, weightKg: 111.67 },
      { grade: "Grade A", set: 2, crates: 1, weightKg: 0.2 },
    ],
  },
];

const LoadSummary: React.FC<LoadSummaryProps> = ({ navigation, route }) => {
  const mode = route.params?.mode || "accept";
  const loadCode = route.params?.loadCode || "L-DRV00001260914001";

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [items] = useState<CropLoadData[]>(MOCK_SUMMARY_ITEMS);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const hasOpenedMapRef = useRef(false);

  // When returning from Google Maps back to the app, show Finish Journey and Continue to map
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && hasOpenedMapRef.current) {
        setJourneyStarted(true);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const openGoogleMapsToThanamalwila = () => {
    hasOpenedMapRef.current = true;
    const destination = "Thanamalwila, Sri Lanka";
    const encodedDestination = encodeURIComponent(destination);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}&travelmode=driving&dir_action=navigate`;
    const urlAlt = `https://maps.google.com/?q=${encodedDestination}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(urlAlt);
        }
      })
      .catch(() => {
        Alert.alert(
          "Error",
          "Could not open Google Maps. Please ensure Google Maps is installed on your device.",
        );
      });
  };

  const handleStartJourney = () => {
    openGoogleMapsToThanamalwila();
  };

  const handleFinishJourney = () => {
    navigation.navigate("LoadQR", { loadCode });
  };

  const handleContinueToMap = () => {
    openGoogleMapsToThanamalwila();
  };

  const handleAcceptLoad = () => {
    setShowSuccessModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigation.navigate("Loads");
  };

  return (
    <View className="flex-1 bg-white">

      {/* Header */}
      <CustomHeader
        title="Summery"
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 px-4 pt-3"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {items.map((crop) => (
          <View
            key={crop.id}
            className="bg-white rounded-3xl p-4 mb-5"
            style={{
              borderWidth: 1,
              borderColor: "#9C9C9C",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {/* Crop Header */}
            <View className="flex-row items-center mb-3">
              <Image
                source={{ uri: crop.imageUri }}
                className="w-12 h-12 rounded-xl mr-3"
                resizeMode="contain"
              />
              <Text className="text-base font-bold text-black">
                {crop.cropName}
              </Text>
            </View>

            {/* Total Dark Card */}
            <View
              className="rounded-2xl p-4 flex-row items-center justify-between mb-4"
              style={{ backgroundColor: "#17262C" }}
            >
              {/* Total Weight */}
              <View className="flex-1 items-center">
                <MaterialCommunityIcons
                  name="scale"
                  size={24}
                  color="#FFFFFF"
                  style={{ marginBottom: 4 }}
                />
                <Text className="text-gray-300 text-xs text-center">
                  Total{"\n"}Weight
                </Text>
                <Text className="text-white text-base font-bold mt-1">
                  {crop.totalWeightKg.toFixed(2)} kg
                </Text>
              </View>

              {/* Divider */}
              <View className="w-[1px] h-14 bg-gray-600 mx-2" />

              {/* Total Crates */}
              <View className="flex-1 items-center">
                <FontAwesome5
                  name="boxes"
                  size={22}
                  color="#FFFFFF"
                  style={{ marginBottom: 4 }}
                />
                <Text className="text-gray-300 text-xs text-center">
                  Total{"\n"}Crates
                </Text>
                <Text className="text-white text-base font-bold mt-1">
                  {crop.totalCrates}
                </Text>
              </View>
            </View>

            {/* Grade Sets List */}
            <View className="gap-y-4">
              {crop.gradeSets.map((gs, idx) => (
                <View key={idx} className="relative pt-3">
                  {/* Pill Badge */}
                  <View className="absolute top-0 left-24 z-10 bg-[#FFF6AD] px-3 py-0.5 rounded-full">
                    <Text className="text-[11px] font-bold text-gray-800">
                      {gs.grade}  |  Set : {gs.set}
                    </Text>
                  </View>

                  {/* Inner Box */}
                  <View
                    className="bg-[#FAFAFA] rounded-2xl p-3 flex-row items-center justify-around"
                    style={{
                      borderLeftWidth: 3,
                      borderLeftColor: "#19282F",
                    }}
                  >
                    {/* Crates Column */}
                    <View className="flex-row items-center gap-x-2">
                      <View className="w-8 h-8 rounded-full bg-[#E5E7EB] items-center justify-center">
                        <FontAwesome5 name="boxes" size={14} color="#000000" />
                      </View>
                      <View>
                        <Text className="text-[10px] text-black font-medium">
                          Crates
                        </Text>
                        <Text className="text-sm font-bold text-black">
                          {gs.crates}
                        </Text>
                      </View>
                    </View>

                    {/* Weight Column */}
                    <View className="flex-row items-center gap-x-2">
                      <View className="w-8 h-8 rounded-full bg-[#E5E7EB] items-center justify-center">
                        <MaterialCommunityIcons
                          name="scale"
                          size={16}
                          color="#000000"
                        />
                      </View>
                      <View>
                        <Text className="text-[10px] text-black font-medium">
                          Weight
                        </Text>
                        <Text className="text-sm font-bold text-black">
                          {gs.weightKg.toFixed(2)} kg
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {mode === "accept" && (
          <TouchableOpacity
            onPress={handleAcceptLoad}
            activeOpacity={0.8}
            className="bg-[#FFCC00] py-4 rounded-full items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Text className="text-black font-extrabold text-base">
              Accept Load
            </Text>
          </TouchableOpacity>
        )}

        {mode === "journey" && !journeyStarted && (
          <TouchableOpacity
            onPress={handleStartJourney}
            activeOpacity={0.8}
            className="bg-[#FFCC00] py-4 rounded-full items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Text className="text-black font-extrabold text-base">
              Start Journey
            </Text>
          </TouchableOpacity>
        )}

        {mode === "journey" && journeyStarted && (
          <View className="gap-y-3">
            {/* Finish Journey - Black button */}
            <TouchableOpacity
              onPress={handleFinishJourney}
              activeOpacity={0.8}
              className="bg-black py-4 rounded-full items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text className="text-white font-extrabold text-base">
                Finish Journey
              </Text>
            </TouchableOpacity>

            {/* Continue to map - Yellow button */}
            <TouchableOpacity
              onPress={handleContinueToMap}
              activeOpacity={0.8}
              className="bg-[#FFCC00] py-4 rounded-full items-center justify-center flex-row"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <FontAwesome5 name="map-marked-alt" size={18} color="#000000" />
              <Text className="text-black font-extrabold text-base ml-2">
                Continue to map
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Success Modal */}
      <AlertModal
        visible={showSuccessModal}
        title="Load Accepted!"
        message="The load has been successfully accepted and assigned to you."
        type="success"
        onClose={handleModalClose}
        duration={3000}
        autoClose={true}
      />
    </View>
  );
};

export default LoadSummary;
