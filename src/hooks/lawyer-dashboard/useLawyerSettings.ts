import { useEffect, useRef, useState } from "react";
import { useLawyerSpecializations } from "@/hooks/useLawyerSpecializations";
import type { ProfileSummary } from "@/components/lawyer/dashboard/types";
import { useSettingsAvatar } from "@/hooks/lawyer-dashboard/settings/useSettingsAvatar";
import { useSettingsLanguages } from "@/hooks/lawyer-dashboard/settings/useSettingsLanguages";
import { useSettingsPracticeAreas } from "@/hooks/lawyer-dashboard/settings/useSettingsPracticeAreas";
import { useSettingsProfileData } from "@/hooks/lawyer-dashboard/settings/useSettingsProfileData";
import { useSettingsSecurity } from "@/hooks/lawyer-dashboard/settings/useSettingsSecurity";
import { useSettingsSubmit } from "@/hooks/lawyer-dashboard/settings/useSettingsSubmit";
import { useSettingsVerification } from "@/hooks/lawyer-dashboard/settings/useSettingsVerification";
import { getAddressHelpText, getAddressValidationError } from "@/hooks/lawyer-dashboard/settings/utils";

interface UseLawyerSettingsArgs {
  user: any | null;
  lawyerProfile: any | null;
  setLawyerProfile: (value: any) => void;
  profile: ProfileSummary | null;
  fetchProfile: (userId: string) => Promise<void>;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
  serviceAreas: string[];
  countryCode: string;
  defaultTimezone?: string | null;
}

