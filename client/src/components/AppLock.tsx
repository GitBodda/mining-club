import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { PinEntry } from "./PinEntry";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  checkBiometricAvailability, 
  authenticateWithBiometrics,
  isNativePlatform 
} from "@/lib/nativeServices";
import ComplianceContext from "@/contexts/ComplianceContext";

// Safe compliance check - uses context directly without throwing if unavailable
function useSafeComplianceMode(): boolean {
  const context = useContext(ComplianceContext);
  // If context is undefined (not within provider), default to false
  return context?.isComplianceMode ?? false;
}

interface SecuritySettings {
  pinEnabled: boolean;
  biometricEnabled: boolean;
  lockOnBackground: boolean;
}

interface ServerSecuritySettings {
  pinLockEnabled?: boolean;
  biometricEnabled?: boolean;
  lockOnBackground?: boolean;
}

interface AppLockContextType {
  isLocked: boolean;
  securityEnabled: boolean;
  unlock: () => void;
  lock: () => void;
  settings: SecuritySettings | null;
  showPinSetup: (onComplete?: () => void) => void;
  hidePinSetup: () => void;
  isSettingUpPin: boolean;
  triggerBiometricAuth: () => Promise<boolean>;
}

const AppLockContext = createContext<AppLockContextType | null>(null);

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error("useAppLock must be used within AppLockProvider");
  }
  return context;
}

interface AppLockProviderProps {
  children: ReactNode;
  userId?: string;
}

