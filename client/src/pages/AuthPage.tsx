import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  signInWithGoogle,
  signInWithApple,
  signInWithEmail, 
  registerWithEmail,
  resetPassword,
  resendVerificationEmail,
  getRedirectAuthResult,
} from "@/lib/firebase";

import mixedMain from "@assets/Mixed_main_1766014388605.webp";

interface AuthPageProps {
  mode: "signin" | "register";
  onBack: () => void;
  onModeChange: (mode: "signin" | "register") => void;
  onComplete: () => void;
}

// Detect iOS device
function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function AuthPage({ mode, onBack, onModeChange, onComplete }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { toast } = useToast();
  const isIOS = isIOSDevice();

  // Handle redirect result (Google redirect fallback)
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const user = await getRedirectAuthResult();
        if (user) {
          toast({ title: "Welcome!", description: "You have successfully signed in." });
          onComplete();
        }
      } catch (err: any) {
        console.error("Redirect sign-in error:", err);
        if (err?.message?.toLowerCase().includes("missing initial state")) {
          toast({
            title: "Google sign-in blocked",
            description: "The browser blocked session storage. Try again using the system browser or disable private mode.",
            variant: "destructive",
          });
        }
      }
    };
    checkRedirect();
  }, [onComplete, toast]);

  // Safety timeout to prevent infinite loading (90s for Apple Sign-In which requires user interaction)
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 90000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
      )
    ]);
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      await resendVerificationEmail();
      toast({
        title: "Email Sent!",
        description: "A new verification email has been sent.",
      });
    } catch (error: any) {
      toast({
        title: "Failed To Send",
        description: error.code === "auth/too-many-requests" 
          ? "Please wait before requesting another email."
          : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAfterVerification = () => {
    setShowVerification(false);
    onModeChange("signin");
    toast({
      title: "Ready To Sign In",
      description: "Please sign in with your verified email.",
    });
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
      const socialTimeoutMs = provider === 'google' ? 45000 : 90000;
      const user = await withTimeout(authFn(), socialTimeoutMs);
      
      if (!user) {
        throw new Error('NO_USER');
      }
      
      toast({
        title: "Welcome!",
        description: "You have successfully signed in.",
      });
      onComplete();
    } catch (error: any) {
      console.error("Auth error:", error);
      let title = "Oops! Something Went Wrong";
      let message = "Please try again in a moment.";

      if (error.message === 'REDIRECT_STARTED') {
        toast({
          title: "Continuing Sign-In",
          description: "Redirecting to Google sign-in...",
        });
        return;
      }
      
      if (error.message?.includes('POPUP_TIMEOUT')) {
        title = "Connection Timeout";
        message = "The sign-in took too long. Please check your connection and try again.";
      } else if (error.message?.includes('POPUP_BLOCKED')) {
        title = "Pop-up Blocked";
        message = "Please check your browser settings and disable pop-up blockers for this app.";
      } else if (error.message?.includes('User cancelled')) {
        title = "Sign-In Cancelled";
        message = "You cancelled the sign-in process.";
      } else if (error.code === "auth/email-already-in-use") {
        title = "Email Already Registered";
        message = "This email is already in use. Try signing in or use a different email.";
      } else if (error.code === "auth/invalid-email") {
        title = "Invalid Email";
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/wrong-password") {
        title = "Incorrect Password";
        message = "The password you entered is incorrect. Try again or reset your password.";
      } else if (error.code === "auth/user-not-found") {
        title = "Account Not Found";
        message = "No account exists with this email. Please sign up first.";
      } else if (error.code === "auth/invalid-credential") {
        title = "Invalid Login Details";
        message = "Your email or password is incorrect. Please check and try again.";
      } else if (error.code === "auth/too-many-requests") {
        title = "Too Many Attempts";
        message = "Please wait a few minutes before trying again.";
      } else if (error.code === "auth/network-request-failed") {
        title = "Connection Issue";
        message = "Please check your internet connection and try again.";
      } else if (error.code === "auth/weak-password") {
        title = "Weak Password";
        message = "Please choose a stronger password with at least 6 characters.";
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

    if (mode === "register" && password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "signin") {
        const user = await withTimeout(signInWithEmail(email, password), 30000);
        if (!user) {
          throw new Error('NO_USER');
        }
        toast({
          title: "Welcome Back!",
          description: "You have successfully signed in.",
        });
        onComplete();
      } else {
        const user = await withTimeout(registerWithEmail(email, password, name.trim()), 30000);
        if (!user) {
          throw new Error('NO_USER');
        }
        // Skip email verification - user can go directly to app
        onComplete();
        toast({
          title: "Account Created! 🎉",
          description: "Welcome to BlockMint Mining!",
        });
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let title = "Oops! Something Went Wrong";
      let message = "Please try again in a moment.";
      
      if (error.message === 'TIMEOUT') {
        title = "Connection Timeout";
        message = "The sign-in took too long. Please check your connection and try again.";
      } else if (error.message === 'NO_USER') {
        title = "Authentication Failed";
        message = "Could not complete authentication. Please try again.";
      } else if (error.code === "auth/email-already-in-use") {
        title = "Email Already Registered";
        message = "This email is already in use. Try signing in or use a different email.";
      } else if (error.code === "auth/invalid-email") {
        title = "Invalid Email";
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/wrong-password") {
        title = "Incorrect Password";
        message = "The password you entered is incorrect. Try again or reset your password.";
      } else if (error.code === "auth/user-not-found") {
        title = "Account Not Found";
        message = "No account exists with this email. Please sign up first.";
      } else if (error.code === "auth/invalid-credential") {
        title = "Invalid Login Details";
        message = "Your email or password is incorrect. Please check and try again.";
      } else if (error.code === "auth/too-many-requests") {
        title = "Too Many Attempts";
        message = "Please wait a few minutes before trying again.";
      } else if (error.code === "auth/network-request-failed") {
        title = "Connection Issue";
        message = "Please check your internet connection and try again.";
      } else if (error.code === "auth/weak-password") {
        title = "Weak Password";
        message = "Please choose a stronger password with at least 6 characters.";
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full px-6 pt-safe pb-safe overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
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
          <div className="flex-1"></div>
          <ThemeToggle />
        </div>

        {showVerification ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Mail className="w-10 h-10 text-primary" />
            </div>
            <h1 
              className="font-display text-xl font-bold text-foreground mb-1"
              data-testid="heading-verification"
            >
              Verify Your Email
            </h1>
            <p className="text-muted-foreground mb-2 max-w-xs">
              We have sent a verification link to
            </p>
            <p className="text-primary font-medium mb-6">{registeredEmail}</p>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs">
              Click the link in the email to verify your account. Check your spam folder if you do not see it.
            </p>
            <div className="space-y-3 w-full max-w-xs">
              <Button
                onClick={handleContinueAfterVerification}
                className="w-full h-12"
                data-testid="button-continue-verification"
              >
                Continue To Sign In
              </Button>
              <Button
                onClick={handleResendVerification}
                variant="ghost"
                className="w-full h-12"
                disabled={isLoading}
                data-testid="button-resend-verification"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                Resend Verification Email
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="text-center mb-4">
              <motion.div 
                className="w-full h-32 mx-auto mb-3 relative flex items-center justify-center"
                initial={{ y: -200, scale: 0.5, opacity: 0 }}
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
                  alt="BlockMint"
                  className="h-8 w-auto object-contain relative z-10"
                  style={{
                    filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 20px rgba(16, 185, 129, 0.3)) contrast(1.1) saturate(1.2)',
                    imageRendering: '-webkit-optimize-contrast',
                  }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </motion.div>
              <h1 
                className="font-display text-xl font-bold text-foreground mb-1"
                data-testid="heading-auth"
              >
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === "signin" 
                  ? "Sign in to continue mining" 
                  : "Start your mining journey today"}
              </p>
            </div>

          <div className="space-y-4">
            {/* Sign in with Apple - Required by Apple App Store Guideline 4.8 */}
            <Button
              onClick={() => handleSocialAuth('apple')}
              variant="outline"
              className="w-full h-11 text-sm font-medium bg-black dark:bg-white border-black dark:border-white gap-3"
              data-testid="button-apple-auth"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white dark:text-black" />
              ) : (
                <SiApple className="w-5 h-5 text-white dark:text-black" />
              )}
              <span className="text-white dark:text-black font-medium">Continue With Apple</span>
            </Button>

            {/* Sign in with Google */}
            <Button
              onClick={() => handleSocialAuth('google')}
              variant="outline"
              className="w-full h-11 text-sm font-medium bg-white dark:bg-white/10 border-white/20 gap-3"
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

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
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
                    className="h-11 text-sm bg-white/5 dark:border-white/10 light:border-2 light:border-emerald-400/50 light:focus:border-emerald-500 light:shadow-[0_0_15px_rgba(16,185,129,0.2)] light:focus:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
                    data-testid="input-name"
                    disabled={isLoading}
                  />
                )}
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 text-sm bg-white/5 dark:border-white/10 light:border-2 light:border-emerald-400/50 light:focus:border-emerald-500 light:shadow-[0_0_15px_rgba(16,185,129,0.2)] light:focus:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
                  data-testid="input-email"
                  disabled={isLoading}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 text-sm bg-white/5 dark:border-white/10 light:border-2 light:border-emerald-400/50 light:focus:border-emerald-500 light:shadow-[0_0_15px_rgba(16,185,129,0.2)] light:focus:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
                  data-testid="input-password"
                  disabled={isLoading}
                />
                {mode === "register" && (
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 text-sm bg-white/5 dark:border-white/10 light:border-2 light:border-emerald-400/50 light:focus:border-emerald-500 light:shadow-[0_0_15px_rgba(16,185,129,0.2)] light:focus:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
                    data-testid="input-confirm-password"
                    disabled={isLoading}
                  />
                )}
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

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  type="submit"
                  className="relative w-full h-11 text-base font-semibold bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 text-white shadow-lg shadow-emerald-400/30 hover:shadow-xl hover:shadow-emerald-400/50 active:shadow-md active:shadow-emerald-400/40 transition-all duration-300 overflow-hidden group"
                  data-testid="button-email-auth"
                  disabled={isLoading}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-5 h-5 mr-2" />
                    )}
                    {mode === "signin" ? "Sign In" : "Create Account"}
                  </span>
                </Button>
              </motion.div>
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
            
            <p className="text-center text-xs text-muted-foreground/60 mt-4">
              By Continuing, You Agree To Our{" "}
              <Link 
                href="/terms" 
                className="text-primary/80 hover:text-primary underline"
                data-testid="link-terms-of-service"
              >
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link 
                href="/privacy" 
                className="text-primary/80 hover:text-primary underline"
                data-testid="link-privacy-policy"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
        )}
      </div>
    </div>
  );
}
