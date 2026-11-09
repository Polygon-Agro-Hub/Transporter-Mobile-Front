import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { useSelector } from "react-redux";
import { selectUserProfile } from "@/store/authSlice";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import * as Progress from "react-native-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import HeavyHomeSkeleton from "@/component/common/HeavyHomeSkeleton";
import UnableToLoadData from "@/component/common/UnableToLoadData";

const scanQRImage = require("@/assets/images/home/scan.webp");
const myComplaintImage = require("@/assets/images/home/complaints.webp");
const packsImage = require("@/assets/images/home/packs.webp");
const ongoingImage = require("@/assets/images/home/ongoing.webp");
const returnImage = require("@/assets/images/home/return.webp");
const smallImage = require("@/assets/images/home/target.webp");

type HeavyDriverHomeNavigationProp = StackNavigationProp<
  RootStackParamList,
  "HeavyDriverHome"
>;

interface HeavyDriverHomeProps {
  navigation: HeavyDriverHomeNavigationProp;
}

type HomeTab = "deliver" | "transfer";

interface HomeButton {
  image: any;
  label: string;
  variant?: "ongoing";
  action: () => void;
  disabled: boolean;
}

/* Same shape as the light driver /api/home/get-amount response */
interface AmountData {
  totalOrders: number;
  totalCashAmount: number;
  todoOrders: number;
  completedOrders: number;
  todayCompletedOrders: number;
  todayReturnOrders: number;
  onTheWayOrders: number;
  holdOrders: number;
  returnOrders: number;
  returnReceivedOrders: number;
  cashOrders: number;
  ongoingProcessOrderIds?: number[];
  pendingLocationsCount?: number;
  todayCompletedLocationsCount?: number;
  activeTransactionStatus?: string | null;
}

const defaultAmountData: AmountData = {
  totalOrders: 0,
  totalCashAmount: 0,
  todoOrders: 0,
  completedOrders: 0,
  todayCompletedOrders: 0,
  todayReturnOrders: 0,
  onTheWayOrders: 0,
  holdOrders: 0,
  returnOrders: 0,
  returnReceivedOrders: 0,
  cashOrders: 0,
  ongoingProcessOrderIds: [],
  pendingLocationsCount: 0,
  todayCompletedLocationsCount: 0,
  activeTransactionStatus: null,
};

const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

/* ----------------------------- Tab toggle ----------------------------- */

const TabToggle = ({
  active,
  onChange,
}: {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
}) => {
  const tabs: { key: HomeTab; label: string; icon: any }[] = [
    { key: "deliver", label: "Deliver Orders", icon: "bag-shopping" },
    { key: "transfer", label: "Transfer Loads", icon: "boxes-stacked" },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 16,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.8}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              flexDirection: "row",
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isActive ? "#000" : "transparent",
            }}
          >
            <FontAwesome6
              name={tab.icon}
              size={14}
              color={isActive ? "#fff" : "#111"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: isActive ? "#fff" : "#111",
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/* ----------------------------- Action grid ----------------------------- */

const ActionGrid = ({ buttons }: { buttons: HomeButton[] }) => {
  const rows = chunkArray(buttons, 2);

  return (
    <View className="px-4 pt-2 pb-6">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-between mb-4">
          {row.map((button) => {
            const isOngoing = button.variant === "ongoing";
            return (
              <TouchableOpacity
                key={button.label}
                onPress={button.disabled ? undefined : button.action}
                activeOpacity={button.disabled ? 1 : 0.7}
                disabled={button.disabled}
                style={{
                  width: "48%",
                  backgroundColor: isOngoing ? "#FFF2BF" : "#fff",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  ...(button.disabled
                    ? { borderWidth: 1, borderColor: "#EBEBEB" }
                    : cardShadow),
                }}
              >
                <View className="w-28 h-28 rounded-lg justify-center items-center mb-3 overflow-hidden">
                  <Image
                    source={button.image}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                </View>

                <View className="flex-row items-center justify-center">
                  {isOngoing && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#F7CA21",
                        marginRight: 6,
                      }}
                    />
                  )}
                  <Text className="text-sm font-bold text-gray-800 text-center">
                    {button.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {row.length === 1 && <View className="w-[48%]" />}
        </View>
      ))}
    </View>
  );
};

