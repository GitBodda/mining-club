import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { 
  User, Shield, Bell, Key, ScanFace, Clock, 
  DollarSign, Globe, ChevronRight, ChevronLeft, Info,
  FileText, Mail, LogOut, Lock, Loader2, Camera,
  Link2, Unlink, Wallet, CalendarClock, ArrowDownToLine,
  Trash2, AlertTriangle
} from "lucide-react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider, linkWithPopup, unlink } from "firebase/auth";
import { GlassCard } from "@/components/GlassCard";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TwoFactorSetupModal } from "@/components/TwoFactorSetupModal";
import { useAppLock } from "@/components/AppLock";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { requestNotificationPermission } from "@/lib/firebase";
import { checkBiometricAvailability, authenticateWithBiometrics, isIOS } from "@/lib/nativeServices";
import type { UserSettings } from "@/lib/types";
import type { User as FirebaseUser } from "firebase/auth";

interface SettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: Partial<UserSettings>) => void;
  user?: FirebaseUser | null;
  onLogout?: () => void;
  onClose?: () => void;
}

interface ServerSecuritySettings {
  pinLockEnabled?: boolean;
  biometricEnabled?: boolean;
  lockOnBackground?: boolean;
}

interface SettingItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  onClick?: () => void;
  action?: React.ReactNode;
  danger?: boolean;
  testId?: string;
}

