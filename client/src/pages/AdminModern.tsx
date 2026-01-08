import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Users, 
  Wallet, 
  Settings, 
  TrendingUp,
  Shield,
  DollarSign,
  Activity,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiquidGlassCard } from "@/components/GlassCard";
import { useQuery } from "@tanstack/react-query";
import { getIdToken } from "@/lib/firebase";

// Helper for admin API requests
async function adminFetch<T = any>(url: string, options?: { method?: string; body?: any }): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(url, {
    method: options?.method || "GET",
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  return null as T;
}

interface AdminProps {
  onBack: () => void;
}

type AdminTab = "dashboard" | "users" | "wallets" | "settings";

interface DashboardStats {
  totalUsers: number;
  totalInvestments: number;
  activeMiners: number;
  totalVolume: number;
}

export function AdminModern({ onBack }: AdminProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["admin-stats"],
    queryFn: () => adminFetch("/api/admin/stats"),
    refetchInterval: 60000, // Increased from 30s to 60s to reduce load
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: Activity },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "wallets" as const, label: "Wallets", icon: Wallet },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="liquid-glass border-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-500" />
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            </div>
            <Badge variant="secondary" className="ml-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              BlockMint
            </Badge>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant="ghost"
                className={`liquid-glass border-0 flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "dashboard" && (
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <LiquidGlassCard variant="strong" glow="btc">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats?.totalUsers || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-primary opacity-50" />
                  </div>
                </LiquidGlassCard>

                <LiquidGlassCard variant="strong" glow="btc">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Investments</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${stats?.totalInvestments?.toLocaleString() || 0}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-500 opacity-50" />
                  </div>
                </LiquidGlassCard>

                <LiquidGlassCard variant="strong" glow="btc">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Miners</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats?.activeMiners || 0}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-amber-500 opacity-50" />
                  </div>
                </LiquidGlassCard>

                <LiquidGlassCard variant="strong" glow="btc">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${stats?.totalVolume?.toLocaleString() || 0}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </LiquidGlassCard>
              </div>

              {/* Recent Activity */}
              <LiquidGlassCard variant="strong">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">New User Registration</p>
                          <p className="text-xs text-muted-foreground">2 minutes ago</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              </LiquidGlassCard>
            </div>
          )}

          {activeTab === "users" && (
            <LiquidGlassCard variant="strong">
              <h3 className="text-lg font-semibold text-foreground mb-4">User Management</h3>
              <p className="text-sm text-muted-foreground mb-4">
                User management features coming soon...
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10">
                  <span className="text-sm text-foreground">Total Registered Users</span>
                  <span className="text-sm font-semibold text-foreground">
                    {stats?.totalUsers || 0}
                  </span>
                </div>
              </div>
            </LiquidGlassCard>
          )}

          {activeTab === "wallets" && (
            <LiquidGlassCard variant="strong">
              <h3 className="text-lg font-semibold text-foreground mb-4">Wallet Management</h3>
              <p className="text-sm text-muted-foreground">
                Wallet management features coming soon...
              </p>
            </LiquidGlassCard>
          )}

          {activeTab === "settings" && (
            <LiquidGlassCard variant="strong">
              <h3 className="text-lg font-semibold text-foreground mb-4">System Settings</h3>
              <p className="text-sm text-muted-foreground">
                Settings configuration coming soon...
              </p>
            </LiquidGlassCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}