export const useLawyerSettings = ({
  user,
  lawyerProfile,
  setLawyerProfile,
  fetchProfile,
  toast,
  serviceAreas,
  countryCode,
  defaultTimezone,
}: UseLawyerSettingsArgs) => {
  const [formData, setFormData] = useState({
    full_name: "",
    specialty: [] as string[],
    experience_years: 0,
    hourly_rate: 0,
    bar_number: "",
    certifications: [] as string[],
    accepting_new_clients: true,
    profile_visible: true,
    notify_email: true,
    notify_sms: false,
    notify_consultation_reminders: true,
    notify_new_messages: true,
    notify_marketing: false,
    slot_duration_minutes: 30,
    timezone: defaultTimezone || "",
    languages: [] as string[],
    meeting_types: [] as string[],
    fee_models: [] as string[],
    fee_model_rates: {} as Record<string, string>,
    bio: "",
    education: "",
    location: [] as string[],
    address_street: "",
    address_unit: "",
    address_city: "",
    address_state: "",
    address_postal_code: "",
    address_country: countryCode === "ch" ? "Switzerland" : "United States",
  });

  const defaultFormErrors = {
    hourlyRate: "",
    experienceYears: "",
    address: "",
    bio: "",
    education: "",
    timezone: "",
  };
  const [formErrors, setFormErrors] = useState(defaultFormErrors);

  const [isDirty, setIsDirty] = useState(false);

  const markDirty = () => {
    if (!isDirty) {
      setIsDirty(true);
    }
  };

  const saveSpecializationsRef = useRef<(() => Promise<void>) | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    practiceAreas: specializationPracticeAreas,
    isLoading: isLoadingSpecializations,
    isSaving: isSavingSpecializations,
    localChanges: specializationChanges,
    updateYears: updateSpecializationYears,
    removeSpecialization,
    addSpecialization,
    saveChanges: saveSpecializations,
    refresh: refreshSpecializations,
  } = useLawyerSpecializations(lawyerProfile?.id || null);

  const languageSettings = useSettingsLanguages({ formData, setFormData, markDirty });
  const practiceAreasState = useSettingsPracticeAreas();
  const avatarSettings = useSettingsAvatar({ user, toast, fetchProfile });
  const securitySettings = useSettingsSecurity({ user, toast });
  const verificationSettings = useSettingsVerification({ lawyerProfile, setLawyerProfile, toast });

  const profileData = useSettingsProfileData({
    user,
    lawyerProfile,
    setLawyerProfile,
    formData,
    setFormData,
    serviceAreas,
    countryCode,
    defaultFormErrors,
    setFormErrors,
    setCustomLanguageOptions: languageSettings.setCustomLanguageOptions,
    setCustomLanguage: languageSettings.setCustomLanguage,
    refreshSpecializations,
    setIsDirty,
    toast,
  });

  const submitSettings = useSettingsSubmit({
    user,
    lawyerProfile,
    formData,
    selectedSpecificIssues: profileData.selectedSpecificIssues,
    practiceAreaYears: profileData.practiceAreaYears,
    serviceAreas,
    defaultFormErrors,
    setFormErrors,
    setIsDirty,
    fetchProfile,
    fetchLawyerProfile: profileData.fetchLawyerProfile,
    toast,
    saveSpecializationsRef,
    getAddressValidation: (postalCode: string, stateValue: string) =>
      getAddressValidationError(countryCode, postalCode, stateValue),
  });

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    customLanguage: languageSettings.customLanguage,
    setCustomLanguage: languageSettings.setCustomLanguage,
    customLanguageOptions: languageSettings.customLanguageOptions,
    setCustomLanguageOptions: languageSettings.setCustomLanguageOptions,
    addCustomLanguage: languageSettings.addCustomLanguage,
    toggleLanguageSelection: languageSettings.toggleLanguageSelection,
    practiceAreas: practiceAreasState.practiceAreas,
    practiceAreasLoading: practiceAreasState.practiceAreasLoading,
    practiceAreasError: practiceAreasState.practiceAreasError,
    lawyerExpertise: profileData.lawyerExpertise,
    practiceAreaYears: profileData.practiceAreaYears,
    setPracticeAreaYears: profileData.setPracticeAreaYears,
    practiceAreaYearsInput: profileData.practiceAreaYearsInput,
    setPracticeAreaYearsInput: profileData.setPracticeAreaYearsInput,
    practiceAreaIds: profileData.practiceAreaIds,
    setPracticeAreaIds: profileData.setPracticeAreaIds,
    selectedSpecificIssues: profileData.selectedSpecificIssues,
    setSelectedSpecificIssues: profileData.setSelectedSpecificIssues,
    specializationPracticeAreas,
    specializationChanges,
    updateSpecializationYears,
    removeSpecialization,
    addSpecialization,
    saveSpecializations,
    isSavingSpecializations,
    isLoadingSpecializations,
    saveSpecializationsRef,
    refreshSpecializations,
    fetchLawyerExpertise: profileData.fetchLawyerExpertise,
    formRef,
    isDirty,
    isSaving: submitSettings.isSaving,
    isDiscarding: profileData.isDiscarding,
    settingsLoading: profileData.settingsLoading,
    markDirty,
    discardSettingsChanges: profileData.discardSettingsChanges,
    handleSubmit: submitSettings.handleSubmit,
    uploadingAvatar: avatarSettings.uploadingAvatar,
    handleAvatarUpload: avatarSettings.handleAvatarUpload,
    getVerificationDocuments: verificationSettings.getVerificationDocuments,
    handleVerificationUpload: verificationSettings.handleVerificationUpload,
    handleVerificationReplace: verificationSettings.handleVerificationReplace,
    handleVerificationRemove: verificationSettings.handleVerificationRemove,
    handleResubmitVerification: verificationSettings.handleResubmitVerification,
    verificationUploading: verificationSettings.verificationUploading,
    verificationBucketChecked: verificationSettings.verificationBucketChecked,
    verificationBucketExists: verificationSettings.verificationBucketExists,
    deleteDocDialogOpen: verificationSettings.deleteDocDialogOpen,
    setDeleteDocDialogOpen: verificationSettings.setDeleteDocDialogOpen,
    docToDelete: verificationSettings.docToDelete,
    setDocToDelete: verificationSettings.setDocToDelete,
    passwordDialogOpen: securitySettings.passwordDialogOpen,
    setPasswordDialogOpen: securitySettings.setPasswordDialogOpen,
    emailDialogOpen: securitySettings.emailDialogOpen,
    setEmailDialogOpen: securitySettings.setEmailDialogOpen,
    securityLoading: securitySettings.securityLoading,
    currentPassword: securitySettings.currentPassword,
    setCurrentPassword: securitySettings.setCurrentPassword,
    newPassword: securitySettings.newPassword,
    setNewPassword: securitySettings.setNewPassword,
    confirmPassword: securitySettings.confirmPassword,
    setConfirmPassword: securitySettings.setConfirmPassword,
    newEmail: securitySettings.newEmail,
    setNewEmail: securitySettings.setNewEmail,
    handleChangePassword: securitySettings.handleChangePassword,
    handleChangeEmail: securitySettings.handleChangeEmail,
    getAddressHelpText: () => getAddressHelpText(countryCode),
    fetchLawyerProfile: profileData.fetchLawyerProfile,
  };
};

export default useLawyerSettings;
