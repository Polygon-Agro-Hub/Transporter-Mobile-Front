import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Signature from "react-native-signature-canvas";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import * as ScreenOrientation from "expo-screen-orientation";
import CustomHeader from "../common/CustomHeader";

type SignatureScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SignatureScreen"
>;

// Custom DashedBorder component
interface DashedBorderProps {
  children: React.ReactNode;
  style?: any;
  borderColor?: string;
  dashWidth?: number;
  gapWidth?: number;
  borderWidth?: number;
}

const DashedBorder = ({
  children,
  style,
  borderColor = "#2D7BFF",
  dashWidth = 10,
  gapWidth = 5,
  borderWidth = 2,
}: DashedBorderProps) => {
  return (
    <View style={[style, { position: "relative" }]}>
      {/* Top border */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: borderWidth,
          flexDirection: "row",
        }}
      >
        {Array.from({ length: Math.ceil(1000 / (dashWidth + gapWidth)) }).map(
          (_, i) => (
            <View
              key={`top-${i}`}
              style={{
                width: dashWidth,
                height: borderWidth,
                backgroundColor: borderColor,
                marginRight: gapWidth,
              }}
            />
          )
        )}
      </View>

      {/* Right border */}
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: borderWidth,
          alignItems: "center",
        }}
      >
        {Array.from({ length: Math.ceil(1000 / (dashWidth + gapWidth)) }).map(
          (_, i) => (
            <View
              key={`right-${i}`}
              style={{
                width: borderWidth,
                height: dashWidth,
                backgroundColor: borderColor,
                marginBottom: gapWidth,
              }}
            />
          )
        )}
      </View>

      {/* Bottom border */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: borderWidth,
          flexDirection: "row",
        }}
      >
        {Array.from({ length: Math.ceil(1000 / (dashWidth + gapWidth)) }).map(
          (_, i) => (
            <View
              key={`bottom-${i}`}
              style={{
                width: dashWidth,
                height: borderWidth,
                backgroundColor: borderColor,
                marginRight: gapWidth,
              }}
            />
          )
        )}
      </View>

      {/* Left border */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: borderWidth,
          alignItems: "center",
        }}
      >
        {Array.from({ length: Math.ceil(1000 / (dashWidth + gapWidth)) }).map(
          (_, i) => (
            <View
              key={`left-${i}`}
              style={{
                width: borderWidth,
                height: dashWidth,
                backgroundColor: borderColor,
                marginBottom: gapWidth,
              }}
            />
          )
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1, margin: borderWidth }}>{children}</View>
    </View>
  );
};

export default function SignatureScreen() {
  const signatureRef = useRef<any>(null);
  const navigation = useNavigation<SignatureScreenNavigationProp>();

  // Use useFocusEffect to handle orientation changes
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const setupOrientation = async () => {
        if (!isActive) return;

        // Lock to landscape when screen is focused
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
        );
      };

      setupOrientation();

      // Cleanup function when screen loses focus
      return () => {
        isActive = false;
        // Unlock orientation when leaving this screen
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      };
    }, [])
  );

  // Also handle with useEffect as backup
  useEffect(() => {
    return () => {
      // Ensure we return to portrait when component unmounts
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
  }, []);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleOK = (signature: string) => {
    console.log("Signature base64:", signature);
    // Navigate to DeliverySuccessful after signature is done
    navigation.navigate("DeliverySuccessful");
  };

  // CSS style for full canvas in landscape
  const signatureStyle = `
    .m-signature-pad {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      box-shadow: none;
    }
    .m-signature-pad--body {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0;
      padding: 0;
      border: none;
      width: 100% !important;
      height: 100% !important;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #DFEDFC;
    }
    canvas {
      background-color: #DFEDFC;
      width: 100% !important;
      height: 100% !important;
      touch-action: none;
    }
  `;

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Customer's Digital Signature"
        showBackButton={true}
        showLanguageSelector={false}
        navigation={navigation}
      />

      {/* SIGNATURE AREA */}
      <View className="flex-1 mx-4 mb-4">
        <DashedBorder
          style={{
            backgroundColor: "#DFEDFC",
            flex: 1,
            borderRadius: 16,
            overflow: "hidden",
          }}
          borderColor="#2D7BFF"
          dashWidth={12}
          gapWidth={8}
          borderWidth={2}
        >
          {/* CLEAR BUTTON */}
          <TouchableOpacity
            onPress={handleClear}
            className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg flex-row items-center z-10"
            style={{
              elevation: 10,
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <FontAwesome6 name="eraser" size={16} color="#2D7BFF" />
            <Text className="ml-2 text-[#2D7BFF] font-semibold">Clear</Text>
          </TouchableOpacity>

          {/* SIGNATURE CANVAS */}
          <View style={{ flex: 1 }}>
            <Signature
              ref={signatureRef}
              onOK={handleOK}
              webStyle={signatureStyle}
              autoClear={false}
              descriptionText=""
              style={{
                flex: 1,
                backgroundColor: "#DFEDFC",
              }}
            />
          </View>
        </DashedBorder>
      </View>

      {/* BOTTOM BUTTONS */}
      <View className="flex-row justify-between px-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-row items-center bg-white border border-gray-300 px-6 py-3 rounded-full"
        >
          <Ionicons name="close" size={20} color="black" />
          <Text className="text-black font-medium ml-2">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (signatureRef.current) {
              signatureRef.current.readSignature();
            } else {
              handleOK("");
            }
          }}
          className="flex-row items-center bg-[#F7CA21] px-6 py-3 rounded-full"
        >
          <FontAwesome6 name="check" size={18} color={"black"} />
          <Text className="font-semibold text-black ml-2">Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
