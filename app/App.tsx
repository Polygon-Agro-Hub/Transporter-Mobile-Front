import { useEffect, useState, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Alert, BackHandler, Text, TextInput, StatusBar, AppState, AppStateStatus } from "react-native";
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
import socketService, { AccountStatusData } from "@/services/socket/socket.service";
import { OFFICER_STATUS } from "@/constants/officer-status";

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

  const handleAccountBanned = useCallback(
    (status?: string, message?: string) => {
      socketService.disconnect();

      const exactStatus =
        status === OFFICER_STATUS.REJECTED
          ? OFFICER_STATUS.REJECTED
          : OFFICER_STATUS.NOT_APPROVED;

      if (navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute() as any;
        if (currentRoute?.name === "BannedScreen") {
          return;
        }

        navigationRef.reset({
          index: 0,
          routes: [
            {
              name: "BannedScreen",
              params: {
                status: exactStatus,
                statusType: exactStatus,
                message:
                  message ||
                  (exactStatus === OFFICER_STATUS.REJECTED
                    ? "Your account has been rejected by administration."
                    : "Your account is not approved."),
              },
            },
          ],
        });
      }
    },
    [],
  );

  useEffect(() => {
    if (!token || !empId) return;

    // Connect to WebSocket and register user room
    socketService.connect();
    socketService.registerEmpId(empId);

    // Listen for real-time account status changes over WebSocket
    const unsubscribeAccountStatus = socketService.onAccountStatusChanged(
      (data: AccountStatusData) => {
        if (
          data.status === OFFICER_STATUS.REJECTED ||
          data.status === OFFICER_STATUS.NOT_APPROVED ||
          data.statusType === "rejected" ||
          data.statusType === "not_approved"
        ) {
          handleAccountBanned(data.status, data.message);
        }
      },
    );

    // Check status on mount / auth change
    const checkStatusOnce = async () => {
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
          if (
            response.status === 403 ||
            data.status === OFFICER_STATUS.REJECTED ||
            data.status === OFFICER_STATUS.NOT_APPROVED
          ) {
            const exactStatus =
              data.status === OFFICER_STATUS.REJECTED
                ? OFFICER_STATUS.REJECTED
                : OFFICER_STATUS.NOT_APPROVED;
            console.log("⛔ [App] Driver account is disallowed:", exactStatus, data.message);
            handleAccountBanned(exactStatus, data.message);
          }
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      }
    };

    // Check status ONCE on launch / token change
    checkStatusOnce();

    return () => {
      unsubscribeAccountStatus();
    };
  }, [token, empId, handleAccountBanned]);

  // Check status once when user resumes the app from background (no interval timer)
  useEffect(() => {
    if (!token || !empId) return;

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === "active") {
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
            if (
              response.status === 403 ||
              data.status === OFFICER_STATUS.REJECTED ||
              data.status === OFFICER_STATUS.NOT_APPROVED
            ) {
              const exactStatus =
                data.status === OFFICER_STATUS.REJECTED
                  ? OFFICER_STATUS.REJECTED
                  : OFFICER_STATUS.NOT_APPROVED;
              handleAccountBanned(exactStatus, data.message);
            }
          }
        } catch (_) {}
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [token, empId, handleAccountBanned]);

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
          (errorResponse.status === 403 ||
            errorResponse.data?.status === OFFICER_STATUS.REJECTED ||
            errorResponse.data?.status === OFFICER_STATUS.NOT_APPROVED)
        ) {
          let currentRouteName = "";
          if (navigationRef.isReady()) {
            const route = navigationRef.getCurrentRoute() as any;
            currentRouteName = route?.name || "";
          }

          if (currentRouteName !== "Login" && currentRouteName !== "Splash" && currentRouteName !== "BannedScreen") {
            const exactStatus =
              errorResponse.data?.status === OFFICER_STATUS.REJECTED
                ? OFFICER_STATUS.REJECTED
                : OFFICER_STATUS.NOT_APPROVED;

            handleAccountBanned(exactStatus, errorResponse.data?.message);

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

