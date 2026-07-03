import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  findNodeHandle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp } from "@react-navigation/native";
import { AlertModal } from "../common/AlertModal";
import CustomHeader from "../common/CustomHeader";
import LoadingPage from "../common/LoadingPage";

type OrderReturnNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OrderReturn"
>;

type OrderReturnRouteProp = RouteProp<RootStackParamList, "OrderReturn">;

interface OrderReturnProps {
  navigation: OrderReturnNavigationProp;
  route: OrderReturnRouteProp;
}

interface Reason {
  id: number;
  indexNo: number;
  rsnEnglish: string;
  rsnSinhala: string;
  rsnTamil: string;
}

const OrderReturn: React.FC<OrderReturnProps> = ({ navigation, route }) => {
  const { orderIds, allProcessOrderIds, remainingOrders, onOrderComplete } =
    route.params;

  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);
  const [otherReason, setOtherReason] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"En" | "Si" | "Ta">(
    "En",
  );
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<
    string | React.ReactNode
  >("");

  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  const languageMap = {
    English: { code: "En" as const, key: "rsnEnglish" as const },
    Sinhala: { code: "Si" as const, key: "rsnSinhala" as const },
    Tamil: { code: "Ta" as const, key: "rsnTamil" as const },
  };

  const mapLanguageCode = (code: "EN" | "SI" | "TA"): "En" | "Si" | "Ta" => {
    switch (code) {
      case "EN":
        return "En";
      case "SI":
        return "Si";
      case "TA":
        return "Ta";
    }
  };

  const languages = ["English", "Sinhala", "Tamil"];

  useEffect(() => {
    fetchReasons();
  }, []);

  const fetchReasons = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const response = await axios.get(
        `${environment.API_BASE_URL}api/return/reason`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = response.data;

      if (result.status === "success" && result.data) {
        const sortedReasons = result.data.sort((a: Reason, b: Reason) => {
          const aIsOther = a.rsnEnglish.toLowerCase() === "other";
          const bIsOther = b.rsnEnglish.toLowerCase() === "other";

          // If a is "Other", it should come after b
          if (aIsOther && !bIsOther) return 1;
          // If b is "Other", it should come after a
          if (!aIsOther && bIsOther) return -1;
          // If neither or both are "Other", sort by indexNo
          return a.indexNo - b.indexNo;
        });
        setReasons(sortedReasons);
      } else {
        Alert.alert("Error", "Failed to fetch reasons");
      }
    } catch (error) {
      console.error("Error fetching reasons:", error);
      Alert.alert("Error", "Failed to load reasons. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLanguageKey = ():
    | "rsnEnglish"
    | "rsnSinhala"
    | "rsnTamil" => {
    if (selectedLanguage === "En") return "rsnEnglish";
    if (selectedLanguage === "Si") return "rsnSinhala";
    return "rsnTamil";
  };

  const isOtherReason = (reason: Reason): boolean => {
    return reason.rsnEnglish.toLowerCase() === "other";
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;

    if (isOtherReason(selectedReason) && !otherReason.trim()) {
      Alert.alert("Required", "Please provide a reason in the text field.");
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem("token");
      const orderIdsList = Array.isArray(orderIds) ? orderIds : [orderIds];

      const payload = {
        orderIds: Array.isArray(orderIds) ? orderIds : [orderIds],
        returnReasonId: selectedReason.id,
        note: isOtherReason(selectedReason) ? otherReason.trim() : null,
      };

      const response = await axios.post(
        `${environment.API_BASE_URL}api/return/submit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = response.data;

      if (result.status === "success") {
        const invoiceNumbers: string[] = result.data.invoiceNumbers || [];

        let message: string | React.ReactNode;

        if (invoiceNumbers.length === 0) {
          message = "Order has been marked as a return order.";
        } else if (invoiceNumbers.length === 1) {
          message = (
            <View className="items-center">
              <Text className="text-center text-[#4E4E4E] mb-5 mt-2">
                Order:{" "}
                <Text className="font-bold text-[#000000]">
                  {invoiceNumbers[0]}
                </Text>{" "}
                has been marked as a return order.
              </Text>
            </View>
          );
        } else {
          // For multiple orders
          message = (
            <View className="items-center">
              <Text className="text-center text-[#4E4E4E] mb-2">Orders:</Text>
              {invoiceNumbers.map((invNo: string, index: number) => (
                <Text
                  key={index}
                  className="text-center font-bold text-[#000000] mb-1"
                >
                  {invNo}
                </Text>
              ))}
              <Text className="text-center text-[#4E4E4E] mt-2">
                have been marked as return orders.
              </Text>
            </View>
          );
        }

        setSuccessMessage(message);
        setShowSuccessModal(true);

        if (onOrderComplete && orderIds && orderIds.length > 0) {
          onOrderComplete(orderIds[0]);
        }
      } else {
        Alert.alert("Error", result.message || "Failed to submit return order");
      }
    } catch (error: any) {
      console.error("Error submitting return order:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit return order. Please try again.";

      const isAlreadyReturnedError =
        errorMessage.toLowerCase().includes("already") &&
        errorMessage.toLowerCase().includes("return");

      if (isAlreadyReturnedError) {
        setSuccessMessage(
          <View className="items-center">
            <Text className="text-center text-[#4E4E4E] mb-5 mt-2">
              {errorMessage}
            </Text>
          </View>,
        );
        setShowErrorModal(true);
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigationAfterSuccess = () => {
    console.log("Navigating to Jobs screen");
    navigation.navigate("Jobs");
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setSelectedReason(null);
    setOtherReason("");
    handleNavigationAfterSuccess();
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setSelectedReason(null);
    setOtherReason("");

    console.log("Error modal closed, navigating to Jobs");
    navigation.navigate("Jobs");
  };

  const getPlaceholderText = (): string => {
    if (selectedLanguage === "En") return "Please mention the reason here...";
    if (selectedLanguage === "Si") return "කරුණාකර මෙහි හේතුව සඳහන් කරන්න...";
    return "காரணத்தை இங்கே குறிப்பிடவும்...";
  };

  // Scrolls the ScrollView just enough to bring the focused TextInput
  // into view, instead of jumping to the end of the content (which was
  // causing the input to be pushed off-screen on iOS when combined with
  // KeyboardAvoidingView's own offset).
  const handleTextInputFocus = () => {
    setTimeout(() => {
      const scrollNode = scrollViewRef.current;
      const inputNode = textInputRef.current;
      if (!scrollNode || !inputNode) return;

      const inputHandle = findNodeHandle(inputNode);
      const scrollHandle = findNodeHandle(scrollNode);
      if (!inputHandle || !scrollHandle) return;

      // @ts-ignore - measureLayout exists at runtime on native components
      inputNode.measureLayout(
        scrollHandle,
        (_x: number, y: number, _w: number, h: number) => {
          scrollNode.scrollTo({
            y: Math.max(y - 40, 0),
            animated: true,
          });
        },
        () => {
          // Fallback: measureLayout can fail on some RN versions/timing.
          scrollNode.scrollToEnd({ animated: true });
        },
      );
    }, 250);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header - Using CustomHeader like in HoldOrder */}
      <CustomHeader
        title={
          selectedLanguage === "En"
            ? "Return Order"
            : selectedLanguage === "Si"
              ? "ඇණවුම ආපසු"
              : "ஆர்டரைத் திருப்பி"
        }
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={true}
        onLanguageChange={(langCode: string) => {
          const mappedLang = mapLanguageCode(langCode as "EN" | "SI" | "TA");
          setSelectedLanguage(mappedLang);
        }}
        onBackPress={handleBackPress} // Add back press handler
      />

      {loading ? (
        <LoadingPage message="Loading Reasons..." fullScreen={true} />
      ) : (
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 24,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Illustration */}
          <View className="items-center mb-6">
            <Image
              source={require("@/assets/images/orders/orderreturn.webp")}
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
            />
          </View>

          {/* Question */}
          <Text className="text-center text-base font-semibold text-gray-900 mb-6">
            {selectedLanguage === "En"
              ? "Why are you returning the order?"
              : selectedLanguage === "Si"
                ? "ඔබ ඇණවුම ආපසු යවන්නේ ඇයි?"
                : "நீங்கள் ஆர்டரை ஏன் திருப்பி அனுப்புகிறீர்கள்?"}
          </Text>

          {/* Reason Options */}
          <View className="mb-6">
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                onPress={() => setSelectedReason(reason)}
                className={`flex-row items-center p-4 rounded-xl border mb-3 ${
                  selectedReason?.id === reason.id
                    ? "bg-[#FFFBEA] border-[#F7CA21]"
                    : "bg-white border-[#A4AAB7]"
                }`}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                    selectedReason?.id === reason.id
                      ? "bg-black"
                      : "border-black"
                  }`}
                >
                  {selectedReason?.id === reason.id && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
                <Text
                  className={`flex-1 text-sm ${
                    selectedReason?.id === reason.id
                      ? "text-[#000000]"
                      : "text-[#000000]"
                  }`}
                >
                  {reason[getCurrentLanguageKey()]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Other Reason Input */}
          {selectedReason && isOtherReason(selectedReason) && (
            <View className="mb-6">
              <TextInput
                ref={textInputRef}
                value={otherReason}
                onChangeText={setOtherReason}
                onFocus={handleTextInputFocus}
                placeholder={getPlaceholderText()}
                placeholderTextColor="#767F94"
                multiline
                numberOfLines={4}
                maxLength={250}
                className="bg-white border border-[#A4AAB7] rounded-xl p-4 text-sm text-gray-900"
                style={{
                  textAlignVertical: "top",
                  minHeight: 100,
                }}
              />
              <Text className="text-xs text-gray-500 mt-2 text-right">
                {otherReason.length}/250
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={
              submitting ||
              !selectedReason ||
              (selectedReason &&
                isOtherReason(selectedReason) &&
                !otherReason.trim())
            }
            className={`rounded-full py-3 items-center mb-6 ${
              selectedReason &&
              (!isOtherReason(selectedReason) || otherReason.trim())
                ? "bg-[#F7CA21]"
                : "bg-[#DCDCDC]"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity:
                selectedReason &&
                (!isOtherReason(selectedReason) || otherReason.trim())
                  ? 0.1
                  : 0,
              shadowRadius: 4,
              elevation:
                selectedReason &&
                (!isOtherReason(selectedReason) || otherReason.trim())
                  ? 3
                  : 0,
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text
                className={`text-base font-semibold ${
                  selectedReason &&
                  (!isOtherReason(selectedReason) || otherReason.trim())
                    ? "text-black"
                    : "text-black"
                }`}
              >
                {selectedLanguage === "En"
                  ? "Submit"
                  : selectedLanguage === "Si"
                    ? "ඉදිරිපත් කරන්න"
                    : "சமர்ப்பிக்கவும்"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Success Alert Modal */}
      <AlertModal
        visible={showSuccessModal}
        title="Successful!"
        message={successMessage}
        type="success"
        onClose={handleSuccessModalClose}
        autoClose={true}
        duration={3000}
      />

      {/* Error Alert Modal */}
      <AlertModal
        visible={showErrorModal}
        title="Error!"
        message={successMessage}
        type="error"
        onClose={handleErrorModalClose}
        autoClose={true}
        duration={3000}
      />

      {/* Language Menu Modal - You can remove this if CustomHeader handles it */}
      <Modal visible={showLanguageMenu} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowLanguageMenu(false)}
          className="flex-1 bg-black/50 items-end justify-start pt-16 px-6"
        >
          <View
            className="bg-white rounded-2xl w-40 overflow-hidden mr-2"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {languages.map((lang, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedLanguage(
                    languageMap[lang as keyof typeof languageMap].code,
                  );
                  setShowLanguageMenu(false);
                }}
                className={`p-4 ${
                  index < languages.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <Text className="text-sm text-gray-900">{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default OrderReturn;