import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useConsultations } from "@/hooks/useConsultations";
import { useCancelConsultation } from "@/hooks/useCancelConsultation";
import OverviewTab from "@/components/lawyer/dashboard/OverviewTab";
import ScheduleTab from "@/components/lawyer/dashboard/ScheduleTab";
import ConsultationsTab from "@/components/lawyer/dashboard/ConsultationsTab";
import MessagesTab from "@/components/lawyer/dashboard/MessagesTab";
import SettingsTab from "@/components/lawyer/dashboard/SettingsTab";
import DashboardHeader from "@/components/lawyer/dashboard/DashboardHeader";
import OverviewStats from "@/components/lawyer/dashboard/OverviewStats";
import CancelConsultationDialog from "@/components/lawyer/dashboard/dialogs/CancelConsultationDialog";
import UnsavedChangesDialog from "@/components/lawyer/dashboard/dialogs/UnsavedChangesDialog";
import DeleteConversationDialog from "@/components/lawyer/dashboard/dialogs/DeleteConversationDialog";
import DeleteDocumentDialog from "@/components/lawyer/dashboard/dialogs/DeleteDocumentDialog";
import SecurityDialogs from "@/components/lawyer/dashboard/dialogs/SecurityDialogs";
import RescheduleDialog from "@/components/lawyer/dashboard/dialogs/RescheduleDialog";
import { countryConfig, getServiceAreas } from "@/config/country";
import {
  BASE_LANGUAGE_OPTIONS,
  FEE_MODEL_OPTIONS,
  MAX_BIO_LENGTH,
  MAX_EDUCATION_LENGTH,
  MEETING_TYPE_OPTIONS,
  SLOT_DURATION_OPTIONS,
  TIMEZONE_OPTIONS,
  VALID_LAWYER_TABS,
} from "@/components/lawyer/dashboard/constants";
import { getLawyerStorageKey } from "@/components/lawyer/dashboard/storage";
import useLawyerOverview from "@/hooks/lawyer-dashboard/useLawyerOverview";
import useLawyerConsultations from "@/hooks/lawyer-dashboard/useLawyerConsultations";
import useLawyerMessages from "@/hooks/lawyer-dashboard/useLawyerMessages";
import useLawyerSettings from "@/hooks/lawyer-dashboard/useLawyerSettings";
import type { Consultation } from "@/components/lawyer/dashboard/types";

const LawyerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, fetchProfile } = useProfile();
  const { fetchLawyerConsultations } = useConsultations();
  const { cancelConsultation: cancelConsultationHandler } = useCancelConsultation();

  const [user, setUser] = useState<any>(null);
  const [lawyerProfile, setLawyerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const serviceAreas = getServiceAreas();

  const settings = useLawyerSettings({
    user,
    lawyerProfile,
    setLawyerProfile,
    profile: profile || null,
    fetchProfile,
    toast,
    serviceAreas,
    countryCode: countryConfig.code,
    defaultTimezone: countryConfig.timezone,
  });

  const overview = useLawyerOverview({
    userId: user?.id || null,
    lawyerProfileId: lawyerProfile?.id || null,
    activeTab,
    toast,
  });

  const consultations = useLawyerConsultations({
    userId: user?.id || null,
    lawyerProfile,
    profile: profile || null,
    toast,
    fetchLawyerConsultations,
    cancelConsultationHandler,
    refreshOverviewStats: overview.refreshOverviewStats,
  });

  const messages = useLawyerMessages({
    userId: user?.id || null,
    lawyerProfileId: lawyerProfile?.id || null,
    activeTab,
    toast,
  });

  const handleMessageClient = async (consultation: Consultation) => {
    if (!consultation.client_id) {
      toast({
        title: "Client not available",
        description: "We couldn't identify the client for this consultation.",
        variant: "destructive",
      });
      return;
    }
    setActiveTab("messages");
    await messages.startConversationWithClient(consultation.client_id);
  };

  const allLanguageOptions = [...BASE_LANGUAGE_OPTIONS, ...settings.customLanguageOptions];

  const handleTabChange = (value: string) => {
    if (activeTab === "settings" && settings.isDirty && value !== "settings") {
      setPendingTab(value);
      setUnsavedDialogOpen(true);
      return;
    }
    setActiveTab(value);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(getLawyerStorageKey(user?.id || null, "activeTab"));
    if (stored && VALID_LAWYER_TABS.includes(stored as any)) {
      setActiveTab(stored);
    }
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getLawyerStorageKey(user?.id || null, "activeTab"), activeTab);
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (!settings.isDirty && pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }, [settings.isDirty, pendingTab]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access your dashboard",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "lawyer")
      .maybeSingle();

    if (!roleData) {
      toast({
        title: "Access denied",
        description: "You need lawyer permissions to access this page",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setUser(user);
    const [, lawyerProfileData] = await Promise.all([
      fetchProfile(user.id),
      settings.fetchLawyerProfile(user.id),
      consultations.fetchConsultations(user.id),
    ]);
    if (lawyerProfileData?.id) {
      await overview.refreshOverviewStats(lawyerProfileData.id);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && user && !lawyerProfile) {
      navigate("/onboarding/lawyer");
    }
  }, [loading, user, lawyerProfile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto pt-24 pb-20 px-4 text-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!lawyerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto pt-24 pb-20 px-4 text-center">
          <p className="text-muted-foreground">Redirecting to onboarding...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <CancelConsultationDialog
        open={consultations.cancelDialogOpen}
        onOpenChange={consultations.setCancelDialogOpen}
        consultation={consultations.consultationToCancel}
        onConfirm={consultations.handleCancelConfirm}
        formatConsultationDateTime={consultations.formatConsultationDateTime}
      />

      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        onOpenChange={setUnsavedDialogOpen}
        isDiscarding={settings.isDiscarding}
        onCancel={() => setPendingTab(null)}
        onDiscard={async () => {
          const ok = await settings.discardSettingsChanges();
          if (ok) {
            setUnsavedDialogOpen(false);
            if (pendingTab) {
              setActiveTab(pendingTab);
              setPendingTab(null);
            }
          }
        }}
        onSave={() => {
          if (settings.formRef.current) {
            settings.formRef.current.requestSubmit();
          }
          setUnsavedDialogOpen(false);
        }}
      />

      <DeleteConversationDialog
        deleteConversationId={messages.deleteConversationDialogProps.deleteConversationId}
        setDeleteConversationId={messages.deleteConversationDialogProps.setDeleteConversationId}
        deletingConversation={messages.deleteConversationDialogProps.deletingConversation}
        handleDeleteConversation={messages.deleteConversationDialogProps.handleDeleteConversation}
      />

      <DeleteDocumentDialog
        open={settings.deleteDocDialogOpen}
        onOpenChange={settings.setDeleteDocDialogOpen}
        docToDelete={settings.docToDelete}
        setDocToDelete={settings.setDocToDelete}
        onRemove={settings.handleVerificationRemove}
      />

      <SecurityDialogs
        passwordDialogOpen={settings.passwordDialogOpen}
        setPasswordDialogOpen={settings.setPasswordDialogOpen}
        emailDialogOpen={settings.emailDialogOpen}
        setEmailDialogOpen={settings.setEmailDialogOpen}
        securityLoading={settings.securityLoading}
        currentPassword={settings.currentPassword}
        setCurrentPassword={settings.setCurrentPassword}
        newPassword={settings.newPassword}
        setNewPassword={settings.setNewPassword}
        confirmPassword={settings.confirmPassword}
        setConfirmPassword={settings.setConfirmPassword}
        newEmail={settings.newEmail}
        setNewEmail={settings.setNewEmail}
        handleChangePassword={settings.handleChangePassword}
        handleChangeEmail={settings.handleChangeEmail}
      />

      <RescheduleDialog
        open={consultations.rescheduleDialogOpen}
        onOpenChange={consultations.setRescheduleDialogOpen}
        consultation={consultations.consultationToReschedule}
        rescheduleDate={consultations.rescheduleDate}
        setRescheduleDate={consultations.setRescheduleDate}
        rescheduleSlots={consultations.rescheduleSlots}
        rescheduleSlotId={consultations.rescheduleSlotId}
        setRescheduleSlotId={consultations.setRescheduleSlotId}
        rescheduleReason={consultations.rescheduleReason}
        setRescheduleReason={consultations.setRescheduleReason}
        rescheduling={consultations.rescheduling}
        formatConsultationDateTime={consultations.formatConsultationDateTime}
        formatConsultationTime={consultations.formatConsultationTime}
        onConfirm={consultations.handleConfirmReschedule}
      />

      <section className="pt-24 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <DashboardHeader
            profile={profile || null}
            upcomingConsultations={consultations.upcomingConsultations}
            pendingConsultations={consultations.pendingConsultations}
            formatConsultationDateTime={consultations.formatConsultationDateTime}
            onReviewPending={() => setActiveTab("consultations")}
          />

          <OverviewStats
            consultationsLoading={consultations.consultationsLoading}
            upcomingConsultations={consultations.upcomingConsultations}
            todayConsultations={consultations.todayConsultations}
            availabilityLoading={overview.availabilityLoading}
            availableSlotsCount={overview.availableSlots.length}
            availabilityError={overview.availabilityError}
            profileViewsLoading={overview.profileViewsLoading}
            profileViews={overview.profileViews}
            profileViewsError={overview.profileViewsError}
          />

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="inline-flex">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="consultations">Consultations</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="settings">Settings{settings.isDirty ? " *" : ""}</TabsTrigger>
              </TabsList>
            </div>

            <OverviewTab
              lastOverviewRefreshFailedAt={overview.lastOverviewRefreshFailedAt}
              lastOverviewRefreshAt={overview.lastOverviewRefreshAt}
              overviewRefreshing={overview.overviewRefreshing}
              canRefresh={Boolean(lawyerProfile?.id)}
              onRefresh={() => lawyerProfile?.id && overview.refreshOverviewStats(lawyerProfile.id)}
              profileViewsError={overview.profileViewsError}
              availabilityError={overview.availabilityError}
              overviewScheduleRange={overview.overviewScheduleRange}
              onOverviewScheduleRangeChange={overview.setOverviewScheduleRange}
              upcomingConsultations={consultations.upcomingConsultations}
              todayConsultations={consultations.todayConsultations}
              consultationsLoading={consultations.consultationsLoading}
              formatConsultationTime={consultations.formatConsultationTime}
              getMeetingLink={consultations.getMeetingLink}
              isWithinJoinWindow={consultations.isWithinJoinWindow}
              onViewSchedule={() => setActiveTab("consultations")}
              onViewMessages={() => setActiveTab("messages")}
              onEditProfile={() => setActiveTab("settings")}
              onViewProfile={() => lawyerProfile?.id && navigate(`/lawyers/${lawyerProfile.id}`)}
              lawyerProfile={lawyerProfile}
            />

            <ScheduleTab
              lawyerProfileId={lawyerProfile?.id}
              lawyerProfileTimezone={lawyerProfile?.timezone}
              lawyerProfileSlotDuration={lawyerProfile?.slot_duration_minutes}
            />

            <ConsultationsTab
              statusFilter={consultations.statusFilter}
              onStatusFilterChange={consultations.setStatusFilter}
              dateRangeFilter={consultations.dateRangeFilter}
              onDateRangeFilterChange={consultations.setDateRangeFilter}
              practiceAreaFilter={consultations.practiceAreaFilter}
              onPracticeAreaFilterChange={consultations.setPracticeAreaFilter}
              practiceAreaOptions={consultations.practiceAreaOptions}
              resetScheduleFilters={consultations.resetScheduleFilters}
              filteredUpcoming={consultations.filteredUpcoming}
              displayedUpcoming={consultations.displayedUpcoming}
              filteredPast={consultations.filteredPast}
              displayedPast={consultations.displayedPast}
              showAllUpcoming={consultations.showAllUpcoming}
              onToggleShowAllUpcoming={() =>
                consultations.setShowAllUpcoming((prev: boolean) => !prev)
              }
              showAllPast={consultations.showAllPast}
              onToggleShowAllPast={() =>
                consultations.setShowAllPast((prev: boolean) => !prev)
              }
              formatConsultationDateTime={consultations.formatConsultationDateTime}
              getLawyerTimezone={consultations.getLawyerTimezone}
              getMeetingLink={consultations.getMeetingLink}
              isWithinJoinWindow={consultations.isWithinJoinWindow}
              onUpdateStatus={consultations.updateConsultationStatus}
              onReschedule={consultations.handleReschedule}
              onCancel={consultations.handleCancelClick}
              onMessageClient={handleMessageClient}
            />

            <MessagesTab {...messages.messagesTabProps} />

            <SettingsTab
              isDirty={settings.isDirty}
              isSaving={settings.isSaving}
              isDiscarding={settings.isDiscarding}
              settingsLoading={settings.settingsLoading}
              formRef={settings.formRef}
              formData={settings.formData}
              setFormData={settings.setFormData}
              formErrors={settings.formErrors}
              markDirty={settings.markDirty}
              handleSubmit={settings.handleSubmit}
              lawyerExpertise={settings.lawyerExpertise}
              profile={profile || null}
              lawyerProfile={lawyerProfile}
              getVerificationDocuments={settings.getVerificationDocuments}
              handleVerificationUpload={settings.handleVerificationUpload}
              handleVerificationReplace={settings.handleVerificationReplace}
              handleResubmitVerification={settings.handleResubmitVerification}
              verificationBucketChecked={settings.verificationBucketChecked}
              verificationBucketExists={settings.verificationBucketExists}
              verificationUploading={settings.verificationUploading}
              setDocToDelete={settings.setDocToDelete}
              setDeleteDocDialogOpen={settings.setDeleteDocDialogOpen}
              timezoneOptions={TIMEZONE_OPTIONS}
              customLanguage={settings.customLanguage}
              setCustomLanguage={settings.setCustomLanguage}
              addCustomLanguage={settings.addCustomLanguage}
              allLanguageOptions={allLanguageOptions}
              toggleLanguageSelection={settings.toggleLanguageSelection}
              meetingTypeOptions={MEETING_TYPE_OPTIONS}
              feeModelOptions={FEE_MODEL_OPTIONS}
              slotDurationOptions={SLOT_DURATION_OPTIONS}
              serviceAreas={serviceAreas}
              getAddressHelpText={settings.getAddressHelpText}
              countryCode={countryConfig.code}
              maxBioLength={MAX_BIO_LENGTH}
              maxEducationLength={MAX_EDUCATION_LENGTH}
              practiceAreas={settings.practiceAreas}
              practiceAreasLoading={settings.practiceAreasLoading}
              practiceAreasError={settings.practiceAreasError}
              practiceAreaYears={settings.practiceAreaYears}
              setPracticeAreaYears={settings.setPracticeAreaYears}
              practiceAreaYearsInput={settings.practiceAreaYearsInput}
              setPracticeAreaYearsInput={settings.setPracticeAreaYearsInput}
              selectedSpecificIssues={settings.selectedSpecificIssues}
              setSelectedSpecificIssues={settings.setSelectedSpecificIssues}
              specializationPracticeAreas={settings.specializationPracticeAreas}
              specializationChanges={settings.specializationChanges}
              updateSpecializationYears={settings.updateSpecializationYears}
              removeSpecialization={settings.removeSpecialization}
              addSpecialization={settings.addSpecialization}
              saveSpecializations={settings.saveSpecializations}
              isSavingSpecializations={settings.isSavingSpecializations}
              isLoadingSpecializations={settings.isLoadingSpecializations}
              saveSpecializationsRef={settings.saveSpecializationsRef}
              refreshSpecializations={settings.refreshSpecializations}
              fetchLawyerExpertise={settings.fetchLawyerExpertise}
              userId={user?.id || ""}
              setPasswordDialogOpen={settings.setPasswordDialogOpen}
              setEmailDialogOpen={settings.setEmailDialogOpen}
              uploadingAvatar={settings.uploadingAvatar}
              handleAvatarUpload={settings.handleAvatarUpload}
              discardSettingsChanges={settings.discardSettingsChanges}
            />
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LawyerDashboard;