function SettingItem({ icon: Icon, label, description, onClick, action, danger, testId }: SettingItemProps) {
  const content = (
    <div className={cn(
      "flex items-center gap-4 py-3",
      "border-b border-white/[0.04] last:border-0"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl",
        "flex items-center justify-center",
        "bg-gradient-to-br",
        danger 
          ? "from-red-500/20 to-rose-500/10 text-red-400"
          : "from-white/[0.08] to-white/[0.04] text-muted-foreground"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium",
          danger ? "text-red-400" : "text-foreground"
        )}>{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action || (onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />)}
    </div>
  );

  if (onClick) {
    return (
      <button
        className="w-full text-left hover-elevate rounded-lg"
        onClick={onClick}
        data-testid={testId || `setting-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {content}
      </button>
    );
  }

  return <div data-testid={testId || `setting-${label.toLowerCase().replace(/\s+/g, '-')}`}>{content}</div>;
}

function isEmailPasswordUser(user: FirebaseUser | null | undefined): boolean {
  if (!user) return false;
  return user.providerData.some(provider => provider.providerId === 'password');
}

function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isStandalone = (window.matchMedia('(display-mode: standalone)').matches) || 
                       ((window.navigator as any).standalone === true);
  return isMobile || isStandalone;
}

function getBiometricType(): 'face' | 'fingerprint' | 'unknown' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'face';
  }
  if (/android/.test(userAgent)) {
    return 'fingerprint';
  }
  return 'unknown';
}

export function Settings({ settings, onSettingsChange, user, onLogout, onClose }: SettingsProps) {
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const appLock = useAppLock();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showNotificationPrefsDialog, setShowNotificationPrefsDialog] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showAutoWithdrawDialog, setShowAutoWithdrawDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [confirmPinCode, setConfirmPinCode] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Auto-withdrawal form state
  const [autoWithdrawEnabled, setAutoWithdrawEnabled] = useState(false);
  const [autoWithdrawCurrency, setAutoWithdrawCurrency] = useState("USDT");
  const [autoWithdrawNetwork, setAutoWithdrawNetwork] = useState("trc20");
  const [autoWithdrawAddress, setAutoWithdrawAddress] = useState("");
  const [autoWithdrawPeriod, setAutoWithdrawPeriod] = useState("monthly");
  const [autoWithdrawMinAmount, setAutoWithdrawMinAmount] = useState("10");
  
  // Account deletion state
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  const resolvedUserId = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const id = parsed.id || parsed.dbId || parsed.uid || parsed.userId || null;
        console.log('[Settings] resolvedUserId from localStorage:', id, parsed);
        return id;
      }
    } catch (e) {
      console.error('[Settings] Error parsing user from localStorage:', e);
    }
    console.log('[Settings] resolvedUserId from user prop:', user?.uid);
    return user?.uid ?? null;
  }, [user]);

  // Fetch security settings from API
  const { data: securitySettings, isLoading: isLoadingSettings, error: settingsError } = useQuery<ServerSecuritySettings, Error, { pinEnabled: boolean; biometricEnabled: boolean; lockOnBackground: boolean }>({
    queryKey: ["/api/security/settings", resolvedUserId],
    enabled: !!resolvedUserId,
    select: (data) => {
      console.log('[Settings] Security settings raw data:', data);
      return {
        pinEnabled: Boolean(data?.pinLockEnabled),
        biometricEnabled: Boolean(data?.biometricEnabled),
        lockOnBackground: Boolean(data?.lockOnBackground),
      };
    },
  });
  
  // Debug logging for security settings
  useEffect(() => {
    console.log('[Settings] Security settings state:', { 
      resolvedUserId, 
      securitySettings, 
      isLoadingSettings, 
      settingsError: settingsError?.message 
    });
  }, [resolvedUserId, securitySettings, isLoadingSettings, settingsError]);

  // Mutations for security settings
  const disablePinMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedUserId) {
        throw new Error("Missing user id for disabling PIN");
      }
      const response = await apiRequest("POST", "/api/security/disable-pin", { userId: resolvedUserId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/settings", resolvedUserId] });
      toast({
        title: "PIN Disabled",
        description: "PIN code authentication has been turned off.",
      });
    },
  });

  const toggleBiometricMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!resolvedUserId) {
        throw new Error("Missing user id for biometric toggle");
      }
      const response = await apiRequest("POST", "/api/security/biometric", { enabled, userId: resolvedUserId });
      return response.json();
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/settings", resolvedUserId] });
      const biometricType = getBiometricType();
      const biometricName = biometricType === 'face' ? 'Face ID' : biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometric';
      toast({
        title: enabled ? `${biometricName} Enabled` : `${biometricName} Disabled`,
        description: enabled ? `Your app is now protected with ${biometricName}.` : `${biometricName} authentication has been turned off.`,
      });
    },
  });

  // Auto-withdrawal settings query and mutation
  const { data: autoWithdrawData } = useQuery<{
    enabled: boolean;
    currency: string;
    network: string;
    walletAddress: string;
    period: string;
    minAmount: string;
  }>({
    queryKey: ["/api/users", user?.uid, "auto-withdraw"],
    queryFn: async () => {
      if (!user?.uid) throw new Error("Not authenticated");
      const response = await apiRequest("GET", `/api/users/${user.uid}/auto-withdraw`);
      return response.json();
    },
    enabled: !!user?.uid,
  });

  // Update local state when data loads
  useEffect(() => {
    if (autoWithdrawData) {
      setAutoWithdrawEnabled(autoWithdrawData.enabled);
      setAutoWithdrawCurrency(autoWithdrawData.currency);
      setAutoWithdrawNetwork(autoWithdrawData.network);
      setAutoWithdrawAddress(autoWithdrawData.walletAddress || "");
      setAutoWithdrawPeriod(autoWithdrawData.period);
      setAutoWithdrawMinAmount(autoWithdrawData.minAmount);
    }
  }, [autoWithdrawData]);

  const saveAutoWithdrawMutation = useMutation({
    mutationFn: async (data: {
      enabled: boolean;
      currency: string;
      network: string;
      walletAddress: string;
      period: string;
      minAmount: string;
    }) => {
      if (!user?.uid) throw new Error("Not authenticated");
      const response = await apiRequest("PATCH", `/api/users/${user.uid}/auto-withdraw`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.uid, "auto-withdraw"] });
      setShowAutoWithdrawDialog(false);
      toast({
        title: "Auto-Withdrawal Updated",
        description: autoWithdrawEnabled 
          ? "Your auto-withdrawal settings have been saved."
          : "Auto-withdrawal has been disabled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save auto-withdrawal settings",
        variant: "destructive",
      });
    },
  });

  const displayName = user?.displayName || user?.email?.split('@')[0] || "Guest User";
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "GU";
  const email = user?.email || "Not signed in";
  const memberSince = user?.metadata?.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : "Dec 2024";

  // Linked accounts detection - reload user to ensure fresh providerData
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  
  useEffect(() => {
    const refreshProviders = async () => {
      if (user) {
        try {
          // Reload user to get fresh providerData
          await user.reload();
          const providers = user.providerData.map(p => p.providerId);
          setLinkedProviders(providers);
        } catch (error) {
          console.error("Error refreshing user providers:", error);
          setLinkedProviders(user.providerData.map(p => p.providerId));
        }
      } else {
        setLinkedProviders([]);
      }
    };
    refreshProviders();
  }, [user]);

  const isGoogleLinked = linkedProviders.includes('google.com');
  const isPasswordLinked = linkedProviders.includes('password');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setIsAdminUser(false);
        return;
      }
      try {
        const tokenResult = await user.getIdTokenResult();
        const claims: any = tokenResult?.claims || {};
        const isAdmin = claims.admin === true || claims.role === "admin";
        if (!cancelled) setIsAdminUser(isAdmin);
      } catch {
        if (!cancelled) setIsAdminUser(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Notification preferences
  const { data: notificationPrefs } = useQuery({
    queryKey: ["/api/users", user?.uid, "notification-preferences"],
    queryFn: async () => {
      if (!user?.uid) return null;
      const token = await user.getIdToken();
      const res = await fetch(`/api/users/${user.uid}/notification-preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user?.uid,
  });

  const updateNotificationPrefsMutation = useMutation({
    mutationFn: async (prefs: Record<string, boolean>) => {
      if (!user?.uid) return;
      const token = await user.getIdToken();
      await fetch(`/api/users/${user.uid}/notification-preferences`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prefs),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.uid, "notification-preferences"] });
      toast({ title: "Preferences Updated" });
    },
  });

  // 2FA status
  const { data: twoFactorStatus } = useQuery({
    queryKey: ["/api/auth/2fa/status", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return { enabled: false };
      const res = await fetch(`/api/auth/2fa/status/${user.uid}`);
      return res.json();
    },
    enabled: !!user?.uid,
  });

  // Fetch user balances for BTC mined
  const { data: userBalances } = useQuery<{ balances: { symbol: string; balance: number }[] }>({
    queryKey: ["/api/balances", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return { balances: [] };
      const res = await fetch(`/api/balances/${user.uid}`);
      return res.json();
    },
    enabled: !!user?.uid,
  });

  // Get BTC price for conversion
  const { btcPrice } = useBTCPrice();

  // Calculate days active since account creation
  const daysActive = user?.metadata?.creationTime 
    ? Math.floor((Date.now() - new Date(user.metadata.creationTime).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Calculate total earnings in BTC equivalent (BTC balance + USDT/USD converted to BTC)
  const btcBalance = userBalances?.balances?.find(b => b.symbol === "BTC")?.balance || 0;
  const usdtBalance = userBalances?.balances?.find(b => b.symbol === "USDT")?.balance || 0;
  const usdcBalance = userBalances?.balances?.find(b => b.symbol === "USDC")?.balance || 0;
  const totalUsdValue = usdtBalance + usdcBalance;
  const btcEquivalent = btcPrice > 0 ? (btcBalance + (totalUsdValue / btcPrice)) : btcBalance;

  // Link/Unlink Google
  const handleLinkGoogle = async () => {
    if (!user) return;
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(user, provider);
      toast({
        title: "Google Account Linked",
        description: "You can now sign in with Google.",
      });
    } catch (error: any) {
      toast({
        title: "Link Failed",
        description: error.message || "Failed to link Google account.",
        variant: "destructive",
      });
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!user) return;
    try {
      await unlink(user, 'google.com');
      toast({
        title: "Google Account Unlinked",
        description: "Google sign-in has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Unlink Failed",
        description: error.message || "Failed to unlink Google account.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your new passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.code === 'auth/wrong-password' 
          ? "Current password is incorrect." 
          : "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSetPin = () => {
    if (pinCode.length !== 4 || !/^\d{4}$/.test(pinCode)) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 4-digit PIN code.",
        variant: "destructive",
      });
      return;
    }

    if (pinCode !== confirmPinCode) {
      toast({
        title: "PINs Don't Match",
        description: "Please make sure your PIN codes match.",
        variant: "destructive",
      });
      return;
    }

    onSettingsChange({ pinLockEnabled: true, pinCode: pinCode });
    localStorage.setItem("pinCode", pinCode);
    toast({
      title: "PIN Lock Enabled",
      description: "Your app is now protected with a PIN code.",
    });
    setShowPinDialog(false);
    setPinCode("");
    setConfirmPinCode("");
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    console.log('[Settings] handleBiometricToggle called, enabled:', enabled, 'pinEnabled:', securitySettings?.pinEnabled);
    
    if (!resolvedUserId) {
      toast({
        title: "Missing user",
        description: "Please sign in again to manage biometric settings.",
        variant: "destructive",
      });
      return;
    }

    // Check if PIN is enabled first (biometric requires PIN as fallback)
    if (enabled && !securitySettings?.pinEnabled) {
      // Automatically start PIN setup flow and continue to biometric after completion
      toast({
        title: "PIN Setup Required",
        description: "Setting up PIN first, then enabling biometric authentication.",
      });
      
      appLock.showPinSetup(async () => {
        // This callback runs after PIN setup completes successfully
        console.log('[Settings] PIN setup completed, now setting up biometric...');
        setIsBiometricLoading(true);
        
        // Use setTimeout to ensure the loading state renders before blocking calls
        setTimeout(async () => {
          try {
            // Now continue with biometric setup
            console.log('[Settings] Checking biometric availability for enabling...');
            const availability = await checkBiometricAvailability();
            console.log('[Settings] Biometric availability:', availability);
            
            if (!availability.isAvailable) {
              toast({
                title: "Biometrics Not Available",
                description: availability.errorMessage || "Your device doesn't support biometric authentication, or it's not set up in system settings.",
                variant: "destructive",
              });
              setIsBiometricLoading(false);
              return;
            }

            // Verify identity before enabling
            console.log('[Settings] Requesting biometric verification...');
            const result = await authenticateWithBiometrics("Enable biometric login for BlockMint");
            console.log('[Settings] Biometric verification result:', result);
            
            if (!result.success) {
              if (!result.error?.toLowerCase().includes('cancel')) {
                toast({
                  title: "Authentication Failed",
                  description: result.error || "Could not verify your identity. Please try again.",
                  variant: "destructive",
                });
              }
              setIsBiometricLoading(false);
              return;
            }

            console.log('[Settings] Enabling biometric in database...');
            toggleBiometricMutation.mutate(true);
            setIsBiometricLoading(false);
          } catch (error) {
            console.error('[Settings] Biometric setup error:', error);
            toast({
              title: "Setup Failed",
              description: "Failed to enable biometric authentication. Please try again.",
              variant: "destructive",
            });
            setIsBiometricLoading(false);
          }
        }, 50);
      });
      return;
    }

    if (enabled) {
      // Set loading state asynchronously to ensure UI updates
      setIsBiometricLoading(true);
      
      // Use setTimeout to ensure the loading state renders before blocking calls
      setTimeout(async () => {
        try {
          // Check biometric availability using native services
          console.log('[Settings] Checking biometric availability for enabling...');
          
          const availability = await checkBiometricAvailability();
          console.log('[Settings] Biometric availability:', availability);
          
          if (!availability.isAvailable) {
            toast({
              title: "Biometrics Not Available",
              description: availability.errorMessage || "Your device doesn't support biometric authentication, or it's not set up in system settings.",
              variant: "destructive",
            });
            setIsBiometricLoading(false);
            return;
          }

          // Verify identity before enabling
          console.log('[Settings] Requesting biometric verification...');
          toast({
            title: "Verify Your Identity",
            description: "Use Face ID or passcode to continue.",
          });
          
          const result = await authenticateWithBiometrics("Enable biometric login for BlockMint");
          console.log('[Settings] Biometric verification result:', result);
          
          if (!result.success) {
            // Don't show error for user cancellation
            if (!result.error?.toLowerCase().includes('cancel')) {
              toast({
                title: "Authentication Failed",
                description: result.error || "Could not verify your identity. Please try again.",
                variant: "destructive",
              });
            }
            setIsBiometricLoading(false);
            return;
          }

          console.log('[Settings] Enabling biometric in database...');
          toggleBiometricMutation.mutate(true);
          setIsBiometricLoading(false);
        } catch (error) {
          console.error('[Settings] Biometric setup error:', error);
          toast({
            title: "Setup Failed",
            description: "Failed to enable biometric authentication. Please try again.",
            variant: "destructive",
          });
          setIsBiometricLoading(false);
        }
      }, 50);
    } else {
      toggleBiometricMutation.mutate(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setIsDeletingAccount(true);
    try {
      const idToken = await user.getIdToken();
      const storedUser = localStorage.getItem("user");
      const userId = storedUser ? JSON.parse(storedUser).id || user.uid : user.uid;
      
      const response = await fetch(`/api/auth/account/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been scheduled for deletion.",
      });

      // Log out and clear local storage
      localStorage.clear();
      if (onLogout) {
        onLogout();
      }
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountDialog(false);
      setDeleteConfirmText("");
    }
  };

  const handleOpenProfileEdit = () => {
    setEditName(displayName);
    setEditEmail(email);
    setAvatarPreview(user?.photoURL || null);
    setShowProfileDialog(true);
  };

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile changes will be saved when connected to cloud storage.",
    });
    setShowProfileDialog(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePinToggle = (enabled: boolean) => {
    if (enabled) {
      // Use the new AppLock PIN setup
      appLock.showPinSetup();
    } else {
      // Disable PIN via API
      if (resolvedUserId) {
        disablePinMutation.mutate();
      } else {
        toast({
          title: "Missing user",
          description: "Please sign in again to manage PIN settings.",
          variant: "destructive",
        });
      }
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      window.history.back();
    }
  };

  return (
    <motion.div
      className="flex flex-col gap-6 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-30 -mx-4 px-4 py-3 mb-3 bg-background/95 backdrop-blur-xl flex items-center gap-3"
      >
        <button
          onClick={handleBack}
          className="w-11 h-11 rounded-2xl liquid-glass flex items-center justify-center hover-elevate transition-all"
          type="button"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage Your Preferences</p>
        </div>
      </motion.header>

      <GlassCard delay={0.1} className="relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <label 
            htmlFor="avatar-upload" 
            className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center overflow-hidden cursor-pointer group"
            data-testid="button-change-avatar"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">{initials}</span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <input 
              type="file" 
              id="avatar-upload" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  toast({
                    title: "Avatar Upload",
                    description: "Avatar change will be available with cloud storage integration.",
                  });
                }
              }}
            />
          </label>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground" data-testid="text-user-name">{displayName}</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-user-email">{email}</p>
            <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-mining-since">Mining Since {memberSince}</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-6 mt-6 pt-4 border-t border-white/[0.06] flex-wrap">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground" data-testid="text-days-active">{daysActive}</p>
            <p className="text-xs text-muted-foreground">Days Active</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground" data-testid="text-btc-mined">{btcEquivalent.toFixed(6)}</p>
            <p className="text-xs text-muted-foreground">BTC Equivalent</p>
          </div>
        </div>
      </GlassCard>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">ACCOUNT</h2>
        <GlassCard delay={0.15} className="p-4">
          <SettingItem
            icon={User}
            label="Profile"
            description="Edit Your Personal Info"
            onClick={handleOpenProfileEdit}
            testId="button-profile"
          />
          {isEmailPasswordUser(user) && (
            <SettingItem
              icon={Key}
              label="Change Password"
              description="Update Your Account Password"
              onClick={() => setShowPasswordDialog(true)}
              testId="button-change-password"
            />
          )}
          <SettingItem
            icon={Shield}
            label="Two-Factor Authentication"
            description={twoFactorStatus?.enabled ? "2FA is enabled" : "Add Extra Security To Your Account"}
            testId="setting-two-factor"
            onClick={() => setShow2FAModal(true)}
            action={
              <div className="flex items-center gap-2">
                {twoFactorStatus?.enabled && (
                  <Badge variant="default" className="bg-green-500">Enabled</Badge>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            }
          />
        </GlassCard>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">LINKED ACCOUNTS</h2>
        <GlassCard delay={0.17} className="p-4">
          <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.04]">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Google</p>
                <p className="text-sm text-muted-foreground">
                  {isGoogleLinked ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
            <Button
              variant={isGoogleLinked ? "outline" : "default"}
              size="sm"
              onClick={isGoogleLinked ? handleUnlinkGoogle : handleLinkGoogle}
            >
              {isGoogleLinked ? <Unlink className="w-4 h-4 mr-1" /> : <Link2 className="w-4 h-4 mr-1" />}
              {isGoogleLinked ? "Unlink" : "Link"}
            </Button>
          </div>
        </GlassCard>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">PREFERENCES</h2>
        <GlassCard delay={0.2} className="p-4">
          <SettingItem
            icon={Bell}
            label="Notifications"
            description="Mining Alerts And Payouts"
            testId="setting-notifications"
            action={
              <Switch
                  data-testid="switch-notifications"
                  checked={settings.notificationsEnabled}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      // Request system notification permission when enabling
                      try {
                        const token = await requestNotificationPermission();
                        if (token) {
                          // Save FCM token to server if we got one
                          if (user?.uid) {
                            const authToken = await user.getIdToken();
                            await fetch(`/api/users/${user.uid}/fcm-token`, {
                              method: "POST",
                              headers: { 
                                Authorization: `Bearer ${authToken}`,
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ fcmToken: token }),
                            });
                          }
                          onSettingsChange({ notificationsEnabled: true });
                          toast({ title: "Notifications Enabled", description: "You'll receive push notifications for mining updates." });
                        } else {
                          toast({ 
                            title: "Permission Denied", 
                            description: "Please allow notifications in your browser/device settings.",
                            variant: "destructive" 
                          });
                        }
                      } catch (error) {
                        console.error("Error enabling notifications:", error);
                        toast({ 
                          title: "Error", 
                          description: "Could not enable notifications. Please try again.",
                          variant: "destructive" 
                        });
                      }
                    } else {
                      onSettingsChange({ notificationsEnabled: false });
                      toast({ title: "Notifications Disabled" });
                    }
                  }}
                />
            }
          />
          <div className="py-3 border-b border-white/[0.04]" data-testid="setting-currency">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.04] text-muted-foreground">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Currency Display</p>
                <p className="text-sm text-muted-foreground">Preferred Currency</p>
              </div>
              <Select 
                value={currency} 
                onValueChange={(value: 'USD' | 'EUR' | 'GBP' | 'AED') => {
                  onSettingsChange({ currency: value });
                  setCurrency(value);
                }}
              >
                <SelectTrigger className="w-24" data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD" data-testid="option-currency-usd">USD</SelectItem>
                  <SelectItem value="EUR" data-testid="option-currency-eur">EUR</SelectItem>
                  <SelectItem value="GBP" data-testid="option-currency-gbp">GBP</SelectItem>
                  <SelectItem value="AED" data-testid="option-currency-aed">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="py-3" data-testid="setting-language">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.04] text-muted-foreground">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Language</p>
                <p className="text-sm text-muted-foreground">App Language</p>
              </div>
              <Select 
                value={settings.language} 
                onValueChange={(value) => onSettingsChange({ language: value })}
              >
                <SelectTrigger className="w-28" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English" data-testid="option-language-english">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">SECURITY</h2>
        <GlassCard delay={0.25} className="p-4">
          <SettingItem
            icon={Lock}
            label="PIN Lock"
            description="Use A 6-Digit PIN Code"
            testId="setting-pin-lock"
            action={
              <Switch
                data-testid="switch-pin-lock"
                checked={securitySettings?.pinEnabled ?? false}
                onCheckedChange={handlePinToggle}
              />
            }
          />
          {/* Face ID - iOS only */}
          {isIOS() && (
            <SettingItem
              icon={ScanFace}
              label="Face ID"
              description="Unlock With Face ID"
              testId="setting-faceid"
              action={
                <Switch
                  data-testid="switch-faceid"
                  checked={securitySettings?.biometricEnabled ?? false}
                  onCheckedChange={handleBiometricToggle}
                  disabled={isBiometricLoading || toggleBiometricMutation.isPending}
                />
              }
            />
          )}
          <div className="py-3" data-testid="setting-session-timeout">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.04] text-muted-foreground">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Session Timeout</p>
                <p className="text-sm text-muted-foreground">Auto-Lock After Inactivity</p>
              </div>
              <Select 
                value={String(settings.sessionTimeout)} 
                onValueChange={(value) => onSettingsChange({ sessionTimeout: parseInt(value) })}
              >
                <SelectTrigger className="w-24" data-testid="select-session-timeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5" data-testid="option-timeout-5">5 Min</SelectItem>
                  <SelectItem value="15" data-testid="option-timeout-15">15 Min</SelectItem>
                  <SelectItem value="30" data-testid="option-timeout-30">30 Min</SelectItem>
                  <SelectItem value="60" data-testid="option-timeout-60">1 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Auto-Withdrawal Section */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">AUTO-WITHDRAWAL</h2>
        <GlassCard delay={0.27} className="p-4">
          <div className="py-3" data-testid="setting-auto-withdraw">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500/20 to-emerald-500/10 text-green-400">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Auto-Withdrawal</p>
                <p className="text-sm text-muted-foreground">
                  {autoWithdrawEnabled 
                    ? `${autoWithdrawCurrency} • ${autoWithdrawPeriod === 'weekly' ? 'Weekly' : 'Monthly'}`
                    : 'Automatically withdraw earnings'
                  }
                </p>
              </div>
              <Switch
                data-testid="switch-auto-withdraw"
                checked={autoWithdrawEnabled}
                onCheckedChange={(checked) => {
                  if (checked && !autoWithdrawAddress) {
                    setShowAutoWithdrawDialog(true);
                  } else {
                    setAutoWithdrawEnabled(checked);
                    saveAutoWithdrawMutation.mutate({
                      enabled: checked,
                      currency: autoWithdrawCurrency,
                      network: autoWithdrawNetwork,
                      walletAddress: autoWithdrawAddress,
                      period: autoWithdrawPeriod,
                      minAmount: autoWithdrawMinAmount,
                    });
                  }
                }}
              />
            </div>
          </div>
          <SettingItem
            icon={Wallet}
            label="Withdrawal Settings"
            description={autoWithdrawAddress 
              ? `${autoWithdrawAddress.slice(0, 6)}...${autoWithdrawAddress.slice(-4)}`
              : "Configure wallet address"
            }
            onClick={() => setShowAutoWithdrawDialog(true)}
            testId="button-withdrawal-settings"
          />
        </GlassCard>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">ABOUT</h2>
        <GlassCard delay={0.3} className="p-4">
          <SettingItem
            icon={Info}
            label="Version"
            description="v1.8.0 (Build 34)"
            testId="setting-version"
          />
          <SettingItem
            icon={FileText}
            label="Terms Of Service"
            onClick={() => window.location.href = '/terms'}
            testId="button-terms"
          />
          <SettingItem
            icon={Shield}
            label="Privacy Policy"
            onClick={() => window.location.href = '/privacy'}
            testId="button-privacy"
          />
          <SettingItem
            icon={Mail}
            label="Contact Support"
            description="Get Help With Your Account"
            onClick={() => window.open('mailto:info@blockmint.app', '_blank')}
            testId="button-contact-support"
          />
        </GlassCard>
      </div>

      {user && onLogout && (
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full h-12 border-red-500/30 text-red-400"
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
          
          <Button
            variant="ghost"
            className="w-full h-12 mt-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={() => setShowDeleteAccountDialog(true)}
            data-testid="button-delete-account"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete Account
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-2" data-testid="text-copyright">
        v1.8.0 (Build 34)
      </p>

      {/* Account Deletion Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-left space-y-3">
              <p>
                This action is <strong>permanent and cannot be undone</strong>. All your data including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Account information and profile</li>
                <li>Mining history and statistics</li>
                <li>Wallet balances and transaction history</li>
                <li>All associated data</li>
              </ul>
              <p className="text-red-400 font-medium">
                Will be permanently deleted within 30 days.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
              <Input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="border-red-500/30"
                data-testid="input-delete-confirm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteAccountDialog(false);
                setDeleteConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || isDeletingAccount}
              data-testid="button-confirm-delete"
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete My Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter Your Current Password And Choose A New One.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter Current Password"
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter New Password"
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                data-testid="input-confirm-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set PIN Lock</DialogTitle>
            <DialogDescription>
              Create A 4-Digit PIN To Secure Your App.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pin-code">Enter 4-Digit PIN</Label>
              <Input
                id="pin-code"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter PIN"
                data-testid="input-pin-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pin">Confirm PIN</Label>
              <Input
                id="confirm-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPinCode}
                onChange={(e) => setConfirmPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirm PIN"
                data-testid="input-confirm-pin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetPin}>
              Set PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update Your Personal Information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <label 
                htmlFor="profile-avatar-upload" 
                className="relative w-24 h-24 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center overflow-hidden cursor-pointer group"
                data-testid="button-edit-avatar"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">{initials}</span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input 
                  type="file" 
                  id="profile-avatar-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <p className="text-center text-xs text-muted-foreground">Tap To Change Avatar</p>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Display Name</Label>
              <Input
                id="edit-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter Your Name"
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Enter Your Email"
                data-testid="input-edit-email"
                disabled={!isEmailPasswordUser(user)}
              />
              {!isEmailPasswordUser(user) && (
                <p className="text-xs text-muted-foreground">Email cannot be changed for social login accounts.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} data-testid="button-save-profile">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Preferences Dialog */}
      <Dialog open={showNotificationPrefsDialog} onOpenChange={setShowNotificationPrefsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
            <DialogDescription>
              Choose which notifications you want to receive.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Deposit Confirmations</p>
                <p className="text-sm text-muted-foreground">When deposits are confirmed</p>
              </div>
              <Switch
                checked={notificationPrefs?.depositAlerts !== false}
                onCheckedChange={(checked) => 
                  updateNotificationPrefsMutation.mutate({ depositAlerts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Withdrawal Updates</p>
                <p className="text-sm text-muted-foreground">Status of your withdrawals</p>
              </div>
              <Switch
                checked={notificationPrefs?.withdrawalAlerts !== false}
                onCheckedChange={(checked) => 
                  updateNotificationPrefsMutation.mutate({ withdrawalAlerts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Earning Notifications</p>
                <p className="text-sm text-muted-foreground">Daily and weekly earnings</p>
              </div>
              <Switch
                checked={notificationPrefs?.earningAlerts !== false}
                onCheckedChange={(checked) => 
                  updateNotificationPrefsMutation.mutate({ earningAlerts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Price Alerts</p>
                <p className="text-sm text-muted-foreground">Significant price changes</p>
              </div>
              <Switch
                checked={notificationPrefs?.priceAlerts !== false}
                onCheckedChange={(checked) => 
                  updateNotificationPrefsMutation.mutate({ priceAlerts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Promotions & News</p>
                <p className="text-sm text-muted-foreground">Special offers and updates</p>
              </div>
              <Switch
                checked={notificationPrefs?.promotionAlerts !== false}
                onCheckedChange={(checked) => 
                  updateNotificationPrefsMutation.mutate({ promotionAlerts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Security Alerts</p>
                <p className="text-sm text-muted-foreground">Login attempts and security</p>
              </div>
              <Switch
                checked={notificationPrefs?.securityAlerts !== false}
                onCheckedChange={(checked) => 
                  updateNotificationPrefsMutation.mutate({ securityAlerts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between py-2 border-t pt-4">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Send copies to email</p>
              </div>
              <Switch
                checked={notificationPrefs?.emailEnabled !== false}
                onCheckedChange={(checked) => 
                  updateNotificationPrefsMutation.mutate({ emailEnabled: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Mobile push notifications</p>
              </div>
              <Switch
                checked={notificationPrefs?.pushEnabled !== false}
                onCheckedChange={(checked) => 
                  updateNotificationPrefsMutation.mutate({ pushEnabled: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNotificationPrefsDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Withdrawal Settings Dialog */}
      <Dialog open={showAutoWithdrawDialog} onOpenChange={setShowAutoWithdrawDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-green-400" />
              Auto-Withdrawal Settings
            </DialogTitle>
            <DialogDescription>
              Configure automatic withdrawal of your mining earnings to your wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Auto-Withdrawal</p>
                <p className="text-sm text-muted-foreground">Automatically send earnings</p>
              </div>
              <Switch
                checked={autoWithdrawEnabled}
                onCheckedChange={setAutoWithdrawEnabled}
                data-testid="dialog-switch-auto-withdraw"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-withdraw-currency">Currency</Label>
              <Select value={autoWithdrawCurrency} onValueChange={setAutoWithdrawCurrency}>
                <SelectTrigger id="auto-withdraw-currency" data-testid="select-auto-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDT">USDT (Tether)</SelectItem>
                  <SelectItem value="BTC">BTC (Bitcoin)</SelectItem>
                  <SelectItem value="LTC">LTC (Litecoin)</SelectItem>
                  <SelectItem value="ETH">ETH (Ethereum)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-withdraw-network">Network</Label>
              <Select value={autoWithdrawNetwork} onValueChange={setAutoWithdrawNetwork}>
                <SelectTrigger id="auto-withdraw-network" data-testid="select-auto-network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {autoWithdrawCurrency === "USDT" && (
                    <>
                      <SelectItem value="trc20">TRC20 (Tron)</SelectItem>
                      <SelectItem value="erc20">ERC20 (Ethereum)</SelectItem>
                      <SelectItem value="bep20">BEP20 (BSC)</SelectItem>
                    </>
                  )}
                  {autoWithdrawCurrency === "BTC" && (
                    <SelectItem value="bitcoin">Bitcoin Network</SelectItem>
                  )}
                  {autoWithdrawCurrency === "LTC" && (
                    <SelectItem value="litecoin">Litecoin Network</SelectItem>
                  )}
                  {autoWithdrawCurrency === "ETH" && (
                    <SelectItem value="ethereum">Ethereum Network</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-withdraw-address">Wallet Address</Label>
              <Input
                id="auto-withdraw-address"
                value={autoWithdrawAddress}
                onChange={(e) => setAutoWithdrawAddress(e.target.value)}
                placeholder="Enter your wallet address"
                data-testid="input-auto-wallet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-withdraw-period">Withdrawal Period</Label>
              <Select value={autoWithdrawPeriod} onValueChange={setAutoWithdrawPeriod}>
                <SelectTrigger id="auto-withdraw-period" data-testid="select-auto-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-withdraw-min">Minimum Amount (USD)</Label>
              <Input
                id="auto-withdraw-min"
                type="number"
                value={autoWithdrawMinAmount}
                onChange={(e) => setAutoWithdrawMinAmount(e.target.value)}
                placeholder="10"
                min="1"
                data-testid="input-auto-min"
              />
              <p className="text-xs text-muted-foreground">
                Withdrawal will only trigger when balance exceeds this amount.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (autoWithdrawEnabled && !autoWithdrawAddress) {
                  toast({
                    title: "Wallet Address Required",
                    description: "Please enter a wallet address to enable auto-withdrawal.",
                    variant: "destructive",
                  });
                  return;
                }
                saveAutoWithdrawMutation.mutate({
                  enabled: autoWithdrawEnabled,
                  currency: autoWithdrawCurrency,
                  network: autoWithdrawNetwork,
                  walletAddress: autoWithdrawAddress,
                  period: autoWithdrawPeriod,
                  minAmount: autoWithdrawMinAmount,
                });
              }}
              disabled={saveAutoWithdrawMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {saveAutoWithdrawMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Two-Factor Authentication Modal */}
      <TwoFactorSetupModal
        open={show2FAModal}
        onOpenChange={setShow2FAModal}
        enabled={twoFactorStatus?.enabled || false}
      />
    </motion.div>
  );
}
