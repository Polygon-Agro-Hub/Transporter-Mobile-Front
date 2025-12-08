import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import { Feather } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import CustomHeader from "@/component/common/CustomHeader";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

type MyJourneyNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MyJourney"
>;

interface MyJourneyProps {
  navigation: MyJourneyNavigationProp;
  route?: any; // Add route prop to receive trip data
}

interface TripData {
  id: string;
  name: string;
  time: string;
  count: number;
  status: "Pending" | "Started" | "InProgress" | "Completed";
  address?: string;
  payment?: string;
  distanceToGo?: string;
}

const MyJourney: React.FC<MyJourneyProps> = ({ navigation, route }) => {
  // Simulate trip data from backend
  const [todoJobs, setTodoJobs] = useState<TripData[]>([
    {
      id: "01",
      name: "Mr. Kusal Dias",
      time: "8:00AM - 2:00PM",
      count: 2,
      status: "Pending",
      address: "11/A, Galle Rd, Dehiwala",
      payment: "Cash : LKR 1,800.00",
      distanceToGo: "2km",
    },
    {
      id: "02",
      name: "Mrs. Anjali Perera",
      time: "2:00PM - 8:00PM",
      count: 1,
      status: "Pending",
      address: "45, Main Street, Colombo 05",
      payment: "Cash : LKR 1,200.00",
      distanceToGo: "3.5km",
    },
  ]);

  // Current active trip
  const [currentTrip, setCurrentTrip] = useState<TripData | null>(null);
  const [journeyStatus, setJourneyStatus] = useState<
    "not_started" | "starting" | "in_progress"
  >("not_started");

  // Initialize with trip from route or find first pending trip
  useEffect(() => {
    if (route?.params?.tripId) {
      const trip = todoJobs.find((job) => job.id === route.params.tripId);
      if (trip) {
        setCurrentTrip(trip);
        if (trip.status === "Started") {
          setJourneyStatus("starting");
        } else if (trip.status === "InProgress") {
          setJourneyStatus("in_progress");
        }
      }
    } else {
      // Find first pending trip
      const pendingTrip = todoJobs.find((job) => job.status === "Pending");
      if (pendingTrip) {
        setCurrentTrip(pendingTrip);
      }
    }
  }, [route?.params?.tripId]);

  // Function to start journey
  const handleStartJourney = () => {
    if (!currentTrip) return;

    Alert.alert(
      "Start Journey",
      `Are you sure you want to start journey to ${currentTrip.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => {
            // Update trip status
            const updatedJobs = todoJobs.map((job) =>
              job.id === currentTrip.id
                ? { ...job, status: "Started" as const }
                : job
            ) as TripData[];
            setTodoJobs(updatedJobs);
            setCurrentTrip((prev) =>
              prev ? { ...prev, status: "Started" as const } : null
            );
            setJourneyStatus("starting");
          },
        },
      ]
    );
  };

  // Function to continue journey
  const handleContinueJourney = () => {
    if (!currentTrip) return;

    // Update to in-progress
    const updatedJobs = todoJobs.map((job) =>
      job.id === currentTrip.id
        ? { ...job, status: "InProgress" as const }
        : job
    ) as TripData[];
    setTodoJobs(updatedJobs);
    setCurrentTrip((prev) =>
      prev ? { ...prev, status: "InProgress" as const } : null
    );
    setJourneyStatus("in_progress");
  };

  // Function to end journey
  const handleEndJourney = () => {
    navigation.navigate("EndJourneyConfirmation" as any, {
      tripId: currentTrip?.id,
      tripName: currentTrip?.name,
      onConfirm: () => {
        // Mark trip as completed
        const updatedJobs = todoJobs.map((job) =>
          job.id === currentTrip?.id
            ? { ...job, status: "Completed" as const }
            : job
        ) as TripData[];
        setTodoJobs(updatedJobs);
        setCurrentTrip(null);
        setJourneyStatus("not_started");

        // Find next pending trip
        const nextPendingTrip = updatedJobs.find(
          (job) => job.status === "Pending"
        ) as TripData | undefined;
        if (nextPendingTrip) {
          setCurrentTrip(nextPendingTrip);
        }
      },
    });
  };

  return (
    <View className="flex-1 bg-black">
      <CustomHeader
        title="My Journey"
        showBackButton={true}
        showLanguageSelector={false}
        navigation={navigation}
        dark={true}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: hp("0%") }}>
        {/* MAP IMAGE */}
        <View className="w-full relative">
          <Image
            source={require("@/assets/images/map.png")}
            resizeMode="cover"
            className="rounded-t-3xl h-screen w-full"
          />

          {/* Direction Floating BTN - Only show when journey is in progress */}
          {journeyStatus === "in_progress" && (
            <TouchableOpacity
              className="absolute bottom-4 left-4 bg-[#FFD700] p-3 rounded-full"
              style={{ elevation: 5 }}
            >
              <Feather name="navigation" size={20} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* BOTTOM CARD - ABSOLUTE */}
      {currentTrip && (
        <View className="mx-6">
          <View
            className="absolute w-full pb-4"
            style={{
              bottom: 0,
            }}
          >
            {journeyStatus === "not_started" ? (
              // NOT STARTED VIEW - Next Destination
              <>
                <View
                  className="bg-white w-full rounded-2xl shadow-lg px-5 py-4 mb-3"
                  style={{ elevation: 4 }}
                >
                  <View className="flex-row justify-center items-center mb-4">
                    <View>
                      <Text className="text-xs text-black font-semibold">
                        Your Next Destination{" "}
                        <Text className="font-extrabold text-black">
                          ({currentTrip?.distanceToGo || "0 km"})
                        </Text>
                      </Text>
                      <Text className="text-sm text-black mt-1 text-center font-semibold">
                        No: #{currentTrip.id}
                      </Text>
                    </View>
                  </View>

                  {/* Start Journey Button */}
                  <TouchableOpacity
                    onPress={handleStartJourney}
                    className="bg-[#F7CA21] py-4 rounded-full items-center justify-center"
                  >
                    <Text className="text-base font-semibold text-black">
                      Start Journey
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : journeyStatus === "starting" ? (
              // STARTING VIEW - Continue Journey
              <>
                <View
                  className="bg-white w-full rounded-2xl shadow-lg px-5 py-4 mb-3"
                  style={{ elevation: 4 }}
                >
                  <View className="flex-row justify-center items-center mb-4">
                    <View>
                      <Text className="text-xs text-black font-semibold">
                        Your Next Destination{" "}
                        <Text className="font-extrabold text-black">
                          ({currentTrip?.distanceToGo || "0 km"})
                        </Text>
                      </Text>
                      <Text className="text-sm text-black mt-1 text-center font-semibold">
                        No: #{currentTrip.id}
                      </Text>
                    </View>
                  </View>

                  {/* Continue Journey Button */}
                  <TouchableOpacity
                    onPress={handleContinueJourney}
                    className="bg-[#F7CA21] py-4 rounded-full items-center justify-center"
                  >
                    <Text className="text-base font-semibold text-black">
                      Continue Journey
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // IN PROGRESS VIEW - Full Details with End Journey
              <>
                <View className="bg-[#F7CA21] rounded-full shadow-lg p-3 mb-2 w-10 h-10">
                  <FontAwesome5 name="location-arrow" size={14} color="black" />
                </View>
                {/* ------------ TOP WHITE CARD ------------ */}
                <View
                  className="bg-white w-full rounded-2xl shadow-lg px-5 py-4 mb-3"
                  style={{ elevation: 4 }}
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-xs text-[#4E4E4E]">
                        {currentTrip.count}{" "}
                        {currentTrip.count === 1 ? "Pack" : "Packs"}
                      </Text>
                      <Text className="text-base font-semibold text-black">
                        {currentTrip.name}
                      </Text>
                    </View>

                    <TouchableOpacity
                      className="bg-[#FFD700] w-12 h-12 rounded-full items-center justify-center"
                      onPress={() => {
                        Alert.alert("Call", `Call ${currentTrip.name}`);
                      }}
                    >
                      <FontAwesome5 name="phone-alt" size={20} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ------------ BOTTOM WHITE CARD ------------ */}
                <View
                  className="bg-white w-full rounded-2xl shadow-lg px-5 pt-4 pb-6"
                  style={{ elevation: 4 }}
                >
                  <Text className="text-sm text-black mb-1 text-center">
                    More{" "}
                    <Text className="text-black font-bold">
                      {currentTrip.distanceToGo?.replace("km", "")}km To Go
                    </Text>
                  </Text>

                  <View className="flex-row items-center mb-2 justify-center">
                    <Entypo name="location-pin" size={18} color="black" />
                    <Text className="text-xs text-black">
                      {currentTrip.address}
                    </Text>
                  </View>

                  <View className="flex-row items-center mb-4 justify-center">
                    <FontAwesome5 name="coins" size={14} color="#F7CA21" />
                    <Text className="text-xs text-black ml-2 font-semibold">
                      {currentTrip.payment}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleEndJourney}
                    className="bg-[#F7CA21] py-4 rounded-full items-center justify-center"
                  >
                    <Text className="text-base font-semibold text-black">
                      End Journey
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default MyJourney;
