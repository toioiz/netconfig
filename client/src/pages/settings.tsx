import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { Settings, Moon, Sun, Bell, Shield, Database } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your application preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-base">Appearance</CardTitle>
                <CardDescription>Customize how NetConfig looks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme for reduced eye strain
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                data-testid="switch-dark-mode"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription>Configure alert preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sync-alerts">Sync Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when device sync fails
                </p>
              </div>
              <Switch id="sync-alerts" defaultChecked data-testid="switch-sync-alerts" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="status-alerts">Status Changes</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when device status changes
                </p>
              </div>
              <Switch id="status-alerts" defaultChecked data-testid="switch-status-alerts" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Security</CardTitle>
                <CardDescription>Manage security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="confirm-changes">Confirm Changes</Label>
                <p className="text-sm text-muted-foreground">
                  Require confirmation for critical actions
                </p>
              </div>
              <Switch id="confirm-changes" defaultChecked data-testid="switch-confirm-changes" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="audit-log">Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Log all configuration changes
                </p>
              </div>
              <Switch id="audit-log" defaultChecked data-testid="switch-audit-log" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Default Settings</CardTitle>
                <CardDescription>Configure default values for new devices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="default-speed">Default Port Speed</Label>
                <Input
                  id="default-speed"
                  defaultValue="auto"
                  placeholder="auto"
                  data-testid="input-default-speed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-vlan">Default VLAN</Label>
                <Input
                  id="default-vlan"
                  type="number"
                  defaultValue="1"
                  placeholder="1"
                  data-testid="input-default-vlan"
                />
              </div>
            </div>
            <Button variant="outline" data-testid="button-save-defaults">
              Save Defaults
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
