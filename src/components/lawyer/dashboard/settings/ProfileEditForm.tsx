import { useState, type ChangeEvent, type FormEvent, type MutableRefObject, type RefObject } from "react";
import { Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import type {
  PracticeAreaOption,
  ProfileSummary,
  SettingsFormData,
  SettingsFormErrors,
  SpecializationPracticeArea,
} from "@/components/lawyer/dashboard/types";
import SpecialtiesSection from "@/components/lawyer/dashboard/settings/SpecialtiesSection";

interface ProfileEditFormProps {
  formRef: RefObject<HTMLFormElement>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  markDirty: () => void;
  formData: SettingsFormData;
  setFormData: (value: SettingsFormData | ((prev: SettingsFormData) => SettingsFormData)) => void;
  formErrors: SettingsFormErrors;
  serviceAreas: string[];
  getAddressHelpText: () => string;
  countryCode: string;
  maxBioLength: number;
  maxEducationLength: number;
  uploadingAvatar: boolean;
  handleAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  profile: ProfileSummary | null;
  practiceAreas: PracticeAreaOption[];
  practiceAreasLoading: boolean;
  practiceAreasError: string;
  practiceAreaYears: Record<string, number>;
  setPracticeAreaYears: (value: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  practiceAreaYearsInput: Record<string, string>;
  setPracticeAreaYearsInput: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  selectedSpecificIssues: Record<string, string[]>;
  setSelectedSpecificIssues: (value: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void;
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
  lawyerProfileId?: string | null;
}

const ProfileEditForm = ({
  formRef,
  handleSubmit,
  markDirty,
  formData,
  setFormData,
  formErrors,
  serviceAreas,
  getAddressHelpText,
  countryCode,
  maxBioLength,
  maxEducationLength,
  uploadingAvatar,
  handleAvatarUpload,
  profile,
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
  lawyerProfileId,
}: ProfileEditFormProps) => {
  const [newCertification, setNewCertification] = useState("");

  const addCertification = () => {
    const trimmed = newCertification.trim();
    if (!trimmed) return;
    if (!formData.certifications.includes(trimmed)) {
      setFormData({ ...formData, certifications: [...formData.certifications, trimmed] });
      markDirty();
    }
    setNewCertification("");
  };

  const removeCertification = (value: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((item) => item !== value),
    });
    markDirty();
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your professional information</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 pb-6 border-b">
          <Label className="mb-3 block">Profile Picture</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Lawyer"} />
              <AvatarFallback>{profile?.full_name?.[0] || "L"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
              <label htmlFor="avatar-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingAvatar}
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingAvatar ? "Uploading..." : "Upload New Picture"}
                </Button>
              </label>
            </div>
          </div>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onChange={markDirty}
          className="space-y-6"
          data-profile-form
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <Label>Years of Experience *</Label>
              <Input
                type="number"
                value={formData.experience_years}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value, 10);
                  setFormData({
                    ...formData,
                    experience_years: Number.isNaN(value) ? 0 : value,
                  });
                }}
                required
              />
              {formErrors.experienceYears && (
                <p className="text-xs text-destructive mt-1">{formErrors.experienceYears}</p>
              )}
            </div>
            <div>
              <Label>Bar Number</Label>
              <Input
                value={formData.bar_number}
                onChange={(e) => setFormData({ ...formData, bar_number: e.target.value })}
                placeholder="Enter your bar number"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used for verification and displayed in admin review.
              </p>
            </div>
            <div>
              <Label>Hourly Rate *</Label>
              <Input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => {
                  const value = Number.parseFloat(e.target.value);
                  setFormData({
                    ...formData,
                    hourly_rate: Number.isNaN(value) ? 0 : value,
                    fee_model_rates: {
                      ...formData.fee_model_rates,
                      ...(formData.fee_models.includes("Hourly")
                        ? { Hourly: e.target.value }
                        : {}),
                    },
                  });
                }}
                required
              />
              {formErrors.hourlyRate && (
                <p className="text-xs text-destructive mt-1">{formErrors.hourlyRate}</p>
              )}
            </div>
            <div className="md:col-span-2 rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Profile visibility</Label>
                  <p className="text-xs text-muted-foreground">
                    When off, your profile is hidden from client search.
                  </p>
                </div>
                <Switch
                  checked={formData.profile_visible}
                  onCheckedChange={(value) => {
                    setFormData({ ...formData, profile_visible: value });
                    markDirty();
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Accepting new clients</Label>
                  <p className="text-xs text-muted-foreground">
                    Turn this off when you're not taking new consultations.
                  </p>
                </div>
                <Switch
                  checked={formData.accepting_new_clients}
                  onCheckedChange={(value) => {
                    setFormData({ ...formData, accepting_new_clients: value });
                    markDirty();
                  }}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="serviceLocation">Service Areas *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select all areas where you provide services
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-muted/20">
                {serviceAreas.map((area) => {
                  const isSelected = formData.location.includes(area);
                  return (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${area}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              location: [...formData.location, area],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              location: formData.location.filter((loc) => loc !== area),
                            });
                          }
                          markDirty();
                        }}
                      />
                      <Label htmlFor={`location-${area}`} className="text-sm cursor-pointer flex-1">
                        {area}
                      </Label>
                    </div>
                  );
                })}
              </div>
              {formData.location.length === 0 && (
                <p className="text-sm text-destructive mt-2">Please select at least one service area</p>
              )}
            </div>
            <div className="md:col-span-2 space-y-3">
              <div>
                <Label>Business Address (Internal Use Only) *</Label>
                <p className="text-xs text-muted-foreground">{getAddressHelpText()}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Street Address *</Label>
                  <Input
                    value={formData.address_street}
                    onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                    placeholder="Street and number"
                  />
                </div>
                <div>
                  <Label>Apartment / Unit</Label>
                  <Input
                    value={formData.address_unit}
                    onChange={(e) => setFormData({ ...formData, address_unit: e.target.value })}
                    placeholder="Apt, Suite, etc."
                  />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input
                    value={formData.address_city}
                    onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label>{countryCode === "ch" ? "Canton *" : "State *"}</Label>
                  <Input
                    value={formData.address_state}
                    onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                    placeholder={countryCode === "ch" ? "Canton" : "State"}
                  />
                </div>
                <div>
                  <Label>{countryCode === "ch" ? "Postal Code *" : "ZIP Code *"}</Label>
                  <Input
                    value={formData.address_postal_code}
                    onChange={(e) => setFormData({ ...formData, address_postal_code: e.target.value })}
                    placeholder={countryCode === "ch" ? "e.g. 8001" : "e.g. 10001"}
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={formData.address_country}
                    onChange={(e) => setFormData({ ...formData, address_country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
              </div>
              {formErrors.address && (
                <p className="text-xs text-destructive mt-1">{formErrors.address}</p>
              )}
            </div>
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => {
                const next = e.target.value.slice(0, maxBioLength);
                setFormData({ ...formData, bio: next });
              }}
              rows={4}
              placeholder="Tell clients about your experience and expertise..."
            />
            <p className="text-xs text-muted-foreground mt-2">
              {formData.bio.length} / {maxBioLength} characters
            </p>
            {formData.bio.length >= maxBioLength - 50 && (
              <p className="text-xs text-amber-600">Approaching character limit.</p>
            )}
            {formErrors.bio && (
              <p className="text-xs text-destructive mt-1">{formErrors.bio}</p>
            )}
          </div>

          <div>
            <Label>Education</Label>
            <Textarea
              value={formData.education}
              onChange={(e) => {
                const next = e.target.value.slice(0, maxEducationLength);
                setFormData({ ...formData, education: next });
              }}
              rows={3}
              placeholder="List your educational background..."
            />
            <p className="text-xs text-muted-foreground mt-2">
              {formData.education.length} / {maxEducationLength} characters
            </p>
            {formData.education.length >= maxEducationLength - 25 && (
              <p className="text-xs text-amber-600">Approaching character limit.</p>
            )}
            {formErrors.education && (
              <p className="text-xs text-destructive mt-1">{formErrors.education}</p>
            )}
          </div>

          <div>
            <Label>Certifications</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Add certifications or accreditations that clients should see.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.certifications.length === 0 ? (
                <span className="text-xs text-muted-foreground">No certifications added yet.</span>
              ) : (
                formData.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs"
                  >
                    {cert}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0"
                      onClick={() => removeCertification(cert)}
                      aria-label={`Remove ${cert}`}
                    >
                      x
                    </Button>
                  </span>
                ))
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="Add certification"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCertification();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addCertification}>
                Add
              </Button>
            </div>
          </div>

          <SpecialtiesSection
            formData={formData}
            setFormData={setFormData}
            markDirty={markDirty}
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
            lawyerProfileId={lawyerProfileId}
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileEditForm;
