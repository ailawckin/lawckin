import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { BASE_LANGUAGE_OPTIONS } from "@/components/lawyer/dashboard/constants";
import { getCustomLanguagesFrom, normalizeLanguage } from "./utils";

interface UseSettingsLanguagesParams {
  formData: { languages: string[] };
  setFormData: Dispatch<
    SetStateAction<{
      languages: string[];
      [key: string]: any;
    }>
  >;
  markDirty: () => void;
}

export function useSettingsLanguages({ formData, setFormData, markDirty }: UseSettingsLanguagesParams) {
  const [customLanguage, setCustomLanguage] = useState("");
  const [customLanguageOptions, setCustomLanguageOptions] = useState<string[]>([]);

  const toggleLanguageSelection = (language: string) => {
    const normalized = normalizeLanguage(language);
    setFormData((prev) => {
      const exists = prev.languages.some((lang) => normalizeLanguage(lang) === normalized);
      if (exists) {
        return {
          ...prev,
          languages: prev.languages.filter(
            (lang) => normalizeLanguage(lang) !== normalized
          ),
        };
      }
      return {
        ...prev,
        languages: [...prev.languages, normalized],
      };
    });
    markDirty();
  };

  const addCustomLanguage = () => {
    const normalized = normalizeLanguage(customLanguage);
    if (!normalized) return;
    if (BASE_LANGUAGE_OPTIONS.some((option) => normalizeLanguage(option) === normalized)) {
      setCustomLanguage("");
      return;
    }
    if (!customLanguageOptions.some((option) => normalizeLanguage(option) === normalized)) {
      setCustomLanguageOptions((prev) => [...prev, normalized]);
    }
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.some((lang) => normalizeLanguage(lang) === normalized)
        ? prev.languages
        : [...prev.languages, normalized],
    }));
    markDirty();
    setCustomLanguage("");
  };

  useEffect(() => {
    const base = new Set(BASE_LANGUAGE_OPTIONS.map((lang) => lang.toLowerCase()));
    const missing = formData.languages.filter(
      (lang) =>
        !base.has(lang.toLowerCase()) &&
        !customLanguageOptions.some((option) => option.toLowerCase() === lang.toLowerCase())
    );
    if (missing.length === 0) return;
    setCustomLanguageOptions((prev) => [...prev, ...missing]);
  }, [formData.languages, customLanguageOptions]);

  return {
    customLanguage,
    setCustomLanguage,
    customLanguageOptions,
    setCustomLanguageOptions,
    toggleLanguageSelection,
    addCustomLanguage,
    getCustomLanguagesFrom,
  };
}
