import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StepProps, THEME } from "./types";

const SRI_LANKA_DISTRICTS = [
  { district: "Colombo", province: "Western Province" },
  { district: "Gampaha", province: "Western Province" },
  { district: "Kalutara", province: "Western Province" },
  { district: "Kandy", province: "Central Province" },
  { district: "Matale", province: "Central Province" },
  { district: "Nuwara Eliya", province: "Central Province" },
  { district: "Galle", province: "Southern Province" },
  { district: "Matara", province: "Southern Province" },
  { district: "Hambantota", province: "Southern Province" },
  { district: "Jaffna", province: "Northern Province" },
  { district: "Kilinochchi", province: "Northern Province" },
  { district: "Mannar", province: "Northern Province" },
  { district: "Vavuniya", province: "Northern Province" },
  { district: "Mullaitivu", province: "Northern Province" },
  { district: "Batticaloa", province: "Eastern Province" },
  { district: "Ampara", province: "Eastern Province" },
  { district: "Trincomalee", province: "Eastern Province" },
  { district: "Kurunegala", province: "North Western Province" },
  { district: "Puttalam", province: "North Western Province" },
  { district: "Anuradhapura", province: "North Central Province" },
  { district: "Polonnaruwa", province: "North Central Province" },
  { district: "Badulla", province: "Uva Province" },
  { district: "Monaragala", province: "Uva Province" },
  { district: "Ratnapura", province: "Sabaragamuwa Province" },
  { district: "Kegalle", province: "Sabaragamuwa Province" },
];

const SRI_LANKAN_BANKS = [
  "Commercial Bank of Ceylon",
  "Bank of Ceylon (BOC)",
  "People's Bank",
  "Sampath Bank",
  "Hatton National Bank (HNB)",
  "Seylan Bank",
  "Nations Trust Bank (NTB)",
  "DFCC Bank",
  "National Development Bank (NDB)",
  "Union Bank",
  "Pan Asia Bank",
  "Amana Bank",
  "Cargills Bank",
];

const COMMON_BRANCHES = [
  "Colombo 01 - Fort",
  "Colombo 03 - Kollupitiya",
  "Colombo 04 - Bambalapitiya",
  "Colombo 07 - Cinnamon Gardens",
  "Colombo 10 - Maradana",
  "Gampaha",
  "Negombo",
  "Kandy Central",
  "Peradeniya",
  "Kurunegala",
  "Galle Fort",
  "Matara",
  "Ratnapura",
  "Anuradhapura",
  "Jaffna Central",
  "Batticaloa",
];

