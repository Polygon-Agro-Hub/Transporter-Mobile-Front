import React from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StepProps, THEME } from "./types";

export const Step3LicenseInsurance: React.FC<StepProps> = ({
  formData,
  errors,
  updateField,
  toggleArrayItem,
  openImagePicker,
}) => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* 1. Driving License Information Card */}
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
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🪪</Text>
          <Text style={{ color: THEME.textWhite, fontSize: 14, fontWeight: "700" }}>
            Driving License Information
          </Text>
        </View>

        {/* License Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Driving License Number *
        </Text>
        <TextInput
          value={formData.licenseNumber}
          onChangeText={(text) => updateField("licenseNumber", text.toUpperCase())}
          placeholder="e.g. B1234567"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.licenseNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.licenseNumber ? 4 : 14,
          }}
        />
        {errors.licenseNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.licenseNumber}
          </Text>
        )}

        {/* License Expiry Date */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          License Expiry Date
        </Text>
        <TextInput
          value={formData.licenseExpiry}
          onChangeText={(text) => updateField("licenseExpiry", text)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: 14,
          }}
        />

        {/* Allowed Categories Chips */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
          Endorsed License Categories
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {[
            "Motorcycle (A)",
            "Light Vehicles (B/B1)",
            "Commercial (C/C1)",
            "Heavy Lorries (CE)",
          ].map((cat) => {
            const isSelected = formData.licenseCategories.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => toggleArrayItem?.("licenseCategories", cat)}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  backgroundColor: isSelected ? THEME.primaryYellow : "#27272A",
                }}
              >
                <Text
                  style={{
                    color: isSelected ? "#0E0E0E" : "#D1D5DB",
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {isSelected ? `✓ ${cat}` : `+ ${cat}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* License Front & Back Photo Upload Cards */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* License Front */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#E5E7EB", fontSize: 11, fontWeight: "600", marginBottom: 6 }}>
              License Front Photo *
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openImagePicker("licenseFrontPhoto")}
              style={{
                height: 100,
                backgroundColor: THEME.inputBg,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: THEME.inputBorder,
                borderStyle: "dashed",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {formData.licenseFrontPhoto ? (
                <Image
                  source={{ uri: formData.licenseFrontPhoto }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={24} color={THEME.primaryYellow} />
                  <Text style={{ color: THEME.textSub, fontSize: 11, marginTop: 4 }}>
                    Upload Front
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* License Back */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#E5E7EB", fontSize: 11, fontWeight: "600", marginBottom: 6 }}>
              License Back Photo
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openImagePicker("licenseBackPhoto")}
              style={{
                height: 100,
                backgroundColor: THEME.inputBg,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: THEME.inputBorder,
                borderStyle: "dashed",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {formData.licenseBackPhoto ? (
                <Image
                  source={{ uri: formData.licenseBackPhoto }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={24} color={THEME.primaryYellow} />
                  <Text style={{ color: THEME.textSub, fontSize: 11, marginTop: 4 }}>
                    Upload Back
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. Insurance Information Card */}
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
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🛡️</Text>
          <Text style={{ color: THEME.textWhite, fontSize: 14, fontWeight: "700" }}>
            Insurance Information
          </Text>
        </View>

        {/* Insurance Provider */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Insurance Company / Provider Name *
        </Text>
        <TextInput
          value={formData.insuranceProvider}
          onChangeText={(text) => updateField("insuranceProvider", text)}
          placeholder="e.g. Sri Lanka Insurance / Ceylinco / Allianz"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.insuranceProvider ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.insuranceProvider ? 4 : 14,
          }}
        />
        {errors.insuranceProvider && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.insuranceProvider}
          </Text>
        )}

        {/* Insurance Policy Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Insurance Policy Number *
        </Text>
        <TextInput
          value={formData.insurancePolicyNumber}
          onChangeText={(text) => updateField("insurancePolicyNumber", text.toUpperCase())}
          placeholder="e.g. POL-12345678"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.insurancePolicyNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.insurancePolicyNumber ? 4 : 14,
          }}
        />
        {errors.insurancePolicyNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.insurancePolicyNumber}
          </Text>
        )}

        {/* Coverage Type */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
          Coverage Type
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {["Comprehensive", "Third Party"].map((cov) => {
            const isSelected = formData.insuranceCoverageType === cov;
            return (
              <TouchableOpacity
                key={cov}
                onPress={() => updateField("insuranceCoverageType", cov)}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: isSelected ? THEME.primaryYellow : "#27272A",
                }}
              >
                <Text
                  style={{
                    color: isSelected ? "#0E0E0E" : "#D1D5DB",
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {cov}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Policy Expiry Date */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Policy Expiry Date
        </Text>
        <TextInput
          value={formData.insuranceExpiry}
          onChangeText={(text) => updateField("insuranceExpiry", text)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: 14,
          }}
        />

        {/* Insurance Card / Certificate Photo Upload */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Insurance Certificate / Card Photo
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openImagePicker("insuranceCardPhoto")}
          style={{
            height: 100,
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: THEME.inputBorder,
            borderStyle: "dashed",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {formData.insuranceCardPhoto ? (
            <Image
              source={{ uri: formData.insuranceCardPhoto }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <>
              <Ionicons name="document-attach-outline" size={26} color={THEME.primaryYellow} />
              <Text style={{ color: THEME.textSub, fontSize: 12, marginTop: 4 }}>
                Tap to upload Insurance Certificate
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
