interface TierStepProps {
  tier: string;
  onTierChange: (value: string) => void;
}

const TIERS = [
  {
    value: "basic",
    name: "Basic",
    price: "Free",
    features: ["Profile listing", "Contact requests"],
  },
  {
    value: "pro",
    name: "Pro",
    price: "$99/mo",
    features: ["Featured listing", "Analytics", "Priority support"],
  },
  {
    value: "firm",
    name: "Firm",
    price: "$299/mo",
    features: ["Team accounts", "Advanced analytics", "Custom branding"],
  },
];

export function TierStep({ tier, onTierChange }: TierStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Choose Your Tier</h2>
      <div className="space-y-3">
        {TIERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onTierChange(option.value)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              tier === option.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-semibold text-lg">{option.name}</div>
              <div className="text-primary font-bold">{option.price}</div>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {option.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}
