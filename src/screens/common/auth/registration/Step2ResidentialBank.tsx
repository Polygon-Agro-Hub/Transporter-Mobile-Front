import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { StepProps, THEME } from "./types";

export const Step2ResidentialBank: React.FC<StepProps> = ({
  formData,
  errors,
  updateField,
}) => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* 1. Residential Address Card */}
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
          <Text style={{ fontSize: 16, marginRight: 6 }}>🏠</Text>
          <Text style={{ color: THEME.textWhite, fontSize: 14, fontWeight: "700" }}>
            Residential Address
          </Text>
        </View>

        {/* Address Line 1 */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Address Line 1 *
        </Text>
        <TextInput
          value={formData.addressLine1}
          onChangeText={(text) => updateField("addressLine1", text)}
          placeholder="e.g. No. 45, Temple Road"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.addressLine1 ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.addressLine1 ? 4 : 14,
          }}
        />
        {errors.addressLine1 && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.addressLine1}
          </Text>
        )}

        {/* Address Line 2 */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Address Line 2 (Optional)
        </Text>
        <TextInput
          value={formData.addressLine2}
          onChangeText={(text) => updateField("addressLine2", text)}
          placeholder="e.g. Baseline Road"
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

        {/* City & District in Row */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
              City *
            </Text>
            <TextInput
              value={formData.city}
              onChangeText={(text) => updateField("city", text)}
              placeholder="e.g. Colombo"
              placeholderTextColor={THEME.textSub}
              style={{
                backgroundColor: THEME.inputBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: errors.city ? THEME.inputBorderError : THEME.inputBorder,
                color: THEME.textWhite,
                fontSize: 14,
                height: 48,
                paddingHorizontal: 14,
              }}
            />
            {errors.city && (
              <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginTop: 4 }}>
                {errors.city}
              </Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
              District *
            </Text>
            <TextInput
              value={formData.district}
              onChangeText={(text) => updateField("district", text)}
              placeholder="e.g. Gampaha"
              placeholderTextColor={THEME.textSub}
              style={{
                backgroundColor: THEME.inputBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: errors.district ? THEME.inputBorderError : THEME.inputBorder,
                color: THEME.textWhite,
                fontSize: 14,
                height: 48,
                paddingHorizontal: 14,
              }}
            />
          </View>
        </View>

        {/* Postal Code */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Postal Code (Optional)
        </Text>
        <TextInput
          value={formData.postalCode}
          onChangeText={(text) => updateField("postalCode", text)}
          placeholder="e.g. 11850"
          placeholderTextColor={THEME.textSub}
          keyboardType="numeric"
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

      {/* 2. Emergency Contact Card */}
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
          <Text style={{ fontSize: 16, marginRight: 6 }}>📞</Text>
          <Text style={{ color: THEME.textWhite, fontSize: 14, fontWeight: "700" }}>
            Emergency Contact
          </Text>
        </View>

        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Contact Person Name *
        </Text>
        <TextInput
          value={formData.emergencyName}
          onChangeText={(text) => updateField("emergencyName", text)}
          placeholder="e.g. Sunethra Perera"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.emergencyName ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.emergencyName ? 4 : 14,
          }}
        />
        {errors.emergencyName && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.emergencyName}
          </Text>
        )}

        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Relationship *
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {["Spouse", "Parent", "Sibling", "Friend"].map((rel) => {
            const isSelected = formData.emergencyRelationship === rel;
            return (
              <TouchableOpacity
                key={rel}
                onPress={() => updateField("emergencyRelationship", rel)}
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
                  {rel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Emergency Phone Number *
        </Text>
        <View
          style={{
            flexDirection: "row",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.emergencyPhone ? THEME.inputBorderError : THEME.inputBorder,
            overflow: "hidden",
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
            value={formData.emergencyPhone}
            onChangeText={(text) => updateField("emergencyPhone", text.replace(/[^0-9]/g, ""))}
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
        {errors.emergencyPhone && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginTop: 4 }}>
            {errors.emergencyPhone}
          </Text>
        )}
      </View>

      {/* 3. Bank Account Details Card */}
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
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🏦</Text>
          <Text style={{ color: THEME.textWhite, fontSize: 14, fontWeight: "700" }}>
            Bank Account Details
          </Text>
        </View>
        <Text style={{ color: THEME.textMuted, fontSize: 12, marginBottom: 14 }}>
          Weekly driver earnings & incentives are directly deposited here.
        </Text>

        {/* Account Holder Name */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Account Holder Name *
        </Text>
        <TextInput
          value={formData.bankAccountHolder}
          onChangeText={(text) => updateField("bankAccountHolder", text)}
          placeholder="e.g. K. P. Perera"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.bankAccountHolder ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.bankAccountHolder ? 4 : 14,
          }}
        />

        {/* Bank Name */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Bank Name *
        </Text>
        <TextInput
          value={formData.bankName}
          onChangeText={(text) => updateField("bankName", text)}
          placeholder="e.g. Commercial Bank / Bank of Ceylon"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.bankName ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.bankName ? 4 : 14,
          }}
        />

        {/* Branch Name */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Branch Name
        </Text>
        <TextInput
          value={formData.bankBranch}
          onChangeText={(text) => updateField("bankBranch", text)}
          placeholder="e.g. Pettah Branch"
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

        {/* Account Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Account Number *
        </Text>
        <TextInput
          value={formData.bankAccountNumber}
          onChangeText={(text) => updateField("bankAccountNumber", text.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 1000234567"
          placeholderTextColor={THEME.textSub}
          keyboardType="numeric"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.bankAccountNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
            marginBottom: errors.bankAccountNumber ? 4 : 14,
          }}
        />
        {errors.bankAccountNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.bankAccountNumber}
          </Text>
        )}

        {/* Confirm Account Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Confirm Account Number *
        </Text>
        <TextInput
          value={formData.confirmBankAccountNumber}
          onChangeText={(text) => updateField("confirmBankAccountNumber", text.replace(/[^0-9]/g, ""))}
          placeholder="Re-enter Account Number"
          placeholderTextColor={THEME.textSub}
          keyboardType="numeric"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: errors.confirmBankAccountNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 14,
          }}
        />
        {errors.confirmBankAccountNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginTop: 4 }}>
            {errors.confirmBankAccountNumber}
          </Text>
        )}
      </View>
    </View>
  );
};
