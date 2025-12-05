import React, { useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Signature from "react-native-signature-canvas";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";

type SignatureScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SignatureScreen"
>;

export default function SignatureScreen() {
  const signatureRef = useRef<any>(null);
  const navigation = useNavigation<SignatureScreenNavigationProp>();

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleOK = (signature: string) => {
    console.log("Signature base64:", signature);
    // Navigate to DeliverySuccessful after signature is done
    navigation.navigate("DeliverySuccessful");
  };

  return (
    <View className="flex-1 bg-white pt-12 px-4">
      {/* TITLE */}
      <Text className="text-center text-base font-semibold mb-3">
        Customer's Digital Signature
      </Text>

      {/* SIGNATURE AREA */}
      <View
        className="relative rounded-2xl overflow-hidden border-2 border-[#2D7BFF] mb-4"
        style={{
          borderStyle: "dashed",
          backgroundColor: "#DFEDFC",
          height: "80%",
        }}
      >
        {/* CLEAR BUTTON */}
        <TouchableOpacity
          onPress={handleClear}
          className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg flex-row items-center z-10"
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <FontAwesome6 name="eraser" size={16} color="#2D7BFF" />
          <Text className="ml-2 text-[#2D7BFF] font-semibold">Clear</Text>
        </TouchableOpacity>

        {/* SIGNATURE CANVAS */}
        <Signature
          ref={signatureRef}
          onOK={handleOK}
          webStyle={`
            .m-signature-pad--footer { display: none; margin: 0; }
            .m-signature-pad--body { margin: 0; }
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #DFEDFC; }
            canvas { background-color: #DFEDFC; width: 100% !important; height: 100% !important; }
          `}
          autoClear={false}
          descriptionText=""
          style={{ flex: 1, backgroundColor: "#DFEDFC" }}
        />
      </View>

      {/* BOTTOM BUTTONS */}
      <View className="flex-row justify-between py-6">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-row items-center bg-white border border-gray-300 px-6 py-3 rounded-full"
        >
          <Ionicons name="close" size={20} color="black" />
          <Text className="text-black font-medium ml-2">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleOK.bind(null, "")} 
          className="flex-row items-center bg-[#F7CA21] px-6 py-3 rounded-full"
        >
          <FontAwesome6 name="check" size={18} color={"black"} />
          <Text className="font-semibold text-black ml-2">Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
