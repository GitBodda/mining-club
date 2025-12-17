import { motion } from "framer-motion";
import { 
  User, Shield, Bell, Moon, HelpCircle, 
  LogOut, ChevronRight, Award 
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserSettings } from "@/lib/types";

interface SettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: Partial<UserSettings>) => void;
}

interface SettingItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  onClick?: () => void;
  action?: React.ReactNode;
  danger?: boolean;
}

function SettingItem({ icon: Icon, label, description, onClick, action, danger }: SettingItemProps) {
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
        data-testid={`setting-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {content}
      </button>
    );
  }

  return content;
}

export function Settings({ settings, onSettingsChange }: SettingsProps) {
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">JD</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">John Doe</h2>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                <Award className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Mining since Dec 2024</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-6 mt-6 pt-4 border-t border-white/[0.06]">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">142</p>
            <p className="text-xs text-muted-foreground">Days Active</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">0.85</p>
            <p className="text-xs text-muted-foreground">BTC Mined</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">#247</p>
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
          />
          <SettingItem
            icon={Shield}
            label="Security"
            description="Password, 2FA, backup"
            onClick={() => {}}
          />
        </GlassCard>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">PREFERENCES</h2>
        <GlassCard delay={0.2} className="p-4">
          <SettingItem
            icon={Bell}
            label="Notifications"
            description="Mining alerts, payouts"
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
            icon={Moon}
            label="Dark Mode"
            description="Always enabled"
            action={
              <Switch
                data-testid="switch-dark-mode"
                checked={true}
                disabled
              />
            }
          />
        </GlassCard>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">SUPPORT</h2>
        <GlassCard delay={0.25} className="p-4">
          <SettingItem
            icon={HelpCircle}
            label="Help Center"
            onClick={() => {}}
          />
          <SettingItem
            icon={LogOut}
            label="Sign Out"
            danger
            onClick={() => {}}
          />
        </GlassCard>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-2">
        CryptoMine v1.0.0
      </p>
    </motion.div>
  );
}
