import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import {
  Ionicons,
  FontAwesome5,
  Feather,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { StepProps, THEME } from "./types";

const defaultProfileImage = require("@/assets/images/auth/profile.webp");

/**
 * NIC input filter (runs on every keystroke / paste)
 * - Digits only, max 12 (new NIC)
 * - "V" allowed ONLY as the 10th character, right after 9 digits (old NIC)
 * - Other English letters and special characters are blocked
 * - Nothing can be typed after "V"
 */
const sanitizeNIC = (input: string): string => {
  let result = "";

  for (const ch of input.toUpperCase()) {
    if (result.endsWith("V")) break;

    if (/[0-9]/.test(ch)) {
      if (result.length < 12) result += ch;
    } else if (ch === "V" && result.length === 9) {
      result += ch;
    }
  }

  return result;
};

// Use this in your parent form's submit validation
export const isValidNIC = (nic: string): boolean =>
  /^(\d{9}V|\d{12})$/.test(nic);

/**
 * Email validation. Returns an error message, or "" when the email is valid.
 * Email is optional on this form, so an empty value is valid unless
 * `required` is true.
 */
export const getEmailError = (email: string, required = false): string => {
  const value = email.trim();

  if (!value) return required ? "Email is required" : "";

  const parts = value.toLowerCase().split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return "Please enter a valid email address";
  }

  const [localPart, domain] = parts;

  if (domain.includes("..")) {
    return "Email domain cannot contain consecutive dots (e.g., gmail..com is invalid)";
  }

  // Domain: dot-separated labels (no leading/trailing hyphen), TLD of 2+ letters
  const domainRegex = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return "Please enter a valid email address";
  }

  // Gmail
  if (domain === "gmail.com" || domain === "googlemail.com") {
    if (localPart.length < 6) {
      return "Gmail addresses must be at least 6 characters before @";
    }
    if (localPart.length > 30) {
      return "Gmail addresses cannot exceed 30 characters before @";
    }
    if (/\.{2,}/.test(localPart)) {
      return "Gmail addresses cannot have consecutive dots";
    }
    if (/^\.|\.$/.test(localPart)) {
      return "Gmail addresses cannot start or end with a dot";
    }
    if (!/^[a-z0-9.+]+$/.test(localPart)) {
      return "Gmail addresses can only contain letters, numbers, dots and plus signs";
    }
    return "";
  }

  // Yahoo
  if (domain === "yahoo.com") {
    if (localPart.length > 32) {
      return "Yahoo addresses cannot exceed 32 characters before @";
    }
    if (/\.{2,}/.test(localPart)) {
      return "Yahoo addresses cannot have consecutive dots";
    }
    if (/^[._-]|[._-]$/.test(localPart)) {
      return "Yahoo addresses cannot start or end with dots, underscores or hyphens";
    }
    if (!/^[a-z0-9._-]+$/.test(localPart)) {
      return "Yahoo addresses can only contain letters, numbers, dots, underscores and hyphens";
    }
    return "";
  }

  // Other providers (any valid domain / TLD)
  if (localPart.length > 64) {
    return "Email address is too long";
  }
  if (/\.{2,}/.test(localPart)) {
    return "Email addresses cannot have consecutive dots";
  }
  if (/^\.|\.$/.test(localPart)) {
    return "Email addresses cannot start or end with a dot";
  }
  if (!/^[a-z0-9._%+-]+$/.test(localPart)) {
    return "Please enter a valid email address";
  }

  return "";
};

