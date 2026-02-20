import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Save, Bell, Shield, Globe, Mail } from "lucide-react";

interface PlatformSettings {
  platform_name: string;
  support_email: string;
  maintenance_mode: boolean;
  allow_registrations: boolean;
  require_email_verification: boolean;
  default_lawyer_tier: string;
  min_consultation_duration: number;
  max_consultation_duration: number;
}

export function Settings() {
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: "LAWCKIN",
    support_email: "support@lawckin.com",
    maintenance_mode: false,
    allow_registrations: true,
    require_email_verification: true,
    default_lawyer_tier: "basic",
    min_consultation_duration: 15,
    max_consultation_duration: 120,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .order("setting_key");

      if (error) throw error;

      // Map settings to state
      const settingsMap = new Map(
        (data || []).map((s) => [s.setting_key, s.setting_value])
      );

      setSettings({
        platform_name: (settingsMap.get("platform_name") as string) || "LAWCKIN",
        support_email: (settingsMap.get("support_email") as string) || "support@lawckin.com",
        maintenance_mode: (settingsMap.get("maintenance_mode") as boolean) || false,
        allow_registrations: (settingsMap.get("allow_registrations") as boolean) ?? true,
        require_email_verification:
          (settingsMap.get("require_email_verification") as boolean) ?? true,
        default_lawyer_tier: (settingsMap.get("default_lawyer_tier") as string) || "basic",
        min_consultation_duration:
          (settingsMap.get("min_consultation_duration") as number) || 15,
        max_consultation_duration:
          (settingsMap.get("max_consultation_duration") as number) || 120,
      });
    } catch (error: any) {
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const settingsToSave = [
        { setting_key: "platform_name", setting_value: settings.platform_name },
        { setting_key: "support_email", setting_value: settings.support_email },
        { setting_key: "maintenance_mode", setting_value: settings.maintenance_mode },
        { setting_key: "allow_registrations", setting_value: settings.allow_registrations },
        {
          setting_key: "require_email_verification",
          setting_value: settings.require_email_verification,
        },
        { setting_key: "default_lawyer_tier", setting_value: settings.default_lawyer_tier },
        {
          setting_key: "min_consultation_duration",
          setting_value: settings.min_consultation_duration,
        },
        {
          setting_key: "max_consultation_duration",
          setting_value: settings.max_consultation_duration,
        },
      ];

      // Upsert settings
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from("admin_settings")
          .upsert(
            {
              ...setting,
              updated_by: user.id,
            },
            { onConflict: "setting_key" }
          );

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Platform settings have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Platform Settings</h2>
        <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform_name">Platform Name</Label>
                <Input
                  id="platform_name"
                  value={settings.platform_name}
                  onChange={(e) =>
                    setSettings({ ...settings, platform_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support_email">Support Email</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={settings.support_email}
                  onChange={(e) =>
                    setSettings({ ...settings, support_email: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Feature Toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Feature Toggles
              </CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Put the platform in maintenance mode (users will see a maintenance message)
                  </p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, maintenance_mode: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow New Registrations</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to sign up for accounts
                  </p>
                </div>
                <Switch
                  checked={settings.allow_registrations}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allow_registrations: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Require users to verify their email before accessing the platform
                  </p>
                </div>
                <Switch
                  checked={settings.require_email_verification}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, require_email_verification: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Consultation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Consultation Settings
              </CardTitle>
              <CardDescription>Configure consultation duration and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_duration">Minimum Duration (minutes)</Label>
                  <Input
                    id="min_duration"
                    type="number"
                    min="15"
                    max="120"
                    value={settings.min_consultation_duration}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        min_consultation_duration: parseInt(e.target.value) || 15,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_duration">Maximum Duration (minutes)</Label>
                  <Input
                    id="max_duration"
                    type="number"
                    min="30"
                    max="240"
                    value={settings.max_consultation_duration}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        max_consultation_duration: parseInt(e.target.value) || 120,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_tier">Default Lawyer Tier</Label>
                <Input
                  id="default_tier"
                  value={settings.default_lawyer_tier}
                  onChange={(e) =>
                    setSettings({ ...settings, default_lawyer_tier: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

