import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import axios from "axios";
import { ScrollView } from "react-native-gesture-handler";
import { environment } from "@/environment/environment";
import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import AlertModal from "../common/AlertModal";

type ChangePasswordNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ChangePassword"
>;

interface ChangePasswordProps {
  navigation: ChangePasswordNavigationProp;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, "ChangePassword">>();
  const { passwordUpdated } = route.params;
  const [loading, setLoading] = useState(false);
  console.log(passwordUpdated);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureCurrent, setSecureCurrent] = useState(true);
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
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

  console.log(passwordUpdated);
  const { t } = useTranslation();

  const validatePassword = () => {
    // Check if all fields are filled
    if (!currentPassword || !newPassword || !confirmPassword) {
      showModal("Sorry", "All fields are required", "error");
      return false;
    }

    // Check if new password meets format requirements
    if (newPassword.length < 8) {
      Alert.alert(
        "Sorry",
        "Your password must contain a minimum of 8 characters with 1 Uppercase, Numbers & Special characters."
      );
      return false;
    }

    // Check for at least 1 uppercase letter
    if (!/[A-Z]/.test(newPassword)) {
      Alert.alert(
        "Sorry",
        "Your password must contain a minimum of 8 characters with 1 Uppercase, Numbers & Special characters."
      );
      return false;
    }

    // Check for at least 1 number
    if (!/[0-9]/.test(newPassword)) {
      Alert.alert(
        "Sorry",
        "Your password must contain a minimum of 8 characters with 1 Uppercase, Numbers & Special characters."
      );
      return false;
    }

    // Check for at least 1 special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      Alert.alert(
        "Sorry",
        "Your password must contain a minimum of 8 characters with 1 Uppercase, Numbers & Special characters."
      );
      return false;
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      showModal(
        "Do Not Match",
        "The new password and confirm new password does not match.",
        "error"
      );
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    Keyboard.dismiss();
    if (!validatePassword()) {
      return;
    }

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      showModal(
        "No Internet",
        "Please check your internet connection",
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(
        `${environment.API_BASE_URL}api/auth/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Navigate to login after a delay
      setTimeout(() => {
        navigation.navigate("Login");
      }, 2000);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          showModal(
            "Incorrect Password!",
            "Current password is incorrect.",
            "error"
          );
        } else {
          showModal("Failed!", "Failed to update password", "error");
        }
      } else {
        showModal(
          "Sorry",
          "Something went wrong. Please try again later.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // If passwordUpdate is 0, prevent back navigation
        if (passwordUpdated === 0) {
          console.log("hitt");
          return true; // Prevent back navigation
        }
        // If passwordUpdate is 1, allow back navigation
        return false; // Allow back navigation
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [passwordUpdated]) // Added passwordUpdate as dependency
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
      className="bg-[#F7CA21]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="h-96 flex-1 justify-center items-center bg-[#FFF2BF] ">
          <Image
            source={require("@/assets/changepassword.webp")}
            className="w-auto h-[65%]"
            resizeMode="contain"
          />
        </View>
        {passwordUpdated === 1 && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-[#f3f3f380] rounded-full p-2 justify-center w-10"
          >
            <AntDesign name="left" size={24} color="#000502" />
          </TouchableOpacity>
        )}

        <View className="flex-1">
          {/* Form Section */}
          <LinearGradient
            colors={["#323232", "#0E0E0E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-1 px-9 py-8 rounded-t-3xl shadow-lg -mt-24 "
          >
            <View>
              <Text className="text-2xl font-semibold text-center mt-42 mb-2 text-white">
                Update Password
              </Text>
              <Text className="text-center text-white mb-6 ">
                Please update your password to continue
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
                  <MaterialIcons name="lock" size={26} color="#F7CA21" />
                  <TextInput
                    className="flex-1  text-base  text-white placeholder:ml-2"
                    secureTextEntry={secureCurrent}
                    onChangeText={setCurrentPassword}
                    value={currentPassword}
                    placeholder="Current Password"
                    placeholderTextColor={"#F6F9FF"}
                  />
                  <TouchableOpacity
                    className="mr-4"
                    onPress={() => setSecureCurrent(!secureCurrent)}
                  >
                    <FontAwesome5
                      name={secureCurrent ? "eye-slash" : "eye"}
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={["#474747", "#242424"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center bg-[#F4F4F4]  rounded-full  mb-6 px-3 py-3"
              >
                <View className="flex-row items-center ml-4">
                  <MaterialIcons name="lock" size={26} color="#F7CA21" />{" "}
                  <TextInput
                    className="flex-1 text-base placeholder:ml-2 text-white"
                    secureTextEntry={secureNew}
                    // onChangeText={setNewPassword}
                    value={newPassword}
                    onChangeText={(text) => {
                      const cleanText = text.replace(/\s/g, "");
                      setNewPassword(cleanText);
                    }}
                    placeholder="New Password"
                    placeholderTextColor={"#F6F9FF"}
                  />
                  <TouchableOpacity
                    className="mr-4"
                    onPress={() => setSecureNew(!secureNew)}
                  >
                    <FontAwesome5
                      name={secureNew ? "eye-slash" : "eye"}
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

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
                    secureTextEntry={secureConfirm}
                    // onChangeText={setConfirmPassword}
                    onChangeText={(text) => {
                      const cleanText = text.replace(/\s/g, "");
                      setConfirmPassword(cleanText);
                    }}
                    value={confirmPassword}
                    placeholder="Re-enter New Password"
                    placeholderTextColor={"#F6F9FF"}
                  />
                  <TouchableOpacity
                    className="mr-4"
                    onPress={() => setSecureConfirm(!secureConfirm)}
                  >
                    <FontAwesome5
                      name={secureNew ? "eye-slash" : "eye"}
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <TouchableOpacity
                className="rounded-full  overflow-hidden bg-[#F7CA21] py-4 items-center justify-center"
                style={{ width: "100%" }}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className=" text-xl font-semibold tracking-wide">
                    Update
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

export default ChangePassword;
