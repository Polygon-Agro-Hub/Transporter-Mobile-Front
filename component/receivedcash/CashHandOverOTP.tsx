import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  ScrollView,
  Image,
  TextInputKeyPressEventData,
  NativeSyntheticEvent,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "@/component/common/CustomHeader";
import { formatNumberWithCommas } from "@/utils/formatNumberWithCommas";
import { AlertModal } from "../common/AlertModal";

type CashHandOverOTPNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CashHandOverOTP"
>;

type CashHandOverOTPRouteProp = RouteProp<
  RootStackParamList,
  "CashHandOverOTP"
>;

const OTP_LENGTH = 5;
const RESEND_TIMER_SECONDS = 60;

const CashHandOverOTP: React.FC = () => {
  const navigation = useNavigation<CashHandOverOTPNavigationProp>();
  const route = useRoute<CashHandOverOTPRouteProp>();

  const { orderIds, officerId, totalAmount, mobileNumber, officerName } =
    route.params;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [timer, setTimer] = useState(RESEND_TIMER_SECONDS);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isOtpInvalid, setIsOtpInvalid] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    amount: string;
    empId: string;
  }>({ amount: "", empId: "" });

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | React.ReactNode>("");
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [retryAction, setRetryAction] = useState<(() => void) | undefined>(undefined);
  const [autoCloseError, setAutoCloseError] = useState(true);

  const isOtpComplete = otp.every((digit) => digit.length === 1);

  const verifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== OTP_LENGTH) {
      setIsOtpInvalid(true);
      return;
    }

    if (timer <= 0) {
      setErrorTitle("Error!");
      setErrorMessage(
        <View className="items-center mt-2 mb-4">
          <Text className="text-center text-[#4E4E4E] text-sm">
            The OTP has expired.
          </Text>
          <Text className="text-center text-[#4E4E4E] text-sm mt-1">
            Please request a new one.
          </Text>
        </View>
      );
      setShowRetryButton(true);
      setRetryAction(() => () => {
        setShowErrorModal(false);
        handleResendOtp();
      });
      setAutoCloseError(false);
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);

      const referenceId = await AsyncStorage.getItem("referenceId");
      const token = await AsyncStorage.getItem("token");

      if (!referenceId || !token) {
        setErrorTitle("Error");
        setErrorMessage("Missing OTP reference or authentication token.");
        setShowRetryButton(false);
        setAutoCloseError(true);
        setShowErrorModal(true);
        return;
      }

      const otpVerificationUrl =
        "https://api.getshoutout.com/otpservice/verify";
      const otpHeaders = {
        Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
        "Content-Type": "application/json",
      };

      const otpResponse = await axios.post(
        otpVerificationUrl,
        { code: otpCode, referenceId },
        { headers: otpHeaders },
      );

      const { statusCode } = otpResponse.data;

      if (statusCode !== "1000") {
        setIsOtpInvalid(true);
        setErrorTitle("Error!");
        setErrorMessage(
          <View className="items-center mt-2 mb-4">
            <Text className="text-center text-[#4E4E4E] text-sm">
              The OTP is incorrect.
            </Text>
            <Text className="text-center text-[#4E4E4E] text-sm mt-1">
              Please check and try again.
            </Text>
          </View>
        );
        setShowRetryButton(true);
        setRetryAction(() => () => {
          setShowErrorModal(false);
          setOtp(Array(OTP_LENGTH).fill(""));
        });
        setAutoCloseError(false);
        setShowErrorModal(true);
        return;
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/home/hand-over-cash`,
        {
          orderIds,
          totalAmount,
          officerId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      if (response.data.status === "success") {
        const responseData = response.data.data;

        await AsyncStorage.removeItem("selectedCashItems");
        await AsyncStorage.removeItem("referenceId");
        await AsyncStorage.removeItem("isNavigatingToQR");

        setSuccessData({
          amount: formatNumberWithCommas(responseData.totalAmount),
          empId: responseData.empId,
        });
        setShowSuccessModal(true);
      } else {
        setErrorTitle("Error");
        setErrorMessage(response.data.message || "Failed to hand over cash.");
        setShowRetryButton(false);
        setAutoCloseError(true);
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error("Error verifying handover OTP:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "An error occurred while verifying OTP.";
      setErrorTitle("Error");
      setErrorMessage(errorMsg);
      setShowRetryButton(false);
      setAutoCloseError(true);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setOtp(Array(OTP_LENGTH).fill(""));
      setResendDisabled(true);
      setTimer(RESEND_TIMER_SECONDS);

      const driverId = (await AsyncStorage.getItem("empid")) || "";
      const formattedAmount = formatNumberWithCommas(totalAmount);

      const apiUrl = "https://api.getshoutout.com/otpservice/send";
      const headers = {
        Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
        "Content-Type": "application/json",
      };

      const body = {
        source: "PolygonAgro",
        transport: "sms",
        content: {
          sms: `${driverId} has sent you Rs. ${formattedAmount}. Enter OTP {{code}} to confirm the payment.`,
        },
        destination: mobileNumber,
      };

      const response = await axios.post(apiUrl, body, { headers });

      if (response.data.referenceId) {
        await AsyncStorage.setItem("referenceId", response.data.referenceId);
        Alert.alert("Success", "OTP resent successfully.");
      } else {
        setErrorTitle("Error");
        setErrorMessage("Failed to resend OTP.");
        setShowRetryButton(false);
        setAutoCloseError(true);
        setShowErrorModal(true);
        setResendDisabled(false);
      }
    } catch (error) {
      console.error("Error resending handover OTP:", error);
      setErrorTitle("Error");
      setErrorMessage("An error occurred while resending OTP.");
      setShowRetryButton(false);
      setAutoCloseError(true);
      setShowErrorModal(true);
      setResendDisabled(false);
    }
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setResendDisabled(false);
    }
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    if (text && !/^\d+$/.test(text)) {
      return;
    }

    const updatedOtp = [...otp];
    updatedOtp[index] = text;
    setOtp(updatedOtp);

    const isValid = updatedOtp.every((digit) => digit.length === 1);
    setIsOtpInvalid(!isValid);

    if (text.length === 1 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === otp.length - 1 && text.length === 1) {
      Keyboard.dismiss();

      if (isValid && timer > 0) {
        verifyOTP();
      }
    }
  };

  const handleKeyPress = (
    { nativeEvent: { key } }: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.navigate("ReceivedCash");
  };

  const maskedMobile = mobileNumber
    ? `${mobileNumber.slice(0, -4).replace(/\d/g, "*")}${mobileNumber.slice(-4)}`
    : "";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      enabled
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        style={{ backgroundColor: "white" }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <CustomHeader
          title="OTP Verification"
          navigation={navigation}
          onBackPress={() => navigation.goBack()}
        />

        <View className="bg-white items-center">
          <View className="w-full max-w-[500px] px-4">
            {/* Amount badge */}
            <View className="items-center mt-6 mb-6">
              <View className="bg-[#FFF0B6] px-5 py-2 rounded-full">
                <Text className="text-[#624D00] font-semibold">
                  Amount : Rs. {formatNumberWithCommas(totalAmount.toFixed(2))}
                </Text>
              </View>
            </View>

            {/* Illustration */}
            <View className="items-center mb-8">
              <Image
                source={require("@/assets/images/cashhandover/otp-cashhandover.webp")}
                style={{ width: 220, height: 170 }}
                resizeMode="contain"
              />
            </View>

            <Text className="text-black text-center font-bold text-xl">
              Enter Verification Code
            </Text>
            <Text className="text-[#808080] text-center mt-3 px-4">
              We have sent a Verification Code to{" "}
              {officerName ? ` ${officerId}'s` : `${officerId}'s`} mobile
              number.
            </Text>

            {/* OTP Input Section */}
            <View className="flex-row justify-center items-center gap-3 mt-8 mb-4">
              {otp.map((digit, index) => (
                <TextInput
                  key={`handover-otp-input-${index}`}
                  ref={(el: TextInput | null) => {
                    inputRefs.current[index] = el;
                  }}
                  className={`w-12 h-12 rounded-lg border-2 ${
                    digit
                      ? "bg-[#F7CA21] border-[#F7CA21]"
                      : "bg-[#F6F9FF] border-[#F6F9FF]"
                  }`}
                  style={{
                    textAlign: "center",
                    textAlignVertical: "center",
                    fontSize: 16,
                    fontWeight: "600",
                    lineHeight: 20,
                    color: digit ? "#000000" : "#8a6d00",
                    padding: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  cursorColor="#000000"
                  selectionColor={digit ? "#000000" : "#F7CA21"}
                />
              ))}
            </View>

            <View className="items-center justify-center bg-white">
              {/* Timer */}
              <Text className="text-black font-bold text-base mb-2">
                {timer > 0
                  ? `0${Math.floor(timer / 60)}:${
                      timer % 60 < 10 ? `0${timer % 60}` : timer % 60
                    }`
                  : "00:00"}
              </Text>

              {/* Resend OTP */}
              <View className="flex-row items-center justify-center mb-6 my-3">
                <Text className="text-gray-500 font-medium">
                  Didn't receive the OTP ?
                </Text>
                <TouchableOpacity
                  disabled={resendDisabled}
                  onPress={handleResendOtp}
                >
                  <Text
                    className={`ml-2 ${
                      resendDisabled
                        ? "text-[#B9C5DE] font-bold"
                        : "text-black font-bold"
                    }`}
                  >
                    RESEND OTP
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                onPress={verifyOTP}
                disabled={!isOtpComplete || loading || timer <= 0}
                activeOpacity={0.7}
                style={{
                  width: "70%",
                  borderRadius: 30,
                  backgroundColor: "transparent",
                  height: 50,
                }}
              >
                <LinearGradient
                  colors={
                    !isOtpComplete || loading || timer <= 0
                      ? ["#D9D9D9", "#BFBFBF"]
                      : ["#F7CA21", "#F0B90B"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className={`h-[50px] items-center justify-center rounded-full ${
                    !isOtpComplete || loading || timer <= 0 ? "opacity-50" : ""
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text className="text-center text-black font-bold text-lg">
                      Verify
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <AlertModal
        visible={showSuccessModal}
        title="Successful!"
        message={
          <Text className="text-center text-[#4E4E4E] mb-5 mt-2">
            Successfully handed over{" "}
            <Text className="font-bold text-black">Rs. {successData.amount}</Text>
            {" to "}
            <Text className="font-bold text-black">{successData.empId}</Text>.
          </Text>
        }
        type="success"
        onClose={handleSuccessModalClose}
        showRescanButton={false}
        duration={4000}
        autoClose={true}
      />

      <AlertModal
        visible={showErrorModal}
        title={errorTitle}
        message={errorMessage}
        type="error"
        onClose={() => {
          setShowErrorModal(false);
          if (retryAction) {
            retryAction();
          } else {
            setOtp(Array(OTP_LENGTH).fill(""));
          }
        }}
        showRescanButton={showRetryButton}
        rescanButtonText="Retry"
        onRescan={() => {
          if (retryAction) {
            retryAction();
          } else {
            setShowErrorModal(false);
            setOtp(Array(OTP_LENGTH).fill(""));
          }
        }}
        duration={4000}
        autoClose={autoCloseError}
      />
    </KeyboardAvoidingView>
  );
};

export default CashHandOverOTP;
