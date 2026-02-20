import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PASSCODE = import.meta.env.VITE_APP_PASSCODE as string | undefined;

interface PasscodeGateProps {
  children: ReactNode;
}

const PasscodeGate = ({ children }: PasscodeGateProps) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!PASSCODE) {
      setIsUnlocked(true);
    }
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!PASSCODE) {
      setIsUnlocked(true);
      return;
    }

    if (code.trim() === PASSCODE) {
      setIsUnlocked(true);
      setError("");
      return;
    }

    setError("Incorrect access code.");
  };

  if (!PASSCODE || isUnlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded-xl p-6 shadow-sm bg-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold brand-wordmark">Lawckin</span>
          <span className="text-xs text-muted-foreground">Private Preview</span>
        </div>
        <h1 className="text-xl font-semibold mb-2">Enter access code</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This preview is private. Enter the code you were given to continue.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passcode">Access code</Label>
            <Input
              id="passcode"
              type="password"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter code"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            Unlock
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PasscodeGate;