export function AppLockProvider({ children, userId }: AppLockProviderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Safe compliance mode check - won't crash if context unavailable
  const isComplianceMode = useSafeComplianceMode();
  
  // In compliance mode, never lock the app - skip all PIN/biometric functionality
  const [isLocked, setIsLocked] = useState(false);
  const [isSettingUpPin, setIsSettingUpPin] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | "none">("none");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Refs for preventing multiple simultaneous auth attempts
  const authInProgressRef = useRef(false);
  const hasTriedAutoAuthRef = useRef(false);
  const pinSetupCompleteCallbackRef = useRef<(() => void) | null>(null);
  
  // Track last activity time for 60-minute timeout
  const lastActivityRef = useRef<number>(Date.now());
  const LOCK_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes

  // Fetch security settings
  const { data: settings } = useQuery<ServerSecuritySettings, Error, SecuritySettings>({
    queryKey: ["/api/security/settings", userId],
    enabled: !!userId,
    refetchOnWindowFocus: false,
    select: (data) => ({
      pinEnabled: Boolean(data?.pinLockEnabled),
      biometricEnabled: Boolean(data?.biometricEnabled),
      lockOnBackground: Boolean(data?.lockOnBackground),
    }),
  });

  // Verify PIN mutation
  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      if (!userId) {
        throw new Error("Missing user id for PIN verification");
      }
      const response = await apiRequest("POST", "/api/security/verify-pin", { pin, userId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setIsLocked(false);
        setFailedAttempts(0);
        sessionStorage.setItem("app_unlocked", "true");
      } else {
        handleFailedAttempt();
      }
    },
    onError: () => {
      handleFailedAttempt();
    },
  });

  // Setup PIN mutation
  const setupPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      if (!userId) {
        throw new Error("Missing user id for PIN setup");
      }
      const response = await apiRequest("POST", "/api/security/pin", { pin, userId });
      return response.json();
    },
    onSuccess: () => {
      setIsSettingUpPin(false);
      queryClient.invalidateQueries({ queryKey: ["/api/security/settings", userId] });
      toast({
        title: "PIN Created",
        description: "Your app is now protected with a PIN code",
      });
      
      // Call the completion callback if one was provided (e.g., for biometric setup flow)
      if (pinSetupCompleteCallbackRef.current) {
        console.log('[AppLock] PIN setup complete, calling completion callback');
        // Small delay to let the query invalidation complete
        setTimeout(() => {
          pinSetupCompleteCallbackRef.current?.();
          pinSetupCompleteCallbackRef.current = null;
        }, 500);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create PIN. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFailedAttempt = useCallback(() => {
    const attempts = failedAttempts + 1;
    setFailedAttempts(attempts);
    
    if (attempts >= 5) {
      const lockout = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      setLockoutUntil(lockout);
      toast({
        title: "Too many attempts",
        description: "Try again in 30 minutes",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Incorrect PIN",
        description: `${5 - attempts} attempts remaining`,
        variant: "destructive",
      });
    }
  }, [failedAttempts, toast]);

  // Define handleBiometricRequest BEFORE any useEffect that references it
  const handleBiometricRequest = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous authentication attempts
    if (authInProgressRef.current) {
      console.log('[AppLock] Auth already in progress, skipping...');
      return false;
    }
    
    // Mark as tried immediately to prevent re-triggers
    hasTriedAutoAuthRef.current = true;
    
    try {
      authInProgressRef.current = true;
      setIsAuthenticating(true);
      
      if (!settings?.biometricEnabled) {
        console.log('[AppLock] Biometrics not enabled in settings');
        return false;
      }
      
      // Check if native platform with biometrics
      if (isNativePlatform()) {
        console.log('[AppLock] Checking biometric availability...');
        const availability = await checkBiometricAvailability();
        
        if (!availability.isAvailable) {
          console.log('[AppLock] Biometrics not available:', availability.errorMessage);
          toast({
            title: "Biometrics Unavailable",
            description: availability.errorMessage || "Please use your PIN instead",
            variant: "destructive",
          });
          return false;
        }
        
        console.log('[AppLock] Requesting biometric authentication...');
        const result = await authenticateWithBiometrics('Unlock BlockMint');
        
        if (result.success) {
          console.log('[AppLock] Biometric auth successful!');
          setIsLocked(false);
          setFailedAttempts(0);
          sessionStorage.setItem("app_unlocked", "true");
          return true;
        } else {
          console.log('[AppLock] Biometric auth failed:', result.error);
          // Only show error toast if it's not a user cancellation
          if (!result.error?.toLowerCase().includes('cancel')) {
            toast({
              title: "Authentication Failed",
              description: result.error || "Please try again or use your PIN",
              variant: "destructive",
            });
          }
          return false;
        }
      }
      
      // Web fallback
      console.log('[AppLock] Web platform - biometrics not natively available');
      return false;
    } catch (e) {
      console.error("[AppLock] Biometric auth error:", e);
      return false;
    } finally {
      authInProgressRef.current = false;
      setIsAuthenticating(false);
    }
  }, [settings?.biometricEnabled, toast]);

  // Detect biometric capability using native plugin
  useEffect(() => {
    async function detectBiometrics() {
      if (isNativePlatform()) {
        try {
          const availability = await checkBiometricAvailability();
          console.log('[AppLock] Biometric availability:', availability);
          if (availability.biometryType === 'face') {
            setBiometricType('face');
          } else if (availability.biometryType === 'fingerprint') {
            setBiometricType('fingerprint');
          } else {
            setBiometricType('none');
          }
        } catch (e) {
          console.error('[AppLock] Failed to detect biometrics:', e);
          setBiometricType('none');
        }
      } else {
        // Web fallback - check user agent
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        if (isIOS) setBiometricType('face');
        else if (isAndroid) setBiometricType('fingerprint');
        else setBiometricType('none');
      }
    }
    detectBiometrics();
  }, []);

  // Lock on visibility change (app backgrounded) - use Capacitor App plugin if available
  // Only lock if 60 minutes have passed since last activity
  useEffect(() => {
    const securityEnabled = settings?.pinEnabled || settings?.biometricEnabled;
    if (!securityEnabled) return;

    // Update last activity on user interactions
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };
    
    // Track user activity
    document.addEventListener("touchstart", updateActivity, { passive: true });
    document.addEventListener("click", updateActivity, { passive: true });
    document.addEventListener("keydown", updateActivity, { passive: true });
    document.addEventListener("scroll", updateActivity, { passive: true });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background - save the time
        console.log('[AppLock] App went to background');
      } else {
        // App came back to foreground - check if 60 minutes have passed
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        console.log('[AppLock] App returned, time since last activity:', Math.round(timeSinceLastActivity / 1000 / 60), 'minutes');
        
        if (timeSinceLastActivity >= LOCK_TIMEOUT_MS) {
          console.log('[AppLock] 60+ minutes passed, locking app...');
          setIsLocked(true);
          hasTriedAutoAuthRef.current = false; // Reset so biometric triggers
          sessionStorage.removeItem("app_unlocked");
        }
      }
    };

    // Listen for visibility changes (works for both web and Capacitor)
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Also listen for Capacitor app state changes if available
    let removeAppListener: (() => void) | null = null;
    if (isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            console.log('[AppLock] Capacitor: App became inactive');
          } else if (securityEnabled) {
            // App became active - check timeout
            const timeSinceLastActivity = Date.now() - lastActivityRef.current;
            console.log('[AppLock] Capacitor: App returned, time since activity:', Math.round(timeSinceLastActivity / 1000 / 60), 'minutes');
            
            if (timeSinceLastActivity >= LOCK_TIMEOUT_MS) {
              console.log('[AppLock] Capacitor: 60+ minutes passed, locking...');
              setIsLocked(true);
              hasTriedAutoAuthRef.current = false;
              sessionStorage.removeItem("app_unlocked");
            }
          }
        }).then(listener => {
          removeAppListener = () => listener.remove();
        });
      }).catch(e => console.log('[AppLock] Capacitor App plugin not available'));
    }
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("touchstart", updateActivity);
      document.removeEventListener("click", updateActivity);
      document.removeEventListener("keydown", updateActivity);
      document.removeEventListener("scroll", updateActivity);
      if (removeAppListener) removeAppListener();
    };
  }, [settings?.pinEnabled, settings?.biometricEnabled]);

  // Initial lock if PIN or biometric is enabled
  useEffect(() => {
    const securityActive = settings?.pinEnabled || settings?.biometricEnabled;
    if (securityActive && !isLocked) {
      // Lock on first load if security is enabled
      const hasUnlockedRecently = sessionStorage.getItem("app_unlocked");
      if (!hasUnlockedRecently) {
        console.log('[AppLock] Initial lock - security enabled, no recent unlock');
        setIsLocked(true);
      }
    }
  }, [settings?.pinEnabled, settings?.biometricEnabled, isLocked]);

  // Auto-trigger biometric authentication when locked and biometrics enabled
  // Only trigger once per lock session
  useEffect(() => {
    if (isLocked && settings?.biometricEnabled && !isSettingUpPin && !hasTriedAutoAuthRef.current && !authInProgressRef.current) {
      // Delay slightly to ensure UI is ready
      const timer = setTimeout(() => {
        if (!authInProgressRef.current && !hasTriedAutoAuthRef.current) {
          console.log('[AppLock] Auto-triggering biometric auth...');
          hasTriedAutoAuthRef.current = true;
          handleBiometricRequest();
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLocked, settings?.biometricEnabled, isSettingUpPin, handleBiometricRequest]);

  const handlePinSuccess = useCallback((pin: string) => {
    if (pin === "biometric") {
      // Biometric succeeded - already handled in handleBiometricRequest
      console.log('[AppLock] PIN success callback with biometric marker');
      setIsLocked(false);
      setFailedAttempts(0);
      sessionStorage.setItem("app_unlocked", "true");
      return;
    }

    if (isSettingUpPin) {
      setupPinMutation.mutate(pin);
    } else {
      verifyPinMutation.mutate(pin);
    }
  }, [isSettingUpPin, setupPinMutation, verifyPinMutation]);

  // Expose a method to manually trigger biometric auth (for Settings and retry)
  const triggerBiometricAuth = useCallback(async (): Promise<boolean> => {
    hasTriedAutoAuthRef.current = false; // Allow re-try
    return handleBiometricRequest();
  }, [handleBiometricRequest]);

  const handleForgotPin = useCallback(() => {
    toast({
      title: "Forgot PIN?",
      description: "Please contact support to reset your PIN",
    });
  }, [toast]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    sessionStorage.setItem("app_unlocked", "true");
  }, []);

  const lock = useCallback(() => {
    setIsLocked(true);
    sessionStorage.removeItem("app_unlocked");
  }, []);

  const showPinSetup = useCallback((onComplete?: () => void) => {
    console.log('[AppLock] showPinSetup called, onComplete:', !!onComplete);
    pinSetupCompleteCallbackRef.current = onComplete || null;
    setIsSettingUpPin(true);
  }, []);
  
  const hidePinSetup = useCallback(() => {
    pinSetupCompleteCallbackRef.current = null;
    setIsSettingUpPin(false);
  }, []);

  // Check lockout
  const isLockedOut = lockoutUntil && new Date() < lockoutUntil;

  // In compliance mode, never show lock screens
  const effectivelyLocked = isComplianceMode ? false : isLocked;

  const value: AppLockContextType = {
    isLocked,
    securityEnabled: settings?.pinEnabled || false,
    unlock,
    lock,
    settings: settings || null,
    showPinSetup,
    hidePinSetup,
    isSettingUpPin,
    triggerBiometricAuth,
  };

  return (
    <AppLockContext.Provider value={value}>
      {children}
      
      <AnimatePresence>
        {/* PIN Verification - Never show in compliance mode */}
        {effectivelyLocked && settings?.pinEnabled && !isSettingUpPin && !isLockedOut && (
          <PinEntry
            mode="verify"
            onSuccess={handlePinSuccess}
            onCancel={handleForgotPin}
            onBiometricRequest={settings.biometricEnabled ? handleBiometricRequest : undefined}
            biometricType={settings.biometricEnabled ? biometricType : "none"}
          />
        )}
        
        {/* Biometric-only lock screen (no PIN set, only Face ID/Touch ID) */}
        {effectivelyLocked && !settings?.pinEnabled && settings?.biometricEnabled && !isSettingUpPin && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-8 text-center">
            <div className="w-20 h-20 mb-6 rounded-2xl bg-primary/20 flex items-center justify-center">
              <span className="text-4xl">{biometricType === 'face' ? '🔐' : '👆'}</span>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              {biometricType === 'face' ? 'Face ID Required' : 'Biometric Required'}
            </h1>
            <p className="text-muted-foreground mb-6">
              Verify your identity to continue
            </p>
            <button
              onClick={triggerBiometricAuth}
              disabled={isAuthenticating}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
            >
              {isAuthenticating ? 'Verifying...' : biometricType === 'face' ? 'Use Face ID' : 'Use Biometrics'}
            </button>
          </div>
        )}
        
        {/* PIN Setup - Never show in compliance mode */}
        {!isComplianceMode && isSettingUpPin && (
          <PinEntry
            mode="setup"
            onSuccess={handlePinSuccess}
            onCancel={hidePinSetup}
            biometricType="none"
          />
        )}
      </AnimatePresence>
      
      {/* Lockout Screen - Never show in compliance mode */}
      {!isComplianceMode && isLockedOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-8 text-center">
          <div className="w-20 h-20 mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Account Locked</h1>
          <p className="text-muted-foreground">
            Too many failed attempts. Please try again later.
          </p>
        </div>
      )}
    </AppLockContext.Provider>
  );
}
