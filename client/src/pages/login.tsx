import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Network, Shield, Settings, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { login, register, isLoggingIn, isRegistering: isRegisteringMutation } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isRegistering) {
        await register({ username, password, displayName: displayName || undefined });
        toast({
          title: "Account created",
          description: "Welcome to NetConfig Manager!",
        });
      } else {
        await login({ username, password });
      }
    } catch (error: any) {
      const message = error?.message || (isRegistering ? "Registration failed" : "Login failed");
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const isPending = isLoggingIn || isRegisteringMutation;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">NetConfig Manager</h1>
            <p className="text-xs text-muted-foreground">Enterprise Switch Configuration</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {isRegistering ? "Create Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription>
                {isRegistering 
                  ? "Register to start managing your network devices"
                  : "Sign in to manage your network switch configurations"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    data-testid="input-username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                </div>

                {isRegistering && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name (optional)</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      data-testid="input-display-name"
                    />
                  </div>
                )}

                <Button 
                  type="submit"
                  className="w-full" 
                  size="lg"
                  disabled={isPending}
                  data-testid="button-submit"
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isRegistering ? "Create Account" : "Sign In"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setIsRegistering(!isRegistering)}
                    data-testid="button-toggle-mode"
                  >
                    {isRegistering 
                      ? "Already have an account? Sign in"
                      : "Need an account? Register"
                    }
                  </Button>
                </div>
              </form>
              
              <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Multi-Vendor</p>
                    <p className="text-xs text-muted-foreground">Cisco and Juniper</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Role-Based</p>
                    <p className="text-xs text-muted-foreground">ACL permissions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Network className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">LACP & VLANs</p>
                    <p className="text-xs text-muted-foreground">Full config</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Offline Ready</p>
                    <p className="text-xs text-muted-foreground">Local auth</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          NetConfig Manager - Enterprise Network Configuration Tool
        </div>
      </footer>
    </div>
  );
}
