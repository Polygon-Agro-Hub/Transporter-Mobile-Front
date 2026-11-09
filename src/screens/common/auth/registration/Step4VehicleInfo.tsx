import React from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StepProps, THEME } from "./types";

export const Step4VehicleInfo: React.FC<StepProps> = ({
  formData,
  errors,
  updateField,
  openImagePicker,
}) => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* 1. Vehicle Details Card */}
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
          <Text style={{ fontSize: 16, marginRight: 6 }}>🚛</Text>
          <Text style={{ color: THEME.textWhite, fontSize: 14, fontWeight: "700" }}>
            Registered Vehicle Information
          </Text>
        </View>

        {/* Vehicle Registration Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Vehicle Registration Number *
        </Text>
        <TextInput
          value={formData.vehicleNumber}
          onChangeText={(text) => updateField("vehicleNumber", text.toUpperCase())}
          placeholder="e.g. WP CAB-5678 / CP LK-1234"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.vehicleNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.vehicleNumber ? 4 : 14,
          }}
        />
        {errors.vehicleNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.vehicleNumber}
          </Text>
        )}

        {/* Vehicle Make & Model */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Vehicle Make & Model *
        </Text>
        <TextInput
          value={formData.vehicleModel}
          onChangeText={(text) => updateField("vehicleModel", text)}
          placeholder="e.g. Mahindra Bolero / Dimo Batta / Isuzu"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.vehicleModel ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.vehicleModel ? 4 : 14,
          }}
        />
        {errors.vehicleModel && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.vehicleModel}
          </Text>
        )}

        {/* Fuel Type */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
          Fuel Type
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {["Diesel", "Petrol", "Electric"].map((fuel) => {
            const isSelected = formData.fuelType === fuel;
            return (
              <TouchableOpacity
                key={fuel}
                onPress={() => updateField("fuelType", fuel)}
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
                  {fuel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ownership Type */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
          Ownership Type
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {["Owned", "Leased / Financed", "Rented / Company"].map((type) => {
            const isSelected = formData.ownershipType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => updateField("ownershipType", type)}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 14,
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
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Revenue License Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Revenue License Number
        </Text>
        <TextInput
          value={formData.revenueLicenseNumber}
          onChangeText={(text) => updateField("revenueLicenseNumber", text.toUpperCase())}
          placeholder="e.g. RL-987654"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
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

        {/* Revenue License Expiry */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Revenue License Expiry Date
        </Text>
        <TextInput
          value={formData.revenueExpiry}
          onChangeText={(text) => updateField("revenueExpiry", text)}
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

        {/* Revenue Photo & Vehicle Photo Uploads */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* Revenue Photo */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#E5E7EB", fontSize: 11, fontWeight: "600", marginBottom: 6 }}>
              Revenue License Photo
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openImagePicker("revenuePhoto")}
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
              {formData.revenuePhoto ? (
                <Image
                  source={{ uri: formData.revenuePhoto }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={24} color={THEME.primaryYellow} />
                  <Text style={{ color: THEME.textSub, fontSize: 11, marginTop: 4 }}>
                    Upload Revenue
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Vehicle Photo */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#E5E7EB", fontSize: 11, fontWeight: "600", marginBottom: 6 }}>
              Vehicle Photo
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openImagePicker("vehiclePhoto")}
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
              {formData.vehiclePhoto ? (
                <Image
                  source={{ uri: formData.vehiclePhoto }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Ionicons name="car-outline" size={24} color={THEME.primaryYellow} />
                  <Text style={{ color: THEME.textSub, fontSize: 11, marginTop: 4 }}>
                    Upload Vehicle
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. Declarations & Agreements Card */}
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
        <Text style={{ color: THEME.textWhite, fontSize: 14, fontWeight: "700", marginBottom: 12 }}>
          Declarations & Agreement
        </Text>

        {/* Agreement 1 */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => updateField("agreeTerms", !formData.agreeTerms)}
          style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: formData.agreeTerms ? THEME.primaryYellow : "#27272A",
              borderWidth: 1,
              borderColor: formData.agreeTerms ? THEME.primaryYellow : "#4B5563",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
              marginTop: 2,
            }}
          >
            {formData.agreeTerms && <Ionicons name="checkmark" size={14} color="#0E0E0E" />}
          </View>
          <Text style={{ flex: 1, color: "#D1D5DB", fontSize: 12, lineHeight: 18 }}>
            I agree to the Govi Transport Driver Partner Terms of Service and Privacy Policy.
          </Text>
        </TouchableOpacity>

        {/* Agreement 2 */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => updateField("agreeDeclaration", !formData.agreeDeclaration)}
          style={{ flexDirection: "row", alignItems: "flex-start" }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: formData.agreeDeclaration ? THEME.primaryYellow : "#27272A",
              borderWidth: 1,
              borderColor: formData.agreeDeclaration ? THEME.primaryYellow : "#4B5563",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
              marginTop: 2,
            }}
          >
            {formData.agreeDeclaration && <Ionicons name="checkmark" size={14} color="#0E0E0E" />}
          </View>
          <Text style={{ flex: 1, color: "#D1D5DB", fontSize: 12, lineHeight: 18 }}>
            I confirm that all vehicle, license, and personal details provided are genuine, authentic, and accurate.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
