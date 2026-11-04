import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  BackHandler,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Dimensions,
  Switch,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { setUser, setUserProfile } from "@/store/authSlice";
import { ROLES, normalizeDriverRole } from "@/constants/user-roles";
import { OFFICER_STATUS } from "@/constants/officer-status";
import { AlertModal } from "@/component/common/AlertModal";
import { BiometricAuthModal } from "@/component/common/BiometricAuthModal";
import biometricService from "@/services/biometric/biometric.service";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const TOP_HEADER_HEIGHT = Math.min(Math.max(SCREEN_HEIGHT * 0.42, 330), 400);

// Colors matching previous Govi Transport yellow & black theme
const THEME = {
  primaryYellow: "#F7CA21",
  bgDark: "#0E0E0E",
  cardGradientStart: "#262626",
  cardGradientEnd: "#0E0E0E",
  inputBg: "#1F1F1F",
  inputBorder: "#374151",
  inputBorderError: "#EF4444",
  textWhite: "#FFFFFF",
  textMuted: "#9CA3AF",
  textSub: "#6B7280",
  divider: "#374151",
  badgeBg: "rgba(247, 202, 33, 0.15)",
  bioBtnBg: "rgba(247, 202, 33, 0.1)",
  bioBtnBorder: "rgba(247, 202, 33, 0.4)",
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();

  const [empid, setEmpid] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [hasStoredBiometrics, setHasStoredBiometrics] = useState(false);
  const [storedBiometricEmpId, setStoredBiometricEmpId] = useState<string | null>(null);
  const [biometricLabel, setBiometricLabel] = useState("Fingerprint");
  const [isBiometricModalVisible, setIsBiometricModalVisible] = useState(false);
  const [biometricModalStatus, setBiometricModalStatus] = useState<
    "scanning" | "success" | "error"
  >("scanning");
  const [biometricModalMode, setBiometricModalMode] = useState<
    "login" | "enable"
  >("login");

  const [empIdError, setEmpIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("error");

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Track keyboard height to provide generous scrolling space for bottom buttons
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Show AlertModal
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

  // Initial load: check Remember Me and Biometrics
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const avail = await biometricService.checkBiometricAvailability();
        if (isMounted) {
          setIsBiometricAvailable(avail.hasHardware && avail.isEnrolled);
        }

        const label = await biometricService.getBiometricTypeLabel();
        if (isMounted) {
          setBiometricLabel(label);
        }

        const bioCreds = await biometricService.getBiometricCredentials();
        const bioEnabled = await biometricService.isBiometricEnabled();
        if (isMounted) {
          const hasBio = Boolean(bioEnabled && bioCreds?.empId && bioCreds?.password);
          setHasStoredBiometrics(hasBio);
          setStoredBiometricEmpId(hasBio && bioCreds?.empId ? bioCreds.empId.trim().toUpperCase() : null);
        }

        const remembered = await biometricService.getRememberMeCredentials();
        if (isMounted && remembered && remembered.empId && remembered.password) {
          setEmpid(remembered.empId);
          setPassword(remembered.password);
          setRememberMe(true);
        }
      } catch (err) {
        console.warn("Initialization error in LoginScreen:", err);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  // Block hardware back button on the login screen
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  const handleEmpIdChange = (text: string) => {
    if (text.includes(" ")) return;
    const capitalized = text.toUpperCase();
    setEmpid(capitalized);
    if (empIdError) setEmpIdError("");
  };

  const handlePasswordChange = (text: string) => {
    if (text.includes(" ")) return;
    setPassword(text);
    if (passwordError) setPasswordError("");
  };

  const normalizeStatus = (value: unknown) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/[\s_-]/g, "");

  // Core Login Executor
  const executeLogin = async (
    loginEmpId: string,
    loginPassword: string,
    options: { saveBiometricsOnSuccess?: boolean } = {},
  ): Promise<boolean> => {
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
            empId: loginEmpId.trim(),
            password: loginPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setLoading(false);
        const message = data.message?.toLowerCase() || "";
        const statusCode = response.status;
        const rawStatus = normalizeStatus(data.status ?? data.statusType);

        const isRejected =
          rawStatus === normalizeStatus(OFFICER_STATUS.REJECTED) ||
          message.includes("rejected");

        const isNotApproved =
          !isRejected &&
          (rawStatus === normalizeStatus(OFFICER_STATUS.NOT_APPROVED) ||
            message.includes("not approved"));

        if (isRejected || isNotApproved || statusCode === 403) {
          const exactStatus = isRejected
            ? OFFICER_STATUS.REJECTED
            : OFFICER_STATUS.NOT_APPROVED;

          navigation.navigate("BannedScreen", {
            status: exactStatus,
            statusType: exactStatus,
            message: data.message,
          });
          return false;
        }

        if (
          statusCode === 404 ||
          message.includes("user not found") ||
          message.includes("not found") ||
          message.includes("not registered") ||
          message.includes("does not exist")
        ) {
          setEmpIdError("This Employee ID is not registered yet.");
          showModal(
            "EMP ID Not Registered",
            "This Employee ID is not registered yet.",
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
        } else if (
          statusCode === 401 ||
          message.includes("invalid") ||
          message.includes("password") ||
          message.includes("incorrect password")
        ) {
          setPasswordError("Please check the Password and retry again.");
          showModal(
            "Invalid Password!",
            "Please check the Password and retry again.",
            "error",
          );
        } else {
          showModal(
            "Sorry",
            data.message || "Something went wrong. Please try again.",
            "error",
          );
        }

        return false;
      }

      // Successful response
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

      // Save Remember Me credentials if enabled, else clear
      if (rememberMe) {
        await biometricService.saveRememberMeCredentials(
          loginEmpId.trim(),
          loginPassword,
        );
      } else {
        await biometricService.clearRememberMeCredentials();
      }

      // Save Biometric credentials only if this flow requested it (e.g. Enable Biometrics)
      if (options.saveBiometricsOnSuccess) {
        await biometricService.saveBiometricCredentials(
          loginEmpId.trim(),
          loginPassword,
        );
        setHasStoredBiometrics(true);
        setStoredBiometricEmpId(loginEmpId.trim().toUpperCase());
      }

      // Smooth navigate after brief transition
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
      }, 600);

      return true;
    } catch (error) {
      setLoading(false);
      console.error("Login error:", error);
      showModal("Error", "Something went wrong. Please try again.", "error");
      return false;
    }
  };

  // Normal Sign In
  const handleNormalSignIn = async () => {
    Keyboard.dismiss();
    setEmpIdError("");
    setPasswordError("");

    const trimmedEmpId = empid.trim();
    let hasErr = false;

    if (!trimmedEmpId && !password) {
      setEmpIdError("Employee ID is not allowed to be empty");
      setPasswordError("Password is not allowed to be empty");
      showModal(
        "Sorry",
        "Password & Employee ID are not allowed to be empty",
        "error",
      );
      return;
    }

    if (!trimmedEmpId && password) {
      setEmpIdError("Employee ID is not allowed to be empty");
      showModal("Sorry", "Employee ID is not allowed to be empty", "error");
      return;
    }

    if (trimmedEmpId && !password) {
      setPasswordError("Password is not allowed to be empty");
      showModal("Sorry", "Password is not allowed to be empty", "error");
      return;
    }

    const empIdPatternRegex = /^[dD][rR][vV]\d{5}$/;
    if (!empIdPatternRegex.test(trimmedEmpId)) {
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
      return;
    }

    const uppercaseRegex = /^DRV\d{5}$/;
    if (!uppercaseRegex.test(trimmedEmpId)) {
      setEmpIdError("Please enter Employee ID in uppercase letters");
      return;
    }

    setLoading(true);
    const success = await executeLogin(trimmedEmpId, password, {
      saveBiometricsOnSuccess: false,
    });
    if (!success) {
      setLoading(false);
    }
  };

  // "Enable Biometrics" Button Handler
  const handleEnableBiometrics = async () => {
    Keyboard.dismiss();
    setEmpIdError("");
    setPasswordError("");

    const trimmedEmpId = empid.trim();
    let hasErr = false;

    if (!trimmedEmpId) {
      setEmpIdError("Employee ID is required");
      hasErr = true;
    }
    if (!password) {
      setPasswordError("Password is required");
      hasErr = true;
    }
    if (hasErr) {
      showModal(
        "Credentials Required",
        "Please enter your Employee ID and Password to enable biometric login.",
        "error",
      );
      return;
    }

    const empIdPatternRegex = /^[dD][rR][vV]\d{5}$/;
    if (!empIdPatternRegex.test(trimmedEmpId)) {
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
      return;
    }

    const uppercaseRegex = /^DRV\d{5}$/;
    if (!uppercaseRegex.test(trimmedEmpId)) {
      setEmpIdError("Please enter Employee ID in uppercase letters");
      return;
    }

    // Check hardware availability
    const avail = await biometricService.checkBiometricAvailability();
    if (!avail.hasHardware || !avail.isEnrolled) {
      showModal(
        "Biometrics Not Available",
        "Biometric authentication is not supported or no biometrics are enrolled on this device.",
        "error",
      );
      return;
    }

    // Show verifying modal on Android only (iOS has native system Face ID / Touch ID UI)
    if (Platform.OS === "android") {
      setIsBiometricModalVisible(true);
      setBiometricModalStatus("scanning");
      setBiometricModalMode("enable");
    }

    const verified = await biometricService.authenticateWithBiometrics(
      Platform.OS === "ios"
        ? "Verify identity to enable biometric sign-in"
        : "Confirm fingerprint to enable biometric login",
    );

    if (verified) {
      if (Platform.OS === "android") {
        setBiometricModalStatus("success");
        setTimeout(async () => {
          setIsBiometricModalVisible(false);
          await executeLogin(trimmedEmpId, password, {
            saveBiometricsOnSuccess: true,
          });
        }, 650);
      } else {
        await executeLogin(trimmedEmpId, password, {
          saveBiometricsOnSuccess: true,
        });
      }
    } else {
      if (Platform.OS === "android") {
        setIsBiometricModalVisible(false);
      }
    }
  };

  // "Use Biometrics" Button Handler
  const handleUseBiometrics = async () => {
    Keyboard.dismiss();

    const creds = await biometricService.getBiometricCredentials();
    if (!creds || !creds.empId || !creds.password) {
      showModal(
        "Biometrics Not Found",
        "No saved credentials found. Please sign in with your password to re-enable biometrics.",
        "error",
      );
      setHasStoredBiometrics(false);
      setStoredBiometricEmpId(null);
      return;
    }

    // Show verifying modal on Android only (iOS has native system Face ID / Touch ID UI)
    if (Platform.OS === "android") {
      setIsBiometricModalVisible(true);
      setBiometricModalStatus("scanning");
      setBiometricModalMode("login");
    }

    const verified = await biometricService.authenticateWithBiometrics(
      Platform.OS === "ios"
        ? "Sign in with Face ID / Touch ID"
        : "Scan your fingerprint to sign in",
    );

    if (verified) {
      setEmpid(creds.empId);
      setPassword(creds.password);

      if (Platform.OS === "android") {
        setBiometricModalStatus("success");
        setTimeout(async () => {
          setIsBiometricModalVisible(false);
          await executeLogin(creds.empId, creds.password, {
            saveBiometricsOnSuccess: false,
          });
        }, 650);
      } else {
        await executeLogin(creds.empId, creds.password, {
          saveBiometricsOnSuccess: false,
        });
      }
    } else {
      if (Platform.OS === "android") {
        setIsBiometricModalVisible(false);
      }
    }
  };

  // Biometrics is usable ONLY if credentials exist AND the current input matches the stored biometric user (or input is empty)
  const isMatchingBiometricUser = Boolean(
    hasStoredBiometrics &&
      storedBiometricEmpId &&
      (empid.trim() === "" ||
        empid.trim().toUpperCase() === storedBiometricEmpId.toUpperCase()),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      style={{ flex: 1, backgroundColor: THEME.bgDark }}
      enabled
    >
      <StatusBar barStyle="dark-content" backgroundColor={THEME.primaryYellow} />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: THEME.bgDark }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: keyboardHeight > 0 ? (Platform.OS === "android" ? 50 : 40) : 30,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        overScrollMode="always"
      >
        {/* Top Yellow Header Section with Branding */}
        <View
          style={{
            height: TOP_HEADER_HEIGHT,
            backgroundColor: THEME.primaryYellow,
            justifyContent: "center",
            alignItems: "center",
            paddingTop: Platform.OS === "ios" ? 44 : 20,
            paddingBottom: 38,
          }}
        >
          <View style={{ alignItems: "center", justifyContent: "center", width: "100%" }}>
            <Image
              source={require("@/assets/images/auth/logo.webp")}
              style={{ width: "65%", height: 64, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Image
              source={require("@/assets/images/auth/truck.webp")}
              style={{ width: "68%", height: 160 }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Bottom Rounded Dark Card */}
        <LinearGradient
          colors={[THEME.cardGradientStart, THEME.cardGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            flexGrow: 1,
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            marginTop: -28,
            paddingHorizontal: 24,
            paddingTop: 30,
            paddingBottom: Platform.OS === "ios" ? 44 : 32,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 440,
              alignSelf: "center",
            }}
          >
            {/* "Welcome Back" Pill Badge */}
            <View
              style={{
                alignSelf: "center",
                backgroundColor: THEME.badgeBg,
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 999,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: THEME.primaryYellow,
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.3,
                }}
              >
                Welcome Back
              </Text>
            </View>

            {/* Title */}
            <Text
              style={{
                textAlign: "center",
                fontSize: 24,
                fontWeight: "700",
                color: THEME.textWhite,
                marginBottom: 6,
              }}
            >
              Sign in to your account
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                textAlign: "center",
                fontSize: 13,
                color: THEME.textMuted,
                marginBottom: 26,
              }}
            >
              Enter your enterprise credentials or use biometrics
            </Text>

            {/* Employee ID Input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: THEME.inputBg,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: empIdError ? THEME.inputBorderError : THEME.inputBorder,
                paddingHorizontal: 18,
                height: 54,
                marginBottom: empIdError ? 4 : 16,
              }}
            >
              <FontAwesome5
                name="user"
                size={16}
                color={THEME.primaryYellow}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: THEME.textWhite,
                  paddingVertical: 0,
                  includeFontPadding: false,
                }}
                placeholder="Employee ID (e.g. DRV00001)"
                placeholderTextColor={THEME.textSub}
                autoCapitalize="characters"
                autoCorrect={false}
                value={empid}
                onChangeText={handleEmpIdChange}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </View>
            {empIdError ? (
              <Text
                style={{
                  color: THEME.inputBorderError,
                  fontSize: 12,
                  marginLeft: 16,
                  marginBottom: 12,
                }}
              >
                {empIdError}
              </Text>
            ) : null}

            {/* Password Input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: THEME.inputBg,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: passwordError ? THEME.inputBorderError : THEME.inputBorder,
                paddingHorizontal: 18,
                height: 54,
                marginBottom: passwordError ? 4 : 18,
              }}
            >
              <FontAwesome5
                name="lock"
                size={16}
                color={THEME.primaryYellow}
                style={{ marginRight: 12 }}
              />
              <TextInput
                ref={passwordInputRef}
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: THEME.textWhite,
                  paddingVertical: 0,
                  includeFontPadding: false,
                }}
                placeholder="Password"
                placeholderTextColor={THEME.textSub}
                secureTextEntry={secureTextEntry}
                value={password}
                onChangeText={handlePasswordChange}
                returnKeyType="done"
                onSubmitEditing={handleNormalSignIn}
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }}
              />
              <TouchableOpacity
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={secureTextEntry ? "eye" : "eye-off"}
                  size={20}
                  color={THEME.primaryYellow}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text
                style={{
                  color: THEME.inputBorderError,
                  fontSize: 12,
                  marginLeft: 16,
                  marginBottom: 12,
                }}
              >
                {passwordError}
              </Text>
            ) : null}

            {/* "Remember me" Switch Row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 22,
                paddingHorizontal: 4,
              }}
            >
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ false: "#374151", true: THEME.primaryYellow }}
                thumbColor={rememberMe ? "#0E0E0E" : "#9CA3AF"}
                ios_backgroundColor="#374151"
                style={{
                  transform:
                    Platform.OS === "ios"
                      ? [{ scaleX: 0.8 }, { scaleY: 0.8 }]
                      : [{ scaleX: 0.95 }, { scaleY: 0.95 }],
                }}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRememberMe(!rememberMe)}
                style={{ marginLeft: 8 }}
              >
                <Text
                  style={{
                    color: "#D1D5DB",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  Remember me
                </Text>
              </TouchableOpacity>
            </View>

            {/* "Sign in" Primary Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleNormalSignIn}
              disabled={loading}
              style={{
                backgroundColor: THEME.primaryYellow,
                borderRadius: 999,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: THEME.primaryYellow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: loading ? 0.15 : 0.35,
                shadowRadius: 8,
                elevation: 6,
                width: "100%",
                marginBottom: 24,
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#0E0E0E" size="small" />
              ) : (
                <Text
                  style={{
                    color: "#0E0E0E",
                    fontSize: 17,
                    fontWeight: "700",
                    letterSpacing: 0.3,
                  }}
                >
                  Sign in
                </Text>
              )}
            </TouchableOpacity>

            {/* "OR AUTHENTICATE WITH" Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 22,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: THEME.divider }}
              />
              <Text
                style={{
                  marginHorizontal: 12,
                  fontSize: 11,
                  fontWeight: "700",
                  color: THEME.textMuted,
                  letterSpacing: 0.8,
                }}
              >
                OR AUTHENTICATE WITH
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: THEME.divider }}
              />
            </View>

            {/* Biometrics Secondary Pill Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={
                isMatchingBiometricUser
                  ? handleUseBiometrics
                  : handleEnableBiometrics
              }
              disabled={loading}
              style={{
                alignSelf: "center",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: THEME.bioBtnBg,
                borderWidth: 1.5,
                borderColor: THEME.bioBtnBorder,
                borderRadius: 999,
                paddingVertical: 12,
                paddingHorizontal: 26,
                opacity: loading ? 0.45 : 1,
              }}
            >
              <FontAwesome5
                name="fingerprint"
                size={20}
                color={THEME.primaryYellow}
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  color: THEME.primaryYellow,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                {isMatchingBiometricUser
                  ? "Use Biometrics"
                  : "Enable Biometrics"}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Biometric Verification Modal (Android Only - Apple Pay Style) */}
      {Platform.OS === "android" && (
        <BiometricAuthModal
          visible={isBiometricModalVisible}
          status={biometricModalStatus}
          mode={biometricModalMode}
          biometricLabel={biometricLabel}
          onCancel={() => setIsBiometricModalVisible(false)}
        />
      )}

      {/* Feedback Alert Modal */}
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
