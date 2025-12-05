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
import {
  AntDesign,
  Feather,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import CustomHeader from "@/component/common/CustomHeader";

type ComplaintsListNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ComplaintsList"
>;

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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <CustomHeader
          title="My Complaints"
          showBackButton={true}
          showLanguageSelector={false}
          navigation={navigation}
        />

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
                    className={`flex-row items-center px-3 py-2 rounded-lg ${
                      isWaiting ? "bg-[#FFF3BF]" : "bg-[#FFF3BF]"
                    }`}
                  >
                    {isWaiting ? (
                      <AntDesign name="hourglass" size={14} color="black" />
                    ) : (
                      <FontAwesome6
                        name="circle-check"
                        size={14}
                        color="black"
                      />
                    )}
                    <Text
                      className={`ml-1.5 text-xs font-medium ${
                        isWaiting ? "text-black" : "text-black"
                      }`}
                    >
                      {isWaiting ? "Waiting.." : "Answered"}
                    </Text>
                  </View>

                  {/* Reply Button */}
                  <TouchableOpacity
                    className={`flex-row items-center px-4 py-1.5 rounded-lg ${
                      isWaiting ? "bg-[#CBD7E8]" : "bg-black"
                    }`}
                    disabled={isWaiting}
                    onPress={() => handleReply(complaint.id)}
                  >
                    <MaterialCommunityIcons
                      name="eye"
                      size={16}
                      color={isWaiting ? "#fff" : "#fff"}
                    />
                    <Text
                      className={`ml-2 text-sm font-medium ${
                        isWaiting ? "text-white" : "text-white"
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
        onPress={() => {
          navigation.navigate("AddComplaint");
        }}
      >
        <View className="w-16 h-16 items-center justify-center">
          <View className="w-16 h-16 rounded-full bg-black items-center justify-center">
            <Feather name="plus" size={24} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ComplaintsList;
