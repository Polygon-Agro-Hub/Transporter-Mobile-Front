import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Alert, BackHandler, Text, TextInput, StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useSelector, useDispatch } from "react-redux";
import { navigationRef } from "../navigationRef";
import { LogBox } from "react-native";
import { RootStackParamList } from "@/types/types";
import store from "@/services/store";
import { selectAuthToken, selectEmpId, logoutUser } from "@/store/authSlice";
import { environment } from "@/environment/environment";
import NetInfo from "@react-native-community/netinfo";
import Splash from "@/component/common/Splash";
import ComplaintsList from "@/component/complaints/ComplaintsList";
import AddComplaint from "@/component/complaints/AddComplaint";
import LoginScreen from "@/component/auth/LoginScreen";
import ChangePassword from "@/component/auth/ChangePassword";
import BannedScreen from "@/component/auth/BannedScreen";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReturnOrders from "@/component/orders/ReturnOrders";
import AssignOrderQR from "@/component/qr/AssignOrderQR";
import Jobs from "@/component/orders/Jobs";
import OrderDetails from "@/component/orders/OrderDetails";
import EndJourneyConfirmation from "@/component/orders/EndJourneyConfirmation";
import SignatureScreen from "@/component/orders/SignatureScreen";
import DeliverySuccessful from "@/component/orders/DeliverySuccessful";
import OrderReturn from "@/component/orders/OrderReturn";
import HoldOrder from "@/component/orders/HoldOrder";
import ReturnOrderQR from "@/component/qr/ReturnOrderQR";
import Home from "@/component/home/Home";
import ProfileScreen from "@/component/auth/Profile";
import OrderDetailsLoadingScreen from "@/component/orders/OrderDetailsLoadingScreen";
import MyEarnings from "@/component/auth/MyEarnings";
import CashHandOver from "@/component/receivedcash/CashHandOver";
import UploadBankTransferSlip from "@/component/receivedcash/UploadBankTransferSlip";
import BankTransferSlipStatus from "@/component/receivedcash/BankTransferSlipStatus";

LogBox.ignoreAllLogs(true);
LogBox.ignoreLogs(["InteractionManager has been deprecated"]);

(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  allowFontScaling: false,
};

(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  allowFontScaling: false,
};

const Stack = createStackNavigator<RootStackParamList>();

function AppContent() {
  const [isOfflineAlertShown, setIsOfflineAlertShown] = useState(false);
  const token = useSelector(selectAuthToken);
  const empId = useSelector(selectEmpId);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token || !empId) return;

    const checkStatus = async () => {
      try {
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

        if (!response.ok) {
          const statusType = data.statusType;
          if (
            response.status === 403 &&
            (statusType === "rejected" ||
              statusType === "not_approved" ||
              statusType === "pending")
          ) {
            // Clear auth tokens
            await AsyncStorage.multiRemove([
              "token",
              "tokenStoredTime",
              "tokenExpirationTime",
              "empid",
              "userProfile",
            ]);

            // Clear Redux state
            dispatch(logoutUser());

            // Redirect
            if (navigationRef.isReady()) {
              navigationRef.reset({
                index: 0,
                routes: [
                  {
                    name: "BannedScreen",
                    params: {
                      statusType,
                      message: data.message || "Your account has been rejected or is not approved.",
                    },
                  },
                ],
              });
            }
          }
        }
      } catch (error) {
        console.error("Error checking user status in background:", error);
      }
    };

    // Run status check immediately on mount/token change
    checkStatus();

    // Poll every 15 seconds
    const intervalId = setInterval(checkStatus, 15000);

    return () => clearInterval(intervalId);
  }, [token, empId, dispatch]);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (!state.isConnected && !isOfflineAlertShown) {
        setIsOfflineAlertShown(true);

        Alert.alert(
          "No Internet Connection",
          "Please turn on mobile data or Wi-Fi to continue.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsOfflineAlertShown(false);
              },
            },
          ],
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

      const currentRouteName = (navigationRef.getCurrentRoute() as any)?.name ?? "";

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
      backAction,
    );
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const errorResponse = error.response;
        if (
          errorResponse &&
          (errorResponse.status === 401 || errorResponse.status === 403) &&
          (errorResponse.data?.statusType === "not_approved" ||
            errorResponse.data?.statusType === "rejected" ||
            errorResponse.data?.statusType === "pending" ||
            errorResponse.data?.message === "This Employee ID is rejected" ||
            errorResponse.data?.message === "This Employee ID is not approved" ||
            errorResponse.data?.message === "Account status is pending verification")
        ) {
          let currentRouteName = "";
          if (navigationRef.isReady()) {
            const route = navigationRef.getCurrentRoute() as any;
            currentRouteName = route?.name || "";
          }

          if (currentRouteName !== "Login" && currentRouteName !== "Splash" && currentRouteName !== "BannedScreen") {
            try {
              // Clear auth tokens
              await AsyncStorage.multiRemove([
                "token",
                "tokenStoredTime",
                "tokenExpirationTime",
                "empid",
                "userProfile",
              ]);

              // Clear Redux state
              dispatch(logoutUser());

              if (navigationRef.isReady()) {
                navigationRef.reset({
                  index: 0,
                  routes: [{ 
                    name: "BannedScreen",
                    params: { 
                      statusType: errorResponse.data?.statusType,
                      message: errorResponse.data?.message 
                    }
                  }],
                });
              }
            } catch (e) {
              console.error("Failed to perform force logout:", e);
            }

            // Return a promise that never resolves or rejects to prevent component error logs
            return new Promise(() => {});
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#fff",
        }}
      >
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ComplaintsList" component={ComplaintsList} />
            <Stack.Screen name="AddComplaint" component={AddComplaint} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePassword} />
            <Stack.Screen name="BannedScreen" component={BannedScreen as any} />
            <Stack.Screen name="ReturnOrders" component={ReturnOrders} />
            <Stack.Screen name="AssignOrderQR" component={AssignOrderQR} />
            <Stack.Screen name="ReturnOrderQR" component={ReturnOrderQR} />
            <Stack.Screen name="Jobs" component={Jobs} />
            <Stack.Screen name="OrderDetails" component={OrderDetails} />
            <Stack.Screen name="EndJourneyConfirmation" component={EndJourneyConfirmation} />
            <Stack.Screen name="SignatureScreen" component={SignatureScreen} />
            <Stack.Screen name="DeliverySuccessful" component={DeliverySuccessful} />
            <Stack.Screen name="OrderReturn" component={OrderReturn} />
            <Stack.Screen name="HoldOrder" component={HoldOrder} />
            <Stack.Screen name="MyEarnings" component={MyEarnings} />
            <Stack.Screen name="CashHandOver" component={CashHandOver} />
            <Stack.Screen name="UploadBankTransferSlip" component={UploadBankTransferSlip} />
            <Stack.Screen name="BankTransferSlipStatus" component={BankTransferSlipStatus} />
            <Stack.Screen name="OrderDetailsLoadingScreen" component={OrderDetailsLoadingScreen} />
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
