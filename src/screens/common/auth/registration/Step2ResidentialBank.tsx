import React, { useMemo, useState } from "react";
import {
  TextStyle,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { StepProps, THEME } from "./types";
import provincesData from "../../../../assets/json/registration/provinces.json";
import banksData from "../../../../assets/json/bank-details/banks.json";
import branchesData from "../../../../assets/json/bank-details/branches.json";

/* ---------- Types ---------- */

type District = { district: string; province: string };
type Bank = { ID: number; name: string };
type Branch = { bankID: number; ID: number | string; name: string };

/* ---------- Districts built from provinces.json ---------- */

const SRI_LANKA_DISTRICTS: District[] = provincesData.provinces
  .flatMap((p) =>
    p.districts.map((d) => ({
      district: d.en,
      province: `${p.name.en} Province`,
    }))
  )
  .sort((a, b) => a.district.localeCompare(b.district));

/* ---------- Banks and branches built from JSON ---------- */

const BANKS: Bank[] = (banksData as Bank[])
  .map((b) => ({ ID: b.ID, name: b.name.trim() }))
  .sort((a, b) => a.name.localeCompare(b.name));

const BRANCHES_BY_BANK = branchesData as unknown as Record<string, Branch[]>;

// Branch names for one bank: trimmed, de-duplicated (some banks list
// "Head Office" several times) and sorted A-Z.
const getBranchNames = (bankId?: number): string[] => {
  if (bankId === undefined) return [];
  const list = BRANCHES_BY_BANK[String(bankId)] ?? [];
  const names = list.map((b) => b.name.trim()).filter(Boolean);
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
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

const CardHeader: React.FC<{ icon: any; title: string }> = ({ icon, title }) => (
  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
    <FontAwesome6 name={icon} size={18} color={THEME.primaryYellow} style={{ marginRight: 8 }} />
    <Text style={{ color: THEME.textWhite, fontSize: 15, fontWeight: "700" }}>{title}</Text>
  </View>
);

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

type SelectModalProps<T> = {
  visible: boolean;
  title: string;
  data: T[];
  keyExtractor: (item: T) => string;
  onClose: () => void;
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  /** When provided, a search box is shown and items are filtered by this text */
  searchText?: (item: T) => string;
  searchPlaceholder?: string;
};

function SelectModal<T>({
  visible,
  title,
  data,
  keyExtractor,
  onClose,
  renderItem,
  onSelect,
  searchText,
  searchPlaceholder = "Search",
}: SelectModalProps<T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searchText || !q) return data;
    return data.filter((item) => searchText(item).toLowerCase().includes(q));
  }, [data, query, searchText]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const handleSelect = (item: T) => {
    setQuery("");
    onSelect(item);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
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
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {searchText && (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={THEME.textSub}
              autoCorrect={false}
              style={inputStyle(false, { height: 40, marginBottom: 8 })}
            />
          )}

          <FlatList
            data={filtered}
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={{ color: THEME.textSub, fontSize: 13, padding: 12 }}>
                No results found
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSelect(item)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#2A2A2E",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {renderItem(item)}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const SelectButton: React.FC<{
  value?: string;
  placeholder: string;
  hasError: boolean;
  onPress: () => void;
  spaced?: boolean;
  disabled?: boolean;
}> = ({ value, placeholder, hasError, onPress, spaced = true, disabled = false }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    disabled={disabled}
    onPress={onPress}
    style={inputStyle(hasError, {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      opacity: disabled ? 0.5 : 1,
      ...(spaced ? { marginBottom: hasError ? 4 : 14 } : {}),
    })}
  >
    <Text style={{ color: value ? THEME.textWhite : THEME.textSub, fontSize: 14 }}>
      {value || placeholder}
    </Text>
    <Ionicons name="chevron-down" size={16} color={THEME.textMuted} />
  </TouchableOpacity>
);

/* ---------- Main component ---------- */

export const Step2ResidentialBank: React.FC<StepProps> = ({
  formData,
  errors,
  updateField,
}) => {
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  // Selected bank (looked up by name) and its branches
  const selectedBank = useMemo(
    () => BANKS.find((b) => b.name === formData.bankName),
    [formData.bankName]
  );
  const branchOptions = useMemo(() => getBranchNames(selectedBank?.ID), [selectedBank]);

  // Some banks in branches.json have no branch list (e.g. finance companies).
  // For those, the branch becomes a free-text field.
  const bankHasNoBranches = !!selectedBank && branchOptions.length === 0;

  const handleSelectDistrict = (item: District) => {
    updateField("district", item.district);
    updateField("province", item.province);
    // City field was removed from this screen, but the parent form may still
    // require `city`. Fill it from the district so validation/API stay happy.
    updateField("city", item.district);
    setDistrictModalVisible(false);
  };

  const handleSelectBank = (bank: Bank) => {
    if (bank.name !== formData.bankName) {
      updateField("bankBranch", ""); // reset branch when bank changes
    }
    updateField("bankName", bank.name);
    setBankModalVisible(false);
  };

  const handleSelectBranch = (branch: string) => {
    updateField("bankBranch", branch);
    setBranchModalVisible(false);
  };

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* 1. Residential Details Card */}
      <View style={cardStyle}>
        <CardHeader icon="location-dot" title="Residential Details" />

        <FormLabel label="House / Plot Number" required />
        <TextInput
          value={formData.houseNumber}
          onChangeText={(text) => updateField("houseNumber", text)}
          placeholder="e.g. 142/B"
          placeholderTextColor={THEME.textSub}
          style={inputStyle(!!errors.houseNumber, { marginBottom: errors.houseNumber ? 4 : 14 })}
        />
        <ErrorText message={errors.houseNumber} />

        <FormLabel label="Street Name" required />
        <TextInput
          value={formData.streetName}
          onChangeText={(text) => updateField("streetName", text)}
          placeholder="e.g. Temple Road"
          placeholderTextColor={THEME.textSub}
          style={inputStyle(!!errors.streetName, { marginBottom: errors.streetName ? 4 : 14 })}
        />
        <ErrorText message={errors.streetName} />

        <FormLabel label="Country" />
        <TextInput
          value={formData.country || "Sri Lanka"}
          editable={false}
          style={inputStyle(false, { marginBottom: 14 })}
        />

        <FormLabel label="District" required />
        <SelectButton
          value={formData.district}
          placeholder="Select District"
          hasError={!!errors.district}
          onPress={() => setDistrictModalVisible(true)}
        />
        <ErrorText message={errors.district} />

        <FormLabel label="Province" required />
        <TextInput
          value={formData.district ? formData.province || "" : ""}
          editable={false}
          placeholder="Auto-Fill"
          placeholderTextColor={THEME.textSub}
          style={inputStyle(!!errors.province)}
        />
        <ErrorText message={errors.province} spaced={false} />
      </View>

      {/* 2. Verified Weekly Payouts Callout Card */}
      <View
        style={{
          backgroundColor: "#1F1E19",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#1F1E19",
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
          <Ionicons name="shield-checkmark-outline" size={20} color={THEME.primaryYellow} />
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
          <Text style={{ color: THEME.textMuted, fontSize: 11, lineHeight: 16 }}>
            Earnings credited weekly directly to your registered bank account.
          </Text>
        </View>
      </View>

      {/* 3. Bank Account Details Card */}
      <View style={cardStyle}>
        <CardHeader icon="building-columns" title="Bank Account Details" />

        <FormLabel label="Account Holder's Name" required />
        <TextInput
          value={formData.bankAccountHolder}
          onChangeText={(text) => updateField("bankAccountHolder", text)}
          placeholder="As shown on bank passbook"
          placeholderTextColor={THEME.textSub}
          style={inputStyle(!!errors.bankAccountHolder, {
            marginBottom: errors.bankAccountHolder ? 4 : 14,
          })}
        />
        <ErrorText message={errors.bankAccountHolder} />

        <FormLabel label="Account Number" required />
        <TextInput
          value={formData.bankAccountNumber}
          onChangeText={(text) => updateField("bankAccountNumber", text.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 8001234567"
          placeholderTextColor={THEME.textSub}
          keyboardType="number-pad"
          style={inputStyle(!!errors.bankAccountNumber, {
            marginBottom: errors.bankAccountNumber ? 4 : 14,
          })}
        />
        <ErrorText message={errors.bankAccountNumber} />

        <FormLabel label="Confirm Account Number" required />
        <TextInput
          value={formData.confirmBankAccountNumber}
          onChangeText={(text) =>
            updateField("confirmBankAccountNumber", text.replace(/[^0-9]/g, ""))
          }
          placeholder="Please Re-enter Account Number"
          placeholderTextColor={THEME.textSub}
          keyboardType="number-pad"
          style={inputStyle(!!errors.confirmBankAccountNumber, {
            marginBottom: errors.confirmBankAccountNumber ? 4 : 14,
          })}
        />
        <ErrorText message={errors.confirmBankAccountNumber} />

        <FormLabel label="Bank Name" required />
        <SelectButton
          value={formData.bankName}
          placeholder="Select Bank"
          hasError={!!errors.bankName}
          onPress={() => setBankModalVisible(true)}
        />
        <ErrorText message={errors.bankName} />

        <FormLabel label="Branch Name" required />
        {bankHasNoBranches ? (
          <TextInput
            value={formData.bankBranch}
            onChangeText={(text) => updateField("bankBranch", text)}
            placeholder="Enter branch name"
            placeholderTextColor={THEME.textSub}
            style={inputStyle(!!errors.bankBranch)}
          />
        ) : (
          <SelectButton
            value={formData.bankBranch}
            placeholder={selectedBank ? "Select Branch" : "Select Bank first"}
            hasError={!!errors.bankBranch}
            disabled={!selectedBank}
            onPress={() => setBranchModalVisible(true)}
            spaced={false}
          />
        )}
        <ErrorText message={errors.bankBranch} spaced={false} />
      </View>

      {/* Modals */}
      <SelectModal<District>
        visible={districtModalVisible}
        title="Select District"
        data={SRI_LANKA_DISTRICTS}
        keyExtractor={(item) => item.district}
        onClose={() => setDistrictModalVisible(false)}
        onSelect={handleSelectDistrict}
        searchText={(item) => item.district}
        searchPlaceholder="Search district"
        renderItem={(item) => (
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500" }}>
            {item.district}
          </Text>
        )}
      />

      <SelectModal<Bank>
        visible={bankModalVisible}
        title="Select Bank"
        data={BANKS}
        keyExtractor={(item) => String(item.ID)}
        onClose={() => setBankModalVisible(false)}
        onSelect={handleSelectBank}
        searchText={(item) => item.name}
        searchPlaceholder="Search bank"
        renderItem={(item) => (
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500" }}>{item.name}</Text>
        )}
      />

      <SelectModal<string>
        visible={branchModalVisible}
        title={selectedBank ? `${selectedBank.name} - Branches` : "Select Branch"}
        data={branchOptions}
        keyExtractor={(item) => item}
        onClose={() => setBranchModalVisible(false)}
        onSelect={handleSelectBranch}
        searchText={(item) => item}
        searchPlaceholder="Search branch"
        renderItem={(item) => (
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500" }}>{item}</Text>
        )}
      />
    </View>
  );
};