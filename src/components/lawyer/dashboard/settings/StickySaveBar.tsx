import type { RefObject } from "react";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickySaveBarProps {
  isDirty: boolean;
  isSaving: boolean;
  isDiscarding: boolean;
  formRef: RefObject<HTMLFormElement>;
  discardSettingsChanges: () => Promise<boolean>;
}

const StickySaveBar = ({
  isDirty,
  isSaving,
  isDiscarding,
  formRef,
  discardSettingsChanges,
}: StickySaveBarProps) => {
  if (!isDirty) {
    return null;
  }

  return (
    <div className="sticky bottom-4 z-10">
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur">
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          {isDiscarding ? (
            <>
              <Loader2 className="h-3.5 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Discarding…</span>
            </>
          ) : (
            "Unsaved changes"
          )}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await discardSettingsChanges();
            }}
            disabled={isSaving || isDiscarding}
          >
            {isDiscarding ? (
              <>
                <Loader2 className="h-3.5 w-3 mr-1.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Discarding…</span>
              </>
            ) : (
              "Discard changes"
            )}
          </Button>
          <Button
            onClick={(event) => {
              event.preventDefault();
              if (formRef.current) {
                formRef.current.requestSubmit();
              }
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickySaveBar;
