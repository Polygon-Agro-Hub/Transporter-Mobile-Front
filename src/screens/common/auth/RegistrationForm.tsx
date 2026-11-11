import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import CustomHeader from "@/component/common/CustomHeader";

import { FormData, INITIAL_FORM_DATA, THEME } from "./registration/types";
import {
  saveRegistrationDraft,
  loadRegistrationDraft,
  clearRegistrationDraft,
  isFormDirty,
} from "./registration/registrationStorage";
import {
  Step1PersonalInfo,
  getEmailError,
  isValidNIC,
} from "./registration/Step1PersonalInfo";
import {
  isAllowedImageUri,
  validateFieldLive,
  getDrivingLicenseError,
  getConfirmDrivingLicenseError,
  getVehicleNumberError,
  getConfirmVehicleNumberError,
  getFirstNameError,
  getLastNameError,
  getPhone1Error,
  getPhone2Error,
  getNICError,
  getHouseNumberError,
  getStreetNameError,
  getDistrictError,
  getBankAccountHolderError,
  getBankAccountNumberError,
  getConfirmBankAccountNumberError,
  getBankNameError,
  getBankBranchError,
  getInsurancePolicyNumberError,
  getConfirmInsurancePolicyNumberError,
  getInsuranceExpiryError,
  getVehicleTypeError,
  getAgreeDeclarationError,
} from "./registration/registrationValidation";
import { Step2ResidentialBank } from "./registration/Step2ResidentialBank";
import { Step3LicenseInsurance } from "./registration/Step3LicenseInsurance";
import { Step4VehicleInfo } from "./registration/Step4VehicleInfo";
import {
  uploadRegistrationDocument,
  submitDriverRegistration,
} from "@/services/auth/registration.service";
import { AlertModal } from "@/component/common/AlertModal";
import { optimizeImageForUpload } from "@/utils/imageOptimizer";

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
  const [submitProgressText, setSubmitProgressText] = useState("");
  const [isSubmitConfirmModalVisible, setIsSubmitConfirmModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isDiscardModalVisible, setIsDiscardModalVisible] = useState(false);

  const [imagePickerModalVisible, setImagePickerModalVisible] = useState(false);
  const [activePhotoField, setActivePhotoField] = useState<keyof FormData | null>(null);

  // Global custom AlertModal state
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertModalTitle, setAlertModalTitle] = useState("");
  const [alertModalMessage, setAlertModalMessage] = useState("");
  const [alertModalType, setAlertModalType] = useState<"success" | "error">("error");

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" = "error"
  ) => {
    setAlertModalTitle(title);
    setAlertModalMessage(message);
    setAlertModalType(type);
    setAlertModalVisible(true);
  };

  const scrollRef = useRef<ScrollView>(null);

  // Load saved draft from SQLite on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await loadRegistrationDraft();
        if (saved && isMounted) {
          setFormData(saved.formData);
          if (saved.currentStep >= 1 && saved.currentStep <= 4) {
            setCurrentStep(saved.currentStep);
          }
        }
      } catch (err) {
        console.warn("Error loading SQLite registration draft:", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle hardware back press on Android
  useEffect(() => {
    const onHardwareBack = () => {
      if (currentStep > 1) {
        handlePrevStep();
        return true;
      }
      if (isFormDirty(formData)) {
        setIsDiscardModalVisible(true);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
    return () => {
      backHandler.remove();
    };
  }, [currentStep, formData]);

  // Update multiple form fields atomically and persist to SQLite with instance-by-instance live validation
  const updateFields = (updates: Partial<FormData>) => {
    setFormData((prev) => {
      const nextForm = { ...prev };
      Object.keys(updates).forEach((k) => {
        const field = k as keyof FormData;
        let nextValue = updates[field];
        // Strip non-digits and leading 0 for phone numbers (exactly 9 digits starting with 7)
        if ((field === "phone1" || field === "phone2") && typeof nextValue === "string") {
          const digits = nextValue.replace(/[^0-9]/g, "");
          nextValue = digits.replace(/^0+/, "").slice(0, 9);
        }
        // Auto uppercase for license, vehicle numbers, and NIC
        if (
          (field === "licenseNumber" ||
            field === "confirmLicenseNumber" ||
            field === "vehicleNumber" ||
            field === "confirmVehicleNumber" ||
            field === "nic") &&
          typeof nextValue === "string"
        ) {
          nextValue = nextValue.toUpperCase();
        }
        (nextForm as any)[field] = nextValue;
      });

      saveRegistrationDraft(currentStep, nextForm);

      // Live instance-by-instance inline validation for updated fields
      setErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        Object.keys(updates).forEach((k) => {
          const field = k as keyof FormData;
          const { fieldError, relatedUpdates } = validateFieldLive(
            field,
            nextForm[field],
            nextForm
          );
          if (fieldError) {
            updatedErrors[field] = fieldError;
          } else {
            delete updatedErrors[field];
          }
          if (relatedUpdates) {
            Object.keys(relatedUpdates).forEach((rk) => {
              if (relatedUpdates[rk]) {
                updatedErrors[rk] = relatedUpdates[rk];
              } else {
                delete updatedErrors[rk];
              }
            });
          }
        });
        return updatedErrors;
      });

      return nextForm;
    });
  };

  // Update a single form field and persist
  const updateField = (field: keyof FormData, value: any) => {
    updateFields({ [field]: value });
  };

  // Toggle array item (languages) and persist
  const toggleArrayItem = (field: "languages" | "licenseCategories", item: string) => {
    setFormData((prev) => {
      const existing = prev[field] || [];
      const updated = existing.includes(item)
        ? existing.length === 1
          ? existing
          : existing.filter((i: string) => i !== item)
        : [...existing, item];
      const next = { ...prev, [field]: updated };
      saveRegistrationDraft(currentStep, next);
      return next;
    });
  };

  // Step 1: Personal & Job Info Validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fnErr = getFirstNameError(formData.firstName);
    if (fnErr) newErrors.firstName = fnErr;

    const lnErr = getLastNameError(formData.lastName);
    if (lnErr) newErrors.lastName = lnErr;

    const pErr = getPhone1Error(formData.phone1);
    if (pErr) newErrors.phone1 = pErr;

    const p2Err = getPhone2Error(formData.phone2);
    if (p2Err) newErrors.phone2 = p2Err;

    const nicErr = getNICError(formData.nic);
    if (nicErr) newErrors.nic = nicErr;

    const emailErr = getEmailError(formData.email ?? "");
    if (emailErr) newErrors.email = emailErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2: Residential & Bank Info Validation
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const hErr = getHouseNumberError(formData.houseNumber);
    if (hErr) newErrors.houseNumber = hErr;

    const sErr = getStreetNameError(formData.streetName);
    if (sErr) newErrors.streetName = sErr;

    const dErr = getDistrictError(formData.district);
    if (dErr) newErrors.district = dErr;

    const hldErr = getBankAccountHolderError(formData.bankAccountHolder);
    if (hldErr) newErrors.bankAccountHolder = hldErr;

    const numErr = getBankAccountNumberError(formData.bankAccountNumber);
    if (numErr) newErrors.bankAccountNumber = numErr;

    const cnumErr = getConfirmBankAccountNumberError(
      formData.confirmBankAccountNumber,
      formData.bankAccountNumber
    );
    if (cnumErr) newErrors.confirmBankAccountNumber = cnumErr;

    const bErr = getBankNameError(formData.bankName);
    if (bErr) newErrors.bankName = bErr;

    const brErr = getBankBranchError(formData.bankBranch);
    if (brErr) newErrors.bankBranch = brErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3: License & Insurance Info Validation
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const licErr = getDrivingLicenseError(formData.licenseNumber);
    if (licErr) newErrors.licenseNumber = licErr;

    const cLicErr = getConfirmDrivingLicenseError(
      formData.confirmLicenseNumber,
      formData.licenseNumber
    );
    if (cLicErr) newErrors.confirmLicenseNumber = cLicErr;

    const insErr = getInsurancePolicyNumberError(formData.insurancePolicyNumber);
    if (insErr) newErrors.insurancePolicyNumber = insErr;

    const cInsErr = getConfirmInsurancePolicyNumberError(
      formData.confirmInsurancePolicyNumber,
      formData.insurancePolicyNumber
    );
    if (cInsErr) newErrors.confirmInsurancePolicyNumber = cInsErr;

    const expErr = getInsuranceExpiryError(formData.insuranceExpiry);
    if (expErr) newErrors.insuranceExpiry = expErr;

    // Required license and insurance photo validation
    if (!formData.licenseFrontPhoto) {
      newErrors.licenseFrontPhoto = "Front image of driving license is required";
    }
    if (!formData.licenseBackPhoto) {
      newErrors.licenseBackPhoto = "Back image of driving license is required";
    }
    if (!formData.insuranceFrontPhoto) {
      newErrors.insuranceFrontPhoto = "Front image of insurance certificate is required";
    }
    if (!formData.insuranceBackPhoto) {
      newErrors.insuranceBackPhoto = "Back image of insurance certificate is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 4: Vehicle Info Validation & Open Submit Confirmation Modal
  const handleFinalSubmit = () => {
    const newErrors: Record<string, string> = {};
    const vehErr = getVehicleNumberError(formData.vehicleNumber);
    if (vehErr) newErrors.vehicleNumber = vehErr;

    const cVehErr = getConfirmVehicleNumberError(
      formData.confirmVehicleNumber,
      formData.vehicleNumber
    );
    if (cVehErr) newErrors.confirmVehicleNumber = cVehErr;

    // Vehicle type validation
    const typeErr = getVehicleTypeError(formData.vehicleType);
    if (typeErr) newErrors.vehicleType = typeErr;

    // Required vehicle photos validation
    if (!formData.vehicleFrontPhoto) {
      newErrors.vehicleFrontPhoto = "Front image of vehicle is required";
    }
    if (!formData.vehicleBackPhoto) {
      newErrors.vehicleBackPhoto = "Back image of vehicle is required";
    }
    if (!formData.vehicleLeftSidePhoto) {
      newErrors.vehicleLeftSidePhoto = "Left side image of vehicle is required";
    }
    if (!formData.vehicleRightSidePhoto) {
      newErrors.vehicleRightSidePhoto = "Right side image of vehicle is required";
    }

    const decErr = getAgreeDeclarationError(formData.agreeDeclaration);
    if (decErr) newErrors.agreeDeclaration = decErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showAlert(
        "Required Fields",
        "Please complete all mandatory vehicle details, upload required photos, and accept declarations."
      );
      return;
    }

    // Validation passed -> Open confirmation popup
    setIsSubmitConfirmModalVisible(true);
  };

  // Confirmed final submit action
  const handleConfirmSubmit = async () => {
    setIsSubmitConfirmModalVisible(false);
    setIsSubmitting(true);
    setSubmitProgressText("Submitting application...");

    try {
      const result = await submitDriverRegistration(formData, (statusMsg) => {
        setSubmitProgressText(statusMsg);
      });

      // Complete success: remove draft from SQLite and show success modal
      await clearRegistrationDraft();
      setIsSubmitting(false);
      setIsSuccessModalVisible(true);
    } catch (err: any) {
      setIsSubmitting(false);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit registration. Please check your internet connection and try again.";
      showAlert("Submission Failed", errorMessage, "error");
    }
  };

  // Navigation between steps
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        const nextStep = 2;
        setCurrentStep(nextStep);
        saveRegistrationDraft(nextStep, formData);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        showAlert(
          "Required Fields",
          "Please complete all mandatory credentials and fix any invalid fields before continuing."
        );
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        const nextStep = 3;
        setCurrentStep(nextStep);
        saveRegistrationDraft(nextStep, formData);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        showAlert(
          "Required Fields",
          "Please complete all required residential & bank fields."
        );
      }
    } else if (currentStep === 3) {
      if (validateStep3()) {
        const nextStep = 4;
        setCurrentStep(nextStep);
        saveRegistrationDraft(nextStep, formData);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        showAlert(
          "Required Fields",
          "Please fill in your driving license and insurance information, and upload all required documents."
        );
      }
    } else if (currentStep === 4) {
      handleFinalSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveRegistrationDraft(prevStep, formData);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      // Step 1: Check if user has entered data before leaving
      if (isFormDirty(formData)) {
        setIsDiscardModalVisible(true);
      } else {
        navigation.goBack();
      }
    }
  };

  // Confirmed discard and exit
  const handleConfirmDiscard = async () => {
    setIsDiscardModalVisible(false);
    await clearRegistrationDraft();
    setFormData(INITIAL_FORM_DATA);
    navigation.goBack();
  };

  // Image picking & background upload
  const getCategoryForField = (
    field: keyof FormData
  ): "profile" | "license" | "insurance" | "vehicle" | "documents" => {
    if (field === "profilePhoto") return "profile";
    if (field.startsWith("license")) return "license";
    if (field.startsWith("insurance")) return "insurance";
    if (field.startsWith("vehicle")) return "vehicle";
    return "documents";
  };

  const processImageSelected = (field: keyof FormData, uri: string) => {
    // 1. Immediately display local preview
    updateField(field, uri);

    // 2. Perform background upload to Cloudflare R2
    const category = getCategoryForField(field);
    uploadRegistrationDocument(uri, category)
      .then((r2Url) => {
        if (r2Url) {
          updateField(field, r2Url);
        }
      })
      .catch((err) => {
        console.warn(`Background upload for ${String(field)} will complete on submit:`, err?.message || err);
      });
  };

  const openImagePicker = (field: keyof FormData) => {
    setActivePhotoField(field);
    setImagePickerModalVisible(true);
  };

  const handleLaunchCamera = async () => {
    setImagePickerModalVisible(false);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showAlert("Permission Denied", "Camera permission is required to capture photos.", "error");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: activePhotoField === "profilePhoto" ? [1, 1] : [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri && activePhotoField) {
        let uri = result.assets[0].uri;
        if (!isAllowedImageUri(uri)) {
          showAlert("Invalid File Format", "Only .jpg, .jpeg, .png, and .heic files are allowed.", "error");
          return;
        }
        try {
          uri = await optimizeImageForUpload(uri);
        } catch (sizeErr: any) {
          showAlert("File Too Large", sizeErr?.message || "Image file size exceeds the 10MB limit.", "error");
          return;
        }
        processImageSelected(activePhotoField, uri);
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
        let uri = result.assets[0].uri;
        if (!isAllowedImageUri(uri)) {
          showAlert("Invalid File Format", "Only .jpg, .jpeg, .png, and .heic files are allowed.", "error");
          return;
        }
        try {
          uri = await optimizeImageForUpload(uri);
        } catch (sizeErr: any) {
          showAlert("File Too Large", sizeErr?.message || "Image file size exceeds the 10MB limit.", "error");
          return;
        }
        processImageSelected(activePhotoField, uri);
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
          progressFraction: 0.5,
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
                color: THEME.textGray,
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
            updateFields={updateFields}
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator color="#0E0E0E" size="small" style={{ marginRight: 8 }} />
                <Text style={{ color: "#0E0E0E", fontSize: 14, fontWeight: "700" }}>
                  {submitProgressText || "Submitting..."}
                </Text>
              </View>
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

      {/* Confirmation Modal when user attempts to go back from Step 1 */}
      <Modal
        visible={isDiscardModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDiscardModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#202023",
              borderRadius: 24,
              padding: 24,
              alignItems: "center",
              borderWidth: 1,
              borderColor: THEME.cardBorder,
            }}
          >
            {/* Warning Alert Icon */}
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: "rgba(247, 202, 33, 0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="alert-circle" size={36} color={THEME.primaryYellow} />
            </View>

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 19,
                fontWeight: "800",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Want to go back?
            </Text>

            <Text
              style={{
                color: THEME.textMuted,
                fontSize: 14,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 24,
              }}
            >
              All the changes you’ve made will be lost.
            </Text>

            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsDiscardModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#2E2E33",
                  borderRadius: 999,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmDiscard}
                style={{
                  flex: 1,
                  backgroundColor: THEME.primaryYellow,
                  borderRadius: 999,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#0E0E0E", fontSize: 14, fontWeight: "800" }}>
                  Leave
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ready to Submit Confirmation Modal */}
      <Modal
        visible={isSubmitConfirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSubmitConfirmModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#232324",
              borderRadius: 24,
              paddingTop: 32,
              paddingBottom: 24,
              paddingHorizontal: 20,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.08)",
              position: "relative",
            }}
          >
            {/* Top-Right Circular Close Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsSubmitConfirmModalVisible(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255, 255, 255, 0.18)",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 19,
                fontWeight: "800",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Are you ready to submit?
            </Text>

            <Text
              style={{
                color: "#D1D5DB",
                fontSize: 15,
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 24,
                paddingHorizontal: 8,
              }}
            >
              Please make sure you review it twice before submitting to avoid any rejections.
            </Text>

            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsSubmitConfirmModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#E2E8F0",
                  borderRadius: 999,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#0E0E0E", fontSize: 15, fontWeight: "700" }}>
                  Go Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmSubmit}
                style={{
                  flex: 1,
                  backgroundColor: THEME.primaryYellow,
                  borderRadius: 999,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#0E0E0E", fontSize: 15, fontWeight: "800" }}>
                  Submit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                marginBottom: 24,
              }}
            >
              Your driver registration request has been submitted for verification. Our review team will verify your credentials within 24–48 hours.
            </Text>

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

      {/* Global Custom Alert Modal */}
      <AlertModal
        visible={alertModalVisible}
        title={alertModalTitle}
        message={alertModalMessage}
        type={alertModalType}
        onClose={() => setAlertModalVisible(false)}
        duration={4000}
        autoClose={true}
      />
    </KeyboardAvoidingView>
  );
};

export default RegistrationForm;