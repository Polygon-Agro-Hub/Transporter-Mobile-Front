import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import {
  FontAwesome5,
  FontAwesome6,
  MaterialIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import { Keyboard } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { setUser, setUserProfile } from "../../store/authSlice";
import { AlertModal } from "../common/AlertModal";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [empid, setEmpid] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [empIdError, setEmpIdError] = useState("");
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("error");

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" = "error"
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const validateEmpIdFormat = (empId: string) => {
    const trimmedEmpId = empId.trim();

    if (trimmedEmpId !== trimmedEmpId.toUpperCase()) {
      setEmpIdError("Please enter Employee ID in uppercase letters");
      return false;
    }

    setEmpIdError("");
    return true;
  };

  const handleEmpIdChange = (text: string) => {
    setEmpid(text);

    if (empIdError) {
      setEmpIdError("");
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    // Clear any existing errors
    setEmpIdError("");

    if (!empid && !password) {
      showModal(
        "Sorry",
        "Password & Employee ID are not allowed to be empty",
        "error"
      );
      return false;
    }

    if (empid && !password) {
      showModal("Sorry", "Password is not allowed to be empty", "error");
      return false;
    }

    if (!empid && password) {
      showModal("Sorry", "Employee ID is not allowed to be empty", "error");
      return false;
    }

    if (!validateEmpIdFormat(empid)) {
      return false;
    }

    setLoading(true);

    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("empid");

    try {
      const trimmedEmpId = empid.trim();

      const response = await fetch(
        `${environment.API_BASE_URL}api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            empId: trimmedEmpId,
            password,
          }),
        }
      );

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok || !data.success) {
        setLoading(false);

        const message = data.message?.toLowerCase() || "";

        if (message.includes("invalid password")) {
          showModal(
            "Invalid Password!",
            "Please check the Password and retry again.",
            "error"
          );
        } else if (message.includes("user not found")) {
          showModal(
            "Invalid Employee ID!",
            "Please check the Employee ID and retry again.",
            "error"
          );
        } else {
          showModal(
            "Sorry",
            "Something went wrong. Please try again.",
            "error"
          );
        }

        return;
      }

      // Extract data properly
      const {
        firstNameEnglish,
        lastNameEnglish,
        image,
        token,
        passwordUpdated,
        empId,
      } = data.data;

      // Save token + empId
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("empid", empId.toString());

      dispatch(setUser({ token, empId: empId.toString() }));

      // Save First name, Last name, Image into Redux
      dispatch(
        setUserProfile({
          firstName: firstNameEnglish,
          lastName: lastNameEnglish,
          profileImg: image,
          empId: empId.toString(),
        })
      );

      // Store token timestamps
      if (token) {
        const timestamp = new Date();
        const expirationTime = new Date(
          timestamp.getTime() + 8 * 60 * 60 * 1000
        );

        await AsyncStorage.multiSet([
          ["tokenStoredTime", timestamp.toISOString()],
          ["tokenExpirationTime", expirationTime.toISOString()],
        ]);
      }

      console.log("Password update required:", passwordUpdated);

      setTimeout(() => {
        setLoading(false);

        if (passwordUpdated === 0) {
          navigation.navigate("ChangePassword", {
            passwordUpdated: passwordUpdated,
          });
        } else {
          navigation.navigate("Home");
        }
      }, 4000);
    } catch (error) {
      setLoading(false);
      console.error("Login error:", error);
      showModal("Error", "Something went wrong. Please try again.", "error");
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [])
  );

  return (
    <KeyboardAvoidingView
      enabled
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "white" }}
      className="bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="h-96 flex-1 justify-center items-center bg-[#F7CA21] ">
          <Image
            source={require("@/assets/images/auth/logo.webp")}
            className="w-auto h-[22%]"
            resizeMode="contain"
          />
          <Image
            source={require("@/assets/images/auth/truck.webp")}
            className="w-auto h-[60%]"
            resizeMode="contain"
          />
        </View>

        <View className="flex-1">
          {/* Form Section */}
          <LinearGradient
            colors={["#323232", "#0E0E0E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-1 px-9 py-8 rounded-t-3xl shadow-lg -mt-20 pt-10"
          >
            <View>
              <Text className="text-3xl font-semibold text-center mt-42 mb-2 text-white">
                Hey, Welcome
              </Text>
              <Text className="text-center text-white mb-6 px-12">
                Please Login to start your work
              </Text>
            </View>

            <View>
              <LinearGradient
                colors={["#474747", "#242424"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center bg-[#F4F4F4]  rounded-full  mb-4 px-3 py-3"
              >
                <View className="flex-row items-center ml-4">
                  <FontAwesome6 name="user-large" size={20} color="#F7CA21" />
                  <TextInput
                    className="flex-1  text-base  text-white placeholder:ml-4"
                    autoCapitalize="characters"
                    value={empid}
                    onChangeText={handleEmpIdChange}
                    placeholder="Your EMP ID"
                    placeholderTextColor={"#F6F9FF"}
                  />
                </View>
              </LinearGradient>
              {empIdError && (
                <Text className="text-red-500 text-sm pl-3 mb-4">
                  {empIdError}
                </Text>
              )}

              <LinearGradient
                colors={["#474747", "#242424"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center bg-[#F4F4F4]  rounded-full  mb-6 px-3 py-3"
              >
                <View className="flex-row items-center ml-4">
                  <MaterialIcons name="lock" size={26} color="#F7CA21" />
                  <TextInput
                    className="flex-1 text-base placeholder:ml-2 text-white"
                    secureTextEntry={secureTextEntry}
                    value={password}
                    onChangeText={handlePasswordChange}
                    placeholder="Your Password"
                    placeholderTextColor={"#F6F9FF"}
                  />
                  <TouchableOpacity
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    className="mr-4"
                  >
                    <FontAwesome5
                      name={secureTextEntry ? "eye-slash" : "eye"}
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              <TouchableOpacity
                className="rounded-full  overflow-hidden bg-[#F7CA21] py-4 items-center justify-center"
                style={{ width: "100%" }}
                disabled={loading}
                onPress={handleLogin}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className=" text-xl font-semibold tracking-wide">
                    Login
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Use the AlertModal component */}
      <AlertModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
        duration={4000}
        autoClose={true}
      />
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
