import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  BackHandler,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useState, useEffect } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../types/types";
import axios from "axios";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { environment } from "@/environment/environment";
import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { AlertModal } from "../common/AlertModal";

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
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" = "error",
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const validatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showModal("Sorry", "All fields are required", "error");
      return false;
    }

    if (currentPassword === newPassword) {
      showModal(
        "Same Password",
        "The current password and new password are the same. Please enter a different new password.",
        "error",
      );
      return false;
    }

    if (newPassword.length < 8) {
      showModal(
        "Sorry",
        "Your password must contain a minimum of 8 characters with 1 Uppercase, Numbers & Special characters.",
        "error",
      );
      return false;
    }

    if (!/[A-Z]/.test(newPassword)) {
      showModal(
        "Sorry",
        "Your password must contain a minimum of 8 characters with 1 Uppercase, Numbers & Special characters.",
        "error",
      );
      return false;
    }

    if (!/[0-9]/.test(newPassword)) {
      showModal(
        "Sorry",
        "Your password must contain a minimum of 8 characters with 1 Uppercase, Numbers & Special characters.",
        "error",
      );
      return false;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      showModal(
        "Sorry",
        "Your password must contain a minimum of 8 characters with 1 Uppercase, Numbers & Special characters.",
        "error",
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      showModal(
        "Do Not Match",
        "The new password and confirm new password does not match.",
        "error",
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
        "error",
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
        },
      );

      setTimeout(() => {
        navigation.navigate("Login");
      }, 2000);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          showModal(
            "Incorrect Password!",
            "Current password is incorrect.",
            "error",
          );
        } else {
          showModal("Failed!", "Failed to update password", "error");
        }
      } else {
        showModal(
          "Sorry",
          "Something went wrong. Please try again later.",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (passwordUpdated === 0) {
          return true;
        }

        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [passwordUpdated]),
  );

  return (
    <LinearGradient
      colors={["#323232", "#0E0E0E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, backgroundColor: "#0E0E0E" }}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: "#0E0E0E" }}
      >
        <View className="h-96 flex-1 justify-center items-center bg-[#FFF2BF] ">
          <Image
            source={require("@/assets/images/auth/changepassword.webp")}
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

        <View className="flex-1" style={{ backgroundColor: "#0E0E0E" }}>
          <LinearGradient
            colors={["#323232", "#0E0E0E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="flex-1 px-6 py-8 rounded-t-3xl overflow-hidden shadow-lg -mt-24 pt-10 justify-center"
          >
            <View>
              <Text className="text-2xl font-semibold text-center mt-42 mb-2 text-white">
                Update Password
              </Text>
              <Text className="text-center text-white mb-6 ">
                Password must be at least 8 characters
              </Text>
            </View>

            <View>
              <LinearGradient
                colors={["#474747", "#242424"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center rounded-full px-4 h-[58px] mb-4 gap-3 overflow-hidden"
              >
                <MaterialIcons name="lock" size={26} color="#F7CA21" />
                <TextInput
                  className="flex-1 text-base text-white"
                  secureTextEntry={secureCurrent}
                  onChangeText={setCurrentPassword}
                  value={currentPassword}
                  placeholder="Current Password"
                  placeholderTextColor={"#F6F9FF"}
                />
                <TouchableOpacity
                  onPress={() => setSecureCurrent(!secureCurrent)}
                >
                  <FontAwesome5
                    name={secureCurrent ? "eye-slash" : "eye"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
              </LinearGradient>

              <LinearGradient
                colors={["#474747", "#242424"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center rounded-full px-4 h-[58px] mb-6 gap-3 overflow-hidden"
              >
                <MaterialIcons name="lock" size={26} color="#F7CA21" />
                <TextInput
                  className="flex-1 text-base text-white"
                  secureTextEntry={secureNew}
                  value={newPassword}
                  onChangeText={(text) => {
                    const cleanText = text.replace(/\s/g, "");
                    setNewPassword(cleanText);
                  }}
                  placeholder="New Password"
                  placeholderTextColor={"#F6F9FF"}
                />
                <TouchableOpacity onPress={() => setSecureNew(!secureNew)}>
                  <FontAwesome5
                    name={secureNew ? "eye-slash" : "eye"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
              </LinearGradient>

              <LinearGradient
                colors={["#474747", "#242424"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center rounded-full px-4 h-[58px] mb-6 gap-3 overflow-hidden"
              >
                <MaterialIcons name="lock" size={26} color="#F7CA21" />
                <TextInput
                  className="flex-1 text-base text-white"
                  secureTextEntry={secureConfirm}
                  onChangeText={(text) => {
                    const cleanText = text.replace(/\s/g, "");
                    setConfirmPassword(cleanText);
                  }}
                  value={confirmPassword}
                  placeholder="Re-enter New Password"
                  placeholderTextColor={"#F6F9FF"}
                />
                <TouchableOpacity
                  onPress={() => setSecureConfirm(!secureConfirm)}
                >
                  <FontAwesome5
                    name={secureConfirm ? "eye-slash" : "eye"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
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
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
};

export default ChangePassword;