/* ----------------------------- Main screen ----------------------------- */

const HeavyDriverHome: React.FC<HeavyDriverHomeProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<HomeTab>("deliver");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Deliver Orders (same data as the light driver home)
  const [amountData, setAmountData] = useState<AmountData>(defaultAmountData);
  const [deliverError, setDeliverError] = useState<string | null>(null);

  // Transfer Loads
  const [loadsCount, setLoadsCount] = useState(0);
  const [ongoingLoadsCount, setOngoingLoadsCount] = useState(0);
  const [ongoingLoadCode, setOngoingLoadCode] = useState<string | null>(null);

  const userProfile = useSelector(selectUserProfile);

  /* ======================= DELIVER ORDERS: data ======================= */

  const fetchAmountData = useCallback(async () => {
    try {
      setDeliverError(null);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setDeliverError("No authentication token found");
        setAmountData(defaultAmountData);
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/home/get-amount`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.status === "success" && response.data.data) {
        setAmountData({ ...defaultAmountData, ...response.data.data });
      } else {
        setDeliverError("Invalid response format");
        setAmountData(defaultAmountData);
      }
    } catch (error) {
      console.error("Error fetching amount data:", error);
      setDeliverError("Failed to load data");
      setAmountData(defaultAmountData);
    }
  }, []);

  /* ======================= TRANSFER LOADS: data ======================= */

  const fetchLoadsData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${environment.API_BASE_URL}api/load/get-driver-loads`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (
        response.data &&
        response.data.status === "success" &&
        response.data.data
      ) {
        const todoLoads = response.data.data.todoLoads || [];
        setLoadsCount(todoLoads.length);

        // Ongoing loads have journeyStatus = "Start"
        const ongoingLoads = todoLoads.filter(
          (load: any) => load.journeyStatus === "Start",
        );
        setOngoingLoadsCount(ongoingLoads.length);
        setOngoingLoadCode(
          ongoingLoads.length > 0 ? ongoingLoads[0].loadCode || null : null,
        );
      }
    } catch (error) {
      console.warn("Could not fetch heavy driver loads:", error);
    }
  }, []);

  /* ======================= Shared fetch / refresh ======================= */

  const fetchAll = useCallback(async () => {
    try {
      await Promise.all([fetchAmountData(), fetchLoadsData()]);
    } finally {
      setLoading(false);
    }
  }, [fetchAmountData, fetchLoadsData]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "refreshToken", "userData"]);
      // Same logout flow as the light driver home. Import logoutUser and
      // useDispatch if you want the full redux reset here.
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  /* ======================= DELIVER ORDERS: logic ======================= */

  const getCashAmount = () => {
    const cash = amountData?.totalCashAmount;
    if (cash === undefined || cash === null || isNaN(cash)) return 0;
    return cash;
  };

  const getPacksCount = () =>
    (amountData?.todoOrders || 0) +
    (amountData?.holdOrders || 0) +
    (amountData?.onTheWayOrders || 0);

  const shouldShowEndShiftButton = () => {
    const returnOrders = amountData?.returnOrders || 0;
    return (
      getPacksCount() === 0 && (getCashAmount() > 0 || returnOrders > 0)
    );
  };

  const handleCashNavigation = () => {
    const cashAmount = getCashAmount();
    const txStatus = amountData?.activeTransactionStatus;

    if (txStatus === "To Review") {
      navigation.navigate("BankTransferSlipStatus" as any, {
        status: "pending",
      });
    } else if (txStatus === "Rejected") {
      navigation.navigate("BankTransferSlipStatus" as any, {
        status: "rejected",
      });
    } else if (cashAmount > 0) {
      navigation.navigate("CashHandOver" as any);
    } else {
      Alert.alert(
        "Information",
        "No cash received. Your previous transfer is completed.",
      );
    }
  };

  const handleEndShiftPress = () => {
    const cashAmount = getCashAmount();
    const returnOrders = amountData?.returnOrders || 0;
    const txStatus = amountData?.activeTransactionStatus;

    if (returnOrders > 0) {
      navigation.navigate("ReturnOrders" as any);
    } else if (txStatus === "To Review" || txStatus === "Rejected") {
      handleCashNavigation();
    } else if (cashAmount > 0) {
      handleCashNavigation();
    }
  };

  const getMotivationalMessage = () => {
    if (shouldShowEndShiftButton()) return null;

    const pendingLocations = amountData?.pendingLocationsCount || 0;
    const todayCompletedLocations =
      amountData?.todayCompletedLocationsCount || 0;

    if (pendingLocations === 0) {
      return {
        title: "Have a nice Day!",
        subtitle: "Scan packages to start..",
        bgColor: "#FFF2BF",
        percentage: 0,
        style: 1,
      };
    }

    const totalWork = pendingLocations + todayCompletedLocations;
    const completionRate =
      totalWork > 0
        ? Math.round((todayCompletedLocations / totalWork) * 100)
        : 0;

    return {
      title: "Way more to go!",
      subtitle: `${pendingLocations} Location${pendingLocations !== 1 ? "s" : ""} to go..`,
      bgColor: "#F7CA21",
      percentage: completionRate,
      style: 2,
    };
  };

  const buildDeliverButtons = (): HomeButton[] => {
    const packsCount = getPacksCount();
    const showEndShift = shouldShowEndShiftButton();
    const returnOrders = amountData?.returnOrders || 0;

    const buttons: HomeButton[] = [
      {
        image: scanQRImage,
        label: "Scan",
        action: () => navigation.navigate("AssignOrderQR" as any),
        disabled: showEndShift,
      },
      {
        image: packsImage,
        label: `${packsCount} ${packsCount === 1 ? "Pack" : "Packs"}`,
        action: () => navigation.navigate("Jobs" as any),
        disabled: packsCount === 0 && (amountData?.completedOrders || 0) === 0,
      },
      {
        image: myComplaintImage,
        label: "My Complaints",
        action: () => navigation.navigate("ComplaintsList"),
        disabled: false,
      },
    ];

    if ((amountData?.onTheWayOrders || 0) > 0) {
      const ids = amountData?.ongoingProcessOrderIds || [];
      buttons.push({
        image: ongoingImage,
        label: "Ongoing",
        variant: "ongoing",
        action: () => {
          if (ids.length > 0) {
            navigation.navigate("OrderDetails" as any, {
              processOrderIds: ids,
            });
          } else {
            navigation.navigate("Jobs" as any);
          }
        },
        disabled: false,
      });
    }

    if (returnOrders > 0) {
      buttons.push({
        image: returnImage,
        label: `${returnOrders} Return`,
        action: () => navigation.navigate("ReturnOrders" as any),
        disabled: false,
      });
    }

    return buttons;
  };

  /* ======================= TRANSFER LOADS: buttons ======================= */

  const buildTransferButtons = (): HomeButton[] => [
    {
      image: scanQRImage,
      label: "Scan Load QR",
      action: () => navigation.navigate("AssignLoadQR"),
      disabled: false,
    },
    {
      image: packsImage,
      label: `${loadsCount} ${loadsCount === 1 ? "Load" : "Loads"}`,
      action: () => navigation.navigate("Loads"),
      disabled: loadsCount === 0,
    },
    {
      image: myComplaintImage,
      label: "My Complaints",
      action: () => navigation.navigate("ComplaintsList"),
      disabled: false,
    },
    ...(ongoingLoadsCount > 0
      ? [
          {
            image: ongoingImage,
            label: "Ongoing",
            variant: "ongoing" as const,
            action: () => {
              if (ongoingLoadCode) {
                navigation.navigate("LoadSummary", {
                  loadCode: ongoingLoadCode,
                  mode: "journey",
                });
              } else {
                navigation.navigate("Loads");
              }
            },
            disabled: false,
          },
        ]
      : []),
  ];

  /* ======================= Render pieces ======================= */

  const renderDeliverBanner = () => {
    // "Great Work! / End My Shift" replaces the motivational banner
    if (shouldShowEndShiftButton()) {
      return (
        <View
          className="mx-4 mt-6 mb-4 rounded-2xl px-5 py-3 items-center justify-center border"
          style={{ backgroundColor: "#FFFBEA", borderColor: "#F7CA21" }}
        >
          <Text className="text-lg font-bold text-black text-center">
            Great Work!
          </Text>
          <Text className="text-black mt-1 text-center">
            Click on Close button to end the shift.
          </Text>
          <TouchableOpacity
            className="bg-[#F7CA21] px-14 py-3 rounded-full mt-3"
            onPress={handleEndShiftPress}
            activeOpacity={0.7}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text className="font-bold text-black">End My Shift</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const msg = getMotivationalMessage();
    if (!msg) return null;

    return (
      <View
        className="mx-4 mt-6 mb-4 rounded-2xl px-5 py-3 flex-row items-center"
        style={{ backgroundColor: msg.bgColor }}
      >
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">{msg.title}</Text>
          <Text
            className={
              msg.style === 1 ? "text-gray-700 mt-1" : "text-gray-900 mt-1"
            }
          >
            {msg.subtitle}
          </Text>
        </View>

        <View className="ml-4 items-center justify-center">
          {msg.style === 1 ? (
            <Image
              source={smallImage}
              className="w-20 h-20"
              resizeMode="contain"
            />
          ) : (
            <Progress.Circle
              size={56}
              progress={msg.percentage / 100}
              thickness={4}
              color="#FFFFFF"
              unfilledColor="#49454F29"
              borderWidth={0}
              showsText
              formatText={() => `${msg.percentage}%`}
              textStyle={{
                fontSize: 12,
                fontWeight: "bold",
                color: "#000000",
              }}
            />
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return <HeavyHomeSkeleton />;
  }

  const showDeliverError = activeTab === "deliver" && !!deliverError;

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#F7CA21"]}
          tintColor="#F7CA21"
        />
      }
    >
      {/* Profile Header */}
      <View className="bg-white px-4 mt-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="flex-row items-center flex-1 mr-3"
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Profile")}
        >
          <View className="mr-4">
            <Image
              source={
                userProfile?.profileImg
                  ? { uri: userProfile.profileImg }
                  : require("@/assets/images/home/profile.webp")
              }
              className="w-14 h-14 rounded-full border-2 border-yellow-400"
              resizeMode="cover"
            />
          </View>

          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Hi, {userProfile?.firstName || "User"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* QR Code Lottie Button */}
        <TouchableOpacity
          className="w-14 h-14 rounded-full justify-center items-center overflow-hidden"
          activeOpacity={0.8}
          onPress={() => navigation.navigate("MyQRCode")}
        >
          <LottieView
            source={require("@/assets/json/heavyweight-driver/home/scan-qr-code.json")}
            autoPlay
            loop
            style={{ width: 34, height: 34 }}
          />
        </TouchableOpacity>
      </View>

      {/* Deliver Orders / Transfer Loads toggle */}
      <TabToggle active={activeTab} onChange={setActiveTab} />

      {/* Deliver Orders tab */}
      {activeTab === "deliver" &&
        (showDeliverError ? (
          <UnableToLoadData
            error={deliverError}
            onRefresh={onRefresh}
            onTryAgain={fetchAmountData}
            onLogout={handleLogout}
            refreshing={refreshing}
          />
        ) : (
          <>
            {renderDeliverBanner()}
            <ActionGrid buttons={buildDeliverButtons()} />
          </>
        ))}

      {/* Transfer Loads tab */}
      {activeTab === "transfer" && (
        <View className="pt-4">
          <ActionGrid buttons={buildTransferButtons()} />
        </View>
      )}
    </ScrollView>
  );
};

export default HeavyDriverHome;