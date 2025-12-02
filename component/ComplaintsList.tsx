import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

type ComplaintsListNavigationProp = StackNavigationProp<RootStackParamList, "ComplaintsList">;

interface ComplaintsListProps {
  navigation: ComplaintsListNavigationProp;
}

interface Complaint {
  id: string;
  title: string;
  date: string;
  status: "waiting" | "answered";
}

const ComplaintsList: React.FC<ComplaintsListProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  const complaints: Complaint[] = [
    {
      id: "#DVR000012511001002",
      title: "Finance Issue",
      date: "Sent : At 11:00AM on Jun 2, 2026",
      status: "waiting",
    },
    {
      id: "#DVR000012511001001",
      title: "Vehicle Repair Announcement",
      date: "Sent : At 11:00AM on Jun 2, 2026",
      status: "answered",
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleReply = (complaintId: string) => {
    // Navigate to reply screen
    console.log("Reply to:", complaintId);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <SafeAreaView  className="bg-white px-2 shadow-sm">
        
           <View
          className="flex-row justify-between "
          style={{ paddingHorizontal: wp(4) ,paddingVertical: hp(2) }}
        >
        
            <TouchableOpacity 
      className="w-8 h-8 rounded-full bg-[#F7FAFF] items-center justify-center shadow-sm "
      onPress={() => navigation.goBack()}
    >
              <Feather name="chevron-left" size={24} color="#000" />
           
          </TouchableOpacity>
       
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold">
              My Complaints
            </Text>
          </View>
        </View>
        </SafeAreaView>

        {/* Complaints List */}
        <View className="px-6 py-4">
          {complaints.map((complaint) => {
            const isWaiting = complaint.status === "waiting";

            return (
              <View
                key={complaint.id}
                className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
              >
                {/* Complaint ID */}
                <Text className="text-sm font-semibold text-gray-900 mb-1">
                  {complaint.id}
                </Text>

                {/* Title */}
                <Text className="text-base font-medium text-gray-900 mb-2">
                  {complaint.title}
                </Text>

                {/* Date */}
                <Text className="text-xs text-gray-500 mb-4">
                  {complaint.date}
                </Text>

                {/* Status and Reply Button */}
                <View className="flex-row items-center justify-between">
                  {/* Status Badge */}
                  <View
                    className={`flex-row items-center px-3 py-2 rounded-full ${
                      isWaiting ? "bg-yellow-100" : "bg-green-100"
                    }`}
                  >
                    {isWaiting ? (
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={14}
                        color="#92400e"
                      />
                    ) : (
                      <Feather
                        name="check-circle"
                        size={14}
                        color="#166534"
                      />
                    )}
                    <Text
                      className={`ml-1.5 text-xs font-medium ${
                        isWaiting ? "text-yellow-800" : "text-green-800"
                      }`}
                    >
                      {isWaiting ? "Waiting.." : "Answered"}
                    </Text>
                  </View>

                  {/* Reply Button */}
                  <TouchableOpacity
                    className={`flex-row items-center px-4 py-2 rounded-full ${
                      isWaiting ? "bg-gray-100" : "bg-black"
                    }`}
                    disabled={isWaiting}
                    onPress={() => handleReply(complaint.id)}
                  >
                    <MaterialCommunityIcons
                      name="message-reply-outline"
                      size={16}
                      color={isWaiting ? "#9ca3af" : "#fff"}
                    />
                    <Text
                      className={`ml-2 text-sm font-medium ${
                        isWaiting ? "text-gray-400" : "text-white"
                      }`}
                    >
                      Reply
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        className="absolute bottom-6 right-6 rounded-full "
        onPress={() => {/* Handle FAB press */}}
      >
        <View className="w-16 h-16 items-center justify-center">
          <View className="w-12 h-12 rounded-full bg-black items-center justify-center">
            <Feather name="plus" size={24} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ComplaintsList;