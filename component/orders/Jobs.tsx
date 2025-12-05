import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import CustomHeader from "@/component/common/CustomHeader";

type JobsScreenNavigationProp = StackNavigationProp<RootStackParamList, "Jobs">;

interface JobsScreenProp {
  navigation: JobsScreenNavigationProp;
}

const Jobs: React.FC<JobsScreenProp> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<"todo" | "completed">("todo");

  const todoJobs = [
    {
      id: "01",
      name: "Mr. Kusal Dies",
      time: "8:00AM - 2:00PM",
      count: 2,
      status: "Started",
    },
    {
      id: "02",
      name: "Mr. Kusal Dies",
      time: "2:00PM - 8:00PM",
      count: 1,
      status: "Pending",
    },
  ];

  const completedJobs = [
    {
      id: "01",
      name: "Mr. Kusal Dies",
      time: "8:00AM - 2:00PM",
      count: 2,
      status: "Started",
    },
    {
      id: "02",
      name: "Mr. Kusal Dies",
      time: "2:00PM - 8:00PM",
      count: 1,
      status: "Pending",
    },
  ];

  const dataToShow = activeTab === "todo" ? todoJobs : completedJobs;

  return (
    <View className="flex-1 bg-white ">
      <CustomHeader
        title="Jobs"
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
      />
      <View
        className="flex-row  mt-2 bg-white "
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("todo")}
          className={`
            flex-1 flex-row items-center justify-center space-x-2 
            ${activeTab === "todo" ? " bg-[#F6F9FF]" : ""}
            py-3
          `}
        >
          <View className="w-8 h-8 rounded-full bg-black justify-center items-center">
            <Text className="text-white font-bold">03</Text>
          </View>
          <Text
            className={`text-lg ${
              activeTab === "todo" ? "font-bold" : "font-medium"
            }`}
          >
            To Do
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("completed")}
          className={`
            flex-1 flex-row items-center justify-center space-x-2 
            ${activeTab === "completed" ? "bg-[#F6F9FF] " : ""}
            py-2
          `}
        >
          <View className="w-8 h-8 rounded-full bg-black justify-center items-center">
            <Text className="text-white font-bold">0</Text>
          </View>
          <Text
            className={`text-lg ${
              activeTab === "completed" ? "font-bold" : "font-medium"
            }`}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="mt-6 px-5">
        {dataToShow.map((item, index) => (
          <TouchableOpacity
            disabled={activeTab === "completed"}
            onPress={() => navigation.navigate("OrderDetails")}
            style={
              activeTab === "todo" && {
                shadowColor: "#000",
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 2,
              }
            }
            key={index}
            className={` rounded-xl px-5 py-2 mb-5 shadow-sm border flex-row justify-between items-center ${
              item.status === "Started" && activeTab === "todo"
                ? "bg-[#FFFBEA] border-[#F7CA21] "
                : "bg-white border-[#A4AAB7] "
            }`}
          >
            <View>
              <View className="flex-row items-center">
                {item.status === "Started" && activeTab === "todo" ? (
                  <View className="bg-[#F7CA21] w-2 h-2 rounded-full mr-1" />
                ) : (
                  ""
                )}
                <Text className="text-sm font-bold">#{item.id}</Text>
              </View>

              <Text className="text-base font-bold mt-1">{item.name}</Text>
              <Text className="text-sm mt-1">{item.time}</Text>
            </View>

            <View
              className={`w-7 h-7  ${
                activeTab === "todo"
                  ? "bg-yellow-400 rounded-full"
                  : "bg-[#F3F3F3] rounded-full"
              } justify-center items-center `}
            >
              <Text className="font-bold text-black ">{item.count}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {activeTab === "completed" && completedJobs.length === 0 && (
          <Text className="text-center text-gray-500 mt-10">
            No completed jobs
          </Text>
        )}
      </ScrollView>
    </View>
  );
};
export default Jobs;
