import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
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
import CustomHeader from "@/component/common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import axios from "axios";

type AddComplaintNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddComplaint"
>;

interface AddComplaintProps {
  navigation: AddComplaintNavigationProp;
}

interface Category {
  id: number;
  appId: number;
  categoryEnglish: string;
  categorySinhala: string;
  categoryTamil: string;
}

interface DropdownItem {
  label: string;
  value: string;
}

const AddComplaint: React.FC<AddComplaintProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [items, setItems] = useState<DropdownItem[]>([]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const token = await AsyncStorage.getItem("token");

      const response = await axios.get(
        `${environment.API_BASE_URL}api/complain/complain-categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "success" && response.data.data) {
        // Transform backend data to dropdown format
        const categoryItems: DropdownItem[] = response.data.data.map(
          (category: Category) => ({
            label: category.categoryEnglish, // You can use categorySinhala or categoryTamil based on language preference
            value: category.id.toString(),
          })
        );
        setItems(categoryItems);
      } else {
        showAlert("Error", "Failed to load categories");
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      showAlert("Error", "Failed to load categories. Please try again later.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: "OK" }]);
  };

  const handleSubmit = async () => {
    if (!value || !description.trim()) {
      showAlert("Error", "Please select a category and enter description");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      // Prepare the request data
      const complaintData = {
        complainCategory: value, // This is the category ID from backend
        complain: description.trim(),
      };

      const response = await axios.post(
        `${environment.API_BASE_URL}api/complain/add-complain`,
        complaintData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        showAlert("Success", "Complaint submitted successfully!");
        // Reset form
        setValue(null);
        setDescription("");
        navigation.goBack();
      } else {
        showAlert(
          "Error",
          response.data.message || "Failed to submit complaint"
        );
      }
    } catch (error: any) {
      console.error("Error submitting complaint:", error);

      if (axios.isAxiosError(error) && error.response) {
        showAlert(
          "Error",
          error.response.data?.message || "Failed to submit complaint"
        );
      } else {
        showAlert("Error", "Something went wrong. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = value && description.trim().length > 0;

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Add a Complaint"
        showBackButton={true}
        showLanguageSelector={false}
        navigation={navigation}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Content */}
        <View className="px-4 pb-8">
          {/* Warning Icon */}
          <View className="items-center mb-8">
            <Image
              source={require("@/assets/images/complaints/complain.webp")}
              style={{ width: 150, height: 150 }}
            />
          </View>

          {/* Category Dropdown */}
          <View className="mb-6 z-50">
            {categoriesLoading ? (
              <View className="bg-[#F3F3F3] border border-[#A4AAB7] rounded-3xl px-4 py-3 flex-row items-center justify-center min-h-[50px]">
                <ActivityIndicator size="small" color="#000000" />
                <Text className="ml-2 text-gray-600">
                  Loading categories...
                </Text>
              </View>
            ) : items.length > 0 ? (
              <DropDownPicker
                open={open}
                value={value}
                items={items}
                setOpen={setOpen}
                setValue={setValue}
                setItems={setItems}
                placeholder="--Select Category Here--"
                placeholderStyle={{
                  color: "#000000",
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
            ) : (
              <View className="bg-[#F3F3F3] border border-[#A4AAB7] rounded-3xl px-4 py-3 min-h-[50px] justify-center">
                <Text className="text-gray-600">No categories available</Text>
              </View>
            )}
          </View>

          {/* Description Input */}
          <View className="mb-8">
            <TextInput
              className="bg-white border border-[#A4AAB7] rounded-xl px-4 py-4 text-base text-gray-800 min-h-[250px]"
              placeholder="Add Description Here..."
              placeholderTextColor="#767F94"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              editable={!categoriesLoading}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || loading || categoriesLoading}
            className={`rounded-full py-3 items-center ${
              isFormValid && !loading && !categoriesLoading
                ? "bg-[#F7CA21]"
                : "bg-[#DCDCDC]"
            }`}
          >
            {loading ? (
              <Text className="text-base font-semibold text-[#000000]">
                Submitting...
              </Text>
            ) : (
              <Text
                className={`text-base font-semibold ${
                  isFormValid ? "text-[#000000]" : "text-[#000000]"
                }`}
              >
                Submit
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default AddComplaint;
