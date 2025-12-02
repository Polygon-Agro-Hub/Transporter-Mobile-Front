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
import { RootStackParamList } from "./types";

const splashscreen = require("../assets/images/splash.png");

type SplashNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const Splash: React.FC = () => {
  const navigation = useNavigation<SplashNavigationProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      setProgress(value);
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      // navigation.navigate("Main" ,{ screen: "Home"});
      navigation.navigate("Login");
    });

    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [navigation, progressAnim]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <SafeAreaView style={styles.safeTop} />

      <Image source={splashscreen} style={styles.image} resizeMode="cover" />

      <SafeAreaView style={styles.safeBottom} />
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
