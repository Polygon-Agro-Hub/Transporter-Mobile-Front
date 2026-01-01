import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUserProfile } from "../../store/authSlice";

type ComplaintsListNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ComplaintsList"
>;

interface ComplaintsListProps {
  navigation: ComplaintsListNavigationProp;
}

interface Complaint {
  id: number;
  driverId: number;
  complainCategory: number;
  refNo: string;
  complain: string;
  reply: string | null;
  status: string;
  adminReplyBy: number | null;
  replyTime: string | null;
  createdAt: string;
  categoryEnglish: string;
  categorySinhala: string;
  categoryTamil: string;
}

const ComplaintsList: React.FC<ComplaintsListProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );

  // Get user profile from Redux
  const userProfile = useSelector(selectUserProfile);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const response = await axios.get(
        `${environment.API_BASE_URL}api/complain/my-complains`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "success") {
        setComplaints(response.data.data);
      } else {
        Alert.alert("Error", "Failed to load complaints");
      }
    } catch (error: any) {
      console.error("Error fetching complaints:", error);
      Alert.alert("Error", "Failed to load complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return `Sent : At ${formattedHours}:${formattedMinutes}${ampm} on ${
      monthNames[date.getMonth()]
    } ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatReplyDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const handleReply = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedComplaint(null);
  };

  // Get user's full name
  const getUserName = () => {
    const firstName = userProfile?.firstName || "User";
    const lastName = userProfile?.lastName || "";
    return `${firstName} ${lastName}`.trim();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <CustomHeader
          title="My Complaints"
          showBackButton={true}
          showLanguageSelector={false}
          navigation={navigation}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000000" />
          <Text className="mt-4 text-gray-600">Loading complaints...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="My Complaints"
        showBackButton={true}
        showLanguageSelector={false}
        navigation={navigation}
      />

      {complaints.length === 0 ? (
        // Centered empty state
        <View className="flex-1 items-center justify-center">
          <View
            className="items-center justify-center"
            style={{
              position: "absolute",
              top: "50%",
              transform: [{ translateY: -50 }],
            }}
          >
            <Text className="text-[#495D86] text-base mb-2">
              -- No Complaints Yet --
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Complaints List */}
          <View className="px-4 py-4">
            {complaints.map((complaint) => {
              const isWaiting = complaint.status === "Opened";
              const isAnswered = complaint.status === "Closed";

              return (
                <View
                  key={complaint.id}
                  className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
                >
                  {/* Complaint ID */}
                  <Text className="text-sm font-semibold text-gray-900 mb-1">
                    #{complaint.refNo}
                  </Text>

                  {/* Title */}
                  <Text className="text-base font-medium text-gray-900 mb-2">
                    {complaint.categoryEnglish}
                  </Text>

                  {/* Date */}
                  <Text className="text-xs text-gray-500 mb-4">
                    {formatDate(complaint.createdAt)}
                  </Text>

                  {/* Status and Reply Button */}
                  <View className="flex-row items-center justify-between">
                    {/* Status Badge */}
                    <View
                      className={`flex-row items-center px-4 py-2 rounded-lg ${
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
                      onPress={() => handleReply(complaint)}
                    >
                      <MaterialCommunityIcons
                        name="eye"
                        size={16}
                        color="#fff"
                      />
                      <Text className="ml-2 text-sm font-medium text-white">
                        Reply
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-4 right-4 rounded-full"
        onPress={() => {
          navigation.navigate("AddComplaint");
        }}
      >
        <View className="w-16 h-16 items-center justify-center">
          <View className="w-16 h-16 rounded-full bg-[#F7CA21] items-center justify-center">
            <Feather name="plus" size={32} color="#020202ff" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Reply Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View
            className="bg-white rounded-3xl w-11/12 mx-4"
            style={{ maxHeight: hp(85) }}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={handleCloseModal}
              className="absolute top-4 right-4 bg-gray-300 rounded-full p-2"
              style={{ zIndex: 1000 }}
            >
              <AntDesign name="close" size={16} color="#fff" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={true} bounces={true}>
              <View className="p-6 pt-14">
                {/* Header with User Name from Redux */}
                <Text className="text-sm text-[#2D2D2D] mb-1">
                  Dear {getUserName()},
                </Text>

                {/* Main Message */}
                <Text className="text-sm text-[#2D2D2D] leading-6 mb-4 mt-4">
                  We are pleased to inform you that your complaint has been
                  resolved.
                </Text>

                {/* Admin Reply */}
                <View className=" mb-2">
                  <Text className="text-sm text-[#2D2D2D] leading-6">
                    {selectedComplaint?.reply || "No reply provided yet."}
                  </Text>
                </View>

                {/* Footer Message */}
                <Text className="text-sm text-[#2D2D2D] leading-6 mb-4">
                  If you have any further concerns or questions, feel free to
                  reach out. Thank you for your patience and understanding.
                </Text>

                {/* Signature */}
                <View className="mt-4 pt-4 ">
                  <Text className="text-sm text-gray-900">Sincerely,</Text>
                  <Text className="text-sm text-[#2D2D2D] mt-1">
                    Polygon Customer Support Team
                  </Text>
                  <Text className="text-xs text-[#2D2D2D] mt-2">
                    {formatReplyDate(selectedComplaint?.replyTime || null)}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ComplaintsList;
