import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { FontAwesome5, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import { Keyboard } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { setUser, setUserProfile } from "@/store/authSlice";
import { ROLES, normalizeDriverRole } from "@/constants/user-roles";
import { OFFICER_STATUS } from "@/constants/officer-status";
import { AlertModal } from "@/component/common/AlertModal";

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
  const [passwordError, setPasswordError] = useState("");
  const [empIdHasError, setEmpIdHasError] = useState(false);
  const [passwordHasError, setPasswordHasError] = useState(false);
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
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("error");

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

  const handleEmpIdChange = (text: string) => {
    const capitalized = text.toUpperCase();
    setEmpid(capitalized);
    setEmpIdHasError(false);

    if (empIdError) {
      setEmpIdError("");
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordHasError(false);
    if (passwordError) {
      setPasswordError("");
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    setEmpIdError("");
    setPasswordError("");
    setEmpIdHasError(false);
    setPasswordHasError(false);

    if (!empid && !password) {
      setEmpIdHasError(true);
      setPasswordHasError(true);
      setEmpIdError("Employee ID is not allowed to be empty");
      setPasswordError("Password is not allowed to be empty");
      showModal(
        "Sorry",
        "Password & Employee ID are not allowed to be empty",
        "error",
      );
      return false;
    }

    if (empid && !password) {
      setPasswordHasError(true);
      setPasswordError("Password is not allowed to be empty");
      showModal("Sorry", "Password is not allowed to be empty", "error");
      return false;
    }

    if (!empid && password) {
      setEmpIdHasError(true);
      setEmpIdError("Employee ID is not allowed to be empty");
      showModal("Sorry", "Employee ID is not allowed to be empty", "error");
      return false;
    }

    const trimmedEmpId = empid.trim();

    const empIdPatternRegex = /^[dD][rR][vV]\d{5}$/;

    if (!empIdPatternRegex.test(trimmedEmpId)) {
      setEmpIdHasError(true);
      const startsWithDRV = /^[dD][rR][vV]/.test(trimmedEmpId);

      if (!startsWithDRV) {
        showModal(
          "Unauthorized Access",
          "You are not authorized to access this system. Please use a valid Employee ID.",
          "error",
        );
      } else {
        showModal(
          "Invalid EMP ID",
          "Please enter a valid Employee ID.",
          "error",
        );
      }
      return false;
    }

    const uppercaseRegex = /^DRV\d{5}$/;

    if (!uppercaseRegex.test(trimmedEmpId)) {
      setEmpIdHasError(true);
      setEmpIdError("Please enter Employee ID in uppercase letters");
      return false;
    }

    setLoading(true);

    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("empid");
    await AsyncStorage.removeItem("jobRole");

    try {
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
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setLoading(false);

        const message = data.message?.toLowerCase() || "";
        const statusCode = response.status;
        const status = data.status;

        if (
          status === OFFICER_STATUS.REJECTED ||
          status === OFFICER_STATUS.NOT_APPROVED ||
          statusCode === 403
        ) {
          const exactStatus =
            status === OFFICER_STATUS.REJECTED
              ? OFFICER_STATUS.REJECTED
              : OFFICER_STATUS.NOT_APPROVED;
          navigation.navigate("BannedScreen", {
            status: exactStatus,
            statusType: exactStatus,
            message: data.message,
          });
          return;
        }

        if (
          statusCode === 404 ||
          message.includes("user not found") ||
          message.includes("not found") ||
          message.includes("not registered") ||
          message.includes("does not exist")
        ) {
          setEmpIdHasError(true);
          showModal(
            "EMP ID Not Registered",
            "This Employee ID is not registered yet. ",
            "error",
          );
        } else if (
          message.includes("rejected") ||
          message.includes("emp id is rejected")
        ) {
          setEmpIdHasError(true);
          showModal("Rejected EMP ID", "This EMP ID is Rejected.", "error");
        } else if (
          message.includes("not approved") ||
          message.includes("emp id not approved")
        ) {
          setEmpIdHasError(true);
          showModal(
            "Not Approved EMP ID",
            "This EMP ID is not approved.",
            "error",
          );
        } else if (
          statusCode === 401 ||
          message.includes("invalid") ||
          message.includes("password") ||
          message.includes("incorrect password")
        ) {
          setPasswordHasError(true);
          setPasswordError("Please check the Password and retry again.");
          showModal(
            "Invalid Password!",
            "Please check the Password and retry again.",
            "error",
          );
        } else if (
          statusCode === 429 ||
          message.includes("too many") ||
          message.includes("attempts")
        ) {
          showModal(
            "Too Many Attempts",
            data.message ||
              "Too many login attempts. Please try again after 15 minutes.",
            "error",
          );
        } else {
          showModal(
            "Sorry",
            "Something went wrong. Please try again.",
            "error",
          );
        }

        return;
      }

      const {
        firstNameEnglish,
        lastNameEnglish,
        image,
        token,
        passwordUpdated,
        empId,
        jobRole,
        QRcode,
        qrCode,
      } = data.data;

      const userJobRole = normalizeDriverRole(jobRole);
      const qrCodeUrl = QRcode || qrCode || "";

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("empid", empId.toString());
      await AsyncStorage.setItem("jobRole", userJobRole);
      if (qrCodeUrl) {
        await AsyncStorage.setItem("@user_qr", qrCodeUrl);
      }

      dispatch(
        setUser({ token, empId: empId.toString(), jobRole: userJobRole }),
      );

      dispatch(
        setUserProfile({
          firstName: firstNameEnglish,
          lastName: lastNameEnglish,
          profileImg: image,
          empId: empId.toString(),
          passwordUpdated: passwordUpdated,
          QRcode: qrCodeUrl,
          qrCode: qrCodeUrl,
        }),
      );

      if (token) {
        const timestamp = new Date();
        const expirationTime = new Date(
          timestamp.getTime() + 8 * 60 * 60 * 1000,
        );

        await AsyncStorage.multiSet([
          ["tokenStoredTime", timestamp.toISOString()],
          ["tokenExpirationTime", expirationTime.toISOString()],
        ]);
      }

      setTimeout(() => {
        setLoading(false);

        if (passwordUpdated === 0) {
          navigation.replace("ChangePassword", {
            passwordUpdated: passwordUpdated,
          });
        } else if (userJobRole === ROLES.HEAVY_WEIGHT_DRIVER) {
          navigation.replace("HeavyDriverHome");
        } else {
          navigation.replace("Home");
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
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  return (
    <LinearGradient
      colors={["#323232", "#0E0E0E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: "#0E0E0E" }}
        contentContainerStyle={{ flexGrow: 1, backgroundColor: "#0E0E0E" }}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={Platform.OS === "android" ? 80 : 20}
        enableAutomaticScroll={true}
        keyboardOpeningTime={0}
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

        <View className="flex-1" style={{ backgroundColor: "#0E0E0E" }}>
          {/* Form Section */}
          <LinearGradient
            colors={["#323232", "#0E0E0E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="flex-1 px-6 py-8 rounded-t-3xl overflow-hidden shadow-lg -mt-20 pt-10 justify-center"
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
              {/* EMP ID */}
              <LinearGradient
                colors={["#474747", "#242424"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 30,
                  paddingHorizontal: 16,
                  height: 58,
                  marginBottom: 12,
                  gap: 12,
                  borderWidth: 2,
                  borderColor: empIdHasError ? "#EF4444" : "transparent",
                }}
              >
                <FontAwesome6 name="user-large" size={18} color="#F7CA21" />

                <TextInput
                  style={{
                    flex: 1,
                    color: "white",
                    paddingVertical: 0,
                    includeFontPadding: false,
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  value={empid}
                  onChangeText={handleEmpIdChange}
                  placeholder="Your EMP ID"
                  placeholderTextColor="#F6F9FF"
                />
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
                className={`flex-row items-center rounded-[30px] px-4 h-[62px] gap-3 border-2 ${
                  passwordError ? "mb-3" : "mb-6"
                } ${passwordHasError ? "border-red-500" : "border-transparent"}`}
                // note: overflow-hidden removed here
              >
                <MaterialIcons name="lock" size={22} color="#F7CA21" />

                <TextInput
                  style={{
                    flex: 1,
                    color: "white",
                    fontSize: 16,
                    paddingVertical: 0,
                    ...(Platform.OS === "android"
                      ? { textAlignVertical: "center" }
                      : {}),
                  }}
                  secureTextEntry={secureTextEntry}
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="Your Password"
                  placeholderTextColor="#F6F9FF"
                />

                <TouchableOpacity
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                >
                  <FontAwesome5
                    name={secureTextEntry ? "eye-slash" : "eye"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
              </LinearGradient>
              {passwordError && (
                <Text className="text-red-500 text-sm pl-3 mb-4">
                  {passwordError}
                </Text>
              )}
              <TouchableOpacity
                className="rounded-full overflow-hidden bg-[#F7CA21] py-4 items-center justify-center"
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

export default LoginScreen;
