import { motion } from "framer-motion";
import { useState } from "react";
import { 
  User, Shield, Bell, Key, Fingerprint, Clock, 
  DollarSign, Globe, ChevronRight, Award, Info,
  FileText, Mail, LogOut, Lock, Loader2, Camera
} from "lucide-react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { GlassCard } from "@/components/GlassCard";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { UserSettings } from "@/lib/types";
import type { User as FirebaseUser } from "firebase/auth";

interface SettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: Partial<UserSettings>) => void;
  user?: FirebaseUser | null;
  onLogout?: () => void;
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

export function Settings({ settings, onSettingsChange, user, onLogout }: SettingsProps) {
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrency();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [confirmPinCode, setConfirmPinCode] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const displayName = user?.displayName || user?.email?.split('@')[0] || "Guest User";
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "GU";
  const email = user?.email || "Not signed in";
  const memberSince = user?.metadata?.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : "Dec 2024";

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
    if (enabled) {
      if (!isMobileDevice()) {
        toast({
          title: "Mobile App Only",
          description: "Biometric authentication is only available on the mobile app. Please use the iOS or Android app to enable Face ID or fingerprint unlock.",
          variant: "destructive",
        });
        return;
      }

      if (!('credentials' in navigator) || !('PublicKeyCredential' in window)) {
        toast({
          title: "Not Supported",
          description: "Biometric authentication is not supported on this device.",
          variant: "destructive",
        });
        return;
      }

      try {
        const available = await (window as any).PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable?.();
        if (!available) {
          toast({
            title: "Not Available",
            description: "Biometric authentication is not available on this device. Please ensure your device has Face ID or fingerprint set up in system settings.",
            variant: "destructive",
          });
          return;
        }

        const biometricType = getBiometricType();
        const biometricName = biometricType === 'face' ? 'Face ID' : biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometric';

        onSettingsChange({ biometricEnabled: true });
        localStorage.setItem("biometricEnabled", "true");
        toast({
          title: `${biometricName} Enabled`,
          description: `Your app is now protected with ${biometricName}.`,
        });
      } catch (error) {
        toast({
          title: "Setup Failed",
          description: "Failed to enable biometric authentication. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      onSettingsChange({ biometricEnabled: false });
      localStorage.removeItem("biometricEnabled");
      const biometricType = getBiometricType();
      const biometricName = biometricType === 'face' ? 'Face ID' : biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometric';
      toast({
        title: `${biometricName} Disabled`,
        description: `${biometricName} authentication has been turned off.`,
      });
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
      setShowPinDialog(true);
    } else {
      onSettingsChange({ pinLockEnabled: false, pinCode: undefined });
      localStorage.removeItem("pinCode");
      toast({
        title: "PIN Lock Disabled",
        description: "PIN code authentication has been turned off.",
      });
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
      >
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage Your Preferences</p>
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
              {user && (
                <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                  <Award className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-user-email">{email}</p>
            <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-mining-since">Mining Since {memberSince}</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-6 mt-6 pt-4 border-t border-white/[0.06] flex-wrap">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground" data-testid="text-days-active">0</p>
            <p className="text-xs text-muted-foreground">Days Active</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground" data-testid="text-btc-mined">0.00</p>
            <p className="text-xs text-muted-foreground">BTC Mined</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground" data-testid="text-global-rank">--</p>
            <p className="text-xs text-muted-foreground">Global Rank</p>
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
            description="Add Extra Security To Your Account"
            testId="setting-two-factor"
            action={
              <Switch
                data-testid="switch-two-factor"
                checked={settings.twoFactorEnabled}
                onCheckedChange={(checked) => 
                  onSettingsChange({ twoFactorEnabled: checked })
                }
              />
            }
          />
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
                onCheckedChange={(checked) => 
                  onSettingsChange({ notificationsEnabled: checked })
                }
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
                  <SelectItem value="Spanish" data-testid="option-language-spanish">Spanish</SelectItem>
                  <SelectItem value="French" data-testid="option-language-french">French</SelectItem>
                  <SelectItem value="German" data-testid="option-language-german">German</SelectItem>
                  <SelectItem value="Arabic" data-testid="option-language-arabic">Arabic</SelectItem>
                  <SelectItem value="Chinese" data-testid="option-language-chinese">Chinese</SelectItem>
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
            icon={Fingerprint}
            label="Biometric Lock"
            description="Use Fingerprint Or Face ID"
            testId="setting-biometric"
            action={
              <Switch
                data-testid="switch-biometric"
                checked={settings.biometricEnabled}
                onCheckedChange={handleBiometricToggle}
              />
            }
          />
          <SettingItem
            icon={Lock}
            label="PIN Lock"
            description="Use A 4-Digit PIN Code"
            testId="setting-pin-lock"
            action={
              <Switch
                data-testid="switch-pin-lock"
                checked={settings.pinLockEnabled}
                onCheckedChange={handlePinToggle}
              />
            }
          />
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

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">ABOUT</h2>
        <GlassCard delay={0.3} className="p-4">
          <SettingItem
            icon={Info}
            label="Version"
            description="Mining Club v1.0.0"
            testId="setting-version"
          />
          <SettingItem
            icon={FileText}
            label="Terms Of Service"
            onClick={() => window.open('#', '_blank')}
            testId="button-terms"
          />
          <SettingItem
            icon={Shield}
            label="Privacy Policy"
            onClick={() => window.open('#', '_blank')}
            testId="button-privacy"
          />
          <SettingItem
            icon={Mail}
            label="Contact Support"
            description="Get Help With Your Account"
            onClick={() => window.open('mailto:support@miningclub.app', '_blank')}
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
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-2" data-testid="text-copyright">
        Mining Club v1.0.0
      </p>

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
    </motion.div>
  );
}
