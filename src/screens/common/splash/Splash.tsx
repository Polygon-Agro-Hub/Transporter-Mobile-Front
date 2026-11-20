import React, { useEffect, useRef } from "react";
import { View, Image, Animated, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import { useDispatch } from "react-redux";
import { setUser, setUserProfile } from "@/store/authSlice";
import { ROLES, normalizeDriverRole } from "@/constants/user-roles";
import { OFFICER_STATUS } from "@/constants/officer-status";
import { ACCESS_TOKEN_EXPIRY_MS } from "@/constants/auth.constants";

const splashscreen = require("@/assets/images/splash.webp");

type SplashNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const Splash: React.FC = () => {
  const navigation = useNavigation<SplashNavigationProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dispatch = useDispatch();

  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {});

    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    });

    animation.start(async () => {
      await handleTokenCheck();
    });

    return () => {
      progressAnim.removeListener(listenerId);
      animation.stop();
    };
  }, [navigation, progressAnim]);

  const handleTokenCheck = async () => {
    try {
      const expirationTime = await AsyncStorage.getItem("tokenExpirationTime");
      const userToken = await AsyncStorage.getItem("token");
      const storedRefreshToken = await AsyncStorage.getItem("refreshToken");
      const empId = await AsyncStorage.getItem("empid");
      const storedJobRole = await AsyncStorage.getItem("jobRole");
      const userProfileStr = await AsyncStorage.getItem("userProfile");

      if (userToken && empId) {
        const currentTime = new Date();
        const tokenExpiry = expirationTime ? new Date(expirationTime) : new Date(0);

        if (currentTime < tokenExpiry) {
          dispatch(
            setUser({
              token: userToken,
              refreshToken: storedRefreshToken,
              empId: empId,
              jobRole: normalizeDriverRole(storedJobRole),
            }),
          );

          if (userProfileStr) {
            try {
              const userProfile = JSON.parse(userProfileStr);
              dispatch(setUserProfile(userProfile));
            } catch (error) {
              console.error("Error parsing user profile:", error);
            }
          }

          await fetchUserProfile(userToken, empId);
        } else if (storedRefreshToken) {
          // Token expired, but refresh token is available - attempt silent refresh
          try {
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
              const timestamp = new Date();
              const newExpiration = new Date(
                timestamp.getTime() + ACCESS_TOKEN_EXPIRY_MS,
              );

              await AsyncStorage.multiSet([
                ["token", newToken],
                ["refreshToken", newRefreshToken],
                ["tokenStoredTime", timestamp.toISOString()],
                ["tokenExpirationTime", newExpiration.toISOString()],
              ]);

              dispatch(
                setUser({
                  token: newToken,
                  refreshToken: newRefreshToken,
                  empId: empId,
                  jobRole: normalizeDriverRole(storedJobRole),
                }),
              );

              if (userProfileStr) {
                try {
                  const userProfile = JSON.parse(userProfileStr);
                  dispatch(setUserProfile(userProfile));
                } catch (error) {
                  console.error("Error parsing user profile:", error);
                }
              }

              await fetchUserProfile(newToken, empId);
            } else {
              // Account disallowed check
              const rawStatus = (refreshData?.status || "").toString();
              const rawStatusType = (refreshData?.statusType || "").toString().toLowerCase();
              if (
                refreshResponse.status === 403 ||
                rawStatus === OFFICER_STATUS.REJECTED ||
                rawStatus === OFFICER_STATUS.NOT_APPROVED ||
                rawStatusType === "rejected" ||
                rawStatusType === "not_approved"
              ) {
                const exactStatus =
                  rawStatus === OFFICER_STATUS.REJECTED || rawStatusType === "rejected"
                    ? OFFICER_STATUS.REJECTED
                    : OFFICER_STATUS.NOT_APPROVED;
                navigation.replace("BannedScreen", {
                  status: exactStatus,
                  statusType: exactStatus,
                  message: refreshData.message,
                });
                return;
              }

              await clearStorage();
              navigation.replace("Login");
            }
          } catch (refreshErr) {
            console.error("Error refreshing token in Splash:", refreshErr);
            await clearStorage();
            navigation.replace("Login");
          }
        } else {
          await clearStorage();
          navigation.replace("Login");
        }
      } else {
        navigation.replace("Login");
      }
    } catch (error) {
      console.error("Error checking token expiration:", error);
      navigation.replace("Login");
    }
  };

  const fetchUserProfile = async (token: string, empId: string) => {
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

      if (response.ok && data.success) {
        const profileData = data.data;

        const userProfile = {
          firstName: profileData.firstNameEnglish || "",
          lastName: profileData.lastNameEnglish || "",
          profileImg: profileData.image || "",
          firstNameSinhala: profileData.firstNameSinhala || "",
          lastNameSinhala: profileData.lastNameSinhala || "",
          firstNameTamil: profileData.firstNameTamil || "",
          lastNameTamil: profileData.lastNameTamil || "",
          empId: profileData.empId || empId,
          passwordUpdated: profileData.passwordUpdated ?? 0,
          QRcode: profileData.QRcode || profileData.qrCode || "",
          qrCode: profileData.QRcode || profileData.qrCode || "",
        };

        dispatch(setUserProfile(userProfile));
        await AsyncStorage.setItem("userProfile", JSON.stringify(userProfile));
        if (profileData.QRcode || profileData.qrCode) {
          await AsyncStorage.setItem("@user_qr", profileData.QRcode || profileData.qrCode);
        }

        const normalizedRole = normalizeDriverRole(profileData.jobRole || (await AsyncStorage.getItem("jobRole")));

        dispatch(setUser({ token, empId, jobRole: normalizedRole }));
        await AsyncStorage.setItem("jobRole", normalizedRole);

        if (
          profileData.passwordUpdated === 0 ||
          profileData.passwordUpdated === "0"
        ) {
          navigation.replace("ChangePassword", {
            passwordUpdated: Number(profileData.passwordUpdated),
          });
        } else if (normalizedRole === ROLES.HEAVY_WEIGHT_DRIVER) {
          navigation.replace("HeavyDriverHome");
        } else {
          navigation.replace("Home");
        }
      } else {
        const status = data.status;
        if (
          response.status === 403 ||
          status === OFFICER_STATUS.REJECTED ||
          status === OFFICER_STATUS.NOT_APPROVED
        ) {
          const exactStatus =
            status === OFFICER_STATUS.REJECTED
              ? OFFICER_STATUS.REJECTED
              : OFFICER_STATUS.NOT_APPROVED;
          navigation.replace("BannedScreen", {
            status: exactStatus,
            statusType: exactStatus,
            message:
              data.message ||
              "Your account has been rejected or is not approved.",
          });
        } else {
          const currentStoredRole = normalizeDriverRole(await AsyncStorage.getItem("jobRole"));
          if (currentStoredRole === ROLES.HEAVY_WEIGHT_DRIVER) {
            navigation.replace("HeavyDriverHome");
          } else {
            navigation.replace("Home");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      const currentStoredRole = normalizeDriverRole(await AsyncStorage.getItem("jobRole"));
      if (currentStoredRole === ROLES.HEAVY_WEIGHT_DRIVER) {
        navigation.replace("HeavyDriverHome");
      } else {
        navigation.replace("Home");
      }
    }
  };

  const clearStorage = async () => {
    await AsyncStorage.multiRemove([
      "token",
      "refreshToken",
      "tokenStoredTime",
      "tokenExpirationTime",
      "empid",
      "jobRole",
      "userProfile",
    ]);
  };

  return (
    <View style={styles.container}>
      <Image source={splashscreen} style={styles.image} resizeMode="cover" />
      <View style={styles.poweredByContainer}>
        <Text style={styles.poweredByText}>Powered By Polygon</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: "100%",
  },
  poweredByContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  poweredByText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "400",
    letterSpacing: 0.3,
    opacity: 0.6,
  },
});

export default Splash;