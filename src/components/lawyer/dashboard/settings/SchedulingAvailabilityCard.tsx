import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { SettingsFormData, SettingsFormErrors } from "@/components/lawyer/dashboard/types";

interface SchedulingAvailabilityCardProps {
  timezoneOptions: Array<{ value: string; label: string }>;
  formData: SettingsFormData;
  setFormData: (value: SettingsFormData | ((prev: SettingsFormData) => SettingsFormData)) => void;
  markDirty: () => void;
  formErrors: SettingsFormErrors;
  customLanguage: string;
  setCustomLanguage: (value: string) => void;
  addCustomLanguage: () => void;
  allLanguageOptions: string[];
  toggleLanguageSelection: (language: string) => void;
  meetingTypeOptions: string[];
  feeModelOptions: string[];
  slotDurationOptions: Array<{ value: number; label: string }>;
}

const SchedulingAvailabilityCard = ({
  timezoneOptions,
  formData,
  setFormData,
  markDirty,
  formErrors,
  customLanguage,
  setCustomLanguage,
  addCustomLanguage,
  allLanguageOptions,
  toggleLanguageSelection,
  meetingTypeOptions,
  feeModelOptions,
  slotDurationOptions,
}: SchedulingAvailabilityCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduling & Availability Settings</CardTitle>
        <CardDescription>Configure timezone and availability defaults for clients.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Timezone *</Label>
          <Select
            value={formData.timezone}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, timezone: value }));
              markDirty();
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezoneOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.timezone && <p className="text-xs text-destructive">{formErrors.timezone}</p>}
        </div>

        <div className="space-y-2">
          <Label>Consultation Length</Label>
          <Select
            value={String(formData.slot_duration_minutes || 30)}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, slot_duration_minutes: Number(value) }));
              markDirty();
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {slotDurationOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This controls the length of new time slots shown to clients.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Languages</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                {formData.languages.length > 0
                  ? `${formData.languages.length} selected`
                  : "Select languages"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0 w-[320px]">
              <Command>
                <CommandInput placeholder="Search languages..." />
                <CommandList>
                  <CommandEmpty>No language found.</CommandEmpty>
                  <CommandGroup>
                    {allLanguageOptions.map((lang) => {
                      const selected = formData.languages.some(
                        (item) => item.toLowerCase() === lang.toLowerCase()
                      );
                      return (
                        <CommandItem key={lang} onSelect={() => toggleLanguageSelection(lang)}>
                          <Check className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                          {lang}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {formData.languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="flex items-center gap-2">
                  {lang}
                  <button type="button" className="text-xs" onClick={() => toggleLanguageSelection(lang)}>
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Input
              value={customLanguage}
              onChange={(event) => setCustomLanguage(event.target.value)}
              placeholder="Add custom language"
            />
            <Button type="button" variant="outline" onClick={addCustomLanguage}>
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Meeting Types</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {meetingTypeOptions.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  id={`meeting-${type}`}
                  checked={formData.meeting_types.includes(type)}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      meeting_types: checked
                        ? [...prev.meeting_types, type]
                        : prev.meeting_types.filter((item) => item !== type),
                    }));
                    markDirty();
                  }}
                />
                <Label htmlFor={`meeting-${type}`} className="text-sm">
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Fee Models</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {feeModelOptions.map((model) => (
              <div key={model} className="flex items-center gap-2">
                <Checkbox
                  id={`fee-${model}`}
                  checked={formData.fee_models.includes(model)}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      fee_models: checked
                        ? [...prev.fee_models, model]
                        : prev.fee_models.filter((item) => item !== model),
                      fee_model_rates: checked
                        ? {
                            ...prev.fee_model_rates,
                            ...(model === "Hourly" && prev.hourly_rate
                              ? { Hourly: String(prev.hourly_rate) }
                              : {}),
                          }
                        : Object.fromEntries(
                            Object.entries(prev.fee_model_rates).filter(([key]) => key !== model)
                          ),
                    }));
                    markDirty();
                  }}
                />
                <Label htmlFor={`fee-${model}`} className="text-sm">
                  {model}
                </Label>
              </div>
            ))}
          </div>
          {formData.fee_models.length > 0 && (
            <div className="mt-4 space-y-3">
              {formData.fee_models.map((model) => (
                <div key={`rate-${model}`} className="space-y-1">
                  <Label className="text-sm">{model} rate</Label>
                  <Input
                    type="number"
                    value={formData.fee_model_rates[model] || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        fee_model_rates: {
                          ...prev.fee_model_rates,
                          [model]: value,
                        },
                        hourly_rate: model === "Hourly" ? Number.parseFloat(value) || 0 : prev.hourly_rate,
                      }));
                      markDirty();
                    }}
                    placeholder="Enter price"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SchedulingAvailabilityCard;
