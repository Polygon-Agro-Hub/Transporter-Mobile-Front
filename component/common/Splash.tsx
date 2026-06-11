import React, { useEffect, useRef } from "react";
import { View, Image, Animated, StatusBar, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import { useDispatch } from "react-redux";
import { setUser, setUserProfile } from "@/store/authSlice";

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
      const empId = await AsyncStorage.getItem("empid");
      const userProfileStr = await AsyncStorage.getItem("userProfile");

      if (expirationTime && userToken && empId) {
        const currentTime = new Date();
        const tokenExpiry = new Date(expirationTime);

        if (currentTime < tokenExpiry) {
          console.log("Token is valid.");

          dispatch(
            setUser({
              token: userToken,
              empId: empId,
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
        } else {
          console.log("Token expired, clearing storage.");
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
        };

        dispatch(setUserProfile(userProfile));
        await AsyncStorage.setItem("userProfile", JSON.stringify(userProfile));

        if (
          profileData.passwordUpdated === 0 ||
          profileData.passwordUpdated === "0"
        ) {
          navigation.replace("ChangePassword", {
            passwordUpdated: Number(profileData.passwordUpdated),
          });
        } else {
          navigation.replace("Home");
        }
      } else {
        console.log("Failed to fetch profile, using cached data if available.");
        navigation.replace("Home");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      navigation.replace("Home");
    }
  };

  const clearStorage = async () => {
    await AsyncStorage.multiRemove([
      "token",
      "tokenStoredTime",
      "tokenExpirationTime",
      "empid",
      "userProfile",
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
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
  safeTop: {
    flex: 0,
  },
  image: {
    flex: 1,
    width: "100%",
  },
  safeBottom: {
    flex: 0,
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