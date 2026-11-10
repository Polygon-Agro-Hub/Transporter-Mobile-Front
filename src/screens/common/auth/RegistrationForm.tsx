import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import CustomHeader from "@/component/common/CustomHeader";

import { FormData, INITIAL_FORM_DATA, THEME } from "./registration/types";
import { Step1PersonalInfo } from "./registration/Step1PersonalInfo";
import { Step2ResidentialBank } from "./registration/Step2ResidentialBank";
import { Step3LicenseInsurance } from "./registration/Step3LicenseInsurance";
import { Step4VehicleInfo } from "./registration/Step4VehicleInfo";

type RegistrationFormNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RegistrationForm"
>;

interface RegistrationFormProps {
  navigation: RegistrationFormNavigationProp;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [generatedRefId, setGeneratedRefId] = useState("");

  const [imagePickerModalVisible, setImagePickerModalVisible] = useState(false);
  const [activePhotoField, setActivePhotoField] = useState<keyof FormData | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // Update a single form field
  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Toggle array item (languages)
  const toggleArrayItem = (field: "languages" | "licenseCategories", item: string) => {
    setFormData((prev) => {
      const existing = prev[field] || [];
      if (existing.includes(item)) {
        if (existing.length === 1) return prev;
        return { ...prev, [field]: existing.filter((i: string) => i !== item) };
      } else {
        return { ...prev, [field]: [...existing, item] };
      }
    });
  };

  // Step 1: Personal & Job Info Validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    const cleanPhone = formData.phone1.replace(/\s/g, "");
    if (!cleanPhone) {
      newErrors.phone1 = "Primary phone number is required";
    } else if (cleanPhone.length < 9) {
      newErrors.phone1 = "Please enter a valid 9-digit phone number";
    }

