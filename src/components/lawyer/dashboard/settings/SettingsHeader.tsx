import type { RefObject } from "react";
import { CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
  isDirty: boolean;
  isSaving: boolean;
  formRef: RefObject<HTMLFormElement>;
}

const SettingsHeader = ({ isDirty, isSaving, formRef }: SettingsHeaderProps) => {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        {isDirty && <p className="text-xs text-muted-foreground">Unsaved changes</p>}
      </div>
      <Button
        onClick={(event) => {
          event.preventDefault();
          if (formRef.current) {
            formRef.current.requestSubmit();
          }
        }}
        disabled={isSaving || !isDirty}
      >
        {isSaving ? (
          <>
            <Clock className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Save Changes{isDirty ? " *" : ""}
          </>
        )}
      </Button>
    </div>
  );
};

export default SettingsHeader;
