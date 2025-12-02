import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import { Feather } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

type AddComplaintNavigationProp = StackNavigationProp<RootStackParamList, "AddComplaint">;

interface AddComplaintProps {
  navigation: AddComplaintNavigationProp;
}

const categories = [
  { label: "Finance Issues", value: "finance" },
  { label: "Technical Support", value: "technical" },
  { label: "HR Related", value: "hr" },
  { label: "Workplace Environment", value: "environment" },
  { label: "Management", value: "management" },
  { label: "Other", value: "other" },
];

const AddComplaint: React.FC<AddComplaintProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [items, setItems] = useState(categories);
  const [description, setDescription] = useState("");

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleSubmit = () => {
    if (value && description.trim()) {
      // Find the selected category label
      const selectedCategory = items.find(item => item.value === value)?.label;
      console.log({ category: selectedCategory, description });
      navigation.goBack();
    }
  };

  const isFormValid = value && description.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          className="flex-row justify-between px-5"
          style={{ paddingHorizontal: wp(4), paddingVertical: hp(2) }}
        >
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-[#F7FAFF] items-center justify-center shadow-sm"
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={24} color="#000" />
          </TouchableOpacity>

          <View className="flex-1 items-center mt-1 mr-4">
            <Text className="text-lg font-bold">
              Add a Complaint
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-6 pb-8">
          {/* Warning Icon */}
          <View className="items-center mb-8">
            <Image
              source={require("../assets/images/complaints/complain.png")}
              style={{ width: 150, height: 150 }}
            />
          </View>

          {/* Category Dropdown */}
          <View className="mb-6 z-50">
           
            <DropDownPicker
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setItems}
              placeholder="--Select Category Here--"
              placeholderStyle={{
                color: "#9CA3AF",
                fontSize: 16,
              }}
              style={{
                backgroundColor: "#F3F3F3",
                borderColor: "#A4AAB7",
                borderRadius: 25,
                borderWidth: 1,
                minHeight: 50,
              }}
              dropDownContainerStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#A4AAB7",
                borderRadius: 12,
                borderWidth: 1,
                marginTop: 2,
              }}
              textStyle={{
                fontSize: 16,
                color: "#000000",
              }}
              arrowIconStyle={{
                width: 20,
                height: 20,
              }}
              tickIconStyle={{
                width: 18,
                height: 18,
              }}
              listItemLabelStyle={{
                color: "#374151",
                fontSize: 16,
              }}
              selectedItemLabelStyle={{
                fontWeight: "600",
              }}
              listMode="SCROLLVIEW"
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
              dropDownDirection="BOTTOM"
              searchable={false}
              showTickIcon={true}
              modalProps={{
                animationType: "fade",
              }}
              modalTitle="Select a category"
              modalTitleStyle={{
                fontWeight: "bold",
              }}
            />
          </View>

          {/* Description Input */}
          <View className="mb-8">
           
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 py-4 text-base text-gray-800 min-h-[250px]"
              placeholder="Add Description Here..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid}
            className={`rounded-full py-3 items-center ${
              isFormValid ? "bg-[#F7CA21]" : "bg-[#DCDCDC]"
            }`}
          >
            <Text
              className={`text-base font-semibold ${
                isFormValid ? "text-[#000000]" : "text-[#000000]"
              }`}
            >
              Submit
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddComplaint;