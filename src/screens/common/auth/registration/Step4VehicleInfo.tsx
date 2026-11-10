import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StepProps, THEME, VehicleTypeItem } from "./types";
import environment from "@/environment/environment";

/* ---------- Vehicle types (loaded from backend) ---------- */

export type VehicleType = VehicleTypeItem;

export const FALLBACK_VEHICLE_TYPES: VehicleType[] = [
  { name: "Three Wheeler", capacity: 100, category: "Light Weight Driver" },
  { name: "Mahindra Bollero", capacity: 272, category: "Light Weight Driver" },
  { name: "Dimo Batta", capacity: 750, category: "Light Weight Driver" },
  { name: "Double Cab Pickup (4x4)", capacity: 900, category: "Heavy Weight Driver" },
  { name: "Isuzu Elf / Canter Lorry", capacity: 3000, category: "Heavy Weight Driver" },
  { name: "Lorry (6-8 Ton)", capacity: 7500, category: "Heavy Weight Driver" },
];

const BASE_API_URL = (process.env.EXPO_PUBLIC_API_URL || environment.API_BASE_URL || "").replace(/\/+$/, "");
const VEHICLE_TYPES_ENDPOINT = `${BASE_API_URL}/api/vehicle-types`;

const useVehicleTypes = () => {
  const [types, setTypes] = useState<VehicleType[]>(FALLBACK_VEHICLE_TYPES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(VEHICLE_TYPES_ENDPOINT);
      if (!res.ok) throw new Error("Request failed with status " + res.status);
      const json = await res.json();
      const rawList = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      if (rawList.length > 0) {
        const normalized: VehicleType[] = rawList.map((item: any) => ({
          name: item.name || item.label || item.id || "",
          capacity:
            typeof item.capacity === "number"
              ? item.capacity
              : parseInt(String(item.capacity).replace(/[^0-9]/g, ""), 10) || 0,
          category: item.category || "Light Weight Driver",
        }));
        setTypes(normalized);
      }
    } catch (err) {
      console.warn("Could not fetch vehicle types from API, using default list:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { types, loading, error, reload: load };
};

/* ---------- File helpers ---------- */

const getFileName = (uri: string): string => {
  try {
    const last = uri.split("?")[0].split("/").pop() || "image.jpg";
    return decodeURIComponent(last);
  } catch {
    return "image.jpg";
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const useFileSize = (uri?: string | null): string => {
  const [size, setSize] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!uri) {
      setSize("");
      return;
    }
    (async () => {
      try {
        const res = await fetch(uri);
        const blob = await res.blob();
        if (!cancelled) setSize(formatBytes(blob.size));
      } catch {
        if (!cancelled) setSize("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return size;
};

/* ---------- Label with yellow asterisk ---------- */

const FormLabel: React.FC<{ label: string; required?: boolean; style?: TextStyle }> = ({
  label,
  required,
  style,
}) => (
  <Text
    style={[
      {
        color: "#E5E7EB",
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "600",
        marginBottom: 6,
      },
      style,
    ]}
  >
    {label}
    {required && (
      <Text style={{ color: THEME.requiredAsterisk, fontSize: 14, lineHeight: 18, fontWeight: "600" }}>
        {" *"}
      </Text>
    )}
  </Text>
);

/* ---------- Shared styles ---------- */

const inputStyle = (hasError: boolean, extra: object = {}) => ({
  backgroundColor: THEME.inputBg,
  borderRadius: 25,
  borderWidth: 1,
  borderColor: hasError ? THEME.inputBorderError : THEME.inputBorder,
  color: THEME.textWhite,
  fontSize: 14,
  height: 48,
  paddingHorizontal: 16,
  ...extra,
});

const cardStyle = {
  backgroundColor: THEME.cardBg,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: THEME.cardBorder,
  padding: 16,
  marginBottom: 16,
};

/* ---------- Small reusable pieces ---------- */

const ErrorText: React.FC<{ message?: string; spaced?: boolean }> = ({ message, spaced = true }) =>
  message ? (
    <Text
      style={{
        color: THEME.inputBorderError,
        fontSize: 11,
        ...(spaced ? { marginBottom: 10 } : { marginTop: 4 }),
      }}
    >
      {message}
    </Text>
  ) : null;

const CardHeader: React.FC<{ icon: any; title: string; marginBottom?: number }> = ({
  icon,
  title,
  marginBottom = 16,
}) => (
  <View style={{ flexDirection: "row", alignItems: "center", marginBottom }}>
    <FontAwesome name={icon} size={18} color={THEME.primaryYellow} style={{ marginRight: 8 }} />
    <Text style={{ color: THEME.textWhite, fontSize: 15, fontWeight: "700" }}>{title}</Text>
  </View>
);

const UploadBox: React.FC<{
  uri?: string | null;
  title: string;
  changeLabel: string;
  error?: string;
  last?: boolean;
  onPress: () => void;
}> = ({ uri, title, error, last = false, onPress }) => {
  const fileSize = useFileSize(uri);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{
          backgroundColor: uri ? "#1A1A1D" : "#161619",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: error ? THEME.inputBorderError : uri ? THEME.primaryYellow : "#2D2D32",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          ...(uri ? { padding: 8 } : { paddingVertical: 18 }),
          ...(last ? {} : { marginBottom: error ? 4 : 12 }),
        }}
      >
        {uri ? (
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#0F0F11",
              borderRadius: 10,
              padding: 8,
            }}
          >
            <Image
              source={{ uri }}
              style={{ width: 66, height: 48, borderRadius: 6, backgroundColor: "#2D2D32" }}
              resizeMode="cover"
            />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text
                numberOfLines={1}
                ellipsizeMode="middle"
                style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", marginBottom: 2 }}
              >
                {getFileName(uri)}
              </Text>
              {!!fileSize && <Text style={{ color: "#9CA3AF", fontSize: 11 }}>{fileSize}</Text>}
            </View>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: "#1F1F23",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons name="rotate-left" size={18} color={THEME.primaryYellow} />
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
              {title}
            </Text>
            <Text style={{ color: THEME.textSub, fontSize: 11 }}>.jpg / .jpeg / .png / .heic</Text>
          </>
        )}
      </TouchableOpacity>
      <ErrorText message={error} spaced={!last} />
    </>
  );
};

/* ---------- Main component ---------- */

export const Step4VehicleInfo: React.FC<StepProps> = ({
  formData,
  errors,
  updateField,
  openImagePicker,
}) => {
  const { types: vehicleTypes, loading: typesLoading, error: typesError, reload } = useVehicleTypes();

  // Role chosen in Step 1 ("Light Weight Driver" or "Heavy Weight Driver")
  const jobRole = formData.jobRole || "Light Weight Driver";

  // Only show vehicles that belong to the selected role
  const displayedVehicles = vehicleTypes.filter(
    (v) => (v.category || "").toLowerCase() === jobRole.toLowerCase()
  );

  const handleSelectVehicleType = (type: VehicleType) => {
    updateField("vehicleType", type.name);
    updateField("vehicleCapacity", `${type.capacity} kg`);
  };

  // If the saved vehicle doesn't belong to the current role (e.g. the user went
  // back and changed role in Step 1), clear it so they pick a valid one.
  useEffect(() => {
    if (typesLoading || !formData.vehicleType) return;
    const belongsToRole = displayedVehicles.some((v) => v.name === formData.vehicleType);
    if (!belongsToRole) {
      updateField("vehicleType", "");
      updateField("vehicleCapacity", "");
    }
  }, [jobRole, vehicleTypes, typesLoading]);

  // If vehicleType matches a displayed vehicle, ensure capacity is auto-filled
  useEffect(() => {
    const matched = displayedVehicles.find((v) => v.name === formData.vehicleType);
    if (matched && (!formData.vehicleCapacity || formData.vehicleCapacity === "Auto-Fill")) {
      updateField("vehicleCapacity", `${matched.capacity} kg`);
    }
  }, [formData.vehicleType, vehicleTypes, jobRole]);

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* 1. Vehicle Registration Card */}
      <View style={cardStyle}>
        <CardHeader icon="truck" title="Vehicle Registration" />

        <FormLabel label="Vehicle Registration Number" required />
        <TextInput
          value={formData.vehicleNumber}
          onChangeText={(text) => updateField("vehicleNumber", text.toUpperCase())}
          placeholder="e.g. WP CAA-4589"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={inputStyle(!!errors.vehicleNumber, {
            marginBottom: errors.vehicleNumber ? 4 : 14,
          })}
        />
        <ErrorText message={errors.vehicleNumber} />

        <FormLabel label="Confirm Vehicle Registration Number" required />
        <TextInput
          value={formData.confirmVehicleNumber}
          onChangeText={(text) => updateField("confirmVehicleNumber", text.toUpperCase())}
          placeholder="Confirm Registration Number"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          style={inputStyle(!!errors.confirmVehicleNumber, {
            marginBottom: errors.confirmVehicleNumber ? 4 : 14,
          })}
        />
        <ErrorText message={errors.confirmVehicleNumber} />

        {/* Vehicle Type header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <FormLabel label="Vehicle Type" required style={{ marginBottom: 0 }} />
          <Text style={{ color: THEME.textYellow, fontSize: 11 }}>Select Type</Text>
        </View>

        {/* Vehicle Type Selection Options (only for the selected role) */}
        {typesLoading && (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <ActivityIndicator color={THEME.primaryYellow} />
          </View>
        )}

        {!typesLoading && typesError && (
          <View style={{ alignItems: "center", paddingVertical: 14 }}>
            <Text style={{ color: THEME.inputBorderError, fontSize: 12, marginBottom: 10 }}>
              Couldn't load latest vehicle types.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={reload}
              style={{
                borderWidth: 1,
                borderColor: THEME.primaryYellow,
                borderRadius: 20,
                paddingHorizontal: 18,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: THEME.primaryYellow, fontSize: 12, fontWeight: "700" }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!typesLoading && displayedVehicles.length === 0 && (
          <Text style={{ color: THEME.textSub, fontSize: 12, paddingVertical: 10 }}>
            No vehicle types available for this role.
          </Text>
        )}

        {!typesLoading &&
          displayedVehicles.map((type) => {
            const isSelected = formData.vehicleType === type.name;
            return (
              <TouchableOpacity
                key={type.name}
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
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      color: isSelected ? "#0E0E0E" : "#FFFFFF",
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    {type.name}
                  </Text>
                  <Text
                    style={{
                      color: isSelected ? "#27272A" : THEME.textSub,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    Capacity: {type.capacity} kg
                  </Text>
                </View>

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
        <ErrorText message={errors.vehicleType} />

        {/* Vehicle Capacity (kg) */}
        <FormLabel label="Vehicle Capacity (kg)" style={{ marginTop: 4 }} />
        <TextInput
          value={formData.vehicleCapacity || "Auto-Fill"}
          editable={false}
          placeholder="Auto-Fill"
          placeholderTextColor={THEME.textSub}
          style={inputStyle(false)}
        />
      </View>

      {/* 2. Exterior Inspection Photos Card */}
      <View style={cardStyle}>
        <CardHeader icon="car" title="Exterior Inspection Photos" marginBottom={12} />

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
          <Ionicons
            name="bulb-outline"
            size={16}
            color={THEME.primaryYellow}
            style={{ marginRight: 8, marginTop: 2 }}
          />
          <Text style={{ color: THEME.textMuted, fontSize: 11, lineHeight: 16, flex: 1 }}>
            Ensure images are well-lit, all angles clearly visible, and license plate is readable.
            Avoid dark garages or severe glare.
          </Text>
        </View>

        <UploadBox
          uri={formData.vehicleFrontPhoto}
          title="Vehicle's Front Image"
          changeLabel="Change Front"
          error={errors.vehicleFrontPhoto}
          onPress={() => openImagePicker("vehicleFrontPhoto")}
        />
        <UploadBox
          uri={formData.vehicleBackPhoto}
          title="Vehicle's Back Image"
          changeLabel="Change Back"
          error={errors.vehicleBackPhoto}
          onPress={() => openImagePicker("vehicleBackPhoto")}
        />
        <UploadBox
          uri={formData.vehicleLeftSidePhoto}
          title="Vehicle's Side 1 Image (Left)"
          changeLabel="Change Left Side"
          error={errors.vehicleLeftSidePhoto}
          onPress={() => openImagePicker("vehicleLeftSidePhoto")}
        />
        <UploadBox
          uri={formData.vehicleRightSidePhoto}
          title="Vehicle's Side 1 Image (Right)"
          changeLabel="Change Right Side"
          error={errors.vehicleRightSidePhoto}
          last
          onPress={() => openImagePicker("vehicleRightSidePhoto")}
        />
      </View>

      {/* 3. Declaration & Legal Consent Card */}
      <View style={cardStyle}>
        <CardHeader icon="legal" title="Declaration & Legal Consent" marginBottom={14} />

        {/* Checkbox */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => updateField("agreeDeclaration", !formData.agreeDeclaration)}
          style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 16 }}
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
            {formData.agreeDeclaration && <Ionicons name="checkmark" size={16} color="#0E0E0E" />}
          </View>
          <Text style={{ color: THEME.textWhite, fontSize: 12, lineHeight: 18, flex: 1 }}>
            I confirm that all provided personal information, driving credentials, and vehicle
            documents are authentic and up-to-date.
          </Text>
        </TouchableOpacity>
        <ErrorText message={errors.agreeDeclaration} />

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
          <MaterialCommunityIcons
            name="timer-outline"
            size={18}
            color={THEME.primaryYellow}
            style={{ marginRight: 10, marginTop: 2 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: THEME.textWhite, fontSize: 12, fontWeight: "700", marginBottom: 2 }}
            >
              Review Process
            </Text>
            <Text style={{ color: THEME.textMuted, fontSize: 11, lineHeight: 16 }}>
              Verification typically takes{" "}
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>24–48 hours</Text>. You will
              receive an SMS notification once your account has been approved or rejected.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};