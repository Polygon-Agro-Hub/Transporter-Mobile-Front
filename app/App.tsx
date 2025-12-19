import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Text,
  View,
  Dimensions,
  TextInput,
} from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useSelector } from "react-redux";
import store, { RootState } from "@/services/store";
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from "react-i18next";
import { navigationRef } from "../navigationRef";
import CustomDrawerContent from "@/Items/CustomDrawerContent";

import { NativeWindStyleSheet } from "nativewind";
import { LogBox } from "react-native";
import Splash from "@/component/common/Splash";
import Home from "@/component/Home";
import ComplaintsList from "@/component/complaints/ComplaintsList";
import AddComplaint from "@/component/complaints/AddComplaint"
import LoginScreen from "@/component/auth/LoginScreen";
import ChangePassword from "@/component/auth/ChangePassword";
import ProfileScreen from "@/component/auth/Profile";
import ReturnOrders from "@/component/orders/ReturnOrders";
import AssignOrderQR from "@/component/qr/AssignOrderQR";
import Jobs from "@/component/orders/Jobs";
import OrderDetails from "@/component/orders/OrderDetails";
import EndJourneyConfirmation from "@/component/orders/EndJourneyConfirmation";
import MyJourney from "@/component/orders/MyJourney";
import SignatureScreen from "@/component/orders/SignatureScreen";
import DeliverySuccessful from "@/component/orders/DeliverySuccessful";
import OrderDetailsAfterJourney from "@/component/orders/OrderDetailsAfterJourney";
import { RootStackParamList } from "@/component/types";
import VerifyOrderQR from "@/component/qr/VerifyOrderQR";
import OrderReturn from "@/component/orders/OrderReturn";
import HoldOrder from "@/component/orders/HoldOrder";
import ReturnOrderQR from "@/component/qr/ReturnOrderQR";

LogBox.ignoreAllLogs(true);
NativeWindStyleSheet.setOutput({
  default: "native",
});

(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  allowFontScaling: false,
};

(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  allowFontScaling: false,
};

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();
const windowDimensions = Dimensions.get("window");

function HomeDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: {
          width: "80%",
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Home" component={Home} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [isOfflineAlertShown, setIsOfflineAlertShown] = useState(false);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (!state.isConnected && !isOfflineAlertShown) {
        setIsOfflineAlertShown(true); // mark that alert is shown
        Alert.alert(
          t("Main.No Internet Connection"),
          t("Main.Please turn on mobile data or Wi-Fi to continue."),
          [
            {
              text: "OK",
              onPress: () => {
                // Reset flag after user presses OK
                setIsOfflineAlertShown(false);
              },
            },
          ]
        );
      }
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, [isOfflineAlertShown]);

  useEffect(() => {
    const backAction = () => {
      if (!navigationRef.isReady()) {
        // Navigation not ready yet, let default system back handle it
        return false;
      }

      const currentRouteName = navigationRef.getCurrentRoute()?.name ?? "";

      if (currentRouteName === "Home") {
        BackHandler.exitApp();
        return true;
      } else if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#fff",
        }}
      >
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Home" component={HomeDrawer} />
            <Stack.Screen name="ComplaintsList" component={ComplaintsList} />
            <Stack.Screen name="AddComplaint" component={AddComplaint} />
            <Stack.Screen name="Login" component={LoginScreen}  />
            <Stack.Screen name="ChangePassword" component={ChangePassword} />
            <Stack.Screen name="ReturnOrders" component={ReturnOrders} />
            <Stack.Screen name="AssignOrderQR" component={AssignOrderQR}  />
            <Stack.Screen name="ReturnOrderQR" component={ReturnOrderQR}  />
            <Stack.Screen name="VerifyOrderQR" component={VerifyOrderQR}  />
            <Stack.Screen name="Jobs" component={Jobs} />
            <Stack.Screen name="OrderDetails" component={OrderDetails} />
            <Stack.Screen name="OrderDetailsAfterJourney" component={OrderDetailsAfterJourney} />
            <Stack.Screen name="EndJourneyConfirmation" component={EndJourneyConfirmation } />
            <Stack.Screen name="MyJourney" component={MyJourney} />
            <Stack.Screen name="SignatureScreen" component={SignatureScreen} />
            <Stack.Screen name="DeliverySuccessful" component={DeliverySuccessful} />
            <Stack.Screen name="OrderReturn" component={OrderReturn} />
            <Stack.Screen name="HoldOrder" component={HoldOrder} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </SafeAreaProvider>
  );
}