export const Step2ResidentialBank: React.FC<StepProps> = ({
  formData,
  errors,
  updateField,
}) => {
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  const handleSelectDistrict = (item: { district: string; province: string }) => {
    updateField("district", item.district);
    updateField("province", item.province);
    setDistrictModalVisible(false);
  };

  const handleSelectBank = (bank: string) => {
    updateField("bankName", bank);
    setBankModalVisible(false);
  };

  const handleSelectBranch = (branch: string) => {
    updateField("bankBranch", branch);
    setBranchModalVisible(false);
  };

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* 1. Residential Details Card */}
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
          <Ionicons name="location-sharp" size={18} color={THEME.primaryYellow} style={{ marginRight: 8 }} />
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Residential Details
          </Text>
        </View>

        {/* House / Plot Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          House / Plot Number *
        </Text>
        <TextInput
          value={formData.houseNumber}
          onChangeText={(text) => updateField("houseNumber", text)}
          placeholder="e.g. 142/B"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.houseNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.houseNumber ? 4 : 14,
          }}
        />
        {errors.houseNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.houseNumber}
          </Text>
        )}

        {/* Street Name */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Street Name *
        </Text>
        <TextInput
          value={formData.streetName}
          onChangeText={(text) => updateField("streetName", text)}
          placeholder="e.g. Temple Road"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.streetName ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.streetName ? 4 : 14,
          }}
        />
        {errors.streetName && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.streetName}
          </Text>
        )}

        {/* City */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          City *
        </Text>
        <TextInput
          value={formData.city}
          onChangeText={(text) => updateField("city", text)}
          placeholder="e.g. Colombo 03"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.city ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.city ? 4 : 14,
          }}
        />
        {errors.city && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.city}
          </Text>
        )}

        {/* Country */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Country
        </Text>
        <TextInput
          value={formData.country || "Sri Lanka"}
          editable={false}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: 14,
          }}
        />

        {/* District */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          District *
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setDistrictModalVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.district ? THEME.inputBorderError : THEME.inputBorder,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.district ? 4 : 14,
          }}
        >
          <Text
            style={{
              color: formData.district ? THEME.textWhite : THEME.textSub,
              fontSize: 14,
            }}
          >
            {formData.district || "Select District"}
          </Text>
          <Ionicons name="chevron-down" size={16} color={THEME.textMuted} />
        </TouchableOpacity>
        {errors.district && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.district}
          </Text>
        )}

        {/* Province */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Province *
        </Text>
        <TextInput
          value={formData.province || ""}
          editable={false}
          placeholder="Auto-Fill"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.province ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
          }}
        />
        {errors.province && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginTop: 4 }}>
            {errors.province}
          </Text>
        )}
      </View>

      {/* 2. Verified Weekly Payouts Callout Card */}
      <View
        style={{
          backgroundColor: "#1F1E19",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#332D18",
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: "#2E2A18",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="shield-checkmark" size={20} color={THEME.primaryYellow} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: THEME.primaryYellow,
              fontSize: 13,
              fontWeight: "700",
              marginBottom: 2,
            }}
          >
            Verified Weekly Payouts
          </Text>
          <Text
            style={{
              color: THEME.textMuted,
              fontSize: 11,
              lineHeight: 16,
            }}
          >
            Earnings credited weekly directly to your registered bank account.
          </Text>
        </View>
      </View>

      {/* 3. Bank Account Details Card */}
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
          <Ionicons name="business-sharp" size={18} color={THEME.primaryYellow} style={{ marginRight: 8 }} />
          <Text
            style={{
              color: THEME.textWhite,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Bank Account Details
          </Text>
        </View>

        {/* Account Holder's Name */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Account Holder's Name *
        </Text>
        <TextInput
          value={formData.bankAccountHolder}
          onChangeText={(text) => updateField("bankAccountHolder", text)}
          placeholder="As shown on bank passbook"
          placeholderTextColor={THEME.textSub}
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.bankAccountHolder ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.bankAccountHolder ? 4 : 14,
          }}
        />
        {errors.bankAccountHolder && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.bankAccountHolder}
          </Text>
        )}

        {/* Account Number */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Account Number *
        </Text>
        <TextInput
          value={formData.bankAccountNumber}
          onChangeText={(text) => updateField("bankAccountNumber", text.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 8001234567"
          placeholderTextColor={THEME.textSub}
          keyboardType="number-pad"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.bankAccountNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
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
          placeholder="Please Re-enter Account Number"
          placeholderTextColor={THEME.textSub}
          keyboardType="number-pad"
          style={{
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.confirmBankAccountNumber ? THEME.inputBorderError : THEME.inputBorder,
            color: THEME.textWhite,
            fontSize: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.confirmBankAccountNumber ? 4 : 14,
          }}
        />
        {errors.confirmBankAccountNumber && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.confirmBankAccountNumber}
          </Text>
        )}

        {/* Bank Name */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Bank Name *
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setBankModalVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.bankName ? THEME.inputBorderError : THEME.inputBorder,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: errors.bankName ? 4 : 14,
          }}
        >
          <Text
            style={{
              color: formData.bankName ? THEME.textWhite : THEME.textSub,
              fontSize: 14,
            }}
          >
            {formData.bankName || "Select Bank"}
          </Text>
          <Ionicons name="chevron-down" size={16} color={THEME.textMuted} />
        </TouchableOpacity>
        {errors.bankName && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginBottom: 10 }}>
            {errors.bankName}
          </Text>
        )}

        {/* Branch Name */}
        <Text style={{ color: "#E5E7EB", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
          Branch Name *
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setBranchModalVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: THEME.inputBg,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: errors.bankBranch ? THEME.inputBorderError : THEME.inputBorder,
            height: 48,
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={{
              color: formData.bankBranch ? THEME.textWhite : THEME.textSub,
              fontSize: 14,
            }}
          >
            {formData.bankBranch || "Select Branch"}
          </Text>
          <Ionicons name="chevron-down" size={16} color={THEME.textMuted} />
        </TouchableOpacity>
        {errors.bankBranch && (
          <Text style={{ color: THEME.inputBorderError, fontSize: 11, marginTop: 4 }}>
            {errors.bankBranch}
          </Text>
        )}
      </View>

      {/* District Selection Modal */}
      <Modal visible={districtModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#202023",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: THEME.cardBorder,
              maxHeight: "75%",
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#333",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
                Select District
              </Text>
              <TouchableOpacity onPress={() => setDistrictModalVisible(false)}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SRI_LANKA_DISTRICTS}
              keyExtractor={(item) => item.district}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectDistrict(item)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#2A2A2E",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500" }}>
                    {item.district}
                  </Text>
                  <Text style={{ color: THEME.textSub, fontSize: 12 }}>
                    {item.province}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Bank Selection Modal */}
      <Modal visible={bankModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#202023",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: THEME.cardBorder,
              maxHeight: "75%",
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#333",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
                Select Bank
              </Text>
              <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SRI_LANKAN_BANKS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectBank(item)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#2A2A2E",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500" }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Branch Selection Modal */}
      <Modal visible={branchModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#202023",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: THEME.cardBorder,
              maxHeight: "75%",
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#333",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
                Select Branch
              </Text>
              <TouchableOpacity onPress={() => setBranchModalVisible(false)}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COMMON_BRANCHES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectBranch(item)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#2A2A2E",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500" }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
