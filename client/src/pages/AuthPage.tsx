import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/GlassCard";

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

  const handleSocialAuth = (provider: string) => {
    window.location.href = "/api/login";
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/api/login";
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
            >
              <SiGoogle className="w-5 h-5 text-[#4285F4]" />
              <span className="text-foreground">Continue with Google</span>
            </Button>

            <Button
              onClick={() => handleSocialAuth("apple")}
              variant="outline"
              className="w-full h-14 text-base font-medium bg-black dark:bg-white border-white/20 gap-3"
              data-testid="button-apple-auth"
            >
              <SiApple className="w-5 h-5 text-white dark:text-black" />
              <span className="text-white dark:text-black font-semibold">Continue with Apple</span>
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 text-base bg-white/5 border-white/10"
                  data-testid="input-email"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 text-base bg-white/5 border-white/10"
                  data-testid="input-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white"
                data-testid="button-email-auth"
              >
                <Mail className="w-5 h-5 mr-2" />
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground pt-4">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button 
                    onClick={() => onModeChange("register")}
                    className="text-primary font-semibold hover:underline"
                    data-testid="button-switch-to-register"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button 
                    onClick={() => onModeChange("signin")}
                    className="text-primary font-semibold hover:underline"
                    data-testid="button-switch-to-signin"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 mt-auto pt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}
