/**
 * Safe Auth Page (Compliance Mode)
 * 
 * This is the authentication page for Safe Mode - a PUBLIC server monitoring tool.
 * Supports both Sign In and Sign Up (Account Creation).
 * 
 * Per Apple Guideline 4.8: Sign in with Apple is the PRIMARY login option.
 * Per Apple Guideline 3.2: This is a PUBLIC app - anyone can create an account.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, X, User } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollAwareStatusBar } from "@/components/ScrollAwareStatusBar";
import { 
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  registerWithEmail,
  resetPassword
} from "@/lib/firebase";

interface SafeAuthPageProps {
  onAuthSuccess: () => void;
  onBack?: () => void;
}

type AuthMode = "signin" | "signup";

export function SafeAuthPage({ onAuthSuccess, onBack }: SafeAuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("signup"); // Default to signup for new users
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Safety timeout to prevent infinite loading - increased to 90 seconds for Apple Sign-In
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 90000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
      )
    ]);
  };

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

  const handleSocialAuth = async (provider: 'google' | 'apple' = 'google') => {
    setIsLoading(true);
    try {
      const authFn = provider === 'apple' ? signInWithApple : signInWithGoogle;
      const user = await withTimeout(authFn(), 150000);
      
      if (!user) {
        throw new Error('NO_USER');
      }
      
      // Store email for returning user detection
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
      }
      
      toast({
        title: "Welcome!",
        description: mode === "signup" ? "Your account has been created." : "You have successfully signed in.",
      });
      onAuthSuccess();
    } catch (error: any) {
      console.error("Auth error:", error);
      let title = "Oops! Something Went Wrong";
      let message = "Please try again in a moment.";
      
      if (error.message === 'TIMEOUT') {
        title = "Connection Timeout";
        message = "The operation took too long. Please check your connection and try again.";
      } else if (error.message === 'NO_USER' || error.message?.includes('cancelled') || error.message?.includes('cancel')) {
        title = "Cancelled";
        message = "Operation was cancelled. Please try again.";
      } else if (error.code === "auth/popup-closed-by-user") {
        title = "Cancelled";
        message = "You closed the sign-in window. Please try again.";
      } else if (error.code === "auth/cancelled-popup-request") {
        title = "Cancelled";
        message = "Operation was cancelled. Please try again.";
      } else if (error.code === "auth/account-exists-with-different-credential") {
        title = "Account Exists";
        message = "An account with this email already exists. Try a different sign-in method.";
      } else if (error.code === "auth/too-many-requests") {
        title = "Too Many Attempts";
        message = "Please wait a few minutes before trying again.";
      } else if (error.code === "auth/network-request-failed") {
        title = "Connection Issue";
        message = "Please check your internet connection and try again.";
      }
      toast({
        title,
        description: message,
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

    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "Please make sure your passwords match.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      let user;
      
      if (mode === "signup") {
        user = await withTimeout(registerWithEmail(email, password, name.trim() || undefined), 30000);
        toast({
          title: "Account Created! 🎉",
          description: "Welcome to BlockMint Node Manager!",
        });
      } else {
        user = await withTimeout(signInWithEmail(email, password), 30000);
        toast({
          title: "Welcome Back!",
          description: "You have successfully signed in.",
        });
      }
      
      if (!user) {
        throw new Error('NO_USER');
      }
      
      // Store email for returning user detection
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
      }
      
      onAuthSuccess();
    } catch (error: any) {
      console.error("Auth error:", error);
      let title = "Oops! Something Went Wrong";
      let message = "Please try again in a moment.";
      
      if (error.message === 'TIMEOUT') {
        title = "Connection Timeout";
        message = "The operation took too long. Please check your connection and try again.";
      } else if (error.message === 'NO_USER') {
        title = "Operation Failed";
        message = "Could not complete the operation. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        title = "Invalid Email";
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/email-already-in-use") {
        title = "Email Already Registered";
        message = "This email is already in use. Try signing in instead.";
      } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        title = "Invalid Credentials";
        message = "Your email or password is incorrect. Please check and try again.";
      } else if (error.code === "auth/user-not-found") {
        title = "Account Not Found";
        message = "No account exists with this email. Please create an account first.";
      } else if (error.code === "auth/too-many-requests") {
        title = "Too Many Attempts";
        message = "Please wait a few minutes before trying again.";
      } else if (error.code === "auth/network-request-failed") {
        title = "Connection Issue";
        message = "Please check your internet connection and try again.";
      } else if (error.code === "auth/weak-password") {
        title = "Weak Password";
        message = "Please use a stronger password (at least 6 characters).";
      }
      
      toast({
        title,
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    // Clear form when switching modes
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Scroll-aware background for system status bar */}
      <ScrollAwareStatusBar />
      
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full px-6 overflow-y-auto">
        {/* Spacer for system status bar */}
        <div className="h-[env(safe-area-inset-top,0px)] shrink-0" />
        
        {/* Header with X button and theme toggle */}
        <div className="flex items-center justify-between mb-2">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate"
            whileTap={{ scale: 0.95 }}
            type="button"
            aria-label="Go back"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <div className="flex-1"></div>
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="text-center mb-1">
            <motion.div 
              className="w-full h-52 mx-auto mb-3 relative flex items-center justify-center"
              initial={{ y: -100, scale: 0.5, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 100,
                damping: 15,
                duration: 0.8
              }}
            >
              <img
                src="/attached_assets/App-Logo.png"
                alt="Node Manager"
                className="h-44 w-auto object-contain relative z-10"
                style={{
                  filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 15px rgba(16, 185, 129, 0.3)) contrast(1.1) saturate(1.2)',
                  imageRendering: '-webkit-optimize-contrast',
                }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </motion.div>
            <h1 className="font-display text-xl font-bold text-foreground mb-1">
              {mode === "signup" ? "Create Your Account" : "Welcome Back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signup" 
                ? "Start monitoring your servers for free" 
                : "Sign in to your account"}
            </p>
          </div>

          <div className="space-y-3">
            {/* Sign in with Apple - Required by Apple App Store Guideline 4.8 */}
            <Button
              onClick={() => handleSocialAuth('apple')}
              variant="outline"
              className="w-full h-11 text-sm font-medium bg-black dark:bg-white border-black dark:border-white gap-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white dark:text-black" />
              ) : (
                <SiApple className="w-5 h-5 text-white dark:text-black" />
              )}
              <span className="text-white dark:text-black font-medium">
                {mode === "signup" ? "Sign Up with Apple" : "Sign In with Apple"}
              </span>
            </Button>

            {/* Sign in with Google */}
            <Button
              onClick={() => handleSocialAuth('google')}
              variant="outline"
              className="w-full h-11 text-sm font-medium bg-white dark:bg-white/10 border-white/20 gap-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <SiGoogle className="w-5 h-5 text-[#4285F4]" />
              )}
              <span className="text-foreground">
                {mode === "signup" ? "Sign Up with Google" : "Sign In with Google"}
              </span>
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-2">
                {mode === "signup" && (
                  <Input
                    type="text"
                    placeholder="Full Name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 text-sm bg-white/5 dark:border-white/10 light:border-2 light:border-emerald-400/50 light:focus:border-emerald-500 light:shadow-[0_0_15px_rgba(16,185,129,0.2)] light:focus:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
                    disabled={isLoading}
                  />
                )}
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 text-sm bg-white/5 dark:border-white/10 light:border-2 light:border-emerald-400/50 light:focus:border-emerald-500 light:shadow-[0_0_15px_rgba(16,185,129,0.2)] light:focus:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
                  disabled={isLoading}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 text-sm bg-white/5 dark:border-white/10 light:border-2 light:border-emerald-400/50 light:focus:border-emerald-500 light:shadow-[0_0_15px_rgba(16,185,129,0.2)] light:focus:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
                  disabled={isLoading}
                />
                {mode === "signup" && (
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 text-sm bg-white/5 dark:border-white/10 light:border-2 light:border-emerald-400/50 light:focus:border-emerald-500 light:shadow-[0_0_15px_rgba(16,185,129,0.2)] light:focus:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
                    disabled={isLoading}
                  />
                )}
              </div>

              {mode === "signin" && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-sm text-primary hover:underline"
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  type="submit"
                  className="relative w-full h-11 text-base font-semibold bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 text-white shadow-lg shadow-emerald-400/30 hover:shadow-xl hover:shadow-emerald-400/50 active:shadow-md active:shadow-emerald-400/40 transition-all duration-300 overflow-hidden group"
                  disabled={isLoading}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : mode === "signup" ? (
                      <User className="w-5 h-5 mr-2" />
                    ) : (
                      <Mail className="w-5 h-5 mr-2" />
                    )}
                    {mode === "signup" ? "Create Account" : "Sign In"}
                  </span>
                </Button>
              </motion.div>
            </form>

            {/* Toggle between sign in and sign up */}
            <p className="text-center text-sm text-muted-foreground mt-4">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary font-medium hover:underline"
                    disabled={isLoading}
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary font-medium hover:underline"
                    disabled={isLoading}
                  >
                    Create Account
                  </button>
                </>
              )}
            </p>
            
            <p className="text-center text-xs text-muted-foreground/60 mt-4">
              By continuing, you agree to our{" "}
              <Link 
                href="/legal/terms" 
                className="text-primary/80 hover:text-primary underline"
              >
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link 
                href="/legal/privacy" 
                className="text-primary/80 hover:text-primary underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
        
        {/* Safe area padding for home indicator */}
        <div className="h-[env(safe-area-inset-bottom,16px)] shrink-0" />
      </div>
    </div>
  );
}

export default SafeAuthPage;
