import { useState } from "react";
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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { queryClient } from "@/lib/queryClient";

import { useToast } from "@/hooks/use-toast";

// Helper for admin API requests that returns parsed JSON or null for empty responses
async function adminFetch<T = any>(url: string, options?: { method?: string; body?: any }): Promise<T> {
  const res = await fetch(url, {
    method: options?.method || "GET",
    headers: options?.body ? { "Content-Type": "application/json" } : {},
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

type AdminTab = "dashboard" | "users" | "wallets" | "plans" | "miners" | "content" | "discounts" | "settings";

export function Admin({ onBack }: AdminProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const { toast } = useToast();

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "wallets" as const, label: "Wallets", icon: Wallet },
    { id: "plans" as const, label: "Investment Plans", icon: TrendingUp },
    { id: "miners" as const, label: "Miner Pricing", icon: Package },
    { id: "content" as const, label: "Content", icon: FileText },
    { id: "discounts" as const, label: "Discounts", icon: Percent },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-card border-r border-border p-4">
          <div className="flex items-center gap-2 mb-8">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              data-testid="button-admin-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-xl font-bold">Admin Panel</h1>
          </div>

          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "wallets" && <WalletsTab />}
          {activeTab === "plans" && <PlansTab />}
          {activeTab === "miners" && <MinersTab />}
          {activeTab === "content" && <ContentTab />}
          {activeTab === "discounts" && <DiscountsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

function DashboardTab() {
  const { data: stats, isLoading } = useQuery({
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
  const { data: users, isLoading } = useQuery({
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
  const { data: mainWallets, isLoading } = useQuery({
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
  const { data: plans, isLoading } = useQuery({
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
  const { data: miners, isLoading } = useQuery({
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
  const { data: content, isLoading } = useQuery({
    queryKey: ["/api/admin/content"],
  });

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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Management</h2>
        <Button onClick={() => setShowForm(true)} data-testid="button-add-content">
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </div>

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
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
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
    { key: "daily_return_percent", label: "Daily Return Percent", type: "number", description: "Default daily earnings percentage for investments" },
    { key: "min_withdrawal", label: "Minimum Withdrawal", type: "number", description: "Minimum amount for withdrawals" },
    { key: "withdrawal_fee_percent", label: "Withdrawal Fee %", type: "number", description: "Fee percentage for withdrawals" },
    { key: "referral_bonus_percent", label: "Referral Bonus %", type: "number", description: "Bonus percentage for referrals" },
    { key: "maintenance_mode", label: "Maintenance Mode", type: "boolean", description: "Enable maintenance mode" },
    { key: "support_email", label: "Support Email", type: "string", description: "Support email address" },
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
      <h2 className="text-2xl font-bold">App Settings</h2>

      <Card>
        <CardContent className="p-6 space-y-6">
          {defaultSettings.map((setting) => (
            <div key={setting.key} className="flex items-center justify-between gap-4 py-4 border-b border-border last:border-0">
              <div className="flex-1">
                <div className="font-medium">{setting.label}</div>
                <div className="text-sm text-muted-foreground">{setting.description}</div>
              </div>
              <div className="flex items-center gap-2">
                {setting.type === "boolean" ? (
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
                ) : (
                  <>
                    <Input
                      type={setting.type === "number" ? "number" : "text"}
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
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
