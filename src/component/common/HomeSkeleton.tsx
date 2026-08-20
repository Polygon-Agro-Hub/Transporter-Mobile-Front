import React, { useEffect, useRef } from "react";
import { View, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const HomeSkeleton: React.FC = () => {
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Profile Skeleton */}
        <Animated.View className="flex-row items-center px-4 mt-4" style={{ opacity: pulseAnim }}>
          <View className="w-14 h-14 rounded-full bg-gray-200 mr-4" />
          <View className="flex-1 h-6 bg-gray-200 rounded-md max-w-[120px]" />
        </Animated.View>

        {/* Banner Card Skeleton */}
        <Animated.View className="mx-4 mt-8 mb-4 h-28 rounded-2xl bg-gray-200" style={{ opacity: pulseAnim }} />

        {/* Cash Received Skeleton */}
        <Animated.View
          className="mx-4 mb-6 h-20 rounded-2xl bg-gray-100 flex-row items-center px-4 justify-between border border-[#EBEBEB]"
          style={{ opacity: pulseAnim }}
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-lg bg-gray-200 mr-4" />
            <View className="gap-y-1.5">
              <View className="w-24 h-4 bg-gray-200 rounded" />
              <View className="w-20 h-5 bg-gray-200 rounded" />
            </View>
          </View>
          <View className="w-6 h-6 bg-gray-200 rounded-full" />
        </Animated.View>

        {/* Grid Cards Skeleton */}
        <View className="px-4 pb-6 gap-y-4">
          {[1, 2].map((row) => (
            <View key={row} className="flex-row justify-between">
              {[1, 2].map((col) => (
                <Animated.View
                  key={col}
                  className="rounded-2xl border border-[#EBEBEB] bg-white p-4 items-center justify-center"
                  style={{ width: "48%", height: 180, opacity: pulseAnim }}
                >
                  <View className="w-20 h-20 rounded-lg bg-gray-200 mb-3" />
                  <View className="w-16 h-4 bg-gray-200 rounded mb-2" />
                  <View className="w-12 h-5 bg-gray-200 rounded-full" />
                </Animated.View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeSkeleton;
