import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import React from "react";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  FontAwesome6,
} from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import CustomHeader from "@/component/common/CustomHeader";

type OrderDetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OrderDetails"
>;

interface OrderDetailsProp {
  navigation: OrderDetailsNavigationProp;
}
const OrderDetails: React.FC<OrderDetailsProp> = ({ navigation }) => {
  const orderItems = [
    {
      id: "251201001",
      time: "8:00AM - 2:00PM",
      payment: "Cash : Rs. 1,000.00",
    },
    {
      id: "251201002",
      time: "8:00AM - 12:00PM",
      payment: "Cash : Rs. 2,500.00",
    },
    {
      id: "251201003",
      time: "1:00PM - 5:00PM",
      payment: "Card : Rs. 3,000.00",
    },
  ];

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <CustomHeader
        title="Order Details"
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Avatar */}
        <View className="items-center ">
          <Image
            source={require("@/assets/ProfileCustomer.webp")}
            className="w-20 h-20 rounded-full"
          />
          <Text className="text-lg font-bold mt-4 max-w-[90%] text-center">
            Mr. Gimhan Nayanajith Kariyawasam
          </Text>

          <View className="flex-row  mt-1 max-w-[90%]">
            <Ionicons name="location-sharp" size={18} color="black" />
            <Text className="ml-1 text-base  max-w-[90%]">
              11/A, Samagi Mawatha, Panipitiya Rd, Maharagama
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between mx-3 mt-6">
          <View className="w-[45%] rounded-xl bg-[#F3F3F3] p-5 items-center">
            <FontAwesome5 name="shopping-bag" size={30} color="black" />
            <Text className="mt-2 text-lg font-semibold">2 Packs</Text>
          </View>

          <View className="w-[45%] rounded-xl bg-[#F3F3F3] p-5 items-center">
            <Ionicons name="time" size={30} color="black" />
            <Text className="mt-2 text-lg font-semibold">8AM - 2PM</Text>
          </View>
        </View>

        <View className="mx-3 mt-6 space-y-5">
          {orderItems.map((item, index) => (
            <View
              key={index}
              className="rounded-xl border border-[#A4AAB7] py-2 px-4 bg-white"
            >
              <Text className="font-bold text-sm ">#{item.id}</Text>

              <View className="flex-row items-center mt-1">
                <Ionicons name="time" size={16} color="black" />
                <Text className="ml-2 text-sm">{item.time}</Text>
              </View>

              <View className="flex-row items-center mt-1">
                <FontAwesome6 name="coins" size={16} color="#F7CA21" />
                <Text className="ml-2 text-sm">{item.payment}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className=" absolute bottom-0  w-full mx-3 px-8 mb-6 ">
        <TouchableOpacity
          className="rounded-full bg-white border border-[#CBD7E8] py-6 px-6 w-full justify-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 1, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <Text className="text-base font-bold text-center absolute left-0 right-0">
            Make Phone Call
          </Text>

          <View className="absolute right-2 bg-[#F7CA21] w-10 h-10 rounded-full items-center justify-center">
            <Ionicons name="call" size={24} color="#000" />
          </View>
        </TouchableOpacity>

        {/* Start Journey Button */}
        <TouchableOpacity
          className="rounded-full bg-[#F7CA21] py-3 mt-5 items-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 4,
          }}
          onPress={() => navigation.navigate("MyJourney")}
        >
          <Text className="text-base font-bold">Start Journey</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default OrderDetails;
