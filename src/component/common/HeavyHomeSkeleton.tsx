import React, { useEffect, useRef } from "react";
import { View, Animated, ScrollView } from "react-native";

export const HeavyHomeSkeleton: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.7,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0.3,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, [pulseAnim]);

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      {/* Profile Header Skeleton */}
      <Animated.View
        className="bg-white px-4 mt-4 flex-row items-center justify-between"
        style={{ opacity: pulseAnim }}
      >
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-14 h-14 rounded-full bg-gray-200 mr-4 border-2 border-gray-100" />
          <View className="flex-1">
            <View className="w-32 h-6 bg-gray-200 rounded-md" />
          </View>
        </View>

        {/* QR Button Skeleton */}
        <View className="w-14 h-14 rounded-full bg-gray-200" />
      </Animated.View>

      {/* Action Buttons Grid Skeleton (Matches 3 cards of HeavyDriverHome) */}
      <View className="px-4 pt-6 pb-6">
        {/* Row 1: 2 Action Cards */}
        <View className="flex-row justify-between mb-4">
          {[1, 2].map((col) => (
            <Animated.View
              key={col}
              className="bg-white rounded-xl p-4 items-center justify-center border border-[#EBEBEB]"
              style={{
                width: "48%",
                opacity: pulseAnim,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              {/* Image box placeholder */}
              <View className="w-28 h-28 rounded-lg justify-center items-center mb-3 bg-gray-100">
                <View className="w-20 h-20 rounded-lg bg-gray-200" />
              </View>
              {/* Label placeholder */}
              <View className="w-24 h-4 bg-gray-200 rounded" />
            </Animated.View>
          ))}
        </View>

        {/* Row 2: 1 Action Card + Empty Space */}
        <View className="flex-row justify-between mb-4">
          <Animated.View
            className="bg-white rounded-xl p-4 items-center justify-center border border-[#EBEBEB]"
            style={{
              width: "48%",
              opacity: pulseAnim,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            {/* Image box placeholder */}
            <View className="w-28 h-28 rounded-lg justify-center items-center mb-3 bg-gray-100">
              <View className="w-20 h-20 rounded-lg bg-gray-200" />
            </View>
            {/* Label placeholder */}
            <View className="w-24 h-4 bg-gray-200 rounded" />
          </Animated.View>

          <View className="w-[48%]" />
        </View>
      </View>
    </ScrollView>
  );
};

export default HeavyHomeSkeleton;
