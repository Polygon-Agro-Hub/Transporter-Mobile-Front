import React from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StepProps, THEME } from "./types";

export const Step3LicenseInsurance: React.FC<StepProps> = ({
  formData,
  errors,
  updateField,
  openImagePicker,
}) => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* 1. Driving License Details Card */}
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
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Ionicons name="card-sharp" size={18} color={THEME.primaryYellow} style={{ marginRight: 8 }} />
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Driving License Details
          </Text>
        </View>

        {/* Driving License ID */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Driving License ID *
        </Text>
        <TextInput
          value={formData.licenseNumber}
          onChangeText={(text) => updateField("licenseNumber", text.toUpperCase())}
          placeholder="e.g. B8849201"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.licenseNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.licenseNumber ? 4 : 14,
          }}
        />
        {errors.licenseNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.licenseNumber}
          </Text>
        )}

        {/* Confirm Driving License ID */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Confirm Driving License ID *
        </Text>
        <TextInput
          value={formData.confirmLicenseNumber}
          onChangeText={(text) => updateField("confirmLicenseNumber", text.toUpperCase())}
          placeholder="Re-enter license ID"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.confirmLicenseNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.confirmLicenseNumber ? 4 : 14,
          }}
        />
        {errors.confirmLicenseNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.confirmLicenseNumber}
          </Text>
        )}

        {/* License Documents Header */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
          License Documents *
        </Text>

        {/* License Front Image Upload Box */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openImagePicker("licenseFrontPhoto")}
          style={{
            backgroundColor: "#161619",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: errors.licenseFrontPhoto ? THEME.inputBorderError : "#2D2D32",
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: errors.licenseFrontPhoto ? 4 : 12,
            overflow: "hidden",
          }}
        >
          {formData.licenseFrontPhoto ? (
            <View style={{ width: "100%", height: 110, position: "relative" }}>
              <Image
                source={{ uri: formData.licenseFrontPhoto }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 8,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons name="checkmark-circle" size={14} color={THEME.primaryYellow} style={{ marginRight: 4 }} />
                <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>Change Front</Text>
              </View>
            </View>
          ) : (
            <>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: "#2E2A18",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Ionicons name="camera" size={20} color={THEME.primaryYellow} />
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", marginBottom: 2 }}>
                Upload Front Image
              </Text>
              <Text style={{ color: THEME.textSub, fontSize: 11 }}>
                .jpg / .jpeg / .png / .heic
              </Text>
            </>
          )}
        </TouchableOpacity>
        {errors.licenseFrontPhoto && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 12 }}>
            {errors.licenseFrontPhoto}
          </Text>
        )}

        {/* License Back Image Upload Box */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openImagePicker("licenseBackPhoto")}
          style={{
            backgroundColor: "#161619",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: errors.licenseBackPhoto ? THEME.inputBorderError : "#2D2D32",
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {formData.licenseBackPhoto ? (
            <View style={{ width: "100%", height: 110, position: "relative" }}>
              <Image
                source={{ uri: formData.licenseBackPhoto }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 8,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons name="checkmark-circle" size={14} color={THEME.primaryYellow} style={{ marginRight: 4 }} />
                <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>Change Back</Text>
              </View>
            </View>
          ) : (
            <>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: "#2E2A18",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Ionicons name="camera" size={20} color={THEME.primaryYellow} />
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", marginBottom: 2 }}>
                Upload Back Image
              </Text>
              <Text style={{ color: THEME.textSub, fontSize: 11 }}>
                .jpg / .jpeg / .png / .heic
              </Text>
            </>
          )}
        </TouchableOpacity>
        {errors.licenseBackPhoto && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginTop: 4 }}>
            {errors.licenseBackPhoto}
          </Text>
        )}
      </View>

      {/* 2. Vehicle Insurance Details Card */}
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
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Ionicons name="shield-checkmark-sharp" size={18} color={THEME.primaryYellow} style={{ marginRight: 8 }} />
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Vehicle Insurance Details
          </Text>
        </View>

        {/* Insurance Policy Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Insurance Policy Number *
        </Text>
        <TextInput
          value={formData.insurancePolicyNumber}
          onChangeText={(text) => updateField("insurancePolicyNumber", text.toUpperCase())}
          placeholder="e.g. POL-9948201-A"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.insurancePolicyNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.insurancePolicyNumber ? 4 : 14,
          }}
        />
        {errors.insurancePolicyNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.insurancePolicyNumber}
          </Text>
        )}

        {/* Confirm Insurance Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Confirm Insurance Number *
        </Text>
        <TextInput
          value={formData.confirmInsurancePolicyNumber}
          onChangeText={(text) => updateField("confirmInsurancePolicyNumber", text.toUpperCase())}
          placeholder="Please Re-enter Account Number"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.confirmInsurancePolicyNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.confirmInsurancePolicyNumber ? 4 : 14,
          }}
        />
        {errors.confirmInsurancePolicyNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.confirmInsurancePolicyNumber}
          </Text>
        )}

        {/* Insurance Expiry Date */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Insurance Expiry Date *
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.insuranceExpiry ? THEME.inputBorderError : THEME.inputBorder,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.insuranceExpiry ? 4 : 14,
          }}
        >
          <TextInput
            value={formData.insuranceExpiry}
            onChangeText={(text) => updateField("insuranceExpiry", text)}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={THEME.textSub}
            maxLength={10}
            style={{
              flex: 1,
              color: THEME.textWhite,
              fontSize: 14,
            }}
          />
          <Ionicons name="calendar" size={18} color={THEME.primaryYellow} />
        </View>
        {errors.insuranceExpiry && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.insuranceExpiry}
          </Text>
        )}

        {/* Insurance Certificate Photos Header */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
          Insurance Certificate Photos *
        </Text>

        {/* Insurance Certificate Front Box */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openImagePicker("insuranceFrontPhoto")}
          style={{
            backgroundColor: "#161619",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: errors.insuranceFrontPhoto ? THEME.inputBorderError : "#2D2D32",
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: errors.insuranceFrontPhoto ? 4 : 12,
            overflow: "hidden",
          }}
        >
          {formData.insuranceFrontPhoto ? (
            <View style={{ width: "100%", height: 110, position: "relative" }}>
              <Image
                source={{ uri: formData.insuranceFrontPhoto }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 8,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons name="checkmark-circle" size={14} color={THEME.primaryYellow} style={{ marginRight: 4 }} />
                <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>Change Certificate</Text>
              </View>
            </View>
          ) : (
            <>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: "#2E2A18",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Ionicons name="camera" size={20} color={THEME.primaryYellow} />
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", marginBottom: 2 }}>
                Insurance Certificate Front
              </Text>
              <Text style={{ color: THEME.textSub, fontSize: 11 }}>
                .jpg / .jpeg / .png / .heic
              </Text>
            </>
          )}
        </TouchableOpacity>
        {errors.insuranceFrontPhoto && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 12 }}>
            {errors.insuranceFrontPhoto}
          </Text>
        )}

        {/* Insurance Certificate Back Box */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openImagePicker("insuranceBackPhoto")}
          style={{
            backgroundColor: "#161619",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: errors.insuranceBackPhoto ? THEME.inputBorderError : "#2D2D32",
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {formData.insuranceBackPhoto ? (
            <View style={{ width: "100%", height: 110, position: "relative" }}>
              <Image
                source={{ uri: formData.insuranceBackPhoto }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 8,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons name="checkmark-circle" size={14} color={THEME.primaryYellow} style={{ marginRight: 4 }} />
                <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>Change Certificate</Text>
              </View>
            </View>
          ) : (
            <>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: "#2E2A18",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Ionicons name="camera" size={20} color={THEME.primaryYellow} />
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", marginBottom: 2 }}>
                Insurance Certificate Back
              </Text>
              <Text style={{ color: THEME.textSub, fontSize: 11 }}>
                .jpg / .jpeg / .png / .heic
              </Text>
            </>
          )}
        </TouchableOpacity>
        {errors.insuranceBackPhoto && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginTop: 4 }}>
            {errors.insuranceBackPhoto}
          </Text>
        )}
      </View>
    </View>
  );
};
