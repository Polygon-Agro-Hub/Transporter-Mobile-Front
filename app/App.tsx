import { useEffect, useState, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Alert, BackHandler, Text, TextInput, StatusBar, AppState, AppStateStatus } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useSelector, useDispatch } from "react-redux";
import { navigationRef } from "../navigationRef";
import { LogBox } from "react-native";
import store from "@/services/store";
import { selectAuthToken, selectEmpId, logoutUser, setUser } from "@/store/authSlice";
import { normalizeDriverRole } from "@/constants/user-roles";
import environment from "@/environment/environment";
import NetInfo from "@react-native-community/netinfo";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RootStackNavigator from "@/routes/Routes";
import { AppUpdateProvider } from "@/features/app-update";
import socketService, { AccountStatusData } from "@/services/socket/socket.service";
import { OFFICER_STATUS } from "@/constants/officer-status";
import { ACCESS_TOKEN_EXPIRY_MS, REFRESH_TOKEN_EXPIRY_MS } from "@/constants/auth.constants";

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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
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

  // Axios interceptor to handle token refresh and banned/rejected accounts
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const errorResponse = error.response;

        if (
          errorResponse &&
          (errorResponse.status === 401 || errorResponse.status === 403)
        ) {
          const data = errorResponse.data;
          const rawStatus = (data?.status || data?.officerStatus || "").toString();
          const rawStatusType = (data?.statusType || "").toString().toLowerCase();
          const rawMessage = (data?.message || "").toString().toLowerCase();

          // 1. Only trigger BannedScreen when the account itself is rejected or not approved
          const isAccountDisallowed =
            rawStatus === OFFICER_STATUS.REJECTED ||
            rawStatus === OFFICER_STATUS.NOT_APPROVED ||
            rawStatusType === "rejected" ||
            rawStatusType === "not_approved" ||
            rawMessage.includes("employee id is rejected") ||
            rawMessage.includes("employee id is not approved") ||
            rawMessage.includes("account has been rejected");

          if (isAccountDisallowed) {
            let currentRouteName = "";
            if (navigationRef.isReady()) {
              const route = navigationRef.getCurrentRoute() as any;
              currentRouteName = route?.name || "";
            }

            if (
              currentRouteName !== "Login" &&
              currentRouteName !== "Splash" &&
              currentRouteName !== "BannedScreen"
            ) {
              const exactStatus =
                rawStatus === OFFICER_STATUS.REJECTED ||
                rawStatusType === "rejected" ||
                rawMessage.includes("rejected")
                  ? OFFICER_STATUS.REJECTED
                  : OFFICER_STATUS.NOT_APPROVED;

              handleAccountBanned(exactStatus, data?.message);

              // Return a promise that never resolves or rejects to prevent component error logs
              return new Promise(() => {});
            }
          }

          // 2. Token Refresh handling for 401 Unauthorized responses
          const requestUrl = (originalRequest?.url || "").toString();
          const isAuthEndpoint =
            requestUrl.includes("api/auth/login") ||
            requestUrl.includes("api/auth/refresh-token") ||
            requestUrl.includes("api/auth/register-driver");

          if (
            errorResponse.status === 401 &&
            !isAuthEndpoint &&
            !isAccountDisallowed &&
            originalRequest &&
            !originalRequest._retry
          ) {
            originalRequest._retry = true;

            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              })
                .then((newToken) => {
                  if (originalRequest.headers) {
                    originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                  }
                  return axios(originalRequest);
                })
                .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;

            try {
              const storedRefreshToken = await AsyncStorage.getItem("refreshToken");

              if (!storedRefreshToken) {
                throw new Error("No refresh token available");
              }

              const refreshResponse = await fetch(
                `${environment.API_BASE_URL}api/auth/refresh-token`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ refreshToken: storedRefreshToken }),
                },
              );

              const refreshData = await refreshResponse.json();

              if (refreshResponse.ok && refreshData.success && refreshData.data?.token) {
                const newToken = refreshData.data.token;
                const newRefreshToken =
                  refreshData.data.refreshToken || storedRefreshToken;
                const now = new Date();
                const newExpiry = new Date(now.getTime() + ACCESS_TOKEN_EXPIRY_MS);
                const newRefreshExpiry = new Date(now.getTime() + REFRESH_TOKEN_EXPIRY_MS);

                await AsyncStorage.multiSet([
                  ["token", newToken],
                  ["refreshToken", newRefreshToken],
                  ["tokenStoredTime", now.toISOString()],
                  ["tokenExpirationTime", newExpiry.toISOString()],
                  ["refreshTokenExpirationTime", newRefreshExpiry.toISOString()],
                ]);

                const storedEmpId = await AsyncStorage.getItem("empid");
                const storedJobRole = await AsyncStorage.getItem("jobRole");
                if (storedEmpId) {
                  dispatch(
                    setUser({
                      token: newToken,
                      refreshToken: newRefreshToken,
                      empId: storedEmpId,
                      jobRole: normalizeDriverRole(storedJobRole),
                    }),
                  );
                }

                processQueue(null, newToken);

                if (originalRequest.headers) {
                  originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                }
                return axios(originalRequest);
              } else {
                // If refresh failed because account was rejected or not approved
                const refStatus = (refreshData?.status || "").toString();
                const refStatusType = (refreshData?.statusType || "").toString().toLowerCase();
                if (
                  refreshResponse.status === 403 ||
                  refStatus === OFFICER_STATUS.REJECTED ||
                  refStatus === OFFICER_STATUS.NOT_APPROVED ||
                  refStatusType === "rejected" ||
                  refStatusType === "not_approved"
                ) {
                  const exactStatus =
                    refStatus === OFFICER_STATUS.REJECTED || refStatusType === "rejected"
                      ? OFFICER_STATUS.REJECTED
                      : OFFICER_STATUS.NOT_APPROVED;
                  handleAccountBanned(exactStatus, refreshData.message);
                  return new Promise(() => {});
                }

                throw new Error(refreshData.message || "Token refresh failed");
              }
            } catch (refreshErr) {
              processQueue(refreshErr, null);

              await AsyncStorage.multiRemove([
                "token",
                "refreshToken",
                "tokenStoredTime",
                "tokenExpirationTime",
                "refreshTokenExpirationTime",
                "empid",
                "jobRole",
                "userProfile",
              ]);
              dispatch(logoutUser());

              if (navigationRef.isReady()) {
                const route = navigationRef.getCurrentRoute() as any;
                if (
                  route?.name !== "Login" &&
                  route?.name !== "Splash" &&
                  route?.name !== "BannedScreen"
                ) {
                  navigationRef.reset({
                    index: 0,
                    routes: [{ name: "Login" as any }],
                  });
                }
              }

              return Promise.reject(refreshErr);
            } finally {
              isRefreshing = false;
            }
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [handleAccountBanned, dispatch]);

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

