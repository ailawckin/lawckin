import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Scale } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  fullName: z.string().trim().min(2, { message: "Full name must be at least 2 characters" }).optional(),
});

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"client" | "lawyer">("client");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectBasedOnRole = useCallback(async (user: User) => {
    let roleData: { role: string } | null = null;

    for (let i = 0; i < 3; i++) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        roleData = data;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (!roleData) {
      const roleFromMeta = user.user_metadata?.role || "client";
      navigate(roleFromMeta === "lawyer" ? "/onboarding/lawyer" : "/onboarding/client");
      return;
    }

    const effectiveRole = roleData.role;

    if (effectiveRole === "client") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      navigate(profile?.onboarding_completed ? "/dashboard" : "/onboarding/client");
      return;
    }

    if (effectiveRole === "lawyer") {
      const { data: lawyerProfile } = await supabase
        .from("lawyer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      navigate(lawyerProfile ? "/lawyer-dashboard" : "/onboarding/lawyer");
      return;
    }

    navigate(effectiveRole === "admin" ? "/admin" : "/");
  }, [navigate]);

  const checkAuthAndRedirect = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      await redirectBasedOnRole(session.user);
    }
  }, [redirectBasedOnRole]);

  useEffect(() => {
    void checkAuthAndRedirect();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await redirectBasedOnRole(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuthAndRedirect, redirectBasedOnRole]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationData = isSignUp
        ? { email, password, fullName }
        : { email, password };

      authSchema.parse(validationData);

      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });

        if (!error && data.user) {
          const { error: roleError } = await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: role,
          });

          if (roleError) {
            console.error("Error creating user role:", roleError);
          }

          await new Promise((resolve) => setTimeout(resolve, 500));

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            toast({
              title: "Success!",
              description: "Account created successfully. Redirecting...",
            });
            await redirectBasedOnRole(session.user);
          } else {
            toast({
              title: "Success!",
              description: "Account created! Please check your email to confirm your account.",
            });
          }
        }

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password and try again.",
              variant: "destructive",
            });
          } else if (
            error.message.includes("fetch failed") ||
            error.message.includes("network") ||
            error.message.includes("ENOTFOUND")
          ) {
            toast({
              title: "Connection error",
              description:
                "Cannot connect to Supabase. Please check your internet connection and ensure your Supabase project is active.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : "An error occurred";

        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes("fetch failed") || errorMessage.includes("network") || errorMessage.includes("ENOTFOUND")) {
          userFriendlyMessage =
            "Cannot connect to the server. Please check your internet connection and ensure your Supabase project is active in the dashboard.";
        }

        toast({
          title: "Error",
          description: userFriendlyMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold brand-wordmark">Lawckin</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground">
            {isSignUp
              ? "Start connecting with verified lawyers"
              : "Sign in to access your account"}
          </p>
        </div>

        <div className="elegant-card">
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={isSignUp}
                  />
                </div>

                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setRole("client")}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        role === "client"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">Client</div>
                        <div className="text-sm text-muted-foreground">
                          I need legal help
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("lawyer")}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        role === "lawyer"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">Lawyer</div>
                        <div className="text-sm text-muted-foreground">
                          I provide legal services
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {isSignUp && (
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
