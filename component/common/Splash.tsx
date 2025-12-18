import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  Animated,
  StatusBar,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import { useDispatch } from "react-redux";
import { setUser, setUserProfile } from "@/store/authSlice";

const splashscreen = require("@/assets/images/splash.png");

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

    // Start animation
    animation.start(async () => {
      // After progress completes, check token
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

          // Dispatch token and empId to Redux
          dispatch(
            setUser({
              token: userToken,
              empId: empId,
            })
          );

          // If we have saved profile data in AsyncStorage, set it in Redux
          if (userProfileStr) {
            try {
              const userProfile = JSON.parse(userProfileStr);
              dispatch(setUserProfile(userProfile));
            } catch (error) {
              console.error("Error parsing user profile:", error);
            }
          }

          // Fetch fresh profile data from API
          await fetchUserProfile(userToken, empId);
        } else {
          console.log("Token expired, clearing storage.");
          await clearStorage();
          navigation.navigate("Login");
        }
      } else {
        navigation.navigate("Login");
      }
    } catch (error) {
      console.error("Error checking token expiration:", error);
      navigation.navigate("Login");
    }
  };

  const fetchUserProfile = async (token: string, empId: string) => {
    try {
      console.log("Fetching fresh user profile...");

      const response = await fetch(
        `${environment.API_BASE_URL}api/auth/get-profile`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log("Profile API response:", data);

      if (response.ok && data.success) {
        const profileData = data.data;

        // Create ProfileData object for Redux
        const userProfile = {
          firstName: profileData.firstNameEnglish || "",
          lastName: profileData.lastNameEnglish || "",
          profileImg: profileData.image || "",
          firstNameSinhala: profileData.firstNameSinhala || "",
          lastNameSinhala: profileData.lastNameSinhala || "",
          firstNameTamil: profileData.firstNameTamil || "",
          lastNameTamil: profileData.lastNameTamil || "",
          empId: profileData.empId || empId,
        };

        // Save to Redux
        dispatch(setUserProfile(userProfile));

        // Save to AsyncStorage for future app starts
        await AsyncStorage.setItem("userProfile", JSON.stringify(userProfile));

        // Navigate to Main/Home
        navigation.navigate("Main", { screen: "Home" });
      } else {
        console.log("Failed to fetch profile, using cached data if available.");
        // Even if API fails, navigate with cached data
        navigation.navigate("Main", { screen: "Home" });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Even if there's an error, navigate with cached data
      navigation.navigate("Main", { screen: "Home" });
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
});

export default Splash;
