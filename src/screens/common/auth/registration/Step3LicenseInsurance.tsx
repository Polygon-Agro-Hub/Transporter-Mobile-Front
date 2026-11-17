import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  TextStyle,
  Platform,
} from "react-native";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { StepProps, THEME } from "./types";
import { useFileSize } from "@/utils/useFileSize";
import { CustomCalendarModal } from "@/component/common/CustomCalendarModal";

/* ---------- Date helpers ---------- */

const MIN_DAYS_AHEAD = 30;

const getMinExpiryDate = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + MIN_DAYS_AHEAD);
  return d;
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

/* ---------- Label with yellow asterisk (THEME.requiredAsterisk) ---------- */

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
      <Text style={{ color: THEME.requiredAsterisk }}>{"\u00A0*"}</Text>
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
              <Feather name="rotate-ccw" size={16} color={THEME.primaryYellow} />
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
              <Feather name="camera" size={20} color={THEME.primaryYellow} />
            </View>
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", marginBottom: 2 }}>
              {title}
            </Text>
            <Text style={{ color: THEME.textYellow, fontSize: 11 }}>.jpg / .jpeg / .png / .heic</Text>
          </>
        )}
      </TouchableOpacity>
      <ErrorText message={error} spaced={!last} />
    </>
  );
};

/* ---------- Date picker field (calendar opens on tap, min = today + 30 days) ---------- */

const ExpiryDateField: React.FC<{
  value?: string;
  hasError: boolean;
  onChange: (value: string) => void;
}> = ({ value, hasError, onChange }) => {
  const [show, setShow] = useState(false);
  const minDate = useMemo(() => getMinExpiryDate(), []);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setShow(true)}
        style={{
          ...inputStyle(hasError, { marginBottom: hasError ? 4 : 14 }),
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: value ? THEME.textWhite : THEME.textSub, fontSize: 14 }}>
          {value || "DD/MM/YYYY"}
        </Text>
        <Feather name="calendar" size={18} color={THEME.primaryYellow} />
      </TouchableOpacity>

      <CustomCalendarModal
        visible={show}
        title="Insurance Expiry Date"
        selectedDate={value}
        minDate={minDate}
        onSelectDate={onChange}
        onClose={() => setShow(false)}
      />
    </>
  );
};

/* ---------- Main component ---------- */

export const Step3LicenseInsurance: React.FC<StepProps> = ({
  formData,
  errors,
  updateField,
  openImagePicker,
}) => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* 1. Driving License Details Card */}
      <View style={cardStyle}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <FontAwesome
            name="id-badge"
            size={18}
            color={THEME.primaryYellow}
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: THEME.textWhite, fontSize: 15, fontWeight: "700" }}>
            Driving License Details
          </Text>
        </View>

        <FormLabel label="Driving License ID" required />
        <TextInput
          value={formData.licenseNumber}
          onChangeText={(text) => updateField("licenseNumber", text.toUpperCase().replace(/^\s+/, ""))}
          placeholder="e.g. B8849201"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          style={inputStyle(!!errors.licenseNumber, {
            marginBottom: errors.licenseNumber ? 4 : 14,
          })}
        />
        <ErrorText message={errors.licenseNumber} />

        <FormLabel label="Confirm Driving License ID" required />
        <TextInput
          value={formData.confirmLicenseNumber}
          onChangeText={(text) => updateField("confirmLicenseNumber", text.toUpperCase().replace(/^\s+/, ""))}
          placeholder="Re-enter license ID"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          style={inputStyle(!!errors.confirmLicenseNumber, {
            marginBottom: errors.confirmLicenseNumber ? 4 : 14,
          })}
        />
        <ErrorText message={errors.confirmLicenseNumber} />

        <FormLabel label="License Documents" required style={{ marginBottom: 10 }} />

        <UploadBox
          uri={formData.licenseFrontPhoto}
          title="Upload Front Image"
          changeLabel="Change Front"
          error={errors.licenseFrontPhoto}
          onPress={() => openImagePicker("licenseFrontPhoto")}
        />
        <UploadBox
          uri={formData.licenseBackPhoto}
          title="Upload Back Image"
          changeLabel="Change Back"
          error={errors.licenseBackPhoto}
          last
          onPress={() => openImagePicker("licenseBackPhoto")}
        />
      </View>

      {/* 2. Vehicle Insurance Details Card */}
      <View style={cardStyle}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Ionicons
            name="shield-checkmark-sharp"
            size={18}
            color={THEME.primaryYellow}
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: THEME.textWhite, fontSize: 15, fontWeight: "700" }}>
            Vehicle Insurance Details
          </Text>
        </View>

        <FormLabel label="Insurance Policy Number" required />
        <TextInput
          value={formData.insurancePolicyNumber}
          onChangeText={(text) =>
            updateField("insurancePolicyNumber", text.toUpperCase().replace(/^\s+/, ""))
          }
          placeholder="e.g. POL-9948201-A"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={30}
          style={inputStyle(!!errors.insurancePolicyNumber, {
            marginBottom: errors.insurancePolicyNumber ? 4 : 14,
          })}
        />
        <ErrorText message={errors.insurancePolicyNumber} />

        <FormLabel label="Confirm Insurance Number" required />
        <TextInput
          value={formData.confirmInsurancePolicyNumber}
          onChangeText={(text) =>
            updateField("confirmInsurancePolicyNumber", text.toUpperCase().replace(/^\s+/, ""))
          }
          placeholder="Re-enter insurance policy number"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={30}
          style={inputStyle(!!errors.confirmInsurancePolicyNumber, {
            marginBottom: errors.confirmInsurancePolicyNumber ? 4 : 14,
          })}
        />
        <ErrorText message={errors.confirmInsurancePolicyNumber} />

        <FormLabel label="Insurance Expiry Date" required />
        <ExpiryDateField
          value={formData.insuranceExpiry}
          hasError={!!errors.insuranceExpiry}
          onChange={(v) => updateField("insuranceExpiry", v)}
        />
        <ErrorText message={errors.insuranceExpiry} />

        <FormLabel label="Insurance Certificate Photos" required style={{ marginBottom: 10 }} />

        <UploadBox
          uri={formData.insuranceFrontPhoto}
          title="Insurance Certificate Front"
          changeLabel="Change Certificate"
          error={errors.insuranceFrontPhoto}
          onPress={() => openImagePicker("insuranceFrontPhoto")}
        />
        <UploadBox
          uri={formData.insuranceBackPhoto}
          title="Insurance Certificate Back"
          changeLabel="Change Certificate"
          error={errors.insuranceBackPhoto}
          last
          onPress={() => openImagePicker("insuranceBackPhoto")}
        />
      </View>
    </View>
  );
};