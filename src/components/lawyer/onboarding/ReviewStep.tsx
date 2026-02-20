interface ReviewStepProps {
  fullName: string;
  barNumber: string;
  specialty: string;
  serviceLocation: string;
  streetAddress: string;
  hourlyMin: string;
  hourlyMax: string;
  tier: string;
}

export function ReviewStep({
  fullName,
  barNumber,
  specialty,
  serviceLocation,
  streetAddress,
  hourlyMin,
  hourlyMax,
  tier,
}: ReviewStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Review & Submit</h2>
      <div className="space-y-3 text-sm">
        <div>
          <div className="font-semibold">Name:</div>
          <div className="text-muted-foreground">{fullName}</div>
        </div>
        <div>
          <div className="font-semibold">Bar Number:</div>
          <div className="text-muted-foreground">{barNumber}</div>
        </div>
        <div>
          <div className="font-semibold">Specialty:</div>
          <div className="text-muted-foreground">{specialty}</div>
        </div>
        <div>
          <div className="font-semibold">Service Area:</div>
          <div className="text-muted-foreground">{serviceLocation || "Not selected"}</div>
        </div>
        {streetAddress && (
          <div>
            <div className="font-semibold">Business Address:</div>
            <div className="text-muted-foreground">{streetAddress}</div>
          </div>
        )}
        <div>
          <div className="font-semibold">Rate Range:</div>
          <div className="text-muted-foreground">${hourlyMin} - ${hourlyMax}/hr</div>
        </div>
        <div>
          <div className="font-semibold">Tier:</div>
          <div className="text-muted-foreground capitalize">{tier}</div>
        </div>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Your profile will be reviewed by our team. You'll receive a notification once approved. You can
          still edit your rates and availability while pending.
        </p>
      </div>
    </div>
  );
}