export const Step1PersonalInfo: React.FC<StepProps> = ({
  formData,
  errors,
  updateField,
  toggleArrayItem,
  openImagePicker,
}) => {
  const [emailTouched, setEmailTouched] = useState(false);

  const emailValue = formData.email ?? "";

  // Validate live once the user has typed an "@" (so no error on the first
  // keystroke), after they leave the field, or when the parent flags it.
  const showLocalEmailError = emailTouched || emailValue.includes("@");
  const localEmailError = showLocalEmailError ? getEmailError(emailValue) : "";

  // Local format error wins; otherwise fall back to the parent's message
  // (e.g. "Email already in use" from submit / server validation).
  const emailErrorText =
    localEmailError || (typeof errors.email === "string" ? errors.email : "");

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
            <Image
              source={
                formData.profilePhoto
                  ? { uri: formData.profilePhoto }
                  : defaultProfileImage
              }
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>

          {/* Camera Badge Icon */}
          <View
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 26,
              height: 26,
              borderRadius: 14,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              borderColor: THEME.cardBg,
              elevation: 3,
            }}
          >
            <Feather name="camera" size={14} color="#1F2937" />
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
            <Text style={{ fontSize: 15, marginRight: 6 }}>
              <FontAwesome5 name="globe" size={16} color="#F7CA21" />
            </Text>
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
              color: THEME.textYellow,
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <FontAwesome6 name="truck-fast" size={16} color="#F7CA21" />
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            {" "}Job Role Allocation
          </Text>
        </View>
        <Text
          style={{
            color: THEME.textYellow,
            fontSize: 12,
            marginBottom: 14,
            lineHeight: 17,
          }}
        >
          Are you working as a Light Weight Driver or Heavy Weight Driver with
          us?
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
                : "#FFEDC2",
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <MaterialCommunityIcons
            name="rickshaw"
            size={24}
            color={
              formData.jobRole === "Light Weight Driver" ? "#0E0E0E" : "#9CA3AF"
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
                    : THEME.textYellow,
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
                : "#FFEDC2",
            paddingVertical: 14,
            paddingHorizontal: 16,
          }}
        >
          <FontAwesome6
            name="truck"
            size={20}
            color={
              formData.jobRole === "Heavy Weight Driver" ? "#0E0E0E" : "#9CA3AF"
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
                    : THEME.textYellow,
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <FontAwesome6 name="user-large" size={16} color="#F7CA21" />
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            {" "}Official Driver Credentials
          </Text>
        </View>

        {/* First Name */}
        <Text
          style={{
            color: "#E5E7EB",
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 6,
          }}
        >
          First Name (in English) <Text style={{ color: "#F7CA21" }}>*</Text>
        </Text>
        <TextInput
          value={formData.firstName}
          onChangeText={(text) => updateField("firstName", text)}
          placeholder="e.g. Kasun"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.firstName
              ? THEME.inputBorderError
              : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.firstName ? 4 : 14,
          }}
        />
        {errors.firstName && (
          <Text
            style={{
              color: THEME.inputBorderError,
              fontSize: 11,
              marginBottom: 10,
            }}
          >
            {errors.firstName}
          </Text>
        )}

        {/* Last Name */}
        <Text
          style={{
            color: "#E5E7EB",
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 6,
          }}
        >
          Last Name (in English) <Text style={{ color: "#F7CA21" }}>*</Text>
        </Text>
        <TextInput
          value={formData.lastName}
          onChangeText={(text) => updateField("lastName", text)}
          placeholder="e.g. Perera"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.lastName
              ? THEME.inputBorderError
              : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.lastName ? 4 : 14,
          }}
        />
        {errors.lastName && (
          <Text
            style={{
              color: THEME.inputBorderError,
              fontSize: 11,
              marginBottom: 10,
            }}
          >
            {errors.lastName}
          </Text>
        )}

        {/* Phone Number - 1 */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600" }}>
            Phone Number - 1 <Text style={{ color: "#F7CA21" }}>*</Text>
          </Text>
          <Text
            style={{
              color: THEME.primaryYellow,
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            Primary / Call
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.phone1
              ? THEME.inputBorderError
              : THEME.inputBorder,
            overflow: "hidden",
            marginBottom: errors.phone1 ? 4 : 14,
            height: 48,
          }}
        >
          <View
            style={{
              backgroundColor: "#2C2C30",
              paddingHorizontal: 16,
              alignItems: "center",
              justifyContent: "center",
              borderRightWidth: 1,
              borderRightColor: THEME.inputBorder,
            }}
          >
            <Text
              style={{
                color: THEME.primaryYellow,
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              +94
            </Text>
          </View>
          <TextInput
            value={formData.phone1}
            onChangeText={(text) =>
              updateField("phone1", text.replace(/[^0-9]/g, ""))
            }
            placeholder="7X XXX XXXX"
            placeholderTextColor={THEME.textSub}
            keyboardType="phone-pad"
            maxLength={9}
            style={{
              flex: 1,
              backgroundColor: THEME.inputBg,
              color: THEME.textWhite,
              fontSize: 14,
              paddingHorizontal: 16,
            }}
          />
        </View>
        {errors.phone1 && (
          <Text
            style={{
              color: THEME.inputBorderError,
              fontSize: 11,
              marginBottom: 10,
            }}
          >
            {errors.phone1}
          </Text>
        )}

        {/* Phone Number - 2 */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600" }}>
            Phone Number - 2
          </Text>
          <Text style={{ color: THEME.textYellow, fontSize: 11 }}>Optional</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.phone2
              ? THEME.inputBorderError
              : THEME.inputBorder,
            overflow: "hidden",
            marginBottom: errors.phone2 ? 4 : 14,
            height: 48,
          }}
        >
          <View
            style={{
              backgroundColor: "#2C2C30",
              paddingHorizontal: 16,
              alignItems: "center",
              justifyContent: "center",
              borderRightWidth: 1,
              borderRightColor: THEME.inputBorder,
            }}
          >
            <Text
              style={{
                color: THEME.textYellow,
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              +94
            </Text>
          </View>
          <TextInput
            value={formData.phone2}
            onChangeText={(text) =>
              updateField("phone2", text.replace(/[^0-9]/g, ""))
            }
            placeholder="7X XXX XXXX"
            placeholderTextColor={THEME.textSub}
            keyboardType="phone-pad"
            maxLength={9}
            style={{
              flex: 1,
              backgroundColor: THEME.inputBg,
              color: THEME.textWhite,
              fontSize: 14,
              paddingHorizontal: 16,
            }}
          />
        </View>
        {errors.phone2 && (
          <Text
            style={{
              color: THEME.inputBorderError,
              fontSize: 11,
              marginBottom: 10,
            }}
          >
            {errors.phone2}
          </Text>
        )}

        {/* National Identity Card (NIC) */}
        <Text
          style={{
            color: "#E5E7EB",
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 6,
          }}
        >
          National Identity Card (NIC) <Text style={{ color: "#F7CA21" }}>*</Text>
        </Text>
        <TextInput
          value={formData.nic}
          onChangeText={(text) => updateField("nic", sanitizeNIC(text))}
          placeholder="e.g. 123456789V / 123456789012"
          placeholderTextColor={THEME.textSub}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.nic
              ? THEME.inputBorderError
              : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.nic ? 4 : 14,
          }}
        />
        {errors.nic && (
          <Text
            style={{
              color: THEME.inputBorderError,
              fontSize: 11,
              marginBottom: 10,
            }}
          >
            {errors.nic}
          </Text>
        )}

        {/* Email Address */}
        <Text
          style={{
            color: "#E5E7EB",
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 6,
          }}
        >
          Email Address
        </Text>
        <TextInput
          value={formData.email}
          onChangeText={(text) => updateField("email", text.replace(/\s/g, ""))}
          onBlur={() => setEmailTouched(true)}
          placeholder="e.g. yourname@gmail.com"
          placeholderTextColor={THEME.textSub}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: emailErrorText
              ? THEME.inputBorderError
              : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: emailErrorText ? 4 : 0,
          }}
        />
        {!!emailErrorText && (
          <Text
            style={{
              color: THEME.inputBorderError,
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            {emailErrorText}
          </Text>
        )}
      </View>
    </View>
  );
};