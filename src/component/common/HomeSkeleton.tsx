import React, { useEffect, useRef } from "react";
import { View, Animated, ScrollView} from "react-native";

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
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>

      {/* Header Profile Skeleton - matches real header */}
      <Animated.View
        className="bg-white px-4 mt-4 flex-row items-center"
        style={{ opacity: pulseAnim }}
      >
        <View className="w-14 h-14 rounded-full bg-gray-200 mr-4 border-2 border-gray-100" />
        <View className="flex-1">
          <View className="w-28 h-6 bg-gray-200 rounded-md" />
        </View>
      </Animated.View>

      {/* Motivational Banner Skeleton - matches real banner */}
      <Animated.View
        className="mx-4 mt-8 mb-4 rounded-2xl px-5 py-3 flex-row items-center bg-gray-100 min-h-[96px]"
        style={{ opacity: pulseAnim }}
      >
        <View className="flex-1 gap-y-2">
          <View className="w-36 h-5 bg-gray-200 rounded" />
          <View className="w-48 h-4 bg-gray-200 rounded" />
        </View>
        <View className="ml-4">
          <View className="w-16 h-16 rounded-xl bg-gray-200" />
        </View>
      </Animated.View>

      {/* Cash Received Skeleton - matches real Cash Received box */}
      <Animated.View
        className="mx-4 mb-2 bg-white rounded-2xl px-5 py-1 border border-[#EBEBEB] flex-row items-center"
        style={{ opacity: pulseAnim }}
      >
        <View className="flex-row items-center flex-1">
          <View className="w-20 h-20 mr-4 rounded-xl bg-gray-100 items-center justify-center">
            <View className="w-14 h-14 rounded-lg bg-gray-200" />
          </View>
          <View className="gap-y-1.5">
            <View className="w-24 h-4 bg-gray-200 rounded" />
            <View className="w-32 h-6 bg-gray-200 rounded" />
          </View>
        </View>
        <View className="ml-4 w-8 h-8 rounded-full bg-gray-100" />
      </Animated.View>

      {/* Quick Actions Grid Skeleton - matches real Quick Actions grid */}
      <View className="px-4 pt-2 pb-6">
        {[1, 2].map((row) => (
          <View key={row} className="flex-row justify-between mb-4">
            {[1, 2].map((col) => (
              <Animated.View
                key={col}
                className="bg-white rounded-xl p-4 items-center justify-center border border-[#EBEBEB]"
                style={{
                  width: "48%",
                  opacity: pulseAnim,
                }}
              >
                {/* Action image placeholder */}
                <View className="w-32 h-32 rounded-lg justify-center items-center mb-3 bg-gray-100">
                  <View className="w-24 h-24 rounded-lg bg-gray-200" />
                </View>
                {/* Action label placeholder */}
                <View className="w-20 h-4 bg-gray-200 rounded" />
              </Animated.View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default HomeSkeleton;
