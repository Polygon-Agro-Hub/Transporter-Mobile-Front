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
  const VEHICLE_TYPES = [
    { id: "Three Wheeler", label: "Three Wheeler", capacity: "500 kg" },
    { id: "Mahindra Bolero", label: "Mahindra Bolero", capacity: "1,200 kg" },
    { id: "Dimo Batta", label: "Dimo Batta", capacity: "850 kg" },
  ];

  const handleSelectVehicleType = (type: { id: string; label: string; capacity: string }) => {
    updateField("vehicleType", type.id);
    updateField("vehicleCapacity", type.capacity);
  };

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* 1. Vehicle Registration Card */}
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
          <Ionicons name="bus-sharp" size={18} color={THEME.primaryYellow} style={{ marginRight: 8 }} />
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Vehicle Registration
          </Text>
        </View>

        {/* Vehicle Registration Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Vehicle Registration Number *
        </Text>
        <TextInput
          value={formData.vehicleNumber}
          onChangeText={(text) => updateField("vehicleNumber", text.toUpperCase())}
          placeholder="e.g. WP CAA-4589"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.vehicleNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.vehicleNumber ? 4 : 14,
          }}
        />
        {errors.vehicleNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.vehicleNumber}
          </Text>
        )}

        {/* Confirm Vehicle Registration Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Confirm Vehicle Registration Number *
        </Text>
        <TextInput
          value={formData.confirmVehicleNumber}
          onChangeText={(text) => updateField("confirmVehicleNumber", text.toUpperCase())}
          placeholder="Confirm Registration Number"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.confirmVehicleNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.confirmVehicleNumber ? 4 : 14,
          }}
        />
        {errors.confirmVehicleNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.confirmVehicleNumber}
          </Text>
        )}

        {/* Vehicle Type header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600" }}>
            Vehicle Type *
          </Text>
          <Text style={{ color: THEME.textSub, fontSize: 11 }}>
            Select Type
          </Text>
        </View>

        {/* Vehicle Type Selection Options */}
        {VEHICLE_TYPES.map((type) => {
          const isSelected = formData.vehicleType === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              activeOpacity={0.85}
              onPress={() => handleSelectVehicleType(type)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isSelected ? THEME.primaryYellow : "#222225",
                borderRadius: 25,
                borderWidth: 1.5,
                borderColor: isSelected ? THEME.primaryYellow : "#374151",
                paddingVertical: 13,
                paddingHorizontal: 18,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: isSelected ? "#0E0E0E" : "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {type.label}
              </Text>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: isSelected ? "#0E0E0E" : "transparent",
                  borderWidth: isSelected ? 0 : 2,
                  borderColor: "#6B7280",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Vehicle Capacity (kg) */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginTop: 4, marginBottom: 6 }}>
          Vehicle Capacity (kg)
        </Text>
        <TextInput
          value={formData.vehicleCapacity || "Auto-Fill"}
          editable={false}
          placeholder="Auto-Fill"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
          }}
        />
      </View>

      {/* 2. Exterior Inspection Photos Card */}
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
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="car-sharp" size={18} color={THEME.primaryYellow} style={{ marginRight: 8 }} />
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Exterior Inspection Photos
          </Text>
        </View>

        {/* Info Banner */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            backgroundColor: "#1D1C17",
            borderRadius: 10,
            padding: 10,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: "#332B13",
          }}
        >
          <Ionicons name="bulb-outline" size={16} color={THEME.primaryYellow} style={{ marginRight: 8, marginTop: 2 }} />
          <Text
            style={{
              color: THEME.textMuted,
              fontSize: 11,
              lineHeight: 16,
              flex: 1,
            }}
          >
            Ensure images are well-lit, all angles clearly visible, and license plate is readable. Avoid dark garages or severe glare.
          </Text>
        </View>

        {/* Box 1: Front Image */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openImagePicker("vehicleFrontPhoto")}
          style={{
            backgroundColor: "#161619",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: errors.vehicleFrontPhoto ? THEME.inputBorderError : "#2D2D32",
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: errors.vehicleFrontPhoto ? 4 : 12,
            overflow: "hidden",
          }}
        >
          {formData.vehicleFrontPhoto ? (
            <View style={{ width: "100%", height: 110, position: "relative" }}>
              <Image
                source={{ uri: formData.vehicleFrontPhoto }}
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
                Vehicle's Front Image
              </Text>
              <Text style={{ color: THEME.textSub, fontSize: 11 }}>
                .jpg / .jpeg / .png / .heic
              </Text>
            </>
          )}
        </TouchableOpacity>
        {errors.vehicleFrontPhoto && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 12 }}>
            {errors.vehicleFrontPhoto}
          </Text>
        )}

        {/* Box 2: Back Image */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openImagePicker("vehicleBackPhoto")}
          style={{
            backgroundColor: "#161619",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: errors.vehicleBackPhoto ? THEME.inputBorderError : "#2D2D32",
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: errors.vehicleBackPhoto ? 4 : 12,
            overflow: "hidden",
          }}
        >
          {formData.vehicleBackPhoto ? (
            <View style={{ width: "100%", height: 110, position: "relative" }}>
              <Image
                source={{ uri: formData.vehicleBackPhoto }}
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
                Vehicle's Back Image
              </Text>
              <Text style={{ color: THEME.textSub, fontSize: 11 }}>
                .jpg / .jpeg / .png / .heic
              </Text>
            </>
          )}
        </TouchableOpacity>
        {errors.vehicleBackPhoto && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 12 }}>
            {errors.vehicleBackPhoto}
          </Text>
        )}

        {/* Box 3: Side 1 Image (Left) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openImagePicker("vehicleLeftSidePhoto")}
          style={{
            backgroundColor: "#161619",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: errors.vehicleLeftSidePhoto ? THEME.inputBorderError : "#2D2D32",
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: errors.vehicleLeftSidePhoto ? 4 : 12,
            overflow: "hidden",
          }}
        >
          {formData.vehicleLeftSidePhoto ? (
            <View style={{ width: "100%", height: 110, position: "relative" }}>
              <Image
                source={{ uri: formData.vehicleLeftSidePhoto }}
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
                <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>Change Left Side</Text>
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
                Vehicle's Side 1 Image (Left)
              </Text>
              <Text style={{ color: THEME.textSub, fontSize: 11 }}>
                .jpg / .jpeg / .png / .heic
              </Text>
            </>
          )}
        </TouchableOpacity>
        {errors.vehicleLeftSidePhoto && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 12 }}>
            {errors.vehicleLeftSidePhoto}
          </Text>
        )}

        {/* Box 4: Side 1 Image (Right) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openImagePicker("vehicleRightSidePhoto")}
          style={{
            backgroundColor: "#161619",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: errors.vehicleRightSidePhoto ? THEME.inputBorderError : "#2D2D32",
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {formData.vehicleRightSidePhoto ? (
            <View style={{ width: "100%", height: 110, position: "relative" }}>
              <Image
                source={{ uri: formData.vehicleRightSidePhoto }}
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
                <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>Change Right Side</Text>
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
                Vehicle's Side 1 Image (Right)
              </Text>
              <Text style={{ color: THEME.textSub, fontSize: 11 }}>
                .jpg / .jpeg / .png / .heic
              </Text>
            </>
          )}
        </TouchableOpacity>
        {errors.vehicleRightSidePhoto && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginTop: 4 }}>
            {errors.vehicleRightSidePhoto}
          </Text>
        )}
      </View>

      {/* 3. Declaration & Legal Consent Card */}
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
          <Ionicons name="scale-sharp" size={18} color={THEME.primaryYellow} style={{ marginRight: 8 }} />
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Declaration & Legal Consent
          </Text>
        </View>

        {/* Checkbox */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => updateField("agreeDeclaration", !formData.agreeDeclaration)}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              backgroundColor: formData.agreeDeclaration ? THEME.primaryYellow : "transparent",
              borderWidth: formData.agreeDeclaration ? 0 : 2,
              borderColor: errors.agreeDeclaration ? THEME.inputBorderError : "#6B7280",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
              marginTop: 2,
            }}
          >
            {formData.agreeDeclaration && (
              <Ionicons name="checkmark" size={16} color="#0E0E0E" />
            )}
          </View>
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 12,
              lineHeight: 18,
              flex: 1,
            }}
          >
            I confirm that all provided personal information, driving credentials, and vehicle documents are authentic and up-to-date.
          </Text>
        </TouchableOpacity>
        {errors.agreeDeclaration && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.agreeDeclaration}
          </Text>
        )}

        {/* Review Process Notice */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            backgroundColor: "#161619",
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: "#26262B",
          }}
        >
          <Ionicons name="time-outline" size={18} color={THEME.primaryYellow} style={{ marginRight: 10, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: THEME.textWhite, fontSize: 12, fontWeight: "700", marginBottom: 2 }}>
              Review Process
            </Text>
            <Text style={{ color: THEME.textMuted, fontSize: 11, lineHeight: 16 }}>
              Verification typically takes <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>24–48 hours</Text>. You will receive an SMS notification once your account has been approved or rejected.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
