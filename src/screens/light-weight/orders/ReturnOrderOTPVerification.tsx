import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "@/component/common/CustomHeader";
import { AlertModal } from "@/component/common/AlertModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";

type ReturnOrderOTPVerificationNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReturnOrderOTPVerification"
>;

type ReturnOrderOTPVerificationRouteProp = RouteProp<
  RootStackParamList,
  "ReturnOrderOTPVerification"
>;

interface ReturnOrderOTPVerificationProps {
  navigation: ReturnOrderOTPVerificationNavigationProp;
  route: ReturnOrderOTPVerificationRouteProp;
}

const OTP_LENGTH = 5;
const INITIAL_TIMER_SECONDS = 120; // 2 minutes

const ReturnOrderOTPVerification: React.FC<ReturnOrderOTPVerificationProps> = ({
  navigation,
  route,
}) => {
  const { orderId, invoiceNumber, dcmEmpId, drvOrderId } = route.params;

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState<number>(INITIAL_TIMER_SECONDS);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalMessage, setModalMessage] = useState<string | React.ReactNode>("");
  const [modalType, setModalType] = useState<"success" | "error">("error");
  const [showRetryButton, setShowRetryButton] = useState<boolean>(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Focus effect for Android hardware back
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  // Timer Countdown Effect
  useEffect(() => {
    startTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimer(INITIAL_TIMER_SECONDS);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleOtpChange = (text: string, index: number) => {
    // Clean input to only numeric characters
    const numericText = text.replace(/[^0-9]/g, "");

    // Handling pasted code (e.g. 5 digits pasted in first box)
    if (numericText.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < OTP_LENGTH; i++) {
        if (numericText[i]) {
          newOtp[i] = numericText[i];
        }
      }
      setOtp(newOtp);
      const nextIndex = Math.min(numericText.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = numericText;
    setOtp(newOtp);

    // Auto-advance to next input if digit entered
    if (numericText && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // If backspace is pressed on an empty box, move focus to previous box
    if (e.nativeEvent.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  const clearOtpInputs = () => {
    setOtp(new Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  };

  const handleResendOtp = async () => {
    if (timer > 0 || resending) return;

    setResending(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setResending(false);
        setModalTitle("Error!");
        setModalMessage("Authentication token not found. Please log in again.");
        setModalType("error");
        setShowRetryButton(false);
        setModalVisible(true);
        return;
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/return/resend-otp`,
        {
          drvOrderId,
          orderId,
          invoiceNumber,
          dcmEmpId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setResending(false);
      if (response.data && response.data.status === "success") {
        clearOtpInputs();
        startTimer();
      } else {
        setModalTitle("Error!");
        setModalMessage(response.data?.message || "Failed to resend OTP");
        setModalType("error");
        setShowRetryButton(true);
        setModalVisible(true);
      }
    } catch (error: any) {
      setResending(false);
      const errMsg =
        error.response?.data?.message || error.message || "Failed to resend OTP";
      setModalTitle("Error!");
      setModalMessage(errMsg);
      setModalType("error");
      setShowRetryButton(true);
      setModalVisible(true);
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < OTP_LENGTH || verifying) return;

    setVerifying(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setVerifying(false);
        setModalTitle("Error!");
        setModalMessage("Authentication token not found. Please log in again.");
        setModalType("error");
        setShowRetryButton(false);
        setModalVisible(true);
        return;
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/return/verify-otp-return-received`,
        {
          drvOrderId,
          orderId,
          invoiceNumber,
          otpCode: fullOtp,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setVerifying(false);

      if (response.data && response.data.status === "success") {
        setModalTitle("Successful!");
        setModalMessage(
          <View className="items-center">
            <Text className="text-center text-[#4E4E4E] mb-5 mt-2 text-sm leading-5">
              Order : <Text className="font-extrabold text-black">{invoiceNumber}</Text> has been
              {"\n"}successfully returned to the centre.
            </Text>
          </View>,
        );
        setModalType("success");
        setShowRetryButton(false);
        setModalVisible(true);
      } else {
        setModalTitle("Error!");
        setModalMessage(response.data?.message || "Verification failed");
        setModalType("error");
        setShowRetryButton(true);
        setModalVisible(true);
      }
    } catch (error: any) {
      setVerifying(false);
      const errMsg =
        error.response?.data?.message || error.message || "Verification failed";
      setModalTitle("Error!");
      setModalMessage(errMsg);
      setModalType("error");
      setShowRetryButton(true);
      setModalVisible(true);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalType === "success") {
      navigation.navigate("ReturnOrders");
    }
  };

  const handleModalRetry = () => {
    setModalVisible(false);
    clearOtpInputs();
  };

  const isOtpComplete = otp.join("").length === OTP_LENGTH;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <CustomHeader
        title="OTP Verification"
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "space-between",
            paddingBottom: 28,
            paddingTop: 10,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center">
            {/* Top Order ID Pill Badge */}
            <View className="items-center my-2">
              <View
                className="px-4 py-1.5 rounded-full"
                style={{ backgroundColor: "#FFECA7" }}
              >
                <Text className="text-xs font-bold text-[#7A4A0E]">
                  Order ID : {invoiceNumber}
                </Text>
              </View>
            </View>

            {/* Flying Envelopes Illustration */}
            <View className="items-center my-4">
              <Image
                source={require("@/assets/images/cashhandover/otp-cashhandover.webp")}
                style={{
                  width: 240,
                  height: 140,
                }}
                resizeMode="contain"
              />
            </View>

            {/* Heading & Subtitle */}
            <Text className="text-2xl font-bold text-black text-center mb-2">
              Enter Verification Code
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-8 px-4 leading-5">
              We have sent a Verification Code to{"\n"}
              <Text className="font-semibold text-gray-700">{dcmEmpId}</Text>.
            </Text>

            {/* 5-Digit OTP Input Boxes */}
            <View className="flex-row justify-center items-center gap-x-3 mb-2">
              {otp.map((digit, index) => {
                const isFilled = digit.length > 0;
                return (
                  <View
                    key={index}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: isFilled ? "#F7CA21" : "#F6F9FF",
                      borderWidth: isFilled ? 0 : 1.5,
                      borderColor: isFilled ? "#F7CA21" : "#F6F9FF",
                      justifyContent: "center",
                      alignItems: "center",
                      shadowColor: isFilled ? "#F7CA21" : "transparent",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isFilled ? 0.3 : 0,
                      shadowRadius: 4,
                      elevation: isFilled ? 2 : 0,
                    }}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={index === 0 ? OTP_LENGTH : 1}
                      selectTextOnFocus
                      textAlign="center"
                      style={{
                        width: "100%",
                        height: "100%",
                        fontSize: 22,
                        fontWeight: "bold",
                        color: "#000000",
                        padding: 0,
                      }}
                    />
                  </View>
                );
              })}
            </View>

            {/* Timer Countdown */}
            <Text className="text-base font-bold text-black text-center mt-6 mb-2">
              {formatTimer(timer)}
            </Text>

            {/* Resend OTP Row */}
            <View className="flex-row items-center justify-center">
              <Text className="text-xs text-gray-500">
                Didn't receive the OTP ?{" "}
              </Text>
              <TouchableOpacity
                disabled={timer > 0 || resending}
                onPress={handleResendOtp}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-xs font-bold ${
                    timer > 0 ? "text-gray-400" : "text-black underline"
                  }`}
                >
                  {resending ? "RESENDING..." : "RESEND OTP"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Verify Button */}
          <View className="mt-8">
            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={!isOtpComplete || verifying}
              activeOpacity={0.8}
              className={`w-full py-4 rounded-full items-center justify-center ${
                isOtpComplete ? "bg-[#F7CA21]" : "bg-[#E5E7EB]"
              }`}
              style={
                isOtpComplete
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 4,
                    }
                  : {}
              }
            >
              {verifying ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text
                  className={`font-bold text-base ${
                    isOtpComplete ? "text-black" : "text-gray-400"
                  }`}
                >
                  Verify
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Alert / Result Modal */}
      <AlertModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={handleModalClose}
        showRescanButton={showRetryButton}
        rescanButtonText="Retry"
        onRescan={handleModalRetry}
        duration={5000}
        autoClose={modalType === "success"}
      />
    </View>
  );
};

export default ReturnOrderOTPVerification;