    const cleanNic = formData.nic.trim().toUpperCase();
    if (!cleanNic) {
      newErrors.nic = "National Identity Card (NIC) is required";
    } else if (cleanNic.length < 10) {
      newErrors.nic = "Please enter a valid NIC (e.g. 123456789V)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2: Residential & Bank Info Validation
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.houseNumber.trim()) newErrors.houseNumber = "House / Plot Number is required";
    if (!formData.streetName.trim()) newErrors.streetName = "Street Name is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.district.trim()) newErrors.district = "District is required";
    if (!formData.bankAccountHolder.trim()) newErrors.bankAccountHolder = "Account holder name is required";
    if (!formData.bankAccountNumber.trim()) newErrors.bankAccountNumber = "Account number is required";
    if (!formData.confirmBankAccountNumber.trim()) {
      newErrors.confirmBankAccountNumber = "Confirm Account number is required";
    } else if (formData.bankAccountNumber !== formData.confirmBankAccountNumber) {
      newErrors.confirmBankAccountNumber = "Account numbers do not match";
    }
    if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required";
    if (!formData.bankBranch.trim()) newErrors.bankBranch = "Branch name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3: License & Insurance Info Validation
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = "Driving license ID is required";
    if (!formData.confirmLicenseNumber.trim()) {
      newErrors.confirmLicenseNumber = "Confirm Driving license ID is required";
    } else if (formData.licenseNumber.trim().toUpperCase() !== formData.confirmLicenseNumber.trim().toUpperCase()) {
      newErrors.confirmLicenseNumber = "Driving license IDs do not match";
    }
    if (!formData.insurancePolicyNumber.trim()) newErrors.insurancePolicyNumber = "Insurance Policy Number is required.";
    if (!formData.confirmInsurancePolicyNumber.trim()) {
      newErrors.confirmInsurancePolicyNumber = "Confirm Insurance Number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 4: Vehicle Info Validation & Submission
  const handleFinalSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.vehicleNumber.trim()) newErrors.vehicleNumber = "Vehicle registration number is required";
    if (!formData.confirmVehicleNumber.trim()) {
      newErrors.confirmVehicleNumber = "Confirm Registration Number is required";
    } else if (formData.vehicleNumber.trim().toUpperCase() !== formData.confirmVehicleNumber.trim().toUpperCase()) {
      newErrors.confirmVehicleNumber = "Vehicle registration numbers do not match";
    }
    if (!formData.agreeDeclaration) newErrors.agreeDeclaration = "You must confirm this declaration";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert("Required Fields", "Please complete all mandatory vehicle details and accept declarations.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const randomRef = "REG-DRV-" + Math.floor(10000 + Math.random() * 90000);
      setGeneratedRefId(randomRef);
      setIsSuccessModalVisible(true);
    }, 1200);
  };

  // Navigation between steps
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        Alert.alert("Required Fields", "Please complete all mandatory credentials before continuing.");
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        Alert.alert("Required Fields", "Please complete all required residential & bank fields.");
      }
    } else if (currentStep === 3) {
      if (validateStep3()) {
        setCurrentStep(4);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        Alert.alert("Required Fields", "Please fill in your driving license and insurance information.");
      }
    } else if (currentStep === 4) {
      handleFinalSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      navigation.goBack();
    }
  };

  // Image picking
  const openImagePicker = (field: keyof FormData) => {
    setActivePhotoField(field);
    setImagePickerModalVisible(true);
  };

  const handleLaunchCamera = async () => {
    setImagePickerModalVisible(false);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Denied", "Camera permission is required to capture photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: activePhotoField === "profilePhoto" ? [1, 1] : [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri && activePhotoField) {
        updateField(activePhotoField, result.assets[0].uri);
      }
    } catch (err) {
      console.warn("Camera launch error:", err);
    }
  };

  const handleLaunchGallery = async () => {
    setImagePickerModalVisible(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: activePhotoField === "profilePhoto" ? [1, 1] : [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri && activePhotoField) {
        updateField(activePhotoField, result.assets[0].uri);
      }
    } catch (err) {
      console.warn("Gallery launch error:", err);
    }
  };

  const handleRemovePhoto = () => {
    setImagePickerModalVisible(false);
    if (activePhotoField) {
      updateField(activePhotoField, null);
    }
  };

  // Progress metadata matching the 4 user requested steps
  const getStepProgressMeta = () => {
    switch (currentStep) {
      case 1:
        return {
          title: "Personal & Job Info",
          nextPreview: "Next: Residential & Bank Info",
          percent: "0% COMPLETED",
          progressFraction: 0.10,
          primaryButtonText: "Continue to Address & Bank Details",
          secondaryButtonText: "",
        };
      case 2:
        return {
          title: "Residential & Bank Info",
          nextPreview: "Next: License & Insurance Info",
          percent: "25% COMPLETED",
          progressFraction: 0.25,
          primaryButtonText: "Continue",
          secondaryButtonText: "Go Back",
        };
      case 3:
        return {
          title: "License & Insurance Info",
          nextPreview: "Next: Vehicle Info",
          percent: "50% COMPLETED",
          progressFraction: 0.50,
          primaryButtonText: "Continue",
          secondaryButtonText: "Go Back",
        };
      case 4:
        return {
          title: "Vehicle Info",
          nextPreview: "Next: Submission",
          percent: "75% COMPLETED",
          progressFraction: 0.75,
          primaryButtonText: "Send to Approve",
          secondaryButtonText: "Review Previous Steps",
        };
      default:
        return {
          title: "",
          nextPreview: "",
          percent: "0% COMPLETED",
          progressFraction: 0.25,
          primaryButtonText: "Continue",
          secondaryButtonText: "Go Back",
        };
    }
  };

  const meta = getStepProgressMeta();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      style={{ flex: 1, backgroundColor: THEME.bgDark }}
    >
      {/* Top Header with Back Button and Title using CustomHeader without bg color */}
      <View style={{ paddingTop: Platform.OS === "ios" ? 44 : 8, backgroundColor: "#191919" }}>
        <CustomHeader
          title="Registration Form"
          dark={true}
          backgroundColor="transparent"
          showBackButton={true}
          navigation={navigation as any}
          onBackPress={handlePrevStep}
          backButtonBg="#E5E7EB"
          backButtonColor="#111827"
          titleStyle={{ color: "#FFFFFF", fontWeight: "700", fontSize: 18 }}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Progress Card */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: THEME.cardBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: THEME.cardBorder,
            padding: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: THEME.primaryYellow,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color: "#0E0E0E",
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  {currentStep}
                </Text>
              </View>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Step {currentStep} of 4
              </Text>
            </View>

            <Text
              style={{
                color: THEME.primaryYellow,
                fontSize: 12,
                fontWeight: "700",
                letterSpacing: 0.5,
              }}
            >
              {meta.percent}
            </Text>
          </View>

          {/* Progress Bar Track */}
          <View
            style={{
              height: 6,
              backgroundColor: "#27272A",
              borderRadius: 3,
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${meta.progressFraction * 100}%`,
                backgroundColor: THEME.primaryYellow,
                borderRadius: 3,
              }}
            />
          </View>

          {/* Step Sub-indicators */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#E5E7EB",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {meta.title}
            </Text>
            <Text
              style={{
                color: THEME.textSub,
                fontSize: 11,
              }}
            >
              {meta.nextPreview}
            </Text>
          </View>
        </View>

        {/* 4 Separate Form Section Components */}
        {currentStep === 1 && (
          <Step1PersonalInfo
            formData={formData}
            errors={errors}
            updateField={updateField}
            toggleArrayItem={toggleArrayItem}
            openImagePicker={openImagePicker}
          />
        )}

        {currentStep === 2 && (
          <Step2ResidentialBank
            formData={formData}
            errors={errors}
            updateField={updateField}
            openImagePicker={openImagePicker}
          />
        )}

        {currentStep === 3 && (
          <Step3LicenseInsurance
            formData={formData}
            errors={errors}
            updateField={updateField}
            openImagePicker={openImagePicker}
          />
        )}

        {currentStep === 4 && (
          <Step4VehicleInfo
            formData={formData}
            errors={errors}
            updateField={updateField}
            openImagePicker={openImagePicker}
          />
        )}

        {/* Bottom Navigation CTA Buttons (Stacked) */}
        <View
          style={{
            paddingHorizontal: 16,
            marginTop: 10,
            gap: 12,
          }}
        >
          {/* Primary Action Button (Top) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNextStep}
            disabled={isSubmitting}
            style={{
              backgroundColor: THEME.primaryYellow,
              borderRadius: 999,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              shadowColor: THEME.primaryYellow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#0E0E0E" size="small" />
            ) : (
              <>
                <Text
                  style={{
                    color: "#0E0E0E",
                    fontSize: 15,
                    fontWeight: "800",
                    marginRight: 6,
                  }}
                >
                  {meta.primaryButtonText}
                </Text>
                <Ionicons
                  name={currentStep === 4 ? "send" : "arrow-forward"}
                  size={16}
                  color="#0E0E0E"
                />
              </>
            )}
          </TouchableOpacity>

          {/* Secondary Action Button (Bottom) - Steps 2, 3, 4 */}
          {currentStep > 1 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePrevStep}
              style={{
                backgroundColor: "#27272A",
                borderRadius: 999,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
            >
              <Ionicons
                name="arrow-back"
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                {meta.secondaryButtonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Photo Picker Modal (Camera vs Gallery) */}
      <Modal
        visible={imagePickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePickerModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setImagePickerModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#202023",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: THEME.cardBorder,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 17,
                fontWeight: "700",
                marginBottom: 18,
                textAlign: "center",
              }}
            >
              Select Document / Photo Source
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLaunchCamera}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#2D2D31",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 14,
                marginBottom: 10,
              }}
            >
              <Ionicons name="camera" size={22} color={THEME.primaryYellow} style={{ marginRight: 12 }} />
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}>
                Take Photo with Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLaunchGallery}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#2D2D31",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 14,
                marginBottom: 10,
              }}
            >
              <Ionicons name="images" size={22} color={THEME.primaryYellow} style={{ marginRight: 12 }} />
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}>
                Choose from Photo Gallery
              </Text>
            </TouchableOpacity>

            {activePhotoField && formData[activePhotoField] && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleRemovePhoto}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  marginBottom: 10,
                }}
              >
                <Ionicons name="trash" size={22} color="#EF4444" style={{ marginRight: 12 }} />
                <Text style={{ color: "#EF4444", fontSize: 15, fontWeight: "600" }}>
                  Remove Current Photo
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setImagePickerModalVisible(false)}
              style={{
                paddingVertical: 14,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Text style={{ color: THEME.textMuted, fontSize: 15, fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={isSuccessModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsSuccessModalVisible(false);
          navigation.goBack();
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#202023",
              borderRadius: 24,
              padding: 26,
              alignItems: "center",
              borderWidth: 1,
              borderColor: THEME.cardBorder,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="checkmark-circle" size={48} color={THEME.successGreen} />
            </View>

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "800",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Application Submitted!
            </Text>

            <Text
              style={{
                color: THEME.textMuted,
                fontSize: 13,
                textAlign: "center",
                lineHeight: 19,
                marginBottom: 16,
              }}
            >
              Your driver registration request has been submitted for verification. Our review team will verify your credentials within 24–48 hours.
            </Text>

            <View
              style={{
                backgroundColor: "#27272A",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                marginBottom: 24,
                alignItems: "center",
              }}
            >
              <Text style={{ color: THEME.textSub, fontSize: 11, marginBottom: 2 }}>
                APPLICATION REFERENCE ID
              </Text>
              <Text
                style={{
                  color: THEME.primaryYellow,
                  fontSize: 16,
                  fontWeight: "800",
                  letterSpacing: 1,
                }}
              >
                {generatedRefId}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setIsSuccessModalVisible(false);
                navigation.goBack();
              }}
              style={{
                backgroundColor: THEME.primaryYellow,
                borderRadius: 999,
                width: "100%",
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#0E0E0E",
                  fontSize: 15,
                  fontWeight: "800",
                }}
              >
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default RegistrationForm;
