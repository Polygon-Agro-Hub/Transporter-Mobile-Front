import React from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { StepProps, THEME } from "./types";

export const Step1PersonalInfo: React.FC<StepProps> = ({
  formData,
  errors,
  updateField,
  toggleArrayItem,
  openImagePicker,
}) => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* 1. Driver Profile Photo Card */}
      <View
        style={{
          backgroundColor: THEME.cardBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: THEME.cardBorder,
          paddingVertical: 22,
          paddingHorizontal: 16,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => openImagePicker("profilePhoto")}
          style={{ position: "relative" }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: THEME.primaryYellow,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {formData.profilePhoto ? (
              <Image
                source={{ uri: formData.profilePhoto }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={62} color="#FFFFFF" />
            )}
          </View>

          {/* Camera Badge Icon */}
          <View
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: THEME.cardBg,
              elevation: 3,
            }}
          >
            <Ionicons name="camera" size={14} color="#1F2937" />
          </View>
        </TouchableOpacity>

        <Text
          style={{
            color: THEME.textWhite,
            fontSize: 15,
            fontWeight: "700",
            marginTop: 12,
          }}
        >
          Driver Profile Photo
        </Text>
        <Text
          style={{
            color: THEME.textMuted,
            fontSize: 12,
            marginTop: 4,
            textAlign: "center",
          }}
        >
          Clear face photo without sunglasses or cap.
        </Text>
      </View>

      {/* 2. Preferred Languages Card */}
      <View
        style={{
          backgroundColor: THEME.cardBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: THEME.cardBorder,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 15, marginRight: 6 }}>🌐</Text>
            <Text
              style={{
                color: THEME.textWhite,
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              Preferred Languages
            </Text>
          </View>
          <Text
            style={{
              color: THEME.textMuted,
              fontSize: 11,
              fontWeight: "500",
            }}
          >
            Multi-select
          </Text>
        </View>

        {/* Language Chips */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {["English", "Sinhala", "Tamil"].map((lang) => {
            const isSelected = formData.languages.includes(lang);
            return (
              <TouchableOpacity
                key={lang}
                activeOpacity={0.8}
                onPress={() => toggleArrayItem?.("languages", lang)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 9,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  backgroundColor: isSelected ? THEME.primaryYellow : "#27272A",
                }}
              >
                <Ionicons
                  name={isSelected ? "checkmark" : "add"}
                  size={15}
                  color={isSelected ? "#0E0E0E" : "#D1D5DB"}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={{
                    color: isSelected ? "#0E0E0E" : "#D1D5DB",
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Job Role Allocation Card */}
      <View
        style={{
          backgroundColor: THEME.cardBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: THEME.cardBorder,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🚚</Text>
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            Job Role Allocation
          </Text>
        </View>
        <Text
          style={{
            color: THEME.textMuted,
            fontSize: 12,
            marginBottom: 14,
            lineHeight: 17,
          }}
        >
          Are you working as a Light Weight Driver or Heavy Weight Driver with us?
        </Text>

        {/* Option 1: Light Weight Driver */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => updateField("jobRole", "Light Weight Driver")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor:
              formData.jobRole === "Light Weight Driver"
                ? THEME.primaryYellow
                : "#222225",
            borderRadius: 40,
            borderWidth: 1.5,
            borderColor:
              formData.jobRole === "Light Weight Driver"
                ? THEME.primaryYellow
                : "#374151",
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <FontAwesome5
            name="truck-pickup"
            size={20}
            color={
              formData.jobRole === "Light Weight Driver"
                ? "#0E0E0E"
                : "#9CA3AF"
            }
            style={{ marginRight: 14 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color:
                  formData.jobRole === "Light Weight Driver"
                    ? "#0E0E0E"
                    : "#FFFFFF",
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              Light Weight Driver
            </Text>
            <Text
              style={{
                color:
                  formData.jobRole === "Light Weight Driver"
                    ? "#27272A"
                    : THEME.textSub,
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Three Wheeler / Mahindra Bolero / Dimo Batta
            </Text>
          </View>

          {/* Checkmark Indicator */}
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor:
                formData.jobRole === "Light Weight Driver"
                  ? "#0E0E0E"
                  : "transparent",
              borderWidth: formData.jobRole === "Light Weight Driver" ? 0 : 2,
              borderColor: "#6B7280",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {formData.jobRole === "Light Weight Driver" && (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>

        {/* Option 2: Heavy Weight Driver */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => updateField("jobRole", "Heavy Weight Driver")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor:
              formData.jobRole === "Heavy Weight Driver"
                ? THEME.primaryYellow
                : "#222225",
            borderRadius: 40,
            borderWidth: 1.5,
            borderColor:
              formData.jobRole === "Heavy Weight Driver"
                ? THEME.primaryYellow
                : "#374151",
            paddingVertical: 14,
            paddingHorizontal: 16,
          }}
        >
          <FontAwesome5
            name="truck-moving"
            size={20}
            color={
              formData.jobRole === "Heavy Weight Driver"
                ? "#0E0E0E"
                : "#9CA3AF"
            }
            style={{ marginRight: 14 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color:
                  formData.jobRole === "Heavy Weight Driver"
                    ? "#0E0E0E"
                    : "#FFFFFF",
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              Heavy Weight Driver
            </Text>
            <Text
              style={{
                color:
                  formData.jobRole === "Heavy Weight Driver"
                    ? "#27272A"
                    : THEME.textSub,
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Double Cab Pickup / Isuzu Elf / Canter Lorry / Lorry
            </Text>
          </View>

          {/* Checkmark Indicator */}
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor:
                formData.jobRole === "Heavy Weight Driver"
                  ? "#0E0E0E"
                  : "transparent",
              borderWidth: formData.jobRole === "Heavy Weight Driver" ? 0 : 2,
              borderColor: "#6B7280",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {formData.jobRole === "Heavy Weight Driver" && (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. Official Driver Credentials Card */}
      <View
        style={{
          backgroundColor: THEME.cardBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: THEME.cardBorder,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>👤</Text>
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            Official Driver Credentials
          </Text>
        </View>

        {/* First Name */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          First Name (in English) *
        </Text>
        <TextInput
          value={formData.firstName}
          onChangeText={(text) => updateField("firstName", text)}
          placeholder="e.g. Kasun"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.firstName ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.firstName ? 4 : 14,
          }}
        />
        {errors.firstName && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.firstName}
          </Text>
        )}

        {/* Last Name */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Last Name (in English) *
        </Text>
        <TextInput
          value={formData.lastName}
          onChangeText={(text) => updateField("lastName", text)}
          placeholder="e.g. Perera"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.lastName ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.lastName ? 4 : 14,
          }}
        />
        {errors.lastName && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.lastName}
          </Text>
        )}

        {/* Phone Number - 1 */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600" }}>
            Phone Number - 1 *
          </Text>
          <Text style={{ color: THEME.primaryYellow, fontSize: 11, fontWeight: "600" }}>
            Primary / Call
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.phone1 ? THEME.inputBorderError : THEME.inputBorder,
            overflow: "hidden",
            marginBottom: errors.phone1 ? 4 : 14,
            height: 48,
          }}
        >
          <View
            style={{
              backgroundColor: "#2C2C30",
              paddingHorizontal: 14,
              alignItems: "center",
              justifyContent: "center",
              borderRightWidth: 1,
              borderRightColor: THEME.inputBorder,
            }}
          >
            <Text style={{ color: THEME.primaryYellow, fontWeight: "700", fontSize: 13 }}>
              +94
            </Text>
          </View>
          <TextInput
            value={formData.phone1}
            onChangeText={(text) => updateField("phone1", text.replace(/[^0-9]/g, ""))}
            placeholder="7X XXX XXXX"
            placeholderTextColor={THEME.textSub}
            keyboardType="phone-pad"
            maxLength={10}
            style={{
              flex: 1,
              backgroundColor: THEME.inputBg,
              color: THEME.textWhite,
              fontSize: 14,
              paddingHorizontal: 14,
            }}
          />
        </View>
        {errors.phone1 && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.phone1}
          </Text>
        )}

        {/* Phone Number - 2 */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600" }}>
            Phone Number - 2
          </Text>
          <Text style={{ color: THEME.textMuted, fontSize: 11 }}>Optional</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: THEME.inputBorder,
            overflow: "hidden",
            marginBottom: 14,
            height: 48,
          }}
        >
          <View
            style={{
              backgroundColor: "#2C2C30",
              paddingHorizontal: 14,
              alignItems: "center",
              justifyContent: "center",
              borderRightWidth: 1,
              borderRightColor: THEME.inputBorder,
            }}
          >
            <Text style={{ color: THEME.primaryYellow, fontWeight: "700", fontSize: 13 }}>
              +94
            </Text>
          </View>
          <TextInput
            value={formData.phone2}
            onChangeText={(text) => updateField("phone2", text.replace(/[^0-9]/g, ""))}
            placeholder="7X XXX XXXX"
            placeholderTextColor={THEME.textSub}
            keyboardType="phone-pad"
            maxLength={10}
            style={{
              flex: 1,
              backgroundColor: THEME.inputBg,
              color: THEME.textWhite,
              fontSize: 14,
              paddingHorizontal: 14,
            }}
          />
        </View>

        {/* National Identity Card (NIC) */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          National Identity Card (NIC) *
        </Text>
        <TextInput
          value={formData.nic}
          onChangeText={(text) => updateField("nic", text.toUpperCase())}
          placeholder="e.g. 123456789V / 123456789012"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.nic ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.nic ? 4 : 14,
          }}
        />
        {errors.nic && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.nic}
          </Text>
        )}

        {/* Email Address */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Email Address
        </Text>
        <TextInput
          value={formData.email}
          onChangeText={(text) => updateField("email", text)}
          placeholder="e.g. yourname@gmail.com"
          placeholderTextColor={THEME.textSub}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
          }}
        />
      </View>
    </View>
  );
};
