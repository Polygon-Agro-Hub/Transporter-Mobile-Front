import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Alert, BackHandler, Text, TextInput, StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useSelector, useDispatch } from "react-redux";
import { navigationRef } from "../navigationRef";
import { LogBox } from "react-native";
import store from "@/services/store";
import { selectAuthToken, selectEmpId, logoutUser } from "@/store/authSlice";
import environment from "@/environment/environment";
import NetInfo from "@react-native-community/netinfo";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestTrackingIfNeeded } from "@/utils/trackingPermissions";
import RootStackNavigator from "@/routes/Routes";
import { AppUpdateProvider } from "@/features/app-update";

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

// AppContent component handles the main application logic, including navigation, authentication checks, and network status monitoring.
function AppContent() {
  const [isOfflineAlertShown, setIsOfflineAlertShown] = useState(false);
  const token = useSelector(selectAuthToken);
  const empId = useSelector(selectEmpId);
  const dispatch = useDispatch();

  useEffect(() => {
    requestTrackingIfNeeded();
  }, []);

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

      if (currentRouteName === "Home" || currentRouteName === "HeavyDriverHome") {
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

  // Axios interceptor to handle 401/403 responses with specific status types
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

  const [currentRoute, setCurrentRoute] = useState<string>("Splash");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        edges={
          currentRoute === "Splash"
            ? []
            : ["top", "bottom", "left", "right"]
        }
        style={{
          flex: 1,
          backgroundColor: "#fff",
        }}
      >
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            const routeName = navigationRef.getCurrentRoute()?.name;
            if (routeName) setCurrentRoute(routeName);
          }}
          onStateChange={() => {
            const routeName = navigationRef.getCurrentRoute()?.name;
            if (routeName) setCurrentRoute(routeName);
          }}
        >
          <RootStackNavigator />
        </NavigationContainer>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AppUpdateProvider>
          <AppContent />
        </AppUpdateProvider>
      </Provider>
    </SafeAreaProvider>
  );
}

