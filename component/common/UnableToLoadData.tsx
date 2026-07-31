import React from "react";
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";

interface UnableToLoadDataProps {
  error: string | null;
  onRefresh: () => void | Promise<void>;
  onTryAgain: () => void | Promise<void>;
  onLogout: () => void | Promise<void>;
  refreshing?: boolean;
}

const UnableToLoadData: React.FC<UnableToLoadDataProps> = ({
  error,
  onRefresh,
  onTryAgain,
  onLogout,
  refreshing = false,
}) => {
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      className="flex-1 bg-white"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="items-center justify-center p-4">
        <Feather name="alert-circle" size={48} color="#EF4444" />
        <Text className="text-lg font-bold text-gray-900 mt-4 text-center">
          Unable to Load Data
        </Text>
        <Text className="text-gray-600 text-center mt-2 px-4">
          {error || "An error occurred"}. Pull down to refresh.
        </Text>
        
        <View className="w-full px-8 mt-8">
          <TouchableOpacity
            className="w-full bg-[#F7CA21] py-4 rounded-full items-center justify-center active:opacity-80 shadow-sm"
            onPress={onTryAgain}
          >
            <Text className="text-gray-900 font-bold text-base">Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="w-full border border-red-500 bg-white py-4 rounded-full items-center justify-center active:opacity-80 mt-3"
            onPress={onLogout}
          >
            <Text className="text-red-500 font-bold text-base">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default UnableToLoadData;
