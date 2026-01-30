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
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "@/component/common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AlertModal } from "../common/AlertModal";
import { environment } from "@/environment/environment";
import axios from "axios";
import GlobalSearchModal from "@/component/common/GlobalSearchModal";
import { MaterialIcons } from "@expo/vector-icons";

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
  originalCategory: Category;
}

const AddComplaint: React.FC<AddComplaintProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState("");

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  // GlobalSearchModal states
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryLabel, setSelectedCategoryLabel] =
    useState<string>("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDescriptionChange = (text: string) => {
    if (text.length > 0 && description.length === 0) {
      setDescription(text.charAt(0).toUpperCase() + text.slice(1));
    } else {
      setDescription(text);
    }
  };

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
        },
      );

      if (response.data.status === "success" && response.data.data) {
        const categoriesData: Category[] = response.data.data;
        setCategories(categoriesData);
      } else {
        showModal("Error", "Failed to load categories", "error");
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      showModal(
        "Error",
        "Failed to load categories. Please try again later.",
        "error",
      );
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

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error",
  ) => {
    setModalConfig({ title, message, type });
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);

    if (modalConfig.type === "success") {
      navigation.navigate("ComplaintsList");
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !description.trim()) {
      showModal(
        "Error",
        "Please select a category and enter description",
        "error",
      );
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      // Prepare the request data
      const complaintData = {
        complainCategory: selectedCategory,
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
        },
      );

      if (response.data.status === "success") {
        // Reset form
        setSelectedCategory(null);
        setSelectedCategoryLabel("");
        setDescription("");

        // Show success modal
        showModal(
          "Success!",
          "Your complaint has been submitted successfully. We'll review it shortly.",
          "success",
        );
      } else {
        showModal(
          "Error",
          response.data.message || "Failed to submit complaint",
          "error",
        );
      }
    } catch (error: any) {
      console.error("Error submitting complaint:", error);

      if (axios.isAxiosError(error) && error.response) {
        showModal(
          "Error",
          error.response.data?.message || "Failed to submit complaint",
          "error",
        );
      } else {
        showModal(
          "Error",
          "Something went wrong. Please try again later.",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = selectedCategory && description.trim().length > 0;

  // Prepare data for GlobalSearchModal
  const getSearchModalData = () => {
    return categories.map((category) => ({
      label: category.categoryEnglish,
      value: category.id.toString(),
      originalCategory: category,
    }));
  };

  // Handle category selection from GlobalSearchModal
  const handleCategorySelect = (selectedValues: string[]) => {
    if (selectedValues.length > 0) {
      const selectedValue = selectedValues[0];
      const selectedCategory = categories.find(
        (cat) => cat.id.toString() === selectedValue,
      );

      if (selectedCategory) {
        setSelectedCategory(selectedValue);
        setSelectedCategoryLabel(selectedCategory.categoryEnglish);
      }
    }
    setSearchModalVisible(false);
  };

  // Custom render item for GlobalSearchModal
  const renderCategoryItem = (item: any, isSelected: boolean) => {
    const category = item.originalCategory;

    return (
      <TouchableOpacity
        className="px-4 py-4 border-b border-gray-200 flex-row items-center justify-between"
        onPress={() => handleCategorySelect([item.value])}
      >
        <View className="flex-1">
          <Text className="text-base text-gray-800 font-medium">
            {item.label}
          </Text>
          {/* You can add additional category info here if needed */}
          {/* <Text className="text-sm text-gray-500 mt-1">
            Category ID: {item.value}
          </Text> */}
        </View>
        {isSelected && (
          <View className="w-6 h-6 rounded-full bg-[#21202B] items-center justify-center ml-2">
            <Text className="text-white text-xs">✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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

          {/* Category Selection Button */}
          <View className="mb-6">
            {categoriesLoading ? (
              <View className="bg-[#F3F3F3] border border-[#A4AAB7] rounded-3xl px-4 py-3 flex-row items-center justify-center min-h-[50px]">
                <ActivityIndicator size="small" color="#000000" />
                <Text className="ml-2 text-gray-600">
                  Loading categories...
                </Text>
              </View>
            ) : categories.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchModalVisible(true)}
                className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-full px-5 flex-row items-center justify-between"
                style={{
                  height: 55,
                  borderRadius: 25,
                }}
                disabled={categoriesLoading}
              >
                <Text className={`text-base text-black`}>
                  {selectedCategoryLabel || "--Select Category Here--"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
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
              onChangeText={handleDescriptionChange}
              editable={!categoriesLoading}
              autoCapitalize="sentences"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || loading || categoriesLoading}
            className={`rounded-full py-3 mx-10 items-center ${
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

      {/* Global Search Modal for Categories */}
      <GlobalSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        title="Select Category"
        data={getSearchModalData()}
        selectedItems={selectedCategory ? [selectedCategory] : []}
        onSelect={handleCategorySelect}
        searchPlaceholder="Search categories..."
        doneButtonText="Done"
        noResultsText="No categories found"
        multiSelect={false}
        renderItem={renderCategoryItem}
        searchKeys={["label"]}
      />

      {/* Alert Modal */}
      <AlertModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={handleModalClose}
        autoClose={true}
        duration={3000}
      />
    </View>
  );
};

export default AddComplaint;
