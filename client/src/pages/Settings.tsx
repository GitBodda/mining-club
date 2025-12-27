import { motion } from "framer-motion";
import { 
  User, Shield, Bell, Key, Fingerprint, Clock, 
  DollarSign, Globe, ChevronRight, Award, Info,
  FileText, Mail, Zap, Activity, LogOut
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

export function Settings({ settings, onSettingsChange, user, onLogout }: SettingsProps) {
  const displayName = user?.displayName || user?.email?.split('@')[0] || "Guest User";
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "GU";
  const email = user?.email || "Not signed in";
  const memberSince = user?.metadata?.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : "Dec 2024";

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
        <p className="text-sm text-muted-foreground mt-0.5">Manage your preferences</p>
      </motion.header>

      <GlassCard delay={0.1} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">{initials}</span>
            )}
          </div>
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
            <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-mining-since">Mining since {memberSince}</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-6 mt-6 pt-4 border-t border-white/[0.06] flex-wrap">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground" data-testid="text-days-active">142</p>
            <p className="text-xs text-muted-foreground">Days Active</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground" data-testid="text-btc-mined">0.85</p>
            <p className="text-xs text-muted-foreground">BTC Mined</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground" data-testid="text-global-rank">#247</p>
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
            description="Edit your personal info"
            onClick={() => {}}
            testId="button-profile"
          />
          <SettingItem
            icon={Key}
            label="Change Password"
            description="Update your account password"
            onClick={() => {}}
            testId="button-change-password"
          />
          <SettingItem
            icon={Shield}
            label="Two-Factor Authentication"
            description="Add extra security to your account"
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
            description="Mining alerts and payouts"
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
          <SettingItem
            icon={Zap}
            label="Low Power Mode"
            description="Optimize battery usage"
            testId="setting-power-saver"
            action={
              <Switch
                data-testid="switch-power-saver"
                checked={settings.powerSaver}
                onCheckedChange={(checked) => 
                  onSettingsChange({ powerSaver: checked })
                }
              />
            }
          />
          <div className="py-3 border-b border-white/[0.04]" data-testid="setting-mining-intensity">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.04] text-muted-foreground">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Mining Intensity</p>
                <p className="text-sm text-muted-foreground">Hashpower visualization level</p>
              </div>
              <span className="text-sm font-medium text-foreground" data-testid="text-intensity-value">{settings.miningIntensity}%</span>
            </div>
            <Slider
              data-testid="slider-mining-intensity"
              value={[settings.miningIntensity]}
              onValueChange={(value) => onSettingsChange({ miningIntensity: value[0] })}
              min={0}
              max={100}
              step={5}
              className="ml-14"
            />
          </div>
          <div className="py-3 border-b border-white/[0.04]" data-testid="setting-currency">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.04] text-muted-foreground">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Currency Display</p>
                <p className="text-sm text-muted-foreground">Preferred currency</p>
              </div>
              <Select 
                value={settings.currency} 
                onValueChange={(value: 'USD' | 'EUR' | 'GBP') => onSettingsChange({ currency: value })}
              >
                <SelectTrigger className="w-24" data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD" data-testid="option-currency-usd">USD</SelectItem>
                  <SelectItem value="EUR" data-testid="option-currency-eur">EUR</SelectItem>
                  <SelectItem value="GBP" data-testid="option-currency-gbp">GBP</SelectItem>
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
                <p className="text-sm text-muted-foreground">App language</p>
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
            label="Biometric Login"
            description="Use fingerprint or Face ID"
            testId="setting-biometric"
            action={
              <Switch
                data-testid="switch-biometric"
                checked={settings.biometricEnabled}
                onCheckedChange={(checked) => 
                  onSettingsChange({ biometricEnabled: checked })
                }
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
                <p className="text-sm text-muted-foreground">Auto-lock after inactivity</p>
              </div>
              <Select 
                value={String(settings.sessionTimeout)} 
                onValueChange={(value) => onSettingsChange({ sessionTimeout: parseInt(value) })}
              >
                <SelectTrigger className="w-24" data-testid="select-session-timeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5" data-testid="option-timeout-5">5 min</SelectItem>
                  <SelectItem value="15" data-testid="option-timeout-15">15 min</SelectItem>
                  <SelectItem value="30" data-testid="option-timeout-30">30 min</SelectItem>
                  <SelectItem value="60" data-testid="option-timeout-60">1 hour</SelectItem>
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
            description="CryptoMine v1.0.0"
            testId="setting-version"
          />
          <SettingItem
            icon={FileText}
            label="Terms of Service"
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
            description="Get help with your account"
            onClick={() => window.open('mailto:support@cryptomine.app', '_blank')}
            testId="button-contact-support"
          />
        </GlassCard>
      </div>

      {user && onLogout && (
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full h-12 border-red-500/30 text-red-400 hover:bg-red-500/10"
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
    </motion.div>
  );
}
