import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { AntDesign } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
  showLanguageSelector?: boolean;
  navigation?: StackNavigationProp<any>;
  onLanguageChange?: (language: string) => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  showBackButton = true,
  showLanguageSelector = false,
  navigation,
  onLanguageChange,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  const languages = [
    { code: "EN", name: "English" },
    { code: "SI", name: "සිංහල" },
    { code: "TA", name: "தமிழ்" },
  ];

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setDropdownVisible(false);
    onLanguageChange?.(languageCode);
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white relative">
      {/* Left Section - Back Button */}
      <View style={{ width: wp(15) }}>
        {showBackButton && navigation && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="items-start"
          >
            <Entypo
              name="chevron-left"
              size={25}
              color="black"
              style={{
                backgroundColor: "#F7FAFF",
                borderRadius: 50,
                padding: wp(2.5),
              }}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Center Section - Title */}
      <View className="flex-1 items-center">
        <Text className="text-xl font-semibold text-center text-black">
          {title}
        </Text>
      </View>

      {/* Right Section - Language Selector or Empty Space */}
      <View style={{ width: wp(15) }} className="items-end">
        {showLanguageSelector && (
          <View className="relative">
            <TouchableOpacity
              onPress={() => setDropdownVisible(!dropdownVisible)}
              className="flex-row items-center bg-[#F6CA20] px-3 py-2 rounded-md"
            >
              <Text className="font-medium text-sm">{selectedLanguage}</Text>
              <AntDesign
                name={dropdownVisible ? "up" : "down"}
                size={12}
                color="#666"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {dropdownVisible && (
              <>
                {/* Overlay to close dropdown when clicking outside */}
                <TouchableWithoutFeedback
                  onPress={() => setDropdownVisible(false)}
                >
                  <View className="absolute top-full right-0 left-0 bottom-[-1000px] z-10" />
                </TouchableWithoutFeedback>

                {/* Dropdown Content */}
                <View className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg z-20 min-w-[130px] border border-gray-200">
                  {languages.map((lang, index) => (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => handleLanguageSelect(lang.code)}
                      className={`flex-row items-center px-4 py-3 ${
                        index !== languages.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      } ${
                        selectedLanguage === lang.code
                          ? "bg-blue-50"
                          : "bg-white"
                      }`}
                    >
                      <Text className="flex-1 text-base">{lang.name}</Text>
                      {selectedLanguage === lang.code && (
                        <AntDesign name="check" size={16} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default CustomHeader;
