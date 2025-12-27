import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  signInWithGoogle, 
  signInWithApple, 
  signInWithEmail, 
  registerWithEmail,
  resetPassword
} from "@/lib/firebase";

import mixedMain from "@assets/Mixed_main_1766014388605.png";

interface AuthPageProps {
  mode: "signin" | "register";
  onBack: () => void;
  onModeChange: (mode: "signin" | "register") => void;
  onComplete: () => void;
}

export function AuthPage({ mode, onBack, onModeChange, onComplete }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email);
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.code === "auth/user-not-found" 
          ? "No account found with this email." 
          : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "apple") => {
    setIsLoading(true);
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
      toast({
        title: "Welcome!",
        description: "You have successfully signed in.",
      });
      onComplete();
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "register" && !name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name.trim());
      }
      toast({
        title: mode === "signin" ? "Welcome Back!" : "Account Created!",
        description: mode === "signin" 
          ? "You have successfully signed in." 
          : "Your account has been created successfully.",
      });
      onComplete();
    } catch (error: any) {
      console.error("Auth error:", error);
      let message = "Please try again.";
      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered. Try signing in instead.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        message = "Invalid email or password.";
      } else if (error.code === "auth/invalid-credential") {
        message = "Invalid email or password.";
      }
      toast({
        title: "Authentication Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full px-6 pt-16 pb-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onBack()}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            data-testid="button-back-auth"
            type="button"
            aria-label="Go back"
            disabled={isLoading}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display text-lg font-bold text-foreground">Mining Club</span>
          <div className="w-9" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="text-center mb-8">
            <motion.div 
              className="w-24 h-24 mx-auto mb-6"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <img 
                src={mixedMain} 
                alt="Mining Club"
                className="w-full h-full object-contain"
              />
            </motion.div>
            <h1 
              className="font-display text-2xl font-bold text-foreground mb-2"
              data-testid="heading-auth"
            >
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "signin" 
                ? "Sign in to continue mining" 
                : "Start your mining journey today"}
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => handleSocialAuth("google")}
              variant="outline"
              className="w-full h-14 text-base font-medium bg-white dark:bg-white/10 border-white/20 gap-3"
              data-testid="button-google-auth"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <SiGoogle className="w-5 h-5 text-[#4285F4]" />
              )}
              <span className="text-foreground">Continue With Google</span>
            </Button>

            <Button
              onClick={() => handleSocialAuth("apple")}
              variant="outline"
              className="w-full h-14 text-base font-medium bg-black dark:bg-white border-white/20 gap-3"
              data-testid="button-apple-auth"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white dark:text-black" />
              ) : (
                <SiApple className="w-5 h-5 text-white dark:text-black" />
              )}
              <span className="text-white dark:text-black font-semibold">Continue With Apple</span>
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-3">
                {mode === "register" && (
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-14 text-base bg-white/5 border-white/10"
                    data-testid="input-name"
                    disabled={isLoading}
                  />
                )}
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 text-base bg-white/5 border-white/10"
                  data-testid="input-email"
                  disabled={isLoading}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 text-base bg-white/5 border-white/10"
                  data-testid="input-password"
                  disabled={isLoading}
                />
              </div>

              {mode === "signin" && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-sm text-primary hover:underline"
                  data-testid="button-forgot-password"
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              )}

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white"
                data-testid="button-email-auth"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Mail className="w-5 h-5 mr-2" />
                )}
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground pt-4">
              {mode === "signin" ? (
                <>
                  Don't Have An Account?{" "}
                  <button 
                    onClick={() => onModeChange("register")}
                    className="text-primary font-semibold hover:underline"
                    data-testid="button-switch-to-register"
                    disabled={isLoading}
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already Have An Account?{" "}
                  <button 
                    onClick={() => onModeChange("signin")}
                    className="text-primary font-semibold hover:underline"
                    data-testid="button-switch-to-signin"
                    disabled={isLoading}
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 mt-auto pt-8">
            By Continuing, You Agree To Our Terms Of Service And Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}
