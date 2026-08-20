import React, { useEffect, useRef } from "react";
import {
  View,
  StatusBar,
  AppStateStatus,
  AppState,
  Linking,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "../common/CustomHeader";
import { RouteProp } from "@react-navigation/native";
import LoadingPage from "../common/LoadingPage";

type OrderDetailsLoadingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OrderDetailsLoadingScreen"
>;

type OrderDetailsLoadingScreenRouteProp = RouteProp<
  RootStackParamList,
  "OrderDetailsLoadingScreen"
>;

interface OrderDetailsLoadingScreenProps {
  navigation: OrderDetailsLoadingScreenNavigationProp;
  route: OrderDetailsLoadingScreenRouteProp;
}

const OrderDetailsLoadingScreen: React.FC<OrderDetailsLoadingScreenProps> = ({
  navigation,
  route,
}) => {
  const {
    processOrderIds = [],
    allProcessOrderIds = [],
    remainingOrders = [],
    orderData,
    onOrderComplete,
    latitude,
    longitude,
    address = "",
  } = route.params;

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const mapOpened = useRef(false);
  const hasNavigated = useRef(false);

  const navigateToEndJourney = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    navigation.replace("EndJourneyConfirmation", {
      processOrderIds,
      allProcessOrderIds,
      remainingOrders,
      orderData,
      onOrderComplete,
    });
  };

  const openGoogleMapsNavigation = async () => {
    if (!latitude || !longitude) {
      navigateToEndJourney();
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate`;
    const urlAlt = `https://maps.google.com/?q=${latitude},${longitude}`;

    try {
      const supported = await Linking.canOpenURL(url);
      mapOpened.current = true;
      await Linking.openURL(supported ? url : urlAlt);
    } catch {
      navigateToEndJourney();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      openGoogleMapsNavigation();
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          mapOpened.current &&
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          navigateToEndJourney();
        }
        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, []);

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <CustomHeader
        title="Order Details"
        navigation={navigation}
        showBackButton={false}
        showLanguageSelector={false}
      />
      <LoadingPage message="Loading..." fullScreen={true} />
    </View>
  );
};

export default OrderDetailsLoadingScreen;
