import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomHeader from "../common/CustomHeader";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp } from "@react-navigation/native";

type OrderReturnNavigationProp = StackNavigationProp<
  RootStackParamList,
  "HoldOrder"
>;

type OrderReturnRouteProp = RouteProp<RootStackParamList, "HoldOrder">;

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

const HoldOrder: React.FC<OrderReturnProps> = ({ navigation, route }) => {
  const { orderIds } = route.params;
  console.log("order Hold page orderid", orderIds);

  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);
  const [otherReason, setOtherReason] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"En" | "Si" | "Ta">(
    "En"
  );
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invoiceNumbers, setInvoiceNumbers] = useState<string[]>([]);

  const languageMap = {
    English: { code: "En" as const, key: "rsnEnglish" as const },
    Sinhala: { code: "Si" as const, key: "rsnSinhala" as const },
    Tamil: { code: "Ta" as const, key: "rsnTamil" as const },
  };

  const languages = ["English", "Sinhala", "Tamil"];

  // Fetch reasons from API
  useEffect(() => {
    fetchReasons();
  }, []);

  const fetchInvoiceNumbers = async (orderIdsList: number[]) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const invoices: string[] = [];

      for (const orderId of orderIdsList) {
        try {
          const response = await axios.get(
            `${environment.API_BASE_URL}api/return/get-invoice/${orderId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.status === "success" && response.data.data) {
            invoices.push(response.data.data.invNo);
          }
        } catch (error) {
          console.error(`Error fetching invoice for order ${orderId}:`, error);
        }
      }

      setInvoiceNumbers(invoices);
    } catch (error) {
      console.error("Error fetching invoice numbers:", error);
    }
  };

  const fetchReasons = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const response = await axios.get(
        `${environment.API_BASE_URL}api/hold/reason`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;

      if (result.status === "success" && result.data) {
        // Sort by indexNo to maintain order
        const sortedReasons = result.data.sort(
          (a: Reason, b: Reason) => a.indexNo - b.indexNo
        );
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

  // Get the current language key for displaying reasons
  const getCurrentLanguageKey = ():
    | "rsnEnglish"
    | "rsnSinhala"
    | "rsnTamil" => {
    if (selectedLanguage === "En") return "rsnEnglish";
    if (selectedLanguage === "Si") return "rsnSinhala";
    return "rsnTamil";
  };

  // Check if the selected reason is "Other"
  const isOtherReason = (reason: Reason): boolean => {
    return reason.rsnEnglish.toLowerCase() === "other";
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Required", "Please select a reason.");
      return;
    }

    // If "Other" is selected, validate that otherReason is filled
    if (isOtherReason(selectedReason) && !otherReason.trim()) {
      Alert.alert("Required", "Please provide a reason in the text field.");
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem("token");

      const orderIdsList = Array.isArray(orderIds) ? orderIds : [orderIds];

      // Prepare the request body
      const requestBody = {
        orderIds: orderIds,
        holdReasonId: selectedReason.id,
        note: isOtherReason(selectedReason) ? otherReason.trim() : null,
      };

      console.log("Submitting hold order:", requestBody);

      const response = await axios.post(
        `${environment.API_BASE_URL}api/hold/submit`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data;

      if (result.status === "success") {
        console.log("Hold order submitted successfully:", result.data);

        // Fetch invoice numbers before showing success modal
        await fetchInvoiceNumbers(orderIdsList);

        // Show success modal
        setShowSuccess(true);

        setTimeout(() => {
          setShowSuccess(false);
          setSelectedReason(null);
          setOtherReason("");
          setInvoiceNumbers([]);
          // Navigate back or to another screen
          navigation.goBack();
        }, 3000);
      } else {
        Alert.alert("Error", result.message || "Failed to submit hold order");
      }
    } catch (error: any) {
      console.error("Error submitting hold order:", error);

      // Handle specific error responses
      if (error.response) {
        const errorMessage =
          error.response.data?.message || "Failed to submit hold order";
        Alert.alert("Error", errorMessage);
      } else if (error.request) {
        Alert.alert(
          "Error",
          "No response from server. Please check your connection."
        );
      } else {
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getPlaceholderText = (): string => {
    if (selectedLanguage === "En") return "Please mention the reason here...";
    if (selectedLanguage === "Si") return "කරුණාකර මෙහි හේතුව සඳහන් කරන්න...";
    return "காரணத்தை இங்கே குறிப்பிடவும்...";
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-4 py-4 flex-row items-center justify-between ">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">
          {selectedLanguage === "En"
            ? "Hold Order"
            : selectedLanguage === "Si"
            ? "ඇණවුම රඳවා ගන්න"
            : "ஆர்டரை வைத்திருங்கள்"}
        </Text>
        <TouchableOpacity
          onPress={() => setShowLanguageMenu(true)}
          className="bg-[#F6CA20] px-3 py-1.5 rounded-md flex-row items-center"
        >
          <Text className="text-sm font-medium mr-1">{selectedLanguage}</Text>
          <Ionicons name="chevron-down" size={16} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F7CA21" />
          <Text className="text-gray-600 mt-4">Loading reasons...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
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
              ? "Why are you holding the order?"
              : selectedLanguage === "Si"
              ? "ඔබ ඇණවුම රඳවා තබන්නේ ඇයි?"
              : "நீங்கள் ஆர்டரை ஏன் வைத்திருக்கிறீர்கள்?"}
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
                    <Ionicons name="checkmark" size={16} color="white" />
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

          {/* Other Reason Input - Show when "Other" is selected */}
          {selectedReason && isOtherReason(selectedReason) && (
            <View className="mb-6">
              <TextInput
                value={otherReason}
                onChangeText={setOtherReason}
                placeholder={getPlaceholderText()}
                placeholderTextColor="#767F94"
                multiline
                numberOfLines={4}
                className="bg-white border border-[#A4AAB7] rounded-xl p-4 text-sm text-gray-900"
                style={{
                  textAlignVertical: "top",
                  minHeight: 100,
                }}
              />
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
            className={`rounded-full py-3 mr-6 ml-6 items-center mb-6 ${
              submitting ||
              !selectedReason ||
              (selectedReason &&
                isOtherReason(selectedReason) &&
                !otherReason.trim())
                ? "bg-[#DCDCDC]"
                : "bg-[#F7CA21]"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity:
                !submitting &&
                selectedReason &&
                (!isOtherReason(selectedReason) || otherReason.trim())
                  ? 0.1
                  : 0,
              shadowRadius: 4,
              elevation:
                !submitting &&
                selectedReason &&
                (!isOtherReason(selectedReason) || otherReason.trim())
                  ? 3
                  : 0,
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className="text-base font-semibold text-black">
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

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View
            className="bg-white rounded-3xl p-8 items-center w-80"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View className="bg-yellow-100 rounded-full p-4 mb-4">
              <Ionicons name="checkmark" size={48} color="#facc15" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">
              {selectedLanguage === "En"
                ? "Successful!"
                : selectedLanguage === "Si"
                ? "සාර්ථකයි!"
                : "வெற்றிகரமாக!"}
            </Text>

            {/* Invoice Numbers Display */}
            {invoiceNumbers.length > 0 && (
              <View className="w-full mb-3">
                {invoiceNumbers.map((invoice, index) => (
                  <View key={index} className="mb-2">
                    <Text className="text-sm text-gray-600 text-center">
                      {selectedLanguage === "En"
                        ? "Order"
                        : selectedLanguage === "Si"
                        ? "ඇණවුම"
                        : "ஆர்டர்"}{" "}
                      <Text className="font-semibold text-gray-900">
                        {invoice}
                      </Text>{" "}
                      {selectedLanguage === "En"
                        ? "has been put on hold for the moment."
                        : selectedLanguage === "Si"
                        ? "මොහොතකට රඳවා තබා ඇත."
                        : "தற்போதைக்கு நிறுத்தி வைக்கப்பட்டுள்ளது."}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Fallback message if no invoices */}
            {invoiceNumbers.length === 0 && (
              <Text className="text-sm text-gray-600 text-center">
                {selectedLanguage === "En"
                  ? "Order(s) have been marked as hold."
                  : selectedLanguage === "Si"
                  ? "ඇණවුම් රඳවා තබා ඇත."
                  : "ஆர்டர்கள் நிறுத்தி வைக்கப்பட்டுள்ளன."}
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Language Menu Modal */}
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
                    languageMap[lang as keyof typeof languageMap].code
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
    </View>
  );
};

export default HoldOrder;
