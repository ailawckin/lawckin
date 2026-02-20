import type {
  ChangeEvent,
  Dispatch,
  FormEvent,
  MutableRefObject,
  RefObject,
  SetStateAction,
} from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import SettingsHeader from "@/components/lawyer/dashboard/settings/SettingsHeader";
import ProfileCompletenessCard from "@/components/lawyer/dashboard/settings/ProfileCompletenessCard";
import ProfileEditForm from "@/components/lawyer/dashboard/settings/ProfileEditForm";
import VerificationDocumentsCard from "@/components/lawyer/dashboard/settings/VerificationDocumentsCard";
import SchedulingAvailabilityCard from "@/components/lawyer/dashboard/settings/SchedulingAvailabilityCard";
import NotificationPreferencesCard from "@/components/lawyer/dashboard/settings/NotificationPreferencesCard";
import SecuritySettingsCard from "@/components/lawyer/dashboard/settings/SecuritySettingsCard";
import StickySaveBar from "@/components/lawyer/dashboard/settings/StickySaveBar";
import type {
  PracticeAreaOption,
  ProfileSummary,
  SettingsFormData,
  SettingsFormErrors,
  SpecializationPracticeArea,
  VerificationDocument,
  LawyerProfileSummary,
} from "@/components/lawyer/dashboard/types";

interface SettingsTabProps {
  isDirty: boolean;
  isSaving: boolean;
  isDiscarding: boolean;
  settingsLoading: boolean;
  formRef: RefObject<HTMLFormElement>;
  formData: SettingsFormData;
  setFormData: Dispatch<SetStateAction<SettingsFormData>>;
  formErrors: SettingsFormErrors;
  markDirty: () => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  lawyerExpertise: Record<string, number>;
  profile: ProfileSummary | null;
  lawyerProfile: LawyerProfileSummary | null;
  getVerificationDocuments: () => VerificationDocument[];
  handleVerificationUpload: (docType: VerificationDocument["type"], file?: File) => void;
  handleVerificationReplace: (doc: VerificationDocument, file?: File) => void;
  handleResubmitVerification: () => void;
  verificationBucketChecked: boolean;
  verificationBucketExists: boolean;
  verificationUploading: string | null;
  setDocToDelete: (doc: VerificationDocument | null) => void;
  setDeleteDocDialogOpen: (value: boolean) => void;
  timezoneOptions: Array<{ value: string; label: string }>;
  customLanguage: string;
  setCustomLanguage: Dispatch<SetStateAction<string>>;
  addCustomLanguage: () => void;
  allLanguageOptions: string[];
  toggleLanguageSelection: (language: string) => void;
  meetingTypeOptions: string[];
  feeModelOptions: string[];
  slotDurationOptions: Array<{ value: number; label: string }>;
  serviceAreas: string[];
  getAddressHelpText: () => string;
  countryCode: string;
  maxBioLength: number;
  maxEducationLength: number;
  practiceAreas: PracticeAreaOption[];
  practiceAreasLoading: boolean;
  practiceAreasError: string;
  practiceAreaYears: Record<string, number>;
  setPracticeAreaYears: Dispatch<SetStateAction<Record<string, number>>>;
  practiceAreaYearsInput: Record<string, string>;
  setPracticeAreaYearsInput: Dispatch<SetStateAction<Record<string, string>>>;
  selectedSpecificIssues: Record<string, string[]>;
  setSelectedSpecificIssues: Dispatch<SetStateAction<Record<string, string[]>>>;
  specializationPracticeAreas: SpecializationPracticeArea[];
  specializationChanges: Record<string, number>;
  updateSpecializationYears: (specializationId: string, years: number) => void;
  removeSpecialization: (specializationId: string) => void;
  addSpecialization: (practiceAreaId: string, specializationId: string) => void;
  saveSpecializations: () => Promise<void>;
  isSavingSpecializations: boolean;
  isLoadingSpecializations: boolean;
  saveSpecializationsRef: MutableRefObject<(() => Promise<void>) | null>;
  refreshSpecializations: () => void;
  fetchLawyerExpertise: (userId: string) => Promise<void>;
  userId: string;
  setPasswordDialogOpen: (value: boolean) => void;
  setEmailDialogOpen: (value: boolean) => void;
  uploadingAvatar: boolean;
  handleAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  discardSettingsChanges: () => Promise<boolean>;
}

