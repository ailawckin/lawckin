import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Scale, ChevronRight, ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { isValidServiceArea } from "@/config/country";
import { PersonalInfoStep } from "@/components/lawyer/onboarding/PersonalInfoStep";
import { CredentialsStep } from "@/components/lawyer/onboarding/CredentialsStep";
import { PracticeInfoStep } from "@/components/lawyer/onboarding/PracticeInfoStep";
import { ExpertiseStep } from "@/components/lawyer/onboarding/ExpertiseStep";
import { ServiceLocationStep } from "@/components/lawyer/onboarding/ServiceLocationStep";
import { RatesFeesStep } from "@/components/lawyer/onboarding/RatesFeesStep";
import { TierStep } from "@/components/lawyer/onboarding/TierStep";
import { ReviewStep } from "@/components/lawyer/onboarding/ReviewStep";

const TOTAL_STEPS = 8;

const LawyerOnboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const [serviceLocation, setServiceLocation] = useState<string>("");
  const [streetAddress, setStreetAddress] = useState<string>("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [hourlyMin, setHourlyMin] = useState("");
  const [hourlyMax, setHourlyMax] = useState("");
  const [feeModels, setFeeModels] = useState<string[]>(["hourly"]);
  const [tier, setTier] = useState("basic");
  const [expertiseYears, setExpertiseYears] = useState<Record<string, number>>({});

  const progress = (step / TOTAL_STEPS) * 100;

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("lawyer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      navigate("/lawyer-dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const handleNext = () => {
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const toggleArrayItem = (arr: string[], setArr: (next: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter((value) => value !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          bio,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (!serviceLocation || !isValidServiceArea(serviceLocation)) {
        toast({
          title: "Invalid location",
          description: "Please select a valid service area.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const normalizedPracticeAreas =
        practiceAreas.length > 0 ? practiceAreas : specialty ? [specialty] : [];
      const primaryPracticeArea = normalizedPracticeAreas[0] || specialty;
      const profileData: any = {
        user_id: user.id,
        specialty: primaryPracticeArea,
        bar_number: barNumber,
        practice_areas: normalizedPracticeAreas,
        location: serviceLocation,
        ny_locations: serviceLocation ? [serviceLocation] : [],
        languages,
        hourly_min: Number.parseFloat(hourlyMin) || null,
        hourly_max: Number.parseFloat(hourlyMax) || null,
        fee_models: feeModels,
        tier,
        verification_status: "pending",
        status: "active",
      };

      if (streetAddress) {
        profileData.address_street = streetAddress;
        profileData.street_address = streetAddress;
      }

      const { data: lawyerProfile, error } = await supabase
        .from("lawyer_profiles")
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;

      if (lawyerProfile && Object.keys(expertiseYears).length > 0) {
        const { data: areas } = await supabase
          .from("practice_areas")
          .select("id, name")
          .in("name", normalizedPracticeAreas);

        if (areas && areas.length > 0) {
          const expertiseRecords = areas
            .filter((area) => expertiseYears[area.name] > 0)
            .map((area) => ({
              lawyer_id: lawyerProfile.id,
              practice_area_id: area.id,
              years_experience: expertiseYears[area.name],
            }));

          if (expertiseRecords.length > 0) {
            const { error: expertiseError } = await supabase
              .from("lawyer_expertise")
              .insert(expertiseRecords);

            if (expertiseError) {
              console.error("Error inserting expertise:", expertiseError);
            }
          }
        }
      }

      toast({
        title: "Profile submitted!",
        description: "Your profile is under review. We'll notify you once approved.",
      });

      navigate("/lawyer-dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <PersonalInfoStep
            fullName={fullName}
            phone={phone}
            bio={bio}
            onFullNameChange={setFullName}
            onPhoneChange={setPhone}
            onBioChange={setBio}
          />
        );
      case 2:
        return <CredentialsStep barNumber={barNumber} onBarNumberChange={setBarNumber} />;
      case 3:
        return (
          <PracticeInfoStep
            specialty={specialty}
            practiceAreas={practiceAreas}
            onSpecialtyChange={setSpecialty}
            onTogglePracticeArea={(area) => toggleArrayItem(practiceAreas, setPracticeAreas, area)}
          />
        );
      case 4:
        return (
          <ExpertiseStep
            practiceAreas={practiceAreas}
            expertiseYears={expertiseYears}
            onExpertiseChange={(area, years) =>
              setExpertiseYears({
                ...expertiseYears,
                [area]: years,
              })
            }
          />
        );
      case 5:
        return (
          <ServiceLocationStep
            serviceLocation={serviceLocation}
            streetAddress={streetAddress}
            languages={languages}
            onServiceLocationChange={setServiceLocation}
            onStreetAddressChange={setStreetAddress}
            onToggleLanguage={(language) => toggleArrayItem(languages, setLanguages, language)}
          />
        );
      case 6:
        return (
          <RatesFeesStep
            hourlyMin={hourlyMin}
            hourlyMax={hourlyMax}
            feeModels={feeModels}
            onHourlyMinChange={setHourlyMin}
            onHourlyMaxChange={setHourlyMax}
            onToggleFeeModel={(model) => toggleArrayItem(feeModels, setFeeModels, model)}
          />
        );
      case 7:
        return <TierStep tier={tier} onTierChange={setTier} />;
      case 8:
        return (
          <ReviewStep
            fullName={fullName}
            barNumber={barNumber}
            specialty={specialty}
            serviceLocation={serviceLocation}
            streetAddress={streetAddress}
            hourlyMin={hourlyMin}
            hourlyMax={hourlyMax}
            tier={tier}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold brand-wordmark">Lawckin</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Lawyer Onboarding</h1>
          <p className="text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </p>
          <Progress value={progress} className="mt-4" />
        </div>

        <div className="elegant-card">
          {renderStep()}

          <div className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={handleNext} disabled={step === 5 && !serviceLocation}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !serviceLocation}>
                {loading ? "Submitting..." : "Submit Profile"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerOnboarding;
