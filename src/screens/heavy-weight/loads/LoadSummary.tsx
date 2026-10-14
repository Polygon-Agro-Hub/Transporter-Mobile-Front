import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "@/component/common/CustomHeader";
import { FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { AlertModal } from "@/component/common/AlertModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";

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

const LoadSummary: React.FC<LoadSummaryProps> = ({ navigation, route }) => {
  const mode = route.params?.mode || "accept";
  const loadCode = route.params?.loadCode || "L-DRV00001260914001";

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [items, setItems] = useState<CropLoadData[]>([]);
  const [loadInfo, setLoadInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [starting, setStarting] = useState(false);

  const [otherJourneyActive, setOtherJourneyActive] = useState(false);
  const [activeLoadCode, setActiveLoadCode] = useState<string | null>(null);

  const [modalMessage, setModalMessage] = useState<React.ReactNode>("");

  const hasOpenedMapRef = useRef(false);

  const fetchLoadDetails = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/load/get-load-details?transferCode=${encodeURIComponent(loadCode)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (
        response.data &&
        response.data.status === "success" &&
        response.data.data
      ) {
        setItems(
          Array.isArray(response.data.data.crops)
            ? response.data.data.crops
            : [],
        );
        setLoadInfo(response.data.data.load || null);

        const currentJourneyStatus = response.data.data.load?.journeyStatus;
        if (
          currentJourneyStatus === "Start" ||
          currentJourneyStatus === "End"
        ) {
          setJourneyStarted(true);
          hasOpenedMapRef.current = true;
        } else {
          setJourneyStarted(false);
        }
      }

      if (mode === "journey") {
        try {
          const activeRes = await axios.get(
            `${environment.API_BASE_URL}api/load/check-active-journey?transferCode=${encodeURIComponent(loadCode)}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          setOtherJourneyActive(!!activeRes.data?.data?.hasActiveJourney);
          setActiveLoadCode(activeRes.data?.data?.activeLoadCode || null);
        } catch (e) {
          console.warn("Could not check active journey:", e);
        }
      }
    } catch (error) {
      console.warn("Could not fetch load details:", error);
    } finally {
      setLoading(false);
    }
  }, [loadCode, mode]);

  useFocusEffect(
    useCallback(() => {
      fetchLoadDetails();
    }, [fetchLoadDetails]),
  );

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

  const openGoogleMapsToDestination = () => {
    hasOpenedMapRef.current = true;
    const destination = loadInfo?.destinationCity
      ? `${loadInfo.destinationCity}, Sri Lanka`
      : "Thanamalwila, Sri Lanka";
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

  const handleStartJourney = async () => {
    if (otherJourneyActive || starting) return;

    setStarting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Session expired. Please log in again.");
        return;
      }

      await axios.post(
        `${environment.API_BASE_URL}api/load/update-journey-status`,
        { transferCode: loadCode, journeyStatus: "Start" },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Server accepted the start
      setJourneyStarted(true);
      openGoogleMapsToDestination();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setOtherJourneyActive(true);
        fetchLoadDetails();
      }
      Alert.alert(
        "Cannot start journey",
        error?.response?.data?.message ||
          "Failed to start the journey. Please try again.",
      );
    } finally {
      setStarting(false);
    }
  };

  const handleFinishJourney = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await axios.post(
          `${environment.API_BASE_URL}api/load/update-journey-status`,
          { transferCode: loadCode, journeyStatus: "End" },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to finish the journey. Please try again.",
      );
      return;
    }
    navigation.navigate("LoadQR", { loadCode });
  };

  const handleContinueToMap = () => {
    if (otherJourneyActive) return;
    openGoogleMapsToDestination();
  };

  const handleAcceptLoad = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await axios
          .post(
            `${environment.API_BASE_URL}api/load/assign-load`,
            { transferCode: loadCode },
            { headers: { Authorization: `Bearer ${token}` } },
          )
          .catch(() => {});
      }
    } catch (_) {}
    setModalMessage(
      <View className="items-center">
        <Text className="text-center text-[#4E4E4E] mb-5 mt-2 text-sm leading-5">
          <Text className="font-extrabold text-black">{loadCode}</Text>
          {"\n"}has been successfully assigned to you.
        </Text>
      </View>,
    );
    setShowSuccessModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigation.navigate("Loads");
  };

  const buttonShadow = (blocked: boolean, height: number, opacity: number) => ({
    shadowColor: "#000",
    shadowOffset: { width: 0, height },
    shadowOpacity: blocked ? 0 : opacity,
    shadowRadius: 6,
    elevation: blocked ? 0 : 4,
  });

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <CustomHeader
        title="Summary"
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFCC00" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-3"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "space-between",
            paddingBottom: 24,
          }}
        >
          {/* Main items section */}
          <View>
            {items.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Text className="text-gray-400 text-sm">
                  -- No items found --
                </Text>
              </View>
            ) : (
              items.map((crop) => (
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
                      className="w-12 h-12 rounded-xl mr-3 shrink-0"
                      resizeMode="contain"
                    />
                    <Text
                      className="text-base font-bold text-black flex-1"
                      style={{ flexShrink: 1 }}
                    >
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
                      <FontAwesome6
                        name="weight-scale"
                        size={24}
                        color="#FFFFFF"
                        style={{ marginBottom: 4 }}
                      />
                      <Text className="text-gray-300 text-xs text-center">
                        Total{`\n`}Weight
                      </Text>
                      <Text className="text-white text-base font-bold mt-1">
                        {crop.totalWeightKg.toFixed(2)} kg
                      </Text>
                    </View>

                    {/* Divider */}
                    <View className="w-[1px] h-14 bg-gray-600 mx-2" />

                    {/* Total Containers */}
                    <View className="flex-1 items-center">
                      <FontAwesome5
                        name="boxes"
                        size={22}
                        color="#FFFFFF"
                        style={{ marginBottom: 4 }}
                      />
                      <Text className="text-gray-300 text-xs text-center">
                        Total{`\n`}Containers
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
                        <View
                          className="absolute top-0 z-10 bg-[#FFF6AD] px-3 py-0.5 rounded-full"
                          style={{ alignSelf: "center" }}
                        >
                          <Text className="text-[11px] font-bold text-gray-800">
                            {gs.grade} | Set : {gs.set}
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
                              <FontAwesome5
                                name="boxes"
                                size={14}
                                color="#000000"
                              />
                            </View>
                            <View>
                              <Text className="text-[10px] text-black font-medium">
                                Containers
                              </Text>
                              <Text className="text-sm font-bold text-black">
                                {gs.crates}
                              </Text>
                            </View>
                          </View>

                          {/* Weight Column */}
                          <View className="flex-row items-center gap-x-2">
                            <View className="w-8 h-8 rounded-full bg-[#E5E7EB] items-center justify-center">
                              <FontAwesome6
                                name="weight-scale"
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
              ))
            )}
          </View>

          {/* Action buttons section */}
          <View className="mt-4">
            {mode === "accept" && (
              <TouchableOpacity
                onPress={handleAcceptLoad}
                activeOpacity={0.8}
                className="bg-[#FFCC00] py-4 rounded-full items-center justify-center"
                style={buttonShadow(false, 4, 0.15)}
              >
                <Text className="text-black font-extrabold text-base">
                  Accept Load
                </Text>
              </TouchableOpacity>
            )}

            {/* Start Journey (only when this load is not started yet) */}
            {mode === "journey" && !journeyStarted && (
              <View>
                <TouchableOpacity
                  onPress={handleStartJourney}
                  disabled={otherJourneyActive || starting}
                  activeOpacity={0.8}
                  className={`${
                    otherJourneyActive ? "bg-[#DCDCDC]" : "bg-[#FFCC00]"
                  } py-4 rounded-full items-center justify-center`}
                  style={buttonShadow(otherJourneyActive, 4, 0.15)}
                >
                  {starting ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text
                      style={{
                        color: otherJourneyActive ? "#8A8A8A" : "#000000",
                        fontWeight: "800",
                        fontSize: 15,
                      }}
                    >
                      Start Journey
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Finish Journey + Continue to map (this load is started) */}
            {mode === "journey" && journeyStarted && (
              <View className="gap-y-3">
                {/* Finish Journey - Black button */}
                <TouchableOpacity
                  onPress={handleFinishJourney}
                  activeOpacity={0.8}
                  className="bg-black py-4 rounded-full items-center justify-center"
                  style={buttonShadow(false, 3, 0.2)}
                >
                  <Text className="text-white font-extrabold text-base">
                    Finish Journey
                  </Text>
                </TouchableOpacity>

                {/* Continue to map - Yellow button */}
                <TouchableOpacity
                  onPress={handleContinueToMap}
                  disabled={otherJourneyActive}
                  activeOpacity={0.8}
                  className={`${
                    otherJourneyActive ? "bg-[#D9D9D9]" : "bg-[#FFCC00]"
                  } py-4 rounded-full items-center justify-center flex-row`}
                  style={buttonShadow(otherJourneyActive, 3, 0.2)}
                >
                  <FontAwesome5
                    name="map-marked-alt"
                    size={18}
                    color={otherJourneyActive ? "#8A8A8A" : "#000000"}
                  />
                  <Text
                    style={{
                      color: otherJourneyActive ? "#8A8A8A" : "#000000",
                      fontWeight: "800",
                      fontSize: 15,
                      marginLeft: 8,
                    }}
                  >
                    Continue to map
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Success Modal */}
      <AlertModal
        visible={showSuccessModal}
        title="Successful!"
        message={modalMessage}
        type="success"
        onClose={handleModalClose}
        duration={5000}
        autoClose={true}
      />
    </View>
  );
};

export default LoadSummary;