const SettingsTab = ({
  isDirty,
  isSaving,
  isDiscarding,
  settingsLoading,
  formRef,
  formData,
  setFormData,
  formErrors,
  markDirty,
  handleSubmit,
  lawyerExpertise,
  profile,
  lawyerProfile,
  getVerificationDocuments,
  handleVerificationUpload,
  handleVerificationReplace,
  handleResubmitVerification,
  verificationBucketChecked,
  verificationBucketExists,
  verificationUploading,
  setDocToDelete,
  setDeleteDocDialogOpen,
  timezoneOptions,
  customLanguage,
  setCustomLanguage,
  addCustomLanguage,
  allLanguageOptions,
  toggleLanguageSelection,
  meetingTypeOptions,
  feeModelOptions,
  slotDurationOptions,
  serviceAreas,
  getAddressHelpText,
  countryCode,
  maxBioLength,
  maxEducationLength,
  practiceAreas,
  practiceAreasLoading,
  practiceAreasError,
  practiceAreaYears,
  setPracticeAreaYears,
  practiceAreaYearsInput,
  setPracticeAreaYearsInput,
  selectedSpecificIssues,
  setSelectedSpecificIssues,
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
  fetchLawyerExpertise,
  userId,
  setPasswordDialogOpen,
  setEmailDialogOpen,
  uploadingAvatar,
  handleAvatarUpload,
  discardSettingsChanges,
}: SettingsTabProps) => {
  if (settingsLoading) {
    return (
      <TabsContent value="settings" className="space-y-6">
        <SettingsHeader isDirty={false} isSaving={false} formRef={formRef} />
        <div className="space-y-4">
          <div className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-3 w-56" />
          </div>
          <div className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="settings" className="space-y-6">
      <SettingsHeader isDirty={isDirty} isSaving={isSaving} formRef={formRef} />

      <ProfileCompletenessCard
        lawyerExpertise={lawyerExpertise}
        profile={profile}
        formData={formData}
      />

      <ProfileEditForm
        formRef={formRef}
        handleSubmit={handleSubmit}
        markDirty={markDirty}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        serviceAreas={serviceAreas}
        getAddressHelpText={getAddressHelpText}
        countryCode={countryCode}
        maxBioLength={maxBioLength}
        maxEducationLength={maxEducationLength}
        uploadingAvatar={uploadingAvatar}
        handleAvatarUpload={handleAvatarUpload}
        profile={profile}
        practiceAreas={practiceAreas}
        practiceAreasLoading={practiceAreasLoading}
        practiceAreasError={practiceAreasError}
        practiceAreaYears={practiceAreaYears}
        setPracticeAreaYears={setPracticeAreaYears}
        practiceAreaYearsInput={practiceAreaYearsInput}
        setPracticeAreaYearsInput={setPracticeAreaYearsInput}
        selectedSpecificIssues={selectedSpecificIssues}
        setSelectedSpecificIssues={setSelectedSpecificIssues}
        specializationPracticeAreas={specializationPracticeAreas}
        specializationChanges={specializationChanges}
        updateSpecializationYears={updateSpecializationYears}
        removeSpecialization={removeSpecialization}
        addSpecialization={addSpecialization}
        saveSpecializations={saveSpecializations}
        isSavingSpecializations={isSavingSpecializations}
        isLoadingSpecializations={isLoadingSpecializations}
        saveSpecializationsRef={saveSpecializationsRef}
        refreshSpecializations={refreshSpecializations}
        fetchLawyerExpertise={fetchLawyerExpertise}
        userId={userId}
        lawyerProfileId={lawyerProfile?.id}
      />

      <VerificationDocumentsCard
        lawyerProfile={lawyerProfile}
        verificationBucketChecked={verificationBucketChecked}
        verificationBucketExists={verificationBucketExists}
        verificationUploading={verificationUploading}
        getVerificationDocuments={getVerificationDocuments}
        handleVerificationUpload={handleVerificationUpload}
        handleVerificationReplace={handleVerificationReplace}
        handleResubmitVerification={handleResubmitVerification}
        setDocToDelete={setDocToDelete}
        setDeleteDocDialogOpen={setDeleteDocDialogOpen}
      />

      <SchedulingAvailabilityCard
        timezoneOptions={timezoneOptions}
        formData={formData}
        setFormData={setFormData}
        markDirty={markDirty}
        formErrors={formErrors}
        customLanguage={customLanguage}
        setCustomLanguage={setCustomLanguage}
        addCustomLanguage={addCustomLanguage}
        allLanguageOptions={allLanguageOptions}
        toggleLanguageSelection={toggleLanguageSelection}
        meetingTypeOptions={meetingTypeOptions}
        feeModelOptions={feeModelOptions}
        slotDurationOptions={slotDurationOptions}
      />

      <NotificationPreferencesCard
        formData={formData}
        setFormData={setFormData}
        markDirty={markDirty}
      />

      <SecuritySettingsCard
        setPasswordDialogOpen={setPasswordDialogOpen}
        setEmailDialogOpen={setEmailDialogOpen}
      />

      <StickySaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        isDiscarding={isDiscarding}
        formRef={formRef}
        discardSettingsChanges={discardSettingsChanges}
      />
    </TabsContent>
  );
};

export default SettingsTab;
