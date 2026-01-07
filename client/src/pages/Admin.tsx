import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  Settings, 
  Package, 
  Percent, 
  FileText,
  LayoutDashboard,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  DollarSign,
  RefreshCw,
  Loader2,
  Bell,
  MessageSquare,
  Key,
  Shield,
  Send,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  PiggyBank,
  HelpCircle,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";
import { getIdToken } from "@/lib/firebase";

import { useToast } from "@/hooks/use-toast";

// Helper for admin API requests that returns parsed JSON or null for empty responses
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

type AdminTab = "dashboard" | "users" | "wallets" | "plans" | "earnplans" | "miners" | "withdrawals" | "notifications" | "tickets" | "content" | "discounts" | "offers" | "apiconfig" | "settings";

export function Admin({ onBack }: AdminProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const { toast } = useToast();

  // Remove the global 430px width clamp while admin is mounted so wide tables/forms are reachable
  useEffect(() => {
    const root = document.getElementById("root");
    document.documentElement.classList.add("admin-mode");
    document.body.classList.add("admin-mode");
    root?.classList.add("admin-mode");

    return () => {
      document.documentElement.classList.remove("admin-mode");
      document.body.classList.remove("admin-mode");
      root?.classList.remove("admin-mode");
    };
  }, []);

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "wallets" as const, label: "Wallets", icon: Wallet },
    { id: "plans" as const, label: "Investment Plans", icon: TrendingUp },
    { id: "earnplans" as const, label: "Earn/Yield Plans", icon: PiggyBank },
    { id: "miners" as const, label: "Miner Pricing", icon: Package },
    { id: "withdrawals" as const, label: "Withdrawals", icon: Download },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "tickets" as const, label: "Support Tickets", icon: MessageSquare },
    { id: "content" as const, label: "Content", icon: FileText },
    { id: "discounts" as const, label: "Discounts", icon: Percent },
    { id: "offers" as const, label: "Promotional Offers", icon: Gift },
    { id: "apiconfig" as const, label: "API & Services", icon: Key },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized layout with full-width overflow for large tables */}
      <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto px-3 md:px-6">
        {/* Mobile: Collapsible sidebar, Desktop: Fixed sidebar */}
        <aside className="w-full md:w-64 bg-card border-b md:border-r md:border-b-0 border-border p-4 md:min-h-screen">
          <div className="flex items-center justify-between md:justify-start gap-2 mb-4 md:mb-8">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                data-testid="button-admin-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-display text-lg md:text-xl font-bold">Admin Panel</h1>
            </div>
          </div>

          {/* Mobile: Horizontal scroll tabs, Desktop: Vertical nav */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 md:px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 md:w-full ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content area - mobile optimized */}
        <main className="flex-1 w-full p-4 md:p-6 overflow-y-auto overflow-x-auto max-h-screen">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "wallets" && <WalletsTab />}
          {activeTab === "plans" && <PlansTab />}
          {activeTab === "earnplans" && <EarnPlansTab />}
          {activeTab === "miners" && <MinersTab />}
          {activeTab === "withdrawals" && <WithdrawalsTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "tickets" && <TicketsTab />}
          {activeTab === "content" && <ContentTab />}
          {activeTab === "discounts" && <DiscountsTab />}
          {activeTab === "offers" && <OffersTab />}
          {activeTab === "apiconfig" && <ApiConfigTab />}
          {activeTab === "settings" && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

interface DashboardStats {
  totalUsers: number;
  totalInvestments: number;
  totalInvestedAmount: number;
  mainWallets: Array<{ id: string; symbol: string; balance: number }>;
}

function DashboardTab() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
  });

  const processMutation = useMutation({
    mutationFn: () => adminFetch("/api/admin/process-daily-earnings", { method: "POST" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <Button 
          onClick={() => processMutation.mutate()}
          disabled={processMutation.isPending}
          data-testid="button-process-earnings"
        >
          {processMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Process Daily Earnings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Investments</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInvestments || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats?.totalInvestedAmount || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Main Wallet</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.mainWallets?.length || 0} Currencies
            </div>
          </CardContent>
        </Card>
      </div>

      {stats?.mainWallets && stats.mainWallets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Main Wallet Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.mainWallets.map((wallet: any) => (
                <div key={wallet.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">{wallet.symbol}</span>
                  <span className="text-lg font-bold">{wallet.balance.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UsersTab() {
  const { toast } = useToast();
  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      adminFetch(`/api/admin/users/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User Updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User Deleted" });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Management</h2>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user: any) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.displayName || "-"}</td>
                    <td className="p-4">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Switch 
                        checked={user.isActive}
                        onCheckedChange={(checked) => 
                          updateMutation.mutate({ id: user.id, data: { isActive: checked } })
                        }
                      />
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateMutation.mutate({ 
                            id: user.id, 
                            data: { role: user.role === "admin" ? "user" : "admin" } 
                          })}
                        >
                          {user.role === "admin" ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(user.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WalletsTab() {
  const { toast } = useToast();
  const { data: mainWallets, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/main-wallet"],
  });

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");

  const withdrawMutation = useMutation({
    mutationFn: ({ symbol, amount, toAddress }: { symbol: string; amount: number; toAddress: string }) =>
      adminFetch(`/api/admin/main-wallet/${symbol}/withdraw`, { 
        method: "POST", 
        body: { amount, toAddress } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/main-wallet"] });
      toast({ title: "Withdrawal Processed" });
      setWithdrawAmount("");
      setWithdrawAddress("");
      setSelectedSymbol("");
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Main Wallet Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mainWallets?.length > 0 ? (
              mainWallets.map((wallet: any) => (
                <div 
                  key={wallet.id} 
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedSymbol === wallet.symbol ? "bg-primary/10 border border-primary" : "bg-muted"
                  }`}
                  onClick={() => setSelectedSymbol(wallet.symbol)}
                >
                  <div>
                    <div className="font-bold">{wallet.symbol}</div>
                    <div className="text-sm text-muted-foreground">{wallet.address || "No address set"}</div>
                  </div>
                  <div className="text-xl font-bold">{wallet.balance.toLocaleString()}</div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No wallets configured yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdraw Funds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Selected Currency</label>
              <div className="text-lg font-bold">{selectedSymbol || "Select a wallet"}</div>
            </div>
            <Input
              type="number"
              placeholder="Amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={!selectedSymbol}
            />
            <Input
              placeholder="Destination Address"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              disabled={!selectedSymbol}
            />
            <Button
              className="w-full"
              disabled={!selectedSymbol || !withdrawAmount || !withdrawAddress || withdrawMutation.isPending}
              onClick={() => withdrawMutation.mutate({
                symbol: selectedSymbol,
                amount: parseFloat(withdrawAmount),
                toAddress: withdrawAddress,
              })}
            >
              {withdrawMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Process Withdrawal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PlansTab() {
  const { toast } = useToast();
  const { data: plans, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/plans"],
  });

  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minAmount: "",
    maxAmount: "",
    dailyReturnPercent: "1",
    durationDays: "",
    currency: "USDT",
    isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminFetch("/api/admin/plans", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({ title: "Plan Created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminFetch(`/api/admin/plans/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({ title: "Plan Updated" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/plans/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({ title: "Plan Deleted" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      minAmount: "",
      maxAmount: "",
      dailyReturnPercent: "1",
      durationDays: "",
      currency: "USDT",
      isActive: true,
    });
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      minAmount: parseFloat(formData.minAmount),
      maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
      dailyReturnPercent: parseFloat(formData.dailyReturnPercent),
      durationDays: parseInt(formData.durationDays),
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Investment Plans</h2>
        <Button onClick={() => setShowForm(true)} data-testid="button-add-plan">
          <Plus className="w-4 h-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPlan ? "Edit Plan" : "New Plan"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Plan Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                placeholder="Currency (USDT, BTC, etc.)"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
            <Input
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Min Amount"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Max Amount (optional)"
                value={formData.maxAmount}
                onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.1"
                placeholder="Daily Return %"
                value={formData.dailyReturnPercent}
                onChange={(e) => setFormData({ ...formData, dailyReturnPercent: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Duration (days)"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <span className="text-sm">Active</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPlan ? "Update" : "Create"} Plan
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans?.map((plan: any) => (
          <Card key={plan.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingPlan(plan);
                    setFormData({
                      name: plan.name,
                      description: plan.description || "",
                      minAmount: plan.minAmount.toString(),
                      maxAmount: plan.maxAmount?.toString() || "",
                      dailyReturnPercent: plan.dailyReturnPercent.toString(),
                      durationDays: plan.durationDays.toString(),
                      currency: plan.currency,
                      isActive: plan.isActive,
                    });
                    setShowForm(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(plan.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Min Investment:</span>
                  <span className="font-medium">{plan.minAmount} {plan.currency}</span>
                </div>
                {plan.maxAmount && (
                  <div className="flex justify-between">
                    <span>Max Investment:</span>
                    <span className="font-medium">{plan.maxAmount} {plan.currency}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Daily Return:</span>
                  <span className="font-medium text-green-500">{plan.dailyReturnPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{plan.durationDays} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MinersTab() {
  const { toast } = useToast();
  const { data: miners, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/miners"],
  });

  const [showForm, setShowForm] = useState(false);
  const [editingMiner, setEditingMiner] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    hashRate: "",
    hashRateUnit: "TH/s",
    priceUsd: "",
    powerConsumption: "",
    algorithm: "SHA-256",
    coin: "BTC",
    isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminFetch("/api/admin/miners", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/miners"] });
      toast({ title: "Miner Created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminFetch(`/api/admin/miners/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/miners"] });
      toast({ title: "Miner Updated" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/miners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/miners"] });
      toast({ title: "Miner Deleted" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingMiner(null);
    setFormData({
      name: "",
      hashRate: "",
      hashRateUnit: "TH/s",
      priceUsd: "",
      powerConsumption: "",
      algorithm: "SHA-256",
      coin: "BTC",
      isActive: true,
    });
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      hashRate: parseFloat(formData.hashRate),
      priceUsd: parseFloat(formData.priceUsd),
      powerConsumption: formData.powerConsumption ? parseFloat(formData.powerConsumption) : null,
    };

    if (editingMiner) {
      updateMutation.mutate({ id: editingMiner.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Miner Pricing</h2>
        <Button onClick={() => setShowForm(true)} data-testid="button-add-miner">
          <Plus className="w-4 h-4 mr-2" />
          Add Miner
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingMiner ? "Edit Miner" : "New Miner"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Miner Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Hash Rate"
                value={formData.hashRate}
                onChange={(e) => setFormData({ ...formData, hashRate: e.target.value })}
              />
              <Input
                placeholder="Unit (TH/s, PH/s)"
                value={formData.hashRateUnit}
                onChange={(e) => setFormData({ ...formData, hashRateUnit: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Price (USD)"
                value={formData.priceUsd}
                onChange={(e) => setFormData({ ...formData, priceUsd: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Power (W)"
                value={formData.powerConsumption}
                onChange={(e) => setFormData({ ...formData, powerConsumption: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Algorithm"
                value={formData.algorithm}
                onChange={(e) => setFormData({ ...formData, algorithm: e.target.value })}
              />
              <Input
                placeholder="Coin (BTC, LTC)"
                value={formData.coin}
                onChange={(e) => setFormData({ ...formData, coin: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <span className="text-sm">Active</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingMiner ? "Update" : "Create"} Miner
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Hash Rate</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Power</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Coin</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {miners?.map((miner: any) => (
                  <tr key={miner.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{miner.name}</td>
                    <td className="p-4">{miner.hashRate} {miner.hashRateUnit}</td>
                    <td className="p-4">${miner.priceUsd.toLocaleString()}</td>
                    <td className="p-4">{miner.powerConsumption ? `${miner.powerConsumption}W` : "-"}</td>
                    <td className="p-4">{miner.coin}</td>
                    <td className="p-4">
                      <Badge variant={miner.isActive ? "default" : "secondary"}>
                        {miner.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingMiner(miner);
                            setFormData({
                              name: miner.name,
                              hashRate: miner.hashRate.toString(),
                              hashRateUnit: miner.hashRateUnit,
                              priceUsd: miner.priceUsd.toString(),
                              powerConsumption: miner.powerConsumption?.toString() || "",
                              algorithm: miner.algorithm,
                              coin: miner.coin,
                              isActive: miner.isActive,
                            });
                            setShowForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(miner.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContentTab() {
  const { toast } = useToast();
  const { data: content, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/content"],
  });

  const [activeContentTab, setActiveContentTab] = useState<"list" | "privacy" | "terms" | "about">("list");
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: "page",
    slug: "",
    title: "",
    content: "",
    imageUrl: "",
    isActive: true,
  });

  // Dedicated content editors
  const [privacyContent, setPrivacyContent] = useState("");
  const [termsContent, setTermsContent] = useState("");
  const [aboutContent, setAboutContent] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: any) => adminFetch("/api/admin/content", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ title: "Content Created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminFetch(`/api/admin/content/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ title: "Content Updated" });
      resetForm();
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ slug, content }: { slug: string; content: string }) =>
      adminFetch(`/api/admin/content/page/${slug}`, { 
        method: "PUT", 
        body: { content, title: slug === "privacy" ? "Privacy Policy" : slug === "terms" ? "Terms of Service" : "About Us" } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ title: "Page Updated Successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/content/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ title: "Content Deleted" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingContent(null);
    setFormData({
      type: "page",
      slug: "",
      title: "",
      content: "",
      imageUrl: "",
      isActive: true,
    });
  };

  const handleSubmit = () => {
    if (editingContent) {
      updateMutation.mutate({ id: editingContent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Load existing page content
  const loadPageContent = () => {
    const privacy = content?.find((c: any) => c.slug === "privacy");
    const terms = content?.find((c: any) => c.slug === "terms");
    const about = content?.find((c: any) => c.slug === "about");
    
    if (privacy) setPrivacyContent(privacy.content || "");
    if (terms) setTermsContent(terms.content || "");
    if (about) setAboutContent(about.content || "");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  // Load page content when data is available
  if (content && !privacyContent && !termsContent && !aboutContent) {
    loadPageContent();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Management</h2>
        {activeContentTab === "list" && (
          <Button onClick={() => setShowForm(true)} data-testid="button-add-content">
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        )}
      </div>

      {/* Content Type Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeContentTab === "list" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveContentTab("list")}
        >
          All Content
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeContentTab === "privacy" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveContentTab("privacy")}
        >
          Privacy Policy
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeContentTab === "terms" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveContentTab("terms")}
        >
          Terms of Service
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeContentTab === "about" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveContentTab("about")}
        >
          About Us
        </button>
      </div>

      {/* Privacy Policy Editor */}
      {activeContentTab === "privacy" && (
        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
            <CardDescription>Edit your app's privacy policy (HTML supported)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="min-h-[400px] font-mono text-sm"
              value={privacyContent}
              onChange={(e) => setPrivacyContent(e.target.value)}
              placeholder="Enter privacy policy content (HTML supported)..."
            />
            <Button
              onClick={() => updatePageMutation.mutate({ slug: "privacy", content: privacyContent })}
              disabled={updatePageMutation.isPending}
            >
              {updatePageMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Save Privacy Policy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Terms of Service Editor */}
      {activeContentTab === "terms" && (
        <Card>
          <CardHeader>
            <CardTitle>Terms of Service</CardTitle>
            <CardDescription>Edit your app's terms of service (HTML supported)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="min-h-[400px] font-mono text-sm"
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              placeholder="Enter terms of service content (HTML supported)..."
            />
            <Button
              onClick={() => updatePageMutation.mutate({ slug: "terms", content: termsContent })}
              disabled={updatePageMutation.isPending}
            >
              {updatePageMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Save Terms of Service
            </Button>
          </CardContent>
        </Card>
      )}

      {/* About Us Editor */}
      {activeContentTab === "about" && (
        <Card>
          <CardHeader>
            <CardTitle>About Us</CardTitle>
            <CardDescription>Edit your company's about page (HTML supported)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="min-h-[400px] font-mono text-sm"
              value={aboutContent}
              onChange={(e) => setAboutContent(e.target.value)}
              placeholder="Enter about us content (HTML supported)..."
            />
            <Button
              onClick={() => updatePageMutation.mutate({ slug: "about", content: aboutContent })}
              disabled={updatePageMutation.isPending}
            >
              {updatePageMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Save About Us
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All Content List */}
      {activeContentTab === "list" && (
        <>
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingContent ? "Edit Content" : "New Content"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="page">Page</option>
                    <option value="popup">Popup</option>
                    <option value="banner">Banner</option>
                    <option value="notification">Notification</option>
                  </select>
                  <Input
                    placeholder="Slug (unique identifier)"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <Textarea
                  className="min-h-[120px]"
                  placeholder="Content (HTML supported)"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
                <Input
                  placeholder="Image URL"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <span className="text-sm">Active</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmit}>
                    {editingContent ? "Update" : "Create"} Content
                  </Button>
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Slug</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content?.map((item: any) => (
                      <tr key={item.id} className="border-b border-border last:border-0">
                        <td className="p-4">
                          <Badge variant="outline">{item.type}</Badge>
                        </td>
                        <td className="p-4 font-medium">{item.title}</td>
                        <td className="p-4 text-muted-foreground">{item.slug}</td>
                        <td className="p-4">
                          <Badge variant={item.isActive ? "default" : "secondary"}>
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingContent(item);
                            setFormData({
                              type: item.type,
                              slug: item.slug,
                              title: item.title,
                              content: item.content || "",
                              imageUrl: item.imageUrl || "",
                              isActive: item.isActive,
                            });
                            setShowForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}

function EarnPlansTab() {
  const { toast } = useToast();
  
  // Earn Plans
  const { data: earnPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/admin/earn-plans"],
  });

  // Earn FAQs
  const { data: earnFaqs, isLoading: faqsLoading } = useQuery({
    queryKey: ["/api/admin/earn-faqs"],
  });

  // Earn Settings
  const { data: earnSettings } = useQuery({
    queryKey: ["/api/admin/earn-settings"],
  });

  // Earn Subscriptions
  const { data: subscriptions } = useQuery({
    queryKey: ["/api/admin/earn-subscriptions"],
  });

  const [activeSubTab, setActiveSubTab] = useState<"plans" | "faqs" | "rates" | "subscriptions">("plans");
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editingFaq, setEditingFaq] = useState<any>(null);

  const [planFormData, setPlanFormData] = useState({
    symbol: "",
    name: "",
    icon: "",
    colorPrimary: "from-amber-500",
    colorSecondary: "to-orange-500",
    minAmount: 50,
    maxAmount: null as number | null,
    dailyApr: 17.9,
    weeklyApr: 18.0,
    monthlyApr: 18.25,
    quarterlyApr: 18.7,
    yearlyApr: 19.25,
    isActive: true,
    order: 0,
  });

  const [faqFormData, setFaqFormData] = useState({
    question: "",
    answer: "",
    isActive: true,
    order: 0,
  });

  const [ratesFormData, setRatesFormData] = useState({
    dailyApr: 17.9,
    weeklyApr: 18.0,
    monthlyApr: 18.25,
    quarterlyApr: 18.7,
    yearlyApr: 19.25,
  });

  // Plan mutations
  const createPlanMutation = useMutation({
    mutationFn: (data: any) => adminFetch("/api/admin/earn-plans", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/earn-plans"] });
      toast({ title: "Earn Plan Created" });
      resetPlanForm();
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminFetch(`/api/admin/earn-plans/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/earn-plans"] });
      toast({ title: "Earn Plan Updated" });
      resetPlanForm();
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/earn-plans/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/earn-plans"] });
      toast({ title: "Earn Plan Deleted" });
    },
  });

  // FAQ mutations
  const createFaqMutation = useMutation({
    mutationFn: (data: any) => adminFetch("/api/admin/earn-faqs", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/earn-faqs"] });
      toast({ title: "FAQ Created" });
      resetFaqForm();
    },
  });

  const updateFaqMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminFetch(`/api/admin/earn-faqs/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/earn-faqs"] });
      toast({ title: "FAQ Updated" });
      resetFaqForm();
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/earn-faqs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/earn-faqs"] });
      toast({ title: "FAQ Deleted" });
    },
  });

  // Rates update mutation
  const updateRatesMutation = useMutation({
    mutationFn: async (rates: any) => {
      await adminFetch(`/api/admin/earn-settings/daily_apr`, { method: "PUT", body: { value: rates.dailyApr.toString(), type: "number" } });
      await adminFetch(`/api/admin/earn-settings/weekly_apr`, { method: "PUT", body: { value: rates.weeklyApr.toString(), type: "number" } });
      await adminFetch(`/api/admin/earn-settings/monthly_apr`, { method: "PUT", body: { value: rates.monthlyApr.toString(), type: "number" } });
      await adminFetch(`/api/admin/earn-settings/quarterly_apr`, { method: "PUT", body: { value: rates.quarterlyApr.toString(), type: "number" } });
      await adminFetch(`/api/admin/earn-settings/yearly_apr`, { method: "PUT", body: { value: rates.yearlyApr.toString(), type: "number" } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/earn-settings"] });
      toast({ title: "APR Rates Updated" });
    },
  });

  // Process earnings mutation
  const processEarningsMutation = useMutation({
    mutationFn: () => adminFetch("/api/admin/process-earn-earnings", { method: "POST" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/earn-subscriptions"] });
      toast({ title: `Processed earnings for ${data?.processedCount || 0} subscriptions` });
    },
  });

  const resetPlanForm = () => {
    setShowPlanForm(false);
    setEditingPlan(null);
    setPlanFormData({
      symbol: "",
      name: "",
      icon: "",
      colorPrimary: "from-amber-500",
      colorSecondary: "to-orange-500",
      minAmount: 50,
      maxAmount: null,
      dailyApr: 17.9,
      weeklyApr: 18.0,
      monthlyApr: 18.25,
      quarterlyApr: 18.7,
      yearlyApr: 19.25,
      isActive: true,
      order: 0,
    });
  };

  const resetFaqForm = () => {
    setShowFaqForm(false);
    setEditingFaq(null);
    setFaqFormData({
      question: "",
      answer: "",
      isActive: true,
      order: 0,
    });
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanFormData({
      symbol: plan.symbol,
      name: plan.name,
      icon: plan.icon || "",
      colorPrimary: plan.colorPrimary || "from-amber-500",
      colorSecondary: plan.colorSecondary || "to-orange-500",
      minAmount: plan.minAmount,
      maxAmount: plan.maxAmount,
      dailyApr: plan.dailyApr,
      weeklyApr: plan.weeklyApr,
      monthlyApr: plan.monthlyApr,
      quarterlyApr: plan.quarterlyApr,
      yearlyApr: plan.yearlyApr,
      isActive: plan.isActive,
      order: plan.order,
    });
    setShowPlanForm(true);
  };

  const handleEditFaq = (faq: any) => {
    setEditingFaq(faq);
    setFaqFormData({
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive,
      order: faq.order,
    });
    setShowFaqForm(true);
  };

  const handleSubmitPlan = () => {
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data: planFormData });
    } else {
      createPlanMutation.mutate(planFormData);
    }
  };

  const handleSubmitFaq = () => {
    if (editingFaq) {
      updateFaqMutation.mutate({ id: editingFaq.id, data: faqFormData });
    } else {
      createFaqMutation.mutate(faqFormData);
    }
  };

  if (plansLoading || faqsLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Earn/Yield Plans Management</h2>
          <p className="text-muted-foreground">Manage APR rates, crypto assets, FAQs, and subscriptions</p>
        </div>
        <Button
          onClick={() => processEarningsMutation.mutate()}
          disabled={processEarningsMutation.isPending}
        >
          {processEarningsMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Process Earnings
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { id: "plans" as const, label: "Crypto Assets", icon: PiggyBank },
          { id: "rates" as const, label: "APR Rates", icon: TrendingUp },
          { id: "faqs" as const, label: "FAQs", icon: HelpCircle },
          { id: "subscriptions" as const, label: "User Subscriptions", icon: Users },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeSubTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSubTab(tab.id)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Crypto Assets Tab */}
      {activeSubTab === "plans" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Crypto Assets for Earning</CardTitle>
              <CardDescription>Configure which cryptocurrencies users can invest in</CardDescription>
            </div>
            <Button onClick={() => setShowPlanForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Crypto Asset
            </Button>
          </CardHeader>
          <CardContent>
            {showPlanForm && (
              <Card className="mb-6 p-4">
                <h3 className="font-semibold mb-4">{editingPlan ? "Edit Crypto Asset" : "Add Crypto Asset"}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Symbol</label>
                    <Input
                      placeholder="BTC"
                      value={planFormData.symbol}
                      onChange={(e) => setPlanFormData({ ...planFormData, symbol: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      placeholder="Bitcoin"
                      value={planFormData.name}
                      onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Icon</label>
                    <Input
                      placeholder="₿"
                      value={planFormData.icon}
                      onChange={(e) => setPlanFormData({ ...planFormData, icon: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Min Amount ($)</label>
                    <Input
                      type="number"
                      value={planFormData.minAmount}
                      onChange={(e) => setPlanFormData({ ...planFormData, minAmount: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Daily APR (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={planFormData.dailyApr}
                      onChange={(e) => setPlanFormData({ ...planFormData, dailyApr: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Yearly APR (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={planFormData.yearlyApr}
                      onChange={(e) => setPlanFormData({ ...planFormData, yearlyApr: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <Switch
                    checked={planFormData.isActive}
                    onCheckedChange={(checked) => setPlanFormData({ ...planFormData, isActive: checked })}
                  />
                  <span className="text-sm">Active</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSubmitPlan} disabled={createPlanMutation.isPending || updatePlanMutation.isPending}>
                    {editingPlan ? "Update" : "Create"} Asset
                  </Button>
                  <Button variant="outline" onClick={resetPlanForm}>Cancel</Button>
                </div>
              </Card>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground text-sm">
                    <th className="pb-3 font-medium">Asset</th>
                    <th className="pb-3 font-medium">Daily APR</th>
                    <th className="pb-3 font-medium">Monthly APR</th>
                    <th className="pb-3 font-medium">Yearly APR</th>
                    <th className="pb-3 font-medium">Min Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(earnPlans as any[])?.map((plan: any) => (
                    <tr key={plan.id} className="text-sm">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{plan.icon}</span>
                          <div>
                            <span className="font-medium">{plan.symbol}</span>
                            <span className="text-muted-foreground ml-2">{plan.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-emerald-500">{plan.dailyApr}%</td>
                      <td className="py-3 text-emerald-500">{plan.monthlyApr}%</td>
                      <td className="py-3 text-emerald-500 font-bold">{plan.yearlyApr}%</td>
                      <td className="py-3">${plan.minAmount}</td>
                      <td className="py-3">
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEditPlan(plan)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deletePlanMutation.mutate(plan.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!earnPlans || (earnPlans as any[]).length === 0) && (
                <p className="text-center text-muted-foreground py-8">No crypto assets configured yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* APR Rates Tab */}
      {activeSubTab === "rates" && (
        <Card>
          <CardHeader>
            <CardTitle>Global APR Rates</CardTitle>
            <CardDescription>Set the default APR rates for all earn plans. These are REAL FIXED APR rates.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium">Daily APR (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={ratesFormData.dailyApr}
                  onChange={(e) => setRatesFormData({ ...ratesFormData, dailyApr: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Weekly APR (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={ratesFormData.weeklyApr}
                  onChange={(e) => setRatesFormData({ ...ratesFormData, weeklyApr: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Monthly APR (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={ratesFormData.monthlyApr}
                  onChange={(e) => setRatesFormData({ ...ratesFormData, monthlyApr: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Quarterly APR (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={ratesFormData.quarterlyApr}
                  onChange={(e) => setRatesFormData({ ...ratesFormData, quarterlyApr: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Yearly APR (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={ratesFormData.yearlyApr}
                  onChange={(e) => setRatesFormData({ ...ratesFormData, yearlyApr: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <Button onClick={() => updateRatesMutation.mutate(ratesFormData)} disabled={updateRatesMutation.isPending}>
              {updateRatesMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Save APR Rates
            </Button>

            <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <h4 className="font-semibold text-emerald-400 mb-2">Current Rates Preview</h4>
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div className="text-center p-3 rounded">
                  <div className="text-muted-foreground">Daily</div>
                  <div className="text-2xl font-bold text-emerald-400">{ratesFormData.dailyApr}%</div>
                </div>
                <div className="text-center p-3 rounded">
                  <div className="text-muted-foreground">Weekly</div>
                  <div className="text-2xl font-bold text-emerald-400">{ratesFormData.weeklyApr}%</div>
                </div>
                <div className="text-center p-3 rounded">
                  <div className="text-muted-foreground">Monthly</div>
                  <div className="text-2xl font-bold text-emerald-400">{ratesFormData.monthlyApr}%</div>
                </div>
                <div className="text-center p-3 rounded">
                  <div className="text-muted-foreground">Quarterly</div>
                  <div className="text-2xl font-bold text-emerald-400">{ratesFormData.quarterlyApr}%</div>
                </div>
                <div className="text-center p-3 rounded">
                  <div className="text-muted-foreground">Yearly</div>
                  <div className="text-2xl font-bold text-emerald-400">{ratesFormData.yearlyApr}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQs Tab */}
      {activeSubTab === "faqs" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Earn FAQs</CardTitle>
              <CardDescription>Manage frequently asked questions about the earn platform</CardDescription>
            </div>
            <Button onClick={() => setShowFaqForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </CardHeader>
          <CardContent>
            {showFaqForm && (
              <Card className="mb-6 p-4">
                <h3 className="font-semibold mb-4">{editingFaq ? "Edit FAQ" : "Add FAQ"}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Question</label>
                    <Input
                      placeholder="Enter question..."
                      value={faqFormData.question}
                      onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Answer</label>
                    <textarea
                      className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      placeholder="Enter answer..."
                      value={faqFormData.answer}
                      onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-sm font-medium">Order</label>
                      <Input
                        type="number"
                        className="w-20"
                        value={faqFormData.order}
                        onChange={(e) => setFaqFormData({ ...faqFormData, order: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={faqFormData.isActive}
                        onCheckedChange={(checked) => setFaqFormData({ ...faqFormData, isActive: checked })}
                      />
                      <span className="text-sm">Active</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSubmitFaq} disabled={createFaqMutation.isPending || updateFaqMutation.isPending}>
                    {editingFaq ? "Update" : "Create"} FAQ
                  </Button>
                  <Button variant="outline" onClick={resetFaqForm}>Cancel</Button>
                </div>
              </Card>
            )}

            <div className="space-y-4">
              {(earnFaqs as any[])?.map((faq: any) => (
                <div key={faq.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={faq.isActive ? "default" : "secondary"}>
                          {faq.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Order: {faq.order}</span>
                      </div>
                      <h4 className="font-semibold">{faq.question}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditFaq(faq)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteFaqMutation.mutate(faq.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {(!earnFaqs || (earnFaqs as any[]).length === 0) && (
                <p className="text-center text-muted-foreground py-8">No FAQs configured yet. Default FAQs will be shown.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions Tab */}
      {activeSubTab === "subscriptions" && (
        <Card>
          <CardHeader>
            <CardTitle>User Earn Subscriptions</CardTitle>
            <CardDescription>View and manage user investments in earn plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground text-sm">
                    <th className="pb-3 font-medium">User ID</th>
                    <th className="pb-3 font-medium">Asset</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Duration</th>
                    <th className="pb-3 font-medium">APR</th>
                    <th className="pb-3 font-medium">Earned</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Start Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(subscriptions as any[])?.map((sub: any) => (
                    <tr key={sub.id} className="text-sm">
                      <td className="py-3 font-mono text-xs">{sub.userId.slice(0, 8)}...</td>
                      <td className="py-3 font-medium">{sub.symbol}</td>
                      <td className="py-3">${sub.amount?.toLocaleString()}</td>
                      <td className="py-3 capitalize">{sub.durationType}</td>
                      <td className="py-3 text-emerald-500">{sub.aprRate}%</td>
                      <td className="py-3 text-emerald-500">+${sub.totalEarned?.toFixed(2)}</td>
                      <td className="py-3">
                        <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(sub.startDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!subscriptions || (subscriptions as any[]).length === 0) && (
                <p className="text-center text-muted-foreground py-8">No user subscriptions yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DiscountsTab() {
  const { toast } = useToast();
  const { data: discounts, isLoading } = useQuery({
    queryKey: ["/api/admin/discounts"],
  });

  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountPercent: "",
    maxUses: "",
    isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminFetch("/api/admin/discounts", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      toast({ title: "Discount Created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminFetch(`/api/admin/discounts/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      toast({ title: "Discount Updated" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/discounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      toast({ title: "Discount Deleted" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingDiscount(null);
    setFormData({
      code: "",
      description: "",
      discountPercent: "",
      maxUses: "",
      isActive: true,
    });
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      discountPercent: parseFloat(formData.discountPercent),
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
    };

    if (editingDiscount) {
      updateMutation.mutate({ id: editingDiscount.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Discount Codes</h2>
        <Button onClick={() => setShowForm(true)} data-testid="button-add-discount">
          <Plus className="w-4 h-4 mr-2" />
          Add Discount
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingDiscount ? "Edit Discount" : "New Discount"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Discount Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
              <Input
                type="number"
                placeholder="Discount %"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
              />
            </div>
            <Input
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Max Uses (leave empty for unlimited)"
              value={formData.maxUses}
              onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <span className="text-sm">Active</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingDiscount ? "Update" : "Create"} Discount
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Code</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Discount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Uses</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts?.map((discount: any) => (
                  <tr key={discount.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-mono font-bold">{discount.code}</td>
                    <td className="p-4 text-green-500 font-medium">{discount.discountPercent}%</td>
                    <td className="p-4">
                      {discount.usedCount} / {discount.maxUses || "Unlimited"}
                    </td>
                    <td className="p-4">
                      <Badge variant={discount.isActive ? "default" : "secondary"}>
                        {discount.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingDiscount(discount);
                            setFormData({
                              code: discount.code,
                              description: discount.description || "",
                              discountPercent: discount.discountPercent.toString(),
                              maxUses: discount.maxUses?.toString() || "",
                              isActive: discount.isActive,
                            });
                            setShowForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(discount.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
  });

  const [formData, setFormData] = useState<Record<string, string>>({});

  const defaultSettings = [
    { key: "company_name", label: "Company Name", type: "string", description: "Company/App name displayed throughout the app" },
    { key: "support_email", label: "Support Email", type: "string", description: "Support email address for user inquiries" },
    { key: "daily_return_percent", label: "Daily Return Percent", type: "number", description: "Default daily earnings percentage for investments" },
    { key: "min_withdrawal_btc", label: "Min Withdrawal BTC", type: "number", description: "Minimum BTC withdrawal amount" },
    { key: "min_withdrawal_ltc", label: "Min Withdrawal LTC", type: "number", description: "Minimum LTC withdrawal amount" },
    { key: "min_withdrawal_usdt", label: "Min Withdrawal USDT", type: "number", description: "Minimum USDT withdrawal amount" },
    { key: "withdrawal_fee_percent", label: "Withdrawal Fee %", type: "number", description: "Fee percentage for withdrawals" },
    { key: "transaction_fee_percent", label: "Transaction Fee %", type: "number", description: "Fee percentage for internal transactions" },
    { key: "referral_bonus_percent", label: "Referral Bonus %", type: "number", description: "Bonus percentage for referrals" },
    { key: "maintenance_mode", label: "Maintenance Mode", type: "boolean", description: "Enable maintenance mode (blocks user access)" },
    { key: "kyc_required", label: "KYC Required", type: "boolean", description: "Require KYC verification for withdrawals" },
    { key: "copyright_text", label: "Copyright Text", type: "string", description: "Copyright text in footer" },
    { key: "social_twitter", label: "Twitter/X URL", type: "string", description: "Social media link for Twitter/X" },
    { key: "social_instagram", label: "Instagram URL", type: "string", description: "Social media link for Instagram" },
    { key: "social_telegram", label: "Telegram URL", type: "string", description: "Social media link for Telegram" },
  ];

  const updateMutation = useMutation({
    mutationFn: ({ key, value, type }: { key: string; value: string; type: string }) =>
      adminFetch(`/api/admin/settings/${key}`, { 
        method: "PUT", 
        body: { value, type } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Setting Updated" });
    },
  });

  const getSettingValue = (key: string) => {
    if (formData[key] !== undefined) return formData[key];
    const setting = settings?.find((s: any) => s.key === key);
    return setting?.value || "";
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">General App Settings</h2>

      {/* Company & Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Company & Branding</CardTitle>
          <CardDescription>Configure company information and branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {defaultSettings.filter(s => ["company_name", "copyright_text", "support_email"].includes(s.key)).map((setting) => (
            <div key={setting.key} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <div className="font-medium">{setting.label}</div>
                <div className="text-sm text-muted-foreground">{setting.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  className="w-64"
                  value={getSettingValue(setting.key)}
                  onChange={(e) => setFormData({ ...formData, [setting.key]: e.target.value })}
                  placeholder={setting.label}
                />
                <Button
                  size="sm"
                  onClick={() => updateMutation.mutate({ 
                    key: setting.key, 
                    value: getSettingValue(setting.key), 
                    type: setting.type 
                  })}
                  disabled={updateMutation.isPending}
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Social Media Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>Configure social media links for footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {defaultSettings.filter(s => s.key.startsWith("social_")).map((setting) => (
            <div key={setting.key} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <div className="font-medium">{setting.label}</div>
                <div className="text-sm text-muted-foreground">{setting.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  className="w-64"
                  value={getSettingValue(setting.key)}
                  onChange={(e) => setFormData({ ...formData, [setting.key]: e.target.value })}
                  placeholder="https://..."
                />
                <Button
                  size="sm"
                  onClick={() => updateMutation.mutate({ 
                    key: setting.key, 
                    value: getSettingValue(setting.key), 
                    type: setting.type 
                  })}
                  disabled={updateMutation.isPending}
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Financial Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Settings</CardTitle>
          <CardDescription>Configure fees, minimums, and earnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {defaultSettings.filter(s => 
            ["daily_return_percent", "withdrawal_fee_percent", "transaction_fee_percent", "referral_bonus_percent", 
             "min_withdrawal_btc", "min_withdrawal_ltc", "min_withdrawal_usdt"].includes(s.key)
          ).map((setting) => (
            <div key={setting.key} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
              <div className="flex-1">
                <div className="font-medium">{setting.label}</div>
                <div className="text-sm text-muted-foreground">{setting.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  className="w-40"
                  value={getSettingValue(setting.key)}
                  onChange={(e) => setFormData({ ...formData, [setting.key]: e.target.value })}
                />
                <Button
                  size="sm"
                  onClick={() => updateMutation.mutate({ 
                    key: setting.key, 
                    value: getSettingValue(setting.key), 
                    type: setting.type 
                  })}
                  disabled={updateMutation.isPending}
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Configure system behavior and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {defaultSettings.filter(s => ["maintenance_mode", "kyc_required"].includes(s.key)).map((setting) => (
            <div key={setting.key} className="flex items-center justify-between gap-4 py-4 border-b border-border last:border-0">
              <div className="flex-1">
                <div className="font-medium">{setting.label}</div>
                <div className="text-sm text-muted-foreground">{setting.description}</div>
              </div>
              <Switch
                checked={getSettingValue(setting.key) === "true"}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, [setting.key]: checked.toString() });
                  updateMutation.mutate({ 
                    key: setting.key, 
                    value: checked.toString(), 
                    type: "boolean" 
                  });
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ WITHDRAWALS TAB ============
function WithdrawalsTab() {
  const { toast } = useToast();
  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["/api/admin/withdrawals"],
    queryFn: () => adminFetch("/api/admin/withdrawals"),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, txHash }: { id: string; txHash?: string }) =>
      adminFetch(`/api/admin/withdrawals/${id}/approve`, { method: "POST", body: { txHash } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({ title: "Withdrawal Approved" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminFetch(`/api/admin/withdrawals/${id}/reject`, { method: "POST", body: { reason } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      toast({ title: "Withdrawal Rejected" });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const statusIcons: Record<string, any> = {
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    rejected: <XCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Withdrawal Requests</h2>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Address</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Requested</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals?.map((w: any) => (
                  <tr key={w.id} className="border-b border-border last:border-0">
                    <td className="p-4">{w.userId}</td>
                    <td className="p-4 font-medium">{w.amount} {w.symbol}</td>
                    <td className="p-4 font-mono text-xs">{w.toAddress?.slice(0, 20)}...</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {statusIcons[w.status]}
                        <Badge variant={w.status === "pending" ? "secondary" : w.status === "completed" ? "default" : "destructive"}>
                          {w.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {w.requestedAt ? new Date(w.requestedAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4 text-right">
                      {w.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveMutation.mutate({ id: w.id })}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate({ id: w.id, reason: "Rejected by admin" })}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {(!withdrawals || withdrawals.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No withdrawal requests
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ NOTIFICATIONS TAB ============
function NotificationsTab() {
  const { toast } = useToast();
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [targetUserId, setTargetUserId] = useState("");

  const { data: adminNotifications, isLoading } = useQuery({
    queryKey: ["/api/admin/notifications"],
    queryFn: () => adminFetch("/api/admin/notifications"),
  });

  const broadcastMutation = useMutation({
    mutationFn: (data: { title: string; message: string; type?: string }) =>
      adminFetch("/api/admin/notifications/broadcast", { method: "POST", body: data }),
    onSuccess: (data: any) => {
      toast({ title: `Sent to ${data?.notificationsSent || 0} users` });
      setBroadcastTitle("");
      setBroadcastMessage("");
      setShowBroadcast(false);
    },
  });

  const sendToUserMutation = useMutation({
    mutationFn: (data: { userId: string; title: string; message: string }) =>
      adminFetch("/api/admin/notifications/send", { method: "POST", body: data }),
    onSuccess: () => {
      toast({ title: "Notification Sent" });
      setBroadcastTitle("");
      setBroadcastMessage("");
      setTargetUserId("");
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <Button onClick={() => setShowBroadcast(!showBroadcast)}>
          <Send className="w-4 h-4 mr-2" />
          Send Notification
        </Button>
      </div>

      {showBroadcast && (
        <Card>
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
            <CardDescription>Send to all users or a specific user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">User ID (leave empty for broadcast)</label>
              <Input
                placeholder="User ID (optional)"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Notification title"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Notification message"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (targetUserId) {
                    sendToUserMutation.mutate({ userId: targetUserId, title: broadcastTitle, message: broadcastMessage });
                  } else {
                    broadcastMutation.mutate({ title: broadcastTitle, message: broadcastMessage, type: "promotion" });
                  }
                }}
                disabled={!broadcastTitle || !broadcastMessage || broadcastMutation.isPending || sendToUserMutation.isPending}
              >
                {broadcastMutation.isPending || sendToUserMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {targetUserId ? "Send to User" : "Broadcast to All"}
              </Button>
              <Button variant="outline" onClick={() => setShowBroadcast(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Admin Notifications</CardTitle>
          <CardDescription>System alerts and admin-specific notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {adminNotifications?.notifications?.map((n: any) => (
              <div
                key={n.id}
                className={`p-4 rounded-lg border ${n.isRead ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{n.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{n.message}</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                  <Badge variant={n.priority === "high" || n.priority === "urgent" ? "destructive" : "secondary"}>
                    {n.type}
                  </Badge>
                </div>
              </div>
            ))}
            {(!adminNotifications?.notifications || adminNotifications.notifications.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">
                No notifications
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ SUPPORT TICKETS TAB ============
function TicketsTab() {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["/api/admin/tickets"],
    queryFn: () => adminFetch("/api/admin/tickets"),
  });

  const { data: ticketMessages } = useQuery({
    queryKey: ["/api/support/tickets", selectedTicket, "messages"],
    queryFn: () => adminFetch(`/api/support/tickets/${selectedTicket}/messages`),
    enabled: !!selectedTicket,
  });

  const replyMutation = useMutation({
    mutationFn: (data: { ticketId: string; message: string }) =>
      adminFetch(`/api/support/tickets/${data.ticketId}/messages`, {
        method: "POST",
        body: { userId: "admin", message: data.message, isAdmin: true },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      toast({ title: "Reply Sent" });
      setReplyMessage("");
    },
  });

  const closeMutation = useMutation({
    mutationFn: (ticketId: string) =>
      adminFetch(`/api/admin/tickets/${ticketId}/close`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      toast({ title: "Ticket Closed" });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const statusColors: Record<string, string> = {
    open: "bg-yellow-500",
    in_progress: "bg-blue-500",
    resolved: "bg-green-500",
    closed: "bg-gray-500",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Support Tickets</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>All Tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {tickets?.map((t: any) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedTicket === t.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{t.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColors[t.status]}`} />
                    <Badge variant="secondary">{t.status}</Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2">{t.description}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  {t.createdAt ? new Date(t.createdAt).toLocaleString() : ""}
                </div>
              </div>
            ))}
            {(!tickets || tickets.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">
                No tickets
              </div>
            )}
          </CardContent>
        </Card>

        {selectedTicket && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ticket Details</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => closeMutation.mutate(selectedTicket)}
                  disabled={closeMutation.isPending}
                >
                  Close Ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {ticketMessages?.map((m: any) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg ${m.isAdmin ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={m.isAdmin ? "default" : "secondary"}>
                        {m.isAdmin ? "Admin" : "User"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}
                      </span>
                    </div>
                    <div className="text-sm">{m.message}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={() => replyMutation.mutate({ ticketId: selectedTicket, message: replyMessage })}
                  disabled={!replyMessage || replyMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============ API CONFIGURATION TAB ============
function ApiConfigTab() {
  const { toast } = useToast();
  const [editingService, setEditingService] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const {
    data: apiConfigs,
    isLoading,
    isError: isApiConfigsError,
    error: apiConfigsError,
  } = useQuery({
    queryKey: ["/api/admin/api-configs"],
    queryFn: () => adminFetch("/api/admin/api-configs"),
  });

  const {
    data: featureToggles,
    isError: isFeatureTogglesError,
    error: featureTogglesError,
  } = useQuery({
    queryKey: ["/api/admin/feature-toggles"],
    queryFn: () => adminFetch("/api/admin/feature-toggles"),
  });

  const updateApiMutation = useMutation({
    mutationFn: (data: any) =>
      adminFetch(`/api/admin/api-configs/${data.serviceName}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-configs"] });
      toast({ title: "API Configuration Updated" });
      setEditingService(null);
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: ({ featureName, isEnabled }: { featureName: string; isEnabled: boolean }) =>
      adminFetch(`/api/admin/feature-toggles/${featureName}`, { method: "PATCH", body: { isEnabled } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-toggles"] });
      toast({ title: "Feature Updated" });
    },
  });

  const saveConfigField = (key: string, value: string) => {
    // Store generic key/value configs in api_configs.additionalConfig.value
    updateApiMutation.mutate({ serviceName: key, additionalConfig: { value } });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const getConfigValue = (key: string) => {
    const config = apiConfigs?.find((c: any) => c.serviceName === key);
    // Prefer `additionalConfig.value` for generic string settings; fall back to endpoint/apiKey/apiSecret.
    const savedValue = config?.additionalConfig?.value ?? config?.endpoint ?? config?.apiKey ?? config?.apiSecret;
    return (savedValue ?? formData[key] ?? "") as string;
  };

  const categoryLabel = (category: string) => {
    const normalized = (category || "other").toLowerCase();
    if (normalized === "blockchain") return "Blockchain";
    if (normalized === "payment") return "Payment";
    if (normalized === "messaging") return "Messaging";
    if (normalized === "analytics") return "Analytics";
    if (normalized === "email") return "Email";
    if (normalized === "sms") return "SMS";
    return "Other";
  };

  const categorizedApiConfigs = (() => {
    if (!Array.isArray(apiConfigs) || apiConfigs.length === 0) return [] as Array<{ key: string; name: string; configs: any[] }>;
    const byCategory = new Map<string, any[]>();
    for (const config of apiConfigs) {
      const key = (config?.category || "other") as string;
      const list = byCategory.get(key) || [];
      list.push(config);
      byCategory.set(key, list);
    }
    return Array.from(byCategory.entries())
      .map(([key, configs]) => ({
        key,
        name: categoryLabel(key),
        configs: configs.slice().sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">API & Services Configuration</h2>

      {(isApiConfigsError || isFeatureTogglesError) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Some admin config data failed to load
            </CardTitle>
            <CardDescription>
              The tab will still render, but parts may be empty until the API is reachable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {isApiConfigsError && (
              <div>API configs error: {(apiConfigsError as any)?.message || "Failed to load"}</div>
            )}
            {isFeatureTogglesError && (
              <div>Feature toggles error: {(featureTogglesError as any)?.message || "Failed to load"}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Blockchain & Wallet Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Blockchain & Wallet
          </CardTitle>
          <CardDescription>Configure wallet mnemonic and blockchain RPC endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">HD Wallet Mnemonic (BIP39)</label>
            <Input
              type="password"
              placeholder="12 or 24 word mnemonic phrase"
              value={getConfigValue("hd_wallet_mnemonic")}
              onChange={(e) => setFormData({ ...formData, hd_wallet_mnemonic: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Master seed phrase for generating wallet addresses</p>
            <Button size="sm" onClick={() => saveConfigField("hd_wallet_mnemonic", getConfigValue("hd_wallet_mnemonic"))}>
              Save Mnemonic
            </Button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Bitcoin RPC URL</label>
            <Input
              type="url"
              placeholder="https://bitcoin-rpc.example.com"
              value={getConfigValue("bitcoin_rpc_url")}
              onChange={(e) => setFormData({ ...formData, bitcoin_rpc_url: e.target.value })}
            />
            <Button size="sm" onClick={() => saveConfigField("bitcoin_rpc_url", getConfigValue("bitcoin_rpc_url"))}>
              Save
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Litecoin RPC URL</label>
            <Input
              type="url"
              placeholder="https://litecoin-rpc.example.com"
              value={getConfigValue("litecoin_rpc_url")}
              onChange={(e) => setFormData({ ...formData, litecoin_rpc_url: e.target.value })}
            />
            <Button size="sm" onClick={() => saveConfigField("litecoin_rpc_url", getConfigValue("litecoin_rpc_url"))}>
              Save
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ethereum RPC URL</label>
            <Input
              type="url"
              placeholder="https://mainnet.infura.io/v3/YOUR-API-KEY"
              value={getConfigValue("ethereum_rpc_url")}
              onChange={(e) => setFormData({ ...formData, ethereum_rpc_url: e.target.value })}
            />
            <Button size="sm" onClick={() => saveConfigField("ethereum_rpc_url", getConfigValue("ethereum_rpc_url"))}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SMS Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            SMS Configuration
          </CardTitle>
          <CardDescription>Configure SMS provider for notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">SMS Provider</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={getConfigValue("sms_provider")}
              onChange={(e) => {
                setFormData({ ...formData, sms_provider: e.target.value });
                saveConfigField("sms_provider", e.target.value);
              }}
            >
              <option value="">Select Provider</option>
              <option value="twilio">Twilio</option>
              <option value="vonage">Vonage (Nexmo)</option>
              <option value="aws_sns">AWS SNS</option>
              <option value="messagebird">MessageBird</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">SMS API Key</label>
            <Input
              type="password"
              placeholder="Your SMS provider API key"
              value={getConfigValue("sms_api_key")}
              onChange={(e) => setFormData({ ...formData, sms_api_key: e.target.value })}
            />
            <Button size="sm" onClick={() => saveConfigField("sms_api_key", getConfigValue("sms_api_key"))}>
              Save API Key
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">SMS API Secret</label>
            <Input
              type="password"
              placeholder="Your SMS provider API secret"
              value={getConfigValue("sms_api_secret")}
              onChange={(e) => setFormData({ ...formData, sms_api_secret: e.target.value })}
            />
            <Button size="sm" onClick={() => saveConfigField("sms_api_secret", getConfigValue("sms_api_secret"))}>
              Save API Secret
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">SMS From Number</label>
            <Input
              placeholder="+1234567890"
              value={getConfigValue("sms_from_number")}
              onChange={(e) => setFormData({ ...formData, sms_from_number: e.target.value })}
            />
            <Button size="sm" onClick={() => saveConfigField("sms_from_number", getConfigValue("sms_from_number"))}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email SMTP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Email SMTP Configuration
          </CardTitle>
          <CardDescription>Configure SMTP settings for email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">SMTP Host</label>
            <Input
              placeholder="smtp.gmail.com"
              value={getConfigValue("smtp_host")}
              onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
            />
            <Button size="sm" onClick={() => saveConfigField("smtp_host", getConfigValue("smtp_host"))}>
              Save
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">SMTP Port</label>
            <Input
              type="number"
              placeholder="587"
              value={getConfigValue("smtp_port")}
              onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
            />
            <Button size="sm" onClick={() => saveConfigField("smtp_port", getConfigValue("smtp_port"))}>
              Save
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">SMTP Username</label>
            <Input
              placeholder="your-email@example.com"
              value={getConfigValue("smtp_username")}
              onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
            />
            <Button size="sm" onClick={() => saveConfigField("smtp_username", getConfigValue("smtp_username"))}>
              Save
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">SMTP Password</label>
            <Input
              type="password"
              placeholder="Your SMTP password"
              value={getConfigValue("smtp_password")}
              onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
            />
            <Button size="sm" onClick={() => saveConfigField("smtp_password", getConfigValue("smtp_password"))}>
              Save
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">From Email</label>
            <Input
              placeholder="noreply@example.com"
              value={getConfigValue("smtp_from_email")}
              onChange={(e) => setFormData({ ...formData, smtp_from_email: e.target.value })}
            />
            <Button size="sm" onClick={() => saveConfigField("smtp_from_email", getConfigValue("smtp_from_email"))}>
              Save
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={getConfigValue("smtp_use_tls") === "true"}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, smtp_use_tls: checked.toString() });
                saveConfigField("smtp_use_tls", checked.toString());
              }}
            />
            <label className="text-sm font-medium">Use TLS</label>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
          <CardDescription>Enable or disable app features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {featureToggles?.map((toggle: any) => (
            <div key={toggle.id} className="flex items-center justify-between p-3 border-b last:border-0">
              <div>
                <div className="font-medium">{toggle.displayName}</div>
                <div className="text-sm text-muted-foreground">{toggle.description}</div>
              </div>
              <Switch
                checked={toggle.isEnabled}
                onCheckedChange={(checked) =>
                  toggleFeatureMutation.mutate({ featureName: toggle.featureName, isEnabled: checked })
                }
              />
            </div>
          ))}
          {(!featureToggles || featureToggles.length === 0) && (
            <div className="p-4 text-center text-muted-foreground">
              No feature toggles configured. Add them in the database.
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Configurations
          </CardTitle>
          <CardDescription>Configure API keys and service endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {categorizedApiConfigs.map((category) => (
            <div key={category.key}>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">{category.name}</h4>
              <div className="space-y-3">
                {category.configs.map((config: any) => (
                  <div key={config.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{config.displayName}</span>
                        {config.isEnabled ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={config.isEnabled}
                          onCheckedChange={(checked) =>
                            updateApiMutation.mutate({ ...config, isEnabled: checked })
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingService(editingService === config.serviceName ? null : config.serviceName)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {editingService === config.serviceName && (
                      <div className="mt-4 space-y-3 pt-4 border-t">
                        <div>
                          <label className="text-sm font-medium">API Key</label>
                          <Input
                            type="password"
                            placeholder="Enter API key"
                            defaultValue={config.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">API Secret</label>
                          <Input
                            type="password"
                            placeholder="Enter API secret (optional)"
                            defaultValue={config.apiSecret}
                            onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Endpoint URL</label>
                          <Input
                            placeholder="https://api.example.com"
                            defaultValue={config.endpoint}
                            onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => updateApiMutation.mutate({ ...config, ...formData })}
                            disabled={updateApiMutation.isPending}
                          >
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setEditingService(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!apiConfigs || apiConfigs.length === 0) && (
            <div className="p-4 text-center text-muted-foreground">
              No API configurations found. They will be created when you configure services.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// OFFERS TAB
// ============================================================

interface PromotionalOffer {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  backgroundType: number;
  ctaText: string | null;
  ctaLink: string | null;
  isActive: boolean;
  order: number;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
}

function OffersTab() {
  const { toast } = useToast();
  const [editingOffer, setEditingOffer] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<PromotionalOffer>>({
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    backgroundType: 1,
    ctaText: "",
    ctaLink: "",
    isActive: true,
    order: 0,
    validFrom: null,
    validUntil: null,
  });

  const { data: offers, isLoading } = useQuery<PromotionalOffer[]>({
    queryKey: ["/api/admin/offers"],
    queryFn: () => adminFetch("/api/admin/offers"),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<PromotionalOffer>) =>
      adminFetch("/api/admin/offers", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      toast({ title: "Offer created successfully" });
      setIsCreating(false);
      setFormData({
        title: "",
        subtitle: "",
        description: "",
        imageUrl: "",
        backgroundType: 1,
        ctaText: "",
        ctaLink: "",
        isActive: true,
        order: 0,
        validFrom: null,
        validUntil: null,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create offer", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<PromotionalOffer> & { id: number }) =>
      adminFetch(`/api/admin/offers/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      toast({ title: "Offer updated successfully" });
      setEditingOffer(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update offer", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      adminFetch(`/api/admin/offers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      toast({ title: "Offer deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete offer", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = (id: number) => {
    updateMutation.mutate({ id, ...formData });
  };

  const startEdit = (offer: PromotionalOffer) => {
    setEditingOffer(offer.id);
    setFormData(offer);
  };

  const cancelEdit = () => {
    setEditingOffer(null);
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      backgroundType: 1,
      ctaText: "",
      ctaLink: "",
      isActive: true,
      order: 0,
      validFrom: null,
      validUntil: null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promotional Offers</h2>
          <p className="text-muted-foreground text-sm">
            Manage promotional banners and offers displayed on the dashboard
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Offer
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Offer</CardTitle>
            <CardDescription>Add a promotional offer for users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Welcome Bonus"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subtitle</label>
                <Input
                  value={formData.subtitle || ""}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Get 10% extra"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Start mining today and receive 10% bonus on your first investment"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Background Type (1-10)</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.backgroundType || 1}
                  onChange={(e) => setFormData({ ...formData, backgroundType: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  1: Electric Blue | 2: Sunset | 3: Ocean | 4: Forest | 5: Royal Purple | 6: Golden | 7: Gray | 8: Coral | 9: Mint | 10: Deep Space
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL (optional)</label>
                <Input
                  value={formData.imageUrl || ""}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CTA Button Text</label>
                <Input
                  value={formData.ctaText || ""}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  placeholder="Learn More"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CTA Link</label>
                <Input
                  value={formData.ctaLink || ""}
                  onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order Priority</label>
                <Input
                  type="number"
                  value={formData.order || 0}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valid From</label>
                <Input
                  type="datetime-local"
                  value={formData.validFrom || ""}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valid Until</label>
                <Input
                  type="datetime-local"
                  value={formData.validUntil || ""}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <label className="text-sm font-medium">Active</label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending || !formData.title}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Create Offer
              </Button>
              <Button variant="outline" onClick={() => { setIsCreating(false); cancelEdit(); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Offers ({offers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : offers && offers.length > 0 ? (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="border border-border rounded-lg p-4">
                  {editingOffer === offer.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Title *</label>
                          <Input
                            value={formData.title || ""}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Subtitle</label>
                          <Input
                            value={formData.subtitle || ""}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={formData.description || ""}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Background Type (1-10)</label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={formData.backgroundType || 1}
                            onChange={(e) => setFormData({ ...formData, backgroundType: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Image URL</label>
                          <Input
                            value={formData.imageUrl || ""}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">CTA Text</label>
                          <Input
                            value={formData.ctaText || ""}
                            onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">CTA Link</label>
                          <Input
                            value={formData.ctaLink || ""}
                            onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Order</label>
                          <Input
                            type="number"
                            value={formData.order || 0}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Valid From</label>
                          <Input
                            type="datetime-local"
                            value={formData.validFrom || ""}
                            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Valid Until</label>
                          <Input
                            type="datetime-local"
                            value={formData.validUntil || ""}
                            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <label className="text-sm font-medium">Active</label>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => handleUpdate(offer.id)} disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                          Save
                        </Button>
                        <Button variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{offer.title}</h3>
                          <Badge variant={offer.isActive ? "default" : "secondary"}>
                            {offer.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">BG: {offer.backgroundType}</Badge>
                          <Badge variant="outline">Order: {offer.order}</Badge>
                        </div>
                        {offer.subtitle && (
                          <p className="text-sm font-medium text-muted-foreground">{offer.subtitle}</p>
                        )}
                        {offer.description && (
                          <p className="text-sm text-muted-foreground">{offer.description}</p>
                        )}
                        {offer.ctaText && (
                          <p className="text-xs text-muted-foreground">
                            CTA: {offer.ctaText} → {offer.ctaLink || "No link"}
                          </p>
                        )}
                        {(offer.validFrom || offer.validUntil) && (
                          <p className="text-xs text-muted-foreground">
                            Valid: {offer.validFrom ? new Date(offer.validFrom).toLocaleDateString() : "Always"} - {offer.validUntil ? new Date(offer.validUntil).toLocaleDateString() : "Forever"}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(offer)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete offer "${offer.title}"?`)) {
                              deleteMutation.mutate(offer.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No offers yet. Create your first promotional offer!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
