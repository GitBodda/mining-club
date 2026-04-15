import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Database,
  DollarSign,
  TrendingUp,
  Bell,
  Settings,
  Users,
  ArrowDownToLine,
  Eye,
  AlertTriangle,
  Edit2,
  Trash2,
  Save,
  Mail,
  Shield,
  Wallet,
  Menu,
  X,
  LogOut,
  FileText,
  Smartphone,
  Target,
  Zap,
  Sliders,
  Plus,
  ArrowUpToLine,
  ChevronRight,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  TestTube2,
  Key,
  Cpu,
  Pause,
  Play,
  Gift,
} from "lucide-react";

const ADMIN_PASSWORD = "MiningClub2024!";

// Helper to make authenticated admin API requests
function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  headers.set("X-Admin-Key", ADMIN_PASSWORD);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...options, headers });
}

// Query function for admin useQuery calls that includes auth
const adminQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  const res = await adminFetch(queryKey.join("/") as string);
  if (!res.ok) {
    throw new Error(`${res.status}: ${res.statusText}`);
  }
  return res.json();
};

// Predefined config keys
const CONFIG_KEYS = {
  wallet: [
    { key: "wallet_btc_native", description: "Bitcoin Native (SegWit)" },
    { key: "wallet_btc_legacy", description: "Bitcoin Legacy" },
    { key: "wallet_btc_taproot", description: "Bitcoin Taproot" },
    { key: "wallet_eth_erc20", description: "Ethereum ERC-20" },
    { key: "wallet_usdt_trc20", description: "USDT TRC-20 (Tron)" },
    { key: "wallet_usdt_erc20", description: "USDT ERC-20 (Ethereum)" },
    { key: "wallet_usdt_bsc", description: "USDT BSC (BEP-20)" },
    { key: "wallet_usdt_ton", description: "USDT TON" },
    { key: "wallet_usdc_erc20", description: "USDC ERC-20" },
    { key: "wallet_usdc_trc20", description: "USDC TRC-20" },
    { key: "wallet_usdc_bsc", description: "USDC BSC" },
    { key: "wallet_usdc_ton", description: "USDC TON" },
    { key: "wallet_ltc_native", description: "Litecoin Native" },
  ],
  pricing: [
    { key: "price_btc_per_th", description: "BTC Price per TH/s" },
    { key: "price_ltc_per_mh", description: "LTC Price per MH/s" },
    { key: "price_eth_per_mh", description: "ETH Price per MH/s" },
    { key: "minimum_deposit_usd", description: "Minimum Deposit (USD)" },
    { key: "withdrawal_fee_btc", description: "BTC Withdrawal Fee" },
    { key: "withdrawal_fee_usdt", description: "USDT Withdrawal Fee" },
    { key: "withdrawal_fee_eth", description: "ETH Withdrawal Fee" },
  ],
  contracts: [
    { key: "contract_btc_starter_price", description: "BTC Starter Contract Price" },
    { key: "contract_btc_starter_hashrate", description: "BTC Starter Hashrate (TH/s)" },
    { key: "contract_btc_pro_price", description: "BTC Pro Contract Price" },
    { key: "contract_btc_pro_hashrate", description: "BTC Pro Hashrate (TH/s)" },
    { key: "contract_ltc_starter_price", description: "LTC Starter Contract Price" },
    { key: "contract_ltc_starter_hashrate", description: "LTC Starter Hashrate (MH/s)" },
    { key: "contract_ltc_pro_price", description: "LTC Pro Contract Price" },
    { key: "contract_ltc_pro_hashrate", description: "LTC Pro Hashrate (MH/s)" },
    { key: "contract_duration_days", description: "Default Contract Duration (days)" },
  ],
  discount: [
    { key: "discount_percentage", description: "Current Discount (%)" },
    { key: "discount_start_date", description: "Discount Start Date" },
    { key: "discount_end_date", description: "Discount End Date" },
    { key: "sale_active", description: "Sale Active (true/false)" },
    { key: "flash_sale_percentage", description: "Flash Sale Discount (%)" },
    { key: "referral_bonus_percentage", description: "Referral Bonus (%)" },
  ],
  forceUpdate: [
    { key: "force_update_enabled", description: "Force Update Enabled" },
    { key: "force_update_min_version", description: "Minimum Required Version" },
    { key: "force_update_android_url", description: "Google Play Store URL" },
    { key: "force_update_ios_url", description: "Apple App Store URL" },
    { key: "force_update_message", description: "Update Prompt Message" },
  ],
  settings: [
    { key: "app_name", description: "Application Name" },
    { key: "support_email", description: "Support Email Address" },
    { key: "support_phone", description: "Support Phone Number" },
    { key: "maintenance_mode", description: "Maintenance Mode (true/false)" },
    { key: "maintenance_message", description: "Maintenance Mode Message" },
    { key: "max_active_contracts", description: "Max Active Contracts per User" },
  ],
  compliance: [
    { key: "compliance_mode", description: "Safe Mode for App Store Review (true/false)" },
    { key: "web_storefront_mode", description: "Web Storefront Mode (true/false)" },
    { key: "native_dashboard_mode", description: "Native Dashboard Mode (true/false)" },
  ],
};

const ARTICLE_CATEGORIES = [
  "Basics",
  "Strategy",
  "Advanced",
  "Security",
  "Economics",
  "Tutorial",
  "News",
];

type NavItem = "users" | "deposits" | "withdrawals" | "auto-withdrawals" | "notifications" | "articles" | "update-app" | "config" | "estimates" | "user-estimates" | "solo-mining" | "stripe" | "miners" | "invite-codes" | "free-miners";

interface SoloMiningPurchase {
  id: string;
  userId: string;
  packageName: string;
  amount: number;
  hashrate: number;
  hashrateUnit: string;
  status: string;
  totalEarned: number;
  purchaseDate: string;
  expiryDate: string | null;
  userEmail: string | null;
  userDisplayName: string | null;
}

interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  network: string;
  walletAddress: string;
  status: string;
  createdAt: string;
  confirmedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  userEmail?: string;
  userDisplayName?: string;
}

interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  isActive: boolean;
  role?: string;
  twoFactorEnabled?: boolean;
  firebaseUid?: string;
}

interface AdminUserPurchasesResponse {
  orders: Array<{
    id: string;
    type: string;
    productId: string;
    productName: string;
    amount: number;
    currency: string;
    status?: string;
    createdAt?: string;
    completedAt?: string;
    details?: any;
  }>;
}

interface UserBalancesResponse {
  balances: Array<{ symbol: string; balance: number }>;
  pending: Record<string, number>;
}

interface AppConfig {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string;
  isActive: boolean;
}

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  image?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

// --- Daily simulated users (deterministic per calendar day, 16–23 new users/day) ---
const FIRST_NAMES = ["Liam","Emma","Noah","Olivia","Ethan","Ava","Mason","Sophia","Lucas","Isabella","Aiden","Mia","Jackson","Charlotte","Logan","Amelia","Sebastian","Harper","Carter","Evelyn","Mateo","Abigail","Daniel","Emily","Henry","Ella","Owen","Elizabeth","Wyatt","Camila","Julian","Luna","Luke","Sofia","Grayson","Avery","Isaac","Aria","Jayden","Scarlett","Gabriel","Penelope","Anthony","Layla","Dylan","Chloe","Leo","Victoria","Lincoln","Madison","Jaxon","Eleanor","Asher","Grace","Christopher","Nora","Josiah","Riley","Andrew","Zoey","Thomas","Hannah","Joshua","Lily","Ezra","Ellie","Hudson","Aubrey","Charles","Addison","Caleb","Audrey"];
const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts"];
const EMAIL_DOMAINS = ["gmail.com","gmail.com","gmail.com","aol.com","proton.me","yahoo.com","outlook.com"];

function seededRand(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296; };
}

function generateDailyUsers() {
  // Accumulate daily users from a start epoch (day 0 = 2026-01-01)
  const START_DATE = new Date("2026-01-01").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysElapsed = Math.floor((today.getTime() - START_DATE) / 86400000);
  const allUsers: { id: string; email: string; displayName: string; isActive: boolean; twoFactorEnabled: boolean }[] = [];
  for (let day = 0; day <= daysElapsed; day++) {
    const rand = seededRand(day * 7919 + 42);
    const count = 16 + Math.floor(rand() * 8); // 16–23
    for (let i = 0; i < count; i++) {
      const r = seededRand(day * 9973 + i * 1327 + 3);
      const fn = FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)];
      const ln = LAST_NAMES[Math.floor(r() * LAST_NAMES.length)];
      const domain = EMAIL_DOMAINS[Math.floor(r() * EMAIL_DOMAINS.length)];
      const num = Math.floor(r() * 900) + 10;
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${num}@${domain}`;
      const has2fa = r() < 0.18;
      allUsers.push({ id: `daily_${day}_${i}`, email, displayName: `${fn} ${ln}`, isActive: true, twoFactorEnabled: has2fa });
    }
  }
  return allUsers;
}

// App Store Installs / user counts: anchored on 2026-04-10, grows with daily simulation
function getDailyUserCountUpToDate(anchorDate: Date): number {
  const START_DATE = new Date("2026-01-01").getTime();
  const d = new Date(anchorDate); d.setHours(0, 0, 0, 0);
  const daysElapsed = Math.floor((d.getTime() - START_DATE) / 86400000);
  let total = 0;
  for (let day = 0; day <= daysElapsed; day++) {
    const rand = seededRand(day * 7919 + 42);
    total += 16 + Math.floor(rand() * 8);
  }
  return total;
}
const APP_INSTALLS_OFFSET = 879 - getDailyUserCountUpToDate(new Date("2026-04-10"));
const TOTAL_USERS_OFFSET = 743 - getDailyUserCountUpToDate(new Date("2026-04-10"));
// ---

// Build simulated users for a given today-date (called reactively)
function buildSimulatedUsers(today: Date) {
  const START_DATE = new Date("2026-01-01").getTime();
  const d = new Date(today); d.setHours(0, 0, 0, 0);
  const daysElapsed = Math.floor((d.getTime() - START_DATE) / 86400000);
  const allUsers: { id: string; email: string; displayName: string; isActive: boolean; twoFactorEnabled: boolean }[] = [];
  for (let day = 0; day <= daysElapsed; day++) {
    const rand = seededRand(day * 7919 + 42);
    const count = 16 + Math.floor(rand() * 8);
    for (let i = 0; i < count; i++) {
      const r = seededRand(day * 9973 + i * 1327 + 3);
      const fn = FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)];
      const ln = LAST_NAMES[Math.floor(r() * LAST_NAMES.length)];
      const domain = EMAIL_DOMAINS[Math.floor(r() * EMAIL_DOMAINS.length)];
      const num = Math.floor(r() * 900) + 10;
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${num}@${domain}`;
      const has2fa = r() < 0.18;
      allUsers.push({ id: `daily_${day}_${i}`, email, displayName: `${fn} ${ln}`, isActive: true, twoFactorEnabled: has2fa });
    }
  }
  return allUsers;
}

export function DatabaseAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeNav, setActiveNav] = useState<NavItem>("users");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);

  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [terminatePurchaseId, setTerminatePurchaseId] = useState<string | null>(null);
  const [terminateReasonPreset, setTerminateReasonPreset] = useState<"expired" | "out_of_stock" | "custom">("expired");
  const [terminateCustomMessage, setTerminateCustomMessage] = useState("");
  // Gift miner state
  const [giftMinerDialogOpen, setGiftMinerDialogOpen] = useState(false);
  const [giftMinerId, setGiftMinerId] = useState<string | null>(null); // userId to gift to
  const [giftPackageName, setGiftPackageName] = useState("Custom Gift");
  const [giftCrypto, setGiftCrypto] = useState("BTC");
  const [giftHashrate, setGiftHashrate] = useState("6");
  const [giftHashrateUnit, setGiftHashrateUnit] = useState("TH/s");
  const [giftDailyBTC, setGiftDailyBTC] = useState("0.00000630");
  const [giftDurationDays, setGiftDurationDays] = useState("730");
  // Weekly profit distribution state
  const [weeklyProfitDialog, setWeeklyProfitDialog] = useState(false);

  // UI-only filters
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "blocked">("all");

  // Reactive daily simulation — recalculates at midnight so counts grow each day
  const [simulatedUsers, setSimulatedUsers] = useState(() => buildSimulatedUsers(new Date()));
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0, 0, 1, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const t = setTimeout(() => {
      setSimulatedUsers(buildSimulatedUsers(new Date()));
    }, msUntilMidnight);
    return () => clearTimeout(t);
  }, [simulatedUsers]);
  const appStoreInstalls = APP_INSTALLS_OFFSET + simulatedUsers.length;
  const totalUsers = TOTAL_USERS_OFFSET + simulatedUsers.length;
  const activeUsers = totalUsers - 3;
  const [depositSearch, setDepositSearch] = useState("");
  const [depositStatusFilter, setDepositStatusFilter] = useState<"all" | "pending" | "confirmed" | "rejected">("all");
  const [depositCurrencyFilter, setDepositCurrencyFilter] = useState<string>("all");
  
  // Config states
  const [newConfigKey, setNewConfigKey] = useState("");
  const [newConfigValue, setNewConfigValue] = useState("");
  const [newConfigCategory, setNewConfigCategory] = useState("wallet");
  const [newConfigDescription, setNewConfigDescription] = useState("");
  const [editingConfig, setEditingConfig] = useState<AppConfig | null>(null);
  const [editConfigValue, setEditConfigValue] = useState("");
  const [deleteConfigId, setDeleteConfigId] = useState<string | null>(null);

  // Estimates (UI settings)
  const [estimateInvestAprAnnual, setEstimateInvestAprAnnual] = useState("19");
  const [estimateMiningMultiplier, setEstimateMiningMultiplier] = useState("1");
  const [estimateSoloMultiplier, setEstimateSoloMultiplier] = useState("1");
  
  // Update app states
  const [forceUpdateEnabled, setForceUpdateEnabled] = useState(false);
  const [updateMinVersion, setUpdateMinVersion] = useState("");
  const [updateAndroidUrl, setUpdateAndroidUrl] = useState("");
  const [updateIosUrl, setUpdateIosUrl] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  
  // Article states
  const [articleTitle, setArticleTitle] = useState("");
  const [articleDescription, setArticleDescription] = useState("");
  const [articleCategory, setArticleCategory] = useState("Basics");
  const [articleIcon, setArticleIcon] = useState("");
  const [articleImage, setArticleImage] = useState("");
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  
  // User-specific estimates states
  const [userEstimatesSearch, setUserEstimatesSearch] = useState("");
  const [selectedUserEstimate, setSelectedUserEstimate] = useState<string | null>(null);
  const [userEstimateDialogOpen, setUserEstimateDialogOpen] = useState(false);
  const [userMiningMultiplier, setUserMiningMultiplier] = useState("1");
  const [userInvestApr, setUserInvestApr] = useState("19");
  const [userSoloMultiplier, setUserSoloMultiplier] = useState("1");
  
  // Solo mining states
  const [awardBlockDialogOpen, setAwardBlockDialogOpen] = useState(false);
  const [selectedSoloPurchase, setSelectedSoloPurchase] = useState<SoloMiningPurchase | null>(null);
  const [blockRewardAmount, setBlockRewardAmount] = useState("3.125");
  const [blockTxHash, setBlockTxHash] = useState("");

  // Stripe states
  const [stripeTestPublishable, setStripeTestPublishable] = useState("");
  const [stripeTestSecret, setStripeTestSecret] = useState("");
  const [stripeTestWebhook, setStripeTestWebhook] = useState("");
  const [stripeLivePublishable, setStripeLivePublishable] = useState("");
  const [stripeLiveSecret, setStripeLiveSecret] = useState("");
  const [stripeLiveWebhook, setStripeLiveWebhook] = useState("");
  const [stripeCurrency, setStripeCurrency] = useState("usd");
  const [stripeMinAmount, setStripeMinAmount] = useState("5");
  const [stripeMaxAmount, setStripeMaxAmount] = useState("10000");
  const [stripeSettingsLoaded, setStripeSettingsLoaded] = useState(false);

  // Invite code form state
  const [newCodeLabel, setNewCodeLabel] = useState("");
  const [newCodeCustom, setNewCodeCustom] = useState("");
  const [newCodeMaxUses, setNewCodeMaxUses] = useState("1");
  const [newCodeBatch, setNewCodeBatch] = useState("1");
  const [newCodeExpiry, setNewCodeExpiry] = useState("");
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const auth = sessionStorage.getItem("dbAdminAuth");
    if (auth === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("dbAdminAuth", "true");
      toast({ title: "Authenticated", description: "Welcome to admin panel." });
    } else {
      toast({ title: "Invalid Password", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("dbAdminAuth");
    toast({ title: "Logged out successfully" });
  };

  // Queries
  const { data: pendingDeposits = [] } = useQuery<DepositRequest[]>({
    queryKey: ["/api/admin/deposits/pending"],
    queryFn: adminQueryFn,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: allDeposits = [] } = useQuery<DepositRequest[]>({
    queryKey: ["/api/admin/deposits/all"],
    queryFn: adminQueryFn,
    enabled: isAuthenticated && activeNav === "deposits",
  });

  const { data: adminStats } = useQuery<{
    deposits: { pending: { amount: number; count: number }; confirmed: { amount: number; count: number }; rejected: { amount: number; count: number } };
    withdrawals: { pending: { amount: number; count: number }; completed: { amount: number; count: number }; rejected: { amount: number; count: number } };
  }>({
    queryKey: ["/api/admin/stats"],
    queryFn: adminQueryFn,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: pendingWithdrawals = [], isLoading: isLoadingWithdrawals } = useQuery<any[]>({
    queryKey: ["/api/admin/withdrawals/pending"],
    queryFn: adminQueryFn,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: autoWithdrawConfigs = [], isLoading: isLoadingAutoWithdraw } = useQuery<any[]>({
    queryKey: ["/api/admin/auto-withdrawals"],
    queryFn: adminQueryFn,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: adminQueryFn,
    enabled: isAuthenticated && (activeNav === "users" || activeNav === "user-estimates"),
    refetchInterval: 10000,
  });

  const { data: selectedUserBalances } = useQuery<UserBalancesResponse>({
    queryKey: ["/api/balances", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return { balances: [], pending: {} };
      const res = await adminFetch(`/api/balances/${selectedUserId}`);
      if (!res.ok) throw new Error("Failed to fetch balances");
      return res.json();
    },
    enabled: isAuthenticated && !!selectedUserId && userDetailsDialogOpen,
  });

  const { data: selectedUserPurchases } = useQuery<AdminUserPurchasesResponse>({
    queryKey: ["/api/admin/users", selectedUserId, "purchases"],
    queryFn: async () => {
      if (!selectedUserId) return { orders: [] };
      const res = await adminFetch(`/api/admin/users/${selectedUserId}/purchases`);
      if (!res.ok) throw new Error("Failed to fetch purchases");
      return res.json();
    },
    enabled: isAuthenticated && !!selectedUserId && userDetailsDialogOpen,
  });

  const selectedBalancesList = selectedUserBalances?.balances ?? [];
  const selectedOrders: AdminUserPurchasesResponse["orders"] = selectedUserPurchases?.orders ?? [];
  const selectedUser = selectedUserId ? users.find((u) => u.id === selectedUserId) : undefined;

  const activeMiningOrders = selectedOrders.filter(
    (o) => o.type === "mining_purchase" && o.details?.status === "active"
  );
  const activeEarnOrders = selectedOrders.filter(
    (o) => o.type === "earn_subscription" && o.details?.status === "active"
  );
  const totalSpent = selectedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  const { data: config = [] } = useQuery<AppConfig[]>({
    queryKey: ["/api/admin/config"],
    queryFn: adminQueryFn,
    enabled: isAuthenticated && (activeNav === "config" || activeNav === "estimates"),
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeNav !== "estimates") return;

    const getVal = (key: string, fallback: string) => {
      const row = config.find((c) => c.key === key);
      return row?.value ?? fallback;
    };

    setEstimateInvestAprAnnual(getVal("public_invest_apr_annual_percent", "19"));
    setEstimateMiningMultiplier(getVal("public_mining_estimate_multiplier", "1"));
    setEstimateSoloMultiplier(getVal("public_solo_estimate_multiplier", "1"));
  }, [activeNav, config, isAuthenticated]);

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    enabled: isAuthenticated && activeNav === "articles",
    select: (data: any) => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.articles)) return data.articles;
      return [];
    },
  });

  // Solo mining purchases query
  const { data: soloMiningPurchases = [] } = useQuery<SoloMiningPurchase[]>({
    queryKey: ["/api/admin/solo-mining-purchases"],
    queryFn: adminQueryFn,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const activeSoloPurchases = soloMiningPurchases.filter(p => p.status === "active");
  const totalSoloInvestment = activeSoloPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalSoloHashpower = activeSoloPurchases.reduce((sum, p) => sum + (p.hashrate || 0), 0);

  // All mining purchases (for Miners tab)
  const { data: allMiningPurchases = [], isLoading: isLoadingMiners, refetch: refetchMiners } = useQuery<any[]>({
    queryKey: ["/api/admin/all-mining-purchases"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/mining-purchases");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated && activeNav === "miners",
    refetchInterval: 30000,
  });

  // Invite codes queries
  const { data: inviteCodes = [], isLoading: isLoadingInviteCodes, refetch: refetchInviteCodes } = useQuery<any[]>({
    queryKey: ["/api/admin/invite-codes"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/invite-codes");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated && activeNav === "invite-codes",
    refetchInterval: 30000,
  });

  const { data: inviteRedemptions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/invite-codes/redemptions"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/invite-codes/redemptions");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated && activeNav === "invite-codes",
  });

  // Free miners query
  const { data: freeMiners = [], isLoading: isLoadingFreeMiners, refetch: refetchFreeMiners } = useQuery<any[]>({
    queryKey: ["/api/admin/free-miners"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/free-miners");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated && activeNav === "free-miners",
    refetchInterval: 30000,
  });

  // Stripe queries
  const { data: stripeSettings, isLoading: isLoadingStripe } = useQuery<any>({
    queryKey: ["/api/admin/stripe/settings"],
    queryFn: adminQueryFn,
    enabled: isAuthenticated && activeNav === "stripe",
  });

  const { data: stripePayments = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/stripe/payments"],
    queryFn: adminQueryFn,
    enabled: isAuthenticated && activeNav === "stripe",
    refetchInterval: 30000,
  });

  // Populate stripe form when settings load
  useEffect(() => {
    if (stripeSettings && !stripeSettingsLoaded) {
      setStripeTestPublishable(stripeSettings.testPublishableKey || "");
      setStripeTestSecret(stripeSettings.testSecretKey || "");
      setStripeTestWebhook(stripeSettings.testWebhookSecret || "");
      setStripeLivePublishable(stripeSettings.livePublishableKey || "");
      setStripeLiveSecret(stripeSettings.liveSecretKey || "");
      setStripeLiveWebhook(stripeSettings.liveWebhookSecret || "");
      setStripeCurrency(stripeSettings.currency || "usd");
      setStripeMinAmount(String(stripeSettings.minPaymentAmount ?? "5"));
      setStripeMaxAmount(String(stripeSettings.maxPaymentAmount ?? "10000"));
      setStripeSettingsLoaded(true);
    }
  }, [stripeSettings, stripeSettingsLoaded]);

  // Mutations
  const confirmDeposit = useMutation({
    mutationFn: async (depositId: string) =>
      adminFetch(`/api/admin/deposits/${depositId}/confirm`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits/all"] });
      toast({ title: "Deposit Confirmed", description: "User balance has been credited" });
      setConfirmDialogOpen(false);
      setSelectedDeposit(null);
    },
  });

  const rejectDeposit = useMutation({
    mutationFn: async ({ depositId, reason }: { depositId: string; reason: string }) =>
      adminFetch(`/api/admin/deposits/${depositId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits/all"] });
      toast({ title: "Deposit Rejected", variant: "destructive" });
      setRejectDialogOpen(false);
      setSelectedDeposit(null);
      setRejectionReason("");
    },
  });

  // Award block to solo miner mutation
  const awardBlockMutation = useMutation({
    mutationFn: async ({ purchaseId, blockReward, txHash }: { purchaseId: string; blockReward: number; txHash?: string }) => {
      const res = await adminFetch(`/api/admin/solo-mining/${purchaseId}/award-block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockReward, txHash }),
      });
      if (!res.ok) throw new Error("Failed to award block");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/solo-mining-purchases"] });
      toast({ 
        title: "🎉 Block Awarded!", 
        description: data.message,
      });
      setAwardBlockDialogOpen(false);
      setSelectedSoloPurchase(null);
      setBlockRewardAmount("3.125");
      setBlockTxHash("");
    },
    onError: (error) => {
      toast({ 
        title: "Failed to Award Block", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const broadcastNotification = useMutation({
    mutationFn: async (data: { title: string; message: string }) =>
      adminFetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: (data) => {
      toast({ title: "Broadcast Sent", description: `Notified ${data.count} users` });
      setBroadcastTitle("");
      setBroadcastMessage("");
    },
  });

  const processWithdrawal = useMutation({
    mutationFn: async ({ id, action, txHash, note }: { id: string; action: "approve" | "reject"; txHash?: string; note?: string }) => {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const adminId = user?.dbId || user?.id || user?.uid;

      const res = await adminFetch(`/api/admin/withdrawals/${id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, action, txHash, note }),
      });
      if (!res.ok) throw new Error("Failed to process withdrawal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals/pending"] });
      toast({ title: "Withdrawal Processed" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Process Failed", 
        description: error.message || "Failed to process withdrawal",
        variant: "destructive" 
      });
    },
  });

  const handleProcessWithdrawal = (id: string, action: "approve" | "reject") => {
    if (action === "approve") {
      const txHash = prompt("Enter transaction hash or tracking number (optional):");
      processWithdrawal.mutate({ id, action, txHash: txHash || undefined });
    } else {
      const note = prompt("Enter rejection reason (optional):");
      processWithdrawal.mutate({ id, action, note: note || undefined });
    }
  };

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminFetch(`/api/admin/users/${userId}/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated" });
    },
  });

  const adjustBalance = useMutation({
    mutationFn: async (data: { userId: string; symbol: string; amount: number; type: string; reason: string }) =>
      adminFetch(`/api/admin/users/${data.userId}/adjust-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balances", variables.userId] });
      toast({ title: "Balance adjusted successfully" });
    },
  });

  const disable2FA = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const res = await adminFetch(`/api/admin/users/${userId}/disable-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to disable 2FA");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "2FA Disabled", description: "Two-factor authentication has been disabled for this user" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const terminateMiningPurchase = useMutation({
    mutationFn: async ({ purchaseId, reason }: { purchaseId: string; reason?: string }) => {
      const res = await adminFetch(`/api/admin/mining-purchases/${purchaseId}/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to terminate purchase");
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUserId, "purchases"] });
      toast({ title: "Purchase terminated" });

      setTerminateDialogOpen(false);
      setTerminatePurchaseId(null);
      setTerminateReasonPreset("expired");
      setTerminateCustomMessage("");
    },
    onError: (error: any) => {
      toast({ title: "Terminate failed", description: error?.message || "Could not terminate purchase", variant: "destructive" });
    },
  });

  const openTerminateDialog = (purchaseId: string) => {
    setTerminatePurchaseId(purchaseId);
    setTerminateReasonPreset("expired");
    setTerminateCustomMessage("");
    setTerminateDialogOpen(true);
  };

  const computedTerminateReason =
    terminateReasonPreset === "expired"
      ? "Expired"
      : terminateReasonPreset === "out_of_stock"
        ? "Out of stock"
        : terminateCustomMessage.trim();

  // Toggle pause/activate a miner
  const toggleFreeMinerStatus = useMutation({
    mutationFn: async ({ rewardId, reason }: { rewardId: string; reason?: string }) => {
      const res = await adminFetch(`/api/admin/free-miners/${rewardId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/free-miners"] });
      toast({ title: data.newStatus === "active" ? "Free miner activated" : "Free miner paused" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteInviteCode = useMutation({
    mutationFn: async (codeId: string) => {
      const res = await adminFetch(`/api/admin/invite-codes/${codeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invite-codes"] });
      toast({ title: "Invite code deleted" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const toggleInviteCode = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await adminFetch(`/api/admin/invite-codes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invite-codes"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  // Toggle pause/activate a miner
  const toggleMinerStatus = useMutation({    mutationFn: async ({ purchaseId, action }: { purchaseId: string; action: "pause" | "activate" }) => {
      const res = await adminFetch(`/api/admin/mining-purchases/${purchaseId}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed");
      return data;
    },
    onSuccess: (_data, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUserId, "purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-mining-purchases"] });
      toast({ title: action === "pause" ? "Miner paused" : "Miner activated" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  // Gift a miner to a user
  const giftMiner = useMutation({
    mutationFn: async (body: object) => {
      const res = await adminFetch(`/api/admin/users/${giftMinerId}/gift-miner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to gift miner");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUserId, "purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-mining-purchases"] });
      toast({ title: "🎁 Miner gifted!", description: "Mining purchase added to user wallet" });
      setGiftMinerDialogOpen(false);
    },
    onError: (e: any) => toast({ title: "Gift failed", description: e.message, variant: "destructive" }),
  });

  // Distribute weekly profit manually
  const distributeWeeklyProfit = useMutation({
    mutationFn: async () => {
      const res = await adminFetch("/api/admin/mining-purchases/distribute-weekly-profit", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "✅ Weekly profit distributed", description: `Paid ${data.userCount} users` });
      setWeeklyProfitDialog(false);
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const addConfig = useMutation({
    mutationFn: async (data: { key: string; value: string; category: string; description: string }) =>
      adminFetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Configuration added" });
      setNewConfigKey("");
      setNewConfigValue("");
      setNewConfigDescription("");
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) =>
      adminFetch(`/api/admin/config/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Configuration updated" });
      setEditingConfig(null);
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) =>
      adminFetch(`/api/admin/config/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Configuration deleted" });
      setDeleteConfigId(null);
    },
  });

  const createArticle = useMutation({
    mutationFn: async (data: { title: string; description: string; category?: string; icon?: string; image?: string; order: number }) =>
      adminFetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isActive: true }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article created successfully" });
      setArticleTitle("");
      setArticleDescription("");
      setArticleCategory("Basics");
      setArticleIcon("");
      setArticleImage("");
    },
  });

  const updateArticle = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string; category?: string; icon?: string; image?: string; order: number }) =>
      adminFetch(`/api/admin/articles/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article updated successfully" });
      setEditingArticle(null);
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) =>
      adminFetch(`/api/admin/articles/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article deleted" });
      setDeleteArticleId(null);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">Admin Panel</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Enter password to continue</p>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="h-12"
              />
              <Button onClick={handleLogin} className="w-full h-12">
                <Shield className="w-4 h-4 mr-2" />
                Authenticate
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: "users" as NavItem, icon: Users, label: "Users" },
    { id: "deposits" as NavItem, icon: ArrowDownToLine, label: "Deposits", badge: pendingDeposits.length },
    { id: "withdrawals" as NavItem, icon: ArrowUpToLine, label: "Withdrawals" },
    { id: "auto-withdrawals" as NavItem, icon: Wallet, label: "Auto-Withdrawals", badge: autoWithdrawConfigs.filter((c: any) => c.enabled).length },
    { id: "solo-mining" as NavItem, icon: Target, label: "Solo Mining", badge: activeSoloPurchases.length },
    { id: "miners" as NavItem, icon: Cpu, label: "Miners" },
    { id: "invite-codes" as NavItem, icon: Key, label: "Invite Codes" },
    { id: "free-miners" as NavItem, icon: Gift, label: "Free Miners" },
    { id: "notifications" as NavItem, icon: Bell, label: "Notifications" },
  ];

  const settingsItems = [
    { id: "stripe" as NavItem, icon: CreditCard, label: "Stripe Payments" },
    { id: "articles" as NavItem, icon: FileText, label: "Articles" },
    { id: "update-app" as NavItem, icon: Smartphone, label: "Update App" },
    { id: "estimates" as NavItem, icon: TrendingUp, label: "Global Estimates" },
    { id: "user-estimates" as NavItem, icon: Users, label: "User Estimates" },
    { id: "config" as NavItem, icon: Sliders, label: "Config" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Hamburger Sidebar Drawer (all screen sizes) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-card border-r border-border z-50 flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Admin Panel</h2>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveNav(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeNav === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium truncate">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge className="ml-auto bg-amber-500 flex-shrink-0">{item.badge}</Badge>
                    )}
                  </button>
                ))}

                <div className="pt-4 mt-4 border-t border-border">
                  <p className="px-4 text-xs font-semibold text-muted-foreground mb-2">SETTINGS</p>
                  {settingsItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveNav(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeNav === item.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </nav>

              <div className="p-4 border-t border-border">
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Header (all sizes) */}
        <div className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b border-border px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button size="icon" variant="ghost" className="flex-shrink-0" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-base sm:text-lg font-bold capitalize truncate">{activeNav.replace("-", " ")}</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                queryClient.invalidateQueries();
                toast({ title: "Refreshing…" });
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={handleLogout} variant="outline" size="icon">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNav}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Users Tab */}
              {activeNav === "users" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1">User Management</h2>
                    <p className="text-sm text-muted-foreground">Manage all registered users</p>
                  </div>

                  {/* Stats Cards */}
                  <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-wrap gap-x-10 gap-y-2">
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold">743</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Active</p>
                        <p className="text-xl font-bold text-green-500">740</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Blocked</p>
                        <p className="text-xl font-bold text-red-500">3</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Avg. Session</p>
                        <p className="text-xl font-bold text-blue-400">1m 50s</p>
                        <p className="text-xs text-muted-foreground">per user / day</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">App Store Installs</p>
                        <p className="text-xl font-bold text-purple-400">{appStoreInstalls.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="bg-card rounded-xl border border-border p-3 sm:p-4 space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Search users</Label>
                      <Input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by email or name…"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status Filter</Label>
                      <Select value={userStatusFilter} onValueChange={(v) => setUserStatusFilter(v as any)}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="active">Active Only</SelectItem>
                          <SelectItem value="blocked">Blocked Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Users List - Card Layout */}
                  <div className="space-y-3">
                    {users
                      .filter((u) => {
                        const q = userSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          u.email.toLowerCase().includes(q) ||
                          (u.displayName || "").toLowerCase().includes(q)
                        );
                      })
                      .filter((u) => {
                        if (userStatusFilter === "all") return true;
                        if (userStatusFilter === "active") return !!u.isActive;
                        return !u.isActive;
                      })
                      .map((user) => (
                      <div key={user.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                        {/* User Info Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm break-all">{user.email}</p>
                            <p className="text-xs text-muted-foreground">{user.displayName || "No display name"}</p>
                          </div>
                          <Badge variant={user.isActive ? "default" : "destructive"} className="flex-shrink-0">
                            {user.isActive ? "Active" : "Blocked"}
                          </Badge>
                        </div>
                        
                        {/* 2FA Status */}
                        {user.twoFactorEnabled && (
                          <div className="flex items-center gap-2 text-xs text-green-500">
                            <Shield className="w-3 h-3" />
                            <span>2FA Enabled</span>
                          </div>
                        )}
                        
                        {/* Action Buttons - Stacked */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setUserDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              toggleUserStatus.mutate({ userId: user.id, isActive: !user.isActive });
                            }}
                          >
                            {user.isActive ? "Block" : "Unblock"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const symbol = prompt("Enter currency (BTC, USDT, ETH, etc.):");
                              if (!symbol) return;
                              const amount = prompt("Enter amount to add:");
                              if (!amount) return;
                              const reason = prompt("Enter reason:") || "Admin adjustment";
                              adjustBalance.mutate({
                                userId: user.id,
                                symbol,
                                amount: parseFloat(amount),
                                type: "add",
                                reason,
                              });
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Bal
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const symbol = prompt("Enter currency (BTC, USDT, ETH, etc.):");
                              if (!symbol) return;
                              const amount = prompt("Enter amount to deduct:");
                              if (!amount) return;
                              const reason = prompt("Enter reason:") || "Admin adjustment";
                              adjustBalance.mutate({
                                userId: user.id,
                                symbol,
                                amount: parseFloat(amount),
                                type: "deduct",
                                reason,
                              });
                            }}
                          >
                            Deduct Bal
                          </Button>
                        </div>
                        
                        {/* 2FA Disable Button */}
                        {user.twoFactorEnabled && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-red-500 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => {
                              if (confirm(`Disable 2FA for ${user.email}?`)) {
                                disable2FA.mutate({ userId: user.id });
                              }
                            }}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            Disable 2FA
                          </Button>
                        )}
                      </div>
                    ))}
                    {/* Daily simulated users */}
                    {simulatedUsers
                      .filter((u: any) => {
                        const q = userSearch.trim().toLowerCase();
                        if (!q) return true;
                        return u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q);
                      })
                      .filter((u: any) => {
                        if (userStatusFilter === "all") return true;
                        if (userStatusFilter === "active") return u.isActive;
                        return !u.isActive;
                      })
                      .map((fakeUser: any) => (
                      <div key={fakeUser.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm break-all">{fakeUser.email}</p>
                            <p className="text-xs text-muted-foreground">{fakeUser.displayName}</p>
                          </div>
                          <Badge variant="default" className="flex-shrink-0">Active</Badge>
                        </div>
                        {fakeUser.twoFactorEnabled && (
                          <div className="flex items-center gap-2 text-xs text-green-500">
                            <Shield className="w-3 h-3" />
                            <span>2FA Enabled</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" variant="outline" className="w-full" disabled><Eye className="w-3 h-3 mr-1" />View</Button>
                          <Button size="sm" variant="outline" className="w-full" disabled>Block</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deposits Tab */}
              {activeNav === "deposits" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1">Deposit Management</h2>
                    <p className="text-sm text-muted-foreground">Review and approve deposit requests</p>
                  </div>

                  {/* Stats */}
                  <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-wrap gap-x-10 gap-y-3">
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="text-xl font-bold text-amber-500">{adminStats?.deposits.pending.count || 0}</p>
                        <p className="text-xs text-muted-foreground">${(adminStats?.deposits.pending.amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Confirmed</p>
                        <p className="text-xl font-bold text-green-500">4</p>
                        <p className="text-xs text-green-400">$190</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Rejected</p>
                        <p className="text-xl font-bold text-red-500">{adminStats?.deposits.rejected.count || 0}</p>
                        <p className="text-xs text-red-400">${(adminStats?.deposits.rejected.amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Tickets</p>
                        <p className="text-xl font-bold">27</p>
                      </div>
                    </div>
                  </div>

                  {/* Solo Mining Quick Summary */}
                  <div 
                    className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-3 sm:p-4 cursor-pointer hover:border-yellow-500/50 transition-colors"
                    onClick={() => setActiveNav("solo-mining")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-yellow-500 text-sm">Solo Mining</p>
                        <p className="text-xs text-muted-foreground">
                          0 active • 0.00 PH/s
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$0</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="bg-card rounded-xl border border-border p-3 sm:p-4 space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Search</Label>
                      <Input
                        value={depositSearch}
                        onChange={(e) => setDepositSearch(e.target.value)}
                        placeholder="Search by email, currency…"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <Select value={depositStatusFilter} onValueChange={(v) => setDepositStatusFilter(v as any)}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Currency</Label>
                        <Select value={depositCurrencyFilter} onValueChange={setDepositCurrencyFilter}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="USDT">USDT</SelectItem>
                            <SelectItem value="BTC">BTC</SelectItem>
                            <SelectItem value="ETH">ETH</SelectItem>
                            <SelectItem value="LTC">LTC</SelectItem>
                            <SelectItem value="USDC">USDC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setDepositSearch("");
                        setDepositStatusFilter("all");
                        setDepositCurrencyFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>

                  {/* Pending Deposits */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold">Pending Deposits</h3>
                      <Badge variant="secondary">{pendingDeposits.length}</Badge>
                    </div>

                    {pendingDeposits
                      .filter((d) => {
                        const q = depositSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (d.userEmail || "").toLowerCase().includes(q) ||
                          (d.currency || "").toLowerCase().includes(q) ||
                          (d.network || "").toLowerCase().includes(q)
                        );
                      })
                      .filter((d) => {
                        if (depositCurrencyFilter === "all") return true;
                        return (d.currency || "").toUpperCase() === depositCurrencyFilter;
                      }).length === 0 ? (
                      <div className="bg-card rounded-xl border border-border p-6 text-center">
                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-muted-foreground">No pending deposits</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingDeposits
                          .filter((d) => {
                            const q = depositSearch.trim().toLowerCase();
                            if (!q) return true;
                            return (
                              (d.userEmail || "").toLowerCase().includes(q) ||
                              (d.currency || "").toLowerCase().includes(q) ||
                              (d.network || "").toLowerCase().includes(q)
                            );
                          })
                          .filter((d) => {
                            if (depositCurrencyFilter === "all") return true;
                            return (d.currency || "").toUpperCase() === depositCurrencyFilter;
                          })
                          .map((deposit) => (
                          <div key={deposit.id} className="bg-card rounded-xl border border-amber-500/30 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm break-all">{deposit.userEmail || "Unknown"}</p>
                                {deposit.userDisplayName && (
                                  <p className="text-xs text-muted-foreground">{deposit.userDisplayName}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="flex-shrink-0">{deposit.network}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Amount</p>
                                <p className="font-bold">{deposit.amount} {deposit.currency}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Date</p>
                                <p className="text-sm">{new Date(deposit.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setSelectedDeposit(deposit);
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full"
                                onClick={() => {
                                  setSelectedDeposit(deposit);
                                  setRejectDialogOpen(true);
                                }}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Deposits */}
                  <div>
                    <h3 className="font-semibold mb-3">Recent Deposits</h3>
                    <div className="space-y-2">
                      {allDeposits
                        .slice(0, 20)
                        .filter((d) => {
                          const q = depositSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            (d.userEmail || "").toLowerCase().includes(q) ||
                            (d.currency || "").toLowerCase().includes(q) ||
                            (d.network || "").toLowerCase().includes(q) ||
                            (d.status || "").toLowerCase().includes(q)
                          );
                        })
                        .filter((d) => {
                          if (depositCurrencyFilter === "all") return true;
                          return (d.currency || "").toUpperCase() === depositCurrencyFilter;
                        })
                        .filter((d) => {
                          if (depositStatusFilter === "all") return true;
                          return (d.status || "").toLowerCase() === depositStatusFilter;
                        })
                        .map((deposit) => (
                        <div key={deposit.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{deposit.userEmail || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {deposit.amount} {deposit.currency} • {new Date(deposit.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              deposit.status === "confirmed" ? "default" :
                              deposit.status === "rejected" ? "destructive" : "secondary"
                            }
                            className="flex-shrink-0"
                          >
                            {deposit.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Withdrawals Tab */}
              {activeNav === "withdrawals" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1">Withdrawal Management</h2>
                    <p className="text-sm text-muted-foreground">Review and process withdrawal requests</p>
                  </div>

                  {/* Stats */}
                  <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-wrap gap-x-10 gap-y-3">
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="text-xl font-bold text-amber-500">{adminStats?.withdrawals.pending.count || 0}</p>
                        <p className="text-xs text-muted-foreground">${(adminStats?.withdrawals.pending.amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-xl font-bold text-green-500">{adminStats?.withdrawals.completed.count || 0}</p>
                        <p className="text-xs text-green-400">${(adminStats?.withdrawals.completed.amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Rejected</p>
                        <p className="text-xl font-bold text-red-500">{adminStats?.withdrawals.rejected.count || 0}</p>
                        <p className="text-xs text-red-400">${(adminStats?.withdrawals.rejected.amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Queue</p>
                        <p className="text-xl font-bold">{pendingWithdrawals.length}</p>
                      </div>
                    </div>
                  </div>

                  {isLoadingWithdrawals ? (
                    <div className="bg-card rounded-xl border border-border p-6 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  ) : pendingWithdrawals && pendingWithdrawals.length > 0 ? (
                    <div className="space-y-3">
                      {pendingWithdrawals.map((withdrawal: any) => (
                        <div key={withdrawal.id} className="bg-card rounded-xl border border-amber-500/30 p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">User ID</p>
                              <p className="text-sm font-medium break-all">{withdrawal.userId}</p>
                            </div>
                            <Badge variant={
                              withdrawal.status === "completed" ? "default" :
                              withdrawal.status === "pending" ? "secondary" : "destructive"
                            }>
                              {withdrawal.status}
                            </Badge>
                          </div>
                          
                          {/* Amount Info */}
                          <div className="grid grid-cols-3 gap-2 text-center bg-muted/30 rounded-lg p-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Amount</p>
                              <p className="font-mono font-bold text-sm">{withdrawal.amount}</p>
                              <p className="text-xs">{withdrawal.symbol}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Fee</p>
                              <p className="font-mono text-sm">{withdrawal.fee}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Net</p>
                              <p className="font-mono font-bold text-sm text-green-500">{withdrawal.netAmount}</p>
                            </div>
                          </div>
                          
                          {/* Details */}
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Network</p>
                              <Badge variant="outline">{withdrawal.network}</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Address</p>
                              <p className="font-mono text-xs break-all text-muted-foreground">{withdrawal.toAddress}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="text-sm">{new Date(withdrawal.requestedAt).toLocaleString()}</p>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          {withdrawal.status === "pending" && (
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleProcessWithdrawal(withdrawal.id, "approve")}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full"
                                onClick={() => handleProcessWithdrawal(withdrawal.id, "reject")}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card rounded-xl border border-border p-6 text-center">
                      <ArrowUpToLine className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm text-muted-foreground">No withdrawal requests</p>
                    </div>
                  )}
                </div>
              )}

              {/* Auto-Withdrawals Tab */}
              {activeNav === "auto-withdrawals" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Auto-Withdrawal Configurations</h2>
                      <p className="text-muted-foreground">View and manage user auto-withdrawal settings</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/auto-withdrawals"] })}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  {/* Stats Cards */}
                  <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-wrap gap-x-10 gap-y-2">
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold">{autoWithdrawConfigs.length}</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Active</p>
                        <p className="text-xl font-bold text-green-400">{autoWithdrawConfigs.filter((c: any) => c.enabled).length}</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Disabled</p>
                        <p className="text-xl font-bold text-muted-foreground">{autoWithdrawConfigs.filter((c: any) => !c.enabled).length}</p>
                      </div>
                    </div>
                  </div>

                  {isLoadingAutoWithdraw ? (
                    <div className="bg-card rounded-xl border border-border p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                      <p className="text-muted-foreground">Loading auto-withdrawal configs...</p>
                    </div>
                  ) : autoWithdrawConfigs && autoWithdrawConfigs.length > 0 ? (
                    <div className="space-y-3">
                      {autoWithdrawConfigs.map((config: any) => (
                        <div key={config.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                          {/* User & Status */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{config.userDisplayName || "—"}</p>
                              <p className="text-xs text-muted-foreground truncate">{config.userEmail || config.userId.slice(0, 8)}</p>
                            </div>
                            <Badge className={config.enabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                              {config.enabled ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                          
                          {/* Currency & Network */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Currency</p>
                              <p className="font-medium text-sm">{config.currency}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Network</p>
                              <p className="text-sm">{config.network}</p>
                            </div>
                          </div>
                          
                          {/* Wallet Address */}
                          <div>
                            <p className="text-xs text-muted-foreground">Wallet Address</p>
                            <p className="text-xs font-mono break-all text-muted-foreground mt-1">
                              {config.walletAddress || "—"}
                            </p>
                          </div>
                          
                          {/* Period, Min Amount, Last Withdrawal */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Period</p>
                              <Badge variant="outline" className="mt-1">
                                {config.period === "weekly" ? "Weekly" : "Monthly"}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Min Amount</p>
                              <p className="font-mono text-sm">${config.minAmount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Last</p>
                              <p className="text-xs">
                                {config.lastWithdrawAt 
                                  ? new Date(config.lastWithdrawAt).toLocaleDateString()
                                  : "Never"
                                }
                              </p>
                            </div>
                          </div>
                          
                          {/* Action Button */}
                          <Button
                            size="sm"
                            className="w-full"
                            variant={config.enabled ? "destructive" : "default"}
                            onClick={async () => {
                              try {
                                await adminFetch(`/api/admin/auto-withdrawals/${config.id}/toggle`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ enabled: !config.enabled })
                                });
                                queryClient.invalidateQueries({ queryKey: ["/api/admin/auto-withdrawals"] });
                                toast({
                                  title: config.enabled ? "Disabled" : "Enabled",
                                  description: `Auto-withdrawal ${config.enabled ? "disabled" : "enabled"} for user.`,
                                });
                              } catch (error) {
                                toast({ title: "Error", description: "Failed to toggle", variant: "destructive" });
                              }
                            }}
                          >
                            {config.enabled ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card rounded-xl border border-border p-8 text-center">
                      <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-muted-foreground">No auto-withdrawal configurations yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Users can set up auto-withdrawal in their Settings</p>
                    </div>
                  )}
                </div>
              )}

              {/* Solo Mining Tab */}
              {activeNav === "solo-mining" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Solo Mining Management</h2>
                    <p className="text-muted-foreground">Manage solo mining contracts and award block rewards</p>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-wrap gap-x-10 gap-y-2">
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Active Contracts</p>
                        <p className="text-xl font-bold text-primary">{activeSoloPurchases.length}</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Total Hashpower</p>
                        <p className="text-xl font-bold">{totalSoloHashpower} PH/s</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Total Investment</p>
                        <p className="text-xl font-bold">${totalSoloInvestment.toLocaleString()}</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Block Reward</p>
                        <p className="text-xl font-bold text-amber-500">3.125 BTC</p>
                      </div>
                    </div>
                  </div>

                  {soloMiningPurchases.length > 0 ? (
                    <div className="space-y-3">
                      {soloMiningPurchases.map((purchase) => (
                        <div key={purchase.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                          {/* User & Status */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{purchase.userDisplayName || "—"}</p>
                              <p className="text-xs text-muted-foreground truncate">{purchase.userEmail || purchase.userId.slice(0, 8)}</p>
                            </div>
                            <Badge className={purchase.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                              {purchase.status}
                            </Badge>
                          </div>
                          
                          {/* Package & Hashpower */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Package</p>
                              <p className="text-sm">{purchase.packageName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Hashpower</p>
                              <p className="font-medium text-sm">{purchase.hashrate} {purchase.hashrateUnit}</p>
                            </div>
                          </div>
                          
                          {/* Investment, Earned, Expires */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Investment</p>
                              <p className="text-sm font-medium">${purchase.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Earned</p>
                              <p className="text-sm font-medium text-amber-500">
                                {purchase.totalEarned > 0 ? `₿${purchase.totalEarned.toFixed(4)}` : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Expires</p>
                              <p className="text-xs">
                                {purchase.expiryDate ? new Date(purchase.expiryDate).toLocaleDateString() : "—"}
                              </p>
                            </div>
                          </div>
                          
                          {/* Award Block Button */}
                          {purchase.status === "active" && (
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
                              onClick={() => {
                                setSelectedSoloPurchase(purchase);
                                setAwardBlockDialogOpen(true);
                              }}
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Award Block
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card rounded-xl border border-border p-8 text-center">
                      <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-muted-foreground">No solo mining contracts yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Miners Tab */}
              {activeNav === "miners" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Miners Management</h2>
                      <p className="text-muted-foreground">All mining purchases across all users</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setWeeklyProfitDialog(true)}
                      className="gap-1"
                    >
                      <DollarSign className="w-4 h-4" /> Distribute Weekly Profit
                    </Button>
                  </div>

                  {isLoadingMiners ? (
                    <div className="text-center py-8 text-muted-foreground">Loading miners...</div>
                  ) : allMiningPurchases.length === 0 ? (
                    <div className="bg-card rounded-xl border border-border p-8 text-center">
                      <Cpu className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-muted-foreground">No mining purchases yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allMiningPurchases.map((p: any) => (
                        <div key={p.id} className="bg-card rounded-xl border border-border p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{p.userDisplayName || "—"}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.userEmail || p.userId?.slice(0, 8)}</p>
                            </div>
                            <Badge className={p.status === "active" ? "bg-green-500/20 text-green-400 shrink-0" : p.status === "paused" ? "bg-yellow-500/20 text-yellow-400 shrink-0" : "bg-gray-500/20 text-gray-400 shrink-0"}>
                              {p.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Package</p>
                              <p className="text-sm">{p.packageName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Hashrate</p>
                              <p className="text-sm font-medium">{p.hashrate} {p.hashrateUnit}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Expires</p>
                              <p className="text-xs">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Earned</p>
                              <p className="text-xs text-amber-500">{p.totalEarned > 0 ? `₿${Number(p.totalEarned).toFixed(6)}` : "—"}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {p.status === "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={toggleMinerStatus.isPending}
                                onClick={() => toggleMinerStatus.mutate({ purchaseId: p.id, action: "pause" })}
                              >
                                <Pause className="w-3 h-3 mr-1" /> Pause
                              </Button>
                            )}
                            {p.status === "paused" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={toggleMinerStatus.isPending}
                                onClick={() => toggleMinerStatus.mutate({ purchaseId: p.id, action: "activate" })}
                              >
                                <Play className="w-3 h-3 mr-1" /> Activate
                              </Button>
                            )}
                            {(p.status === "active" || p.status === "paused") && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={terminateMiningPurchase.isPending}
                                onClick={() => openTerminateDialog(p.id)}
                              >
                                Terminate
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Invite Codes Tab */}
              {activeNav === "invite-codes" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Invite Codes</h2>
                    <p className="text-muted-foreground text-sm">Generate codes — users redeem them to unlock their free starter miner</p>
                  </div>

                  {/* Create codes */}
                  <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><Key className="w-4 h-4 text-primary" /> Generate Codes</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">Label (optional)</Label>
                        <Input value={newCodeLabel} onChange={e => setNewCodeLabel(e.target.value)} placeholder="X Giveaway April 2026" className="h-9 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Custom Code (optional)</Label>
                        <Input value={newCodeCustom} onChange={e => setNewCodeCustom(e.target.value.toUpperCase())} placeholder="e.g. BLOCK-VIP" className="h-9 text-sm font-mono" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Max Uses per Code</Label>
                        <Input type="number" min={1} value={newCodeMaxUses} onChange={e => setNewCodeMaxUses(e.target.value)} className="h-9 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Batch Count</Label>
                        <Input type="number" min={1} max={500} value={newCodeBatch} onChange={e => setNewCodeBatch(e.target.value)} className="h-9 text-sm" placeholder="1" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs mb-1 block">Expiry Date (optional)</Label>
                        <Input type="date" value={newCodeExpiry} onChange={e => setNewCodeExpiry(e.target.value)} className="h-9 text-sm" />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      disabled={isCreatingCode}
                      onClick={async () => {
                        setIsCreatingCode(true);
                        try {
                          const batch = parseInt(newCodeBatch) || 1;
                          const res = await adminFetch("/api/admin/invite-codes", {
                            method: "POST",
                            body: JSON.stringify({
                              code: newCodeCustom || undefined,
                              label: newCodeLabel || undefined,
                              maxUses: parseInt(newCodeMaxUses) || 1,
                              batch: batch > 1 ? batch : undefined,
                              validUntil: newCodeExpiry || undefined,
                            }),
                          });
                          if (!res.ok) throw new Error((await res.json()).error);
                          const result = await res.json();
                          queryClient.invalidateQueries({ queryKey: ["/api/admin/invite-codes"] });
                          toast({ title: `${Array.isArray(result) ? result.length : 1} code(s) created`, description: Array.isArray(result) ? result.map((c: any) => c.code).join(", ") : result.code });
                          setNewCodeLabel(""); setNewCodeCustom(""); setNewCodeBatch("1"); setNewCodeExpiry("");
                        } catch (e: any) {
                          toast({ title: "Error", description: e.message, variant: "destructive" });
                        } finally {
                          setIsCreatingCode(false);
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {parseInt(newCodeBatch) > 1 ? `Generate ${newCodeBatch} Codes` : "Create Code"}
                    </Button>
                  </div>

                  {/* Code list */}
                  {isLoadingInviteCodes ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
                  ) : inviteCodes.length === 0 ? (
                    <div className="bg-card rounded-xl border border-border p-8 text-center">
                      <Key className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-muted-foreground">No invite codes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">{inviteCodes.length} codes • {inviteCodes.filter((c: any) => c.isActive).length} active</p>
                      {inviteCodes.map((c: any) => (
                        <div key={c.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono font-bold text-primary text-sm">{c.code}</p>
                            {c.label && <p className="text-xs text-muted-foreground">{c.label}</p>}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {c.usedCount}/{c.maxUses} uses
                              {c.validUntil && ` · expires ${new Date(c.validUntil).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={c.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}>
                              {c.isActive ? "Active" : "Off"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => toggleInviteCode.mutate({ id: c.id, isActive: !c.isActive })}
                            >
                              {c.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => deleteInviteCode.mutate(c.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Redemptions */}
                  {inviteRedemptions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Recent Redemptions ({inviteRedemptions.length})</h3>
                      <div className="space-y-2">
                        {inviteRedemptions.slice(0, 20).map((r: any) => (
                          <div key={r.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{r.userDisplayName || r.userEmail || r.userId?.slice(0,8)}</p>
                              <p className="text-xs text-muted-foreground">{r.userEmail}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-mono text-xs text-primary">{r.code}</p>
                              <p className="text-xs text-muted-foreground">{new Date(r.redeemedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Free Miners Tab */}
              {activeNav === "free-miners" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Free Miners</h2>
                    <p className="text-muted-foreground text-sm">All starter miners granted via invite codes</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card rounded-xl border border-border p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{freeMiners.filter((m: any) => m.status === "active").length}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-4 text-center">
                      <p className="text-2xl font-bold text-red-400">{freeMiners.filter((m: any) => m.status === "revoked").length}</p>
                      <p className="text-xs text-muted-foreground">Revoked</p>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-4 text-center">
                      <p className="text-2xl font-bold">{freeMiners.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>

                  {isLoadingFreeMiners ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
                  ) : freeMiners.length === 0 ? (
                    <div className="bg-card rounded-xl border border-border p-8 text-center">
                      <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-muted-foreground">No free miners claimed yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {freeMiners.map((m: any) => (
                        <div key={m.rewardId} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{m.userDisplayName || "—"}</p>
                              <p className="text-xs text-muted-foreground truncate">{m.userEmail || m.userId?.slice(0,8)}</p>
                              {m.inviteCode && (
                                <p className="text-xs mt-1">
                                  <span className="font-mono text-primary">{m.inviteCode}</span>
                                  {m.inviteLabel && <span className="text-muted-foreground ml-1">· {m.inviteLabel}</span>}
                                </p>
                              )}
                            </div>
                            <Badge className={m.status === "active" ? "bg-emerald-500/20 text-emerald-400 shrink-0" : m.status === "expired" ? "bg-yellow-500/20 text-yellow-400 shrink-0" : "bg-red-500/20 text-red-400 shrink-0"}>
                              {m.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <p className="text-muted-foreground">Hashrate</p>
                              <p className="font-semibold">{m.hashrate} {m.hashrateUnit}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Expires</p>
                              <p>{m.expiresAt ? new Date(m.expiresAt).toLocaleDateString() : "—"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Earned</p>
                              <p className="text-amber-500">{m.totalEarned > 0 ? `₿${Number(m.totalEarned).toFixed(6)}` : "—"}</p>
                            </div>
                          </div>
                          {(m.status === "active" || m.status === "revoked") && (
                            <Button
                              size="sm"
                              variant={m.status === "active" ? "outline" : "default"}
                              className="w-full h-8 text-xs"
                              disabled={toggleFreeMinerStatus.isPending}
                              onClick={() => toggleFreeMinerStatus.mutate({ rewardId: m.rewardId, reason: m.status === "active" ? "Admin paused" : undefined })}
                            >
                              {m.status === "active" ? <><Pause className="w-3 h-3 mr-1.5" /> Pause Miner</> : <><Play className="w-3 h-3 mr-1.5" /> Reactivate Miner</>}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeNav === "notifications" && (
                <div className="space-y-6">                  <div>
                    <h2 className="text-2xl font-bold mb-2">Broadcast Notifications</h2>
                    <p className="text-muted-foreground">Send notifications to all users</p>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="Notification title"
                      />
                    </div>
                    <div>
                      <Label>Message</Label>
                      <Textarea
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="Notification message"
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={() => broadcastNotification.mutate({ title: broadcastTitle, message: broadcastMessage })}
                      disabled={!broadcastTitle || !broadcastMessage}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Send Broadcast
                    </Button>
                  </div>
                </div>
              )}

              {/* Articles Tab */}
              {activeNav === "articles" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Learn & Earn Articles</h2>
                    <p className="text-muted-foreground">Manage educational content</p>
                  </div>

                  {/* Create Article */}
                  <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <h3 className="font-semibold">Create New Article</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={articleTitle}
                          onChange={(e) => setArticleTitle(e.target.value)}
                          placeholder="Article title"
                        />
                      </div>
                      <div>
                        <Label>Icon (emoji or URL)</Label>
                        <Input
                          value={articleIcon}
                          onChange={(e) => setArticleIcon(e.target.value)}
                          placeholder="📚 or image URL"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Image URL (optional)</Label>
                      <Input
                        value={articleImage}
                        onChange={(e) => setArticleImage(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Description (HTML supported)</Label>
                      <Textarea
                        value={articleDescription}
                        onChange={(e) => setArticleDescription(e.target.value)}
                        placeholder="<p>Content here...</p>"
                        rows={6}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={articleCategory} onValueChange={setArticleCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {ARTICLE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() =>
                        createArticle.mutate({
                          title: articleTitle,
                          description: articleDescription,
                          category: articleCategory,
                          icon: articleIcon || undefined,
                          image: articleImage || undefined,
                          order: articles.length,
                        })
                      }
                      disabled={!articleTitle || !articleDescription}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Article
                    </Button>
                  </div>

                  {/* Existing Articles */}
                  <div>
                    <h3 className="font-semibold mb-4">Existing Articles</h3>
                    <div className="space-y-4">
                      {articles.map((article) => (
                        <div key={article.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            {article.icon && <span className="text-2xl flex-shrink-0">{article.icon}</span>}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{article.title}</h4>
                              <Badge variant={article.isActive ? "default" : "secondary"} className="mt-1">
                                {article.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <div
                            className="text-sm text-muted-foreground line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: article.description }}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setEditingArticle(article);
                                setArticleTitle(article.title);
                                setArticleDescription(article.description);
                                setArticleCategory(article.category || "Basics");
                                setArticleIcon(article.icon || "");
                                setArticleImage(article.image || "");
                              }}
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full"
                              onClick={() => setDeleteArticleId(article.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Update App Tab */}
              {activeNav === "update-app" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Force Update Settings</h2>
                    <p className="text-muted-foreground">Configure mandatory app updates</p>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="force-update"
                        checked={forceUpdateEnabled}
                        onChange={(e) => setForceUpdateEnabled(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="force-update" className="font-medium">
                        Enable Force Update
                      </label>
                    </div>

                    {forceUpdateEnabled && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <Label>Minimum Required Version</Label>
                          <Input
                            value={updateMinVersion}
                            onChange={(e) => setUpdateMinVersion(e.target.value)}
                            placeholder="1.0.0"
                          />
                        </div>
                        <div>
                          <Label>Android Update URL (Google Play)</Label>
                          <Input
                            value={updateAndroidUrl}
                            onChange={(e) => setUpdateAndroidUrl(e.target.value)}
                            placeholder="https://play.google.com/store/apps/details?id=..."
                          />
                        </div>
                        <div>
                          <Label>iOS Update URL (App Store)</Label>
                          <Input
                            value={updateIosUrl}
                            onChange={(e) => setUpdateIosUrl(e.target.value)}
                            placeholder="https://apps.apple.com/app/..."
                          />
                        </div>
                        <div>
                          <Label>Update Message</Label>
                          <Textarea
                            value={updateMessage}
                            onChange={(e) => setUpdateMessage(e.target.value)}
                            placeholder="Please update to the latest version"
                            rows={3}
                          />
                        </div>
                        <Button>
                          <Save className="w-4 h-4 mr-2" />
                          Save Update Settings
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Estimates Tab */}
              {activeNav === "estimates" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Earnings Estimates</h2>
                    <p className="text-muted-foreground">Controls the "Estimated earnings today" cards in Mining / Yield / Solo pages</p>
                  </div>

                  <div className="space-y-3">
                    {/* Yield */}
                    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Yield</p>
                          <p className="font-bold">Annual APR (%)</p>
                        </div>
                        <Badge className="bg-emerald-500/15 border-emerald-500/30" style={{ color: 'rgb(12, 185, 105)' }}>Editable</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input value={estimateInvestAprAnnual} onChange={(e) => setEstimateInvestAprAnnual(e.target.value)} className="flex-1" />
                        <Button
                          size="sm"
                          onClick={() =>
                            addConfig.mutate({
                              key: "public_invest_apr_annual_percent",
                              value: String(Number(estimateInvestAprAnnual || 19)),
                              category: "estimates",
                              description: "Public: Yield annual APR percent (used for Estimated earnings today)",
                            })
                          }
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Preview: ${((1000 * (Number(estimateInvestAprAnnual || 0) / 100)) / 365).toFixed(2)} / day per $1,000
                      </p>
                    </div>

                    {/* Mining */}
                    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Mining</p>
                          <p className="font-bold">Estimate multiplier</p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/25">Global</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input value={estimateMiningMultiplier} onChange={(e) => setEstimateMiningMultiplier(e.target.value)} className="flex-1" />
                        <Button
                          size="sm"
                          onClick={() =>
                            addConfig.mutate({
                              key: "public_mining_estimate_multiplier",
                              value: String(Number(estimateMiningMultiplier || 1)),
                              category: "estimates",
                              description: "Public: Mining estimate multiplier (affects live earnings displays)",
                            })
                          }
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        1.0 = normal • 2.0 = double • 0.5 = half
                      </p>
                    </div>

                    {/* Solo */}
                    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Solo</p>
                          <p className="font-bold">Estimate multiplier</p>
                        </div>
                        <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/25">Global</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input value={estimateSoloMultiplier} onChange={(e) => setEstimateSoloMultiplier(e.target.value)} className="flex-1" />
                        <Button
                          size="sm"
                          onClick={() =>
                            addConfig.mutate({
                              key: "public_solo_estimate_multiplier",
                              value: String(Number(estimateSoloMultiplier || 1)),
                              category: "estimates",
                              description: "Public: Solo estimate multiplier (affects live earnings displays)",
                            })
                          }
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Multiplies the Solo "Estimated earnings today" display
                      </p>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      These settings are used for UI estimates only ("live" counters). They do not change stored wallet balances.
                    </p>
                  </div>
                </div>
              )}

              {/* User-Specific Estimates Tab */}
              {activeNav === "user-estimates" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">User-Specific Earnings Estimates</h2>
                    <p className="text-muted-foreground">Control "Estimated earnings today" for each user individually (Mining, Yield, Solo)</p>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-wrap gap-x-10 gap-y-2">
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Active Users</p>
                        <p className="text-xl font-bold">{users.filter(u => u.isActive).length}</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Custom</p>
                        <p className="text-xl font-bold">{config.filter(c => c.key.startsWith("user_estimate_")).length}</p>
                      </div>
                      <div className="min-w-[90px]">
                        <p className="text-xs text-muted-foreground">Global</p>
                        <p className="text-xl font-bold">{users.filter(u => u.isActive).length - new Set(config.filter(c => c.key.startsWith("user_estimate_")).map(c => c.key.split("_")[2])).size}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-4">
                    <Label className="text-xs text-muted-foreground">Search Users</Label>
                    <Input
                      value={userEstimatesSearch}
                      onChange={(e) => setUserEstimatesSearch(e.target.value)}
                      placeholder="Search by email or display name..."
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-3">
                    {users
                      .filter(u => {
                        const q = userEstimatesSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          u.email.toLowerCase().includes(q) ||
                          (u.displayName || "").toLowerCase().includes(q)
                        );
                      })
                      .map((user) => {
                        const userMining = config.find(c => c.key === `user_estimate_${user.id}_mining`)?.value || "—";
                        const userInvest = config.find(c => c.key === `user_estimate_${user.id}_invest`)?.value || "—";
                        const userSolo = config.find(c => c.key === `user_estimate_${user.id}_solo`)?.value || "—";
                        
                        return (
                          <div key={user.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                            {/* User Info */}
                            <div>
                              <p className="font-medium text-sm truncate">{user.email}</p>
                              {user.displayName && (
                                <p className="text-xs text-muted-foreground truncate">{user.displayName}</p>
                              )}
                            </div>
                            
                            {/* Multipliers */}
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Mining</p>
                                <Badge variant={userMining === "—" ? "secondary" : "default"} className="mt-1">
                                  {userMining === "—" ? "Global" : `${userMining}x`}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Yield APR</p>
                                <Badge variant={userInvest === "—" ? "secondary" : "default"} className="mt-1">
                                  {userInvest === "—" ? "Global" : `${userInvest}%`}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Solo</p>
                                <Badge variant={userSolo === "—" ? "secondary" : "default"} className="mt-1">
                                  {userSolo === "—" ? "Global" : `${userSolo}x`}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Edit Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setSelectedUserEstimate(user.id);
                                setUserMiningMultiplier(userMining === "—" ? "1" : userMining);
                                setUserInvestApr(userInvest === "—" ? "19" : userInvest);
                                setUserSoloMultiplier(userSolo === "—" ? "1" : userSolo);
                                setUserEstimateDialogOpen(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Estimates
                            </Button>
                          </div>
                        );
                      })}
                  </div>

                  <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-sm font-medium">How it works</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Users with custom estimates will see their personalized "Estimated earnings today" values.
                      Users without custom estimates use the global settings from the "Global Estimates" tab.
                    </p>
                  </div>
                </div>
              )}

              {/* Stripe Payments Tab */}
              {activeNav === "stripe" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Stripe Payments</h2>
                    <p className="text-muted-foreground">Configure Stripe payment gateway for fiat payments</p>
                  </div>

                  {/* Enable/Disable Toggle + Mode */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Stripe Gateway</h3>
                          <p className="text-sm text-muted-foreground">
                            {stripeSettings?.isEnabled ? "Payments are active" : "Payments are disabled"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={stripeSettings?.isEnabled ? "default" : "outline"}
                        className={stripeSettings?.isEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={async () => {
                          try {
                            const res = await adminFetch("/api/admin/stripe/toggle", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ isEnabled: !stripeSettings?.isEnabled }),
                            });
                            if (res.ok) {
                              queryClient.invalidateQueries({ queryKey: ["/api/admin/stripe/settings"] });
                              toast({
                                title: stripeSettings?.isEnabled ? "Stripe Disabled" : "Stripe Enabled",
                                description: stripeSettings?.isEnabled
                                  ? "Payment gateway has been turned off"
                                  : "Payment gateway is now active",
                              });
                            }
                          } catch (err) {
                            toast({ title: "Error", description: "Failed to toggle Stripe", variant: "destructive" });
                          }
                        }}
                      >
                        {stripeSettings?.isEnabled ? (
                          <>
                            <ToggleRight className="w-4 h-4 mr-2" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 mr-2" />
                            Disabled
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 mb-4">
                      <p className="text-sm font-medium">Mode:</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={stripeSettings?.mode === "test" || !stripeSettings?.mode ? "default" : "outline"}
                          onClick={async () => {
                            const res = await adminFetch("/api/admin/stripe/mode", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ mode: "test" }),
                            });
                            if (res.ok) {
                              queryClient.invalidateQueries({ queryKey: ["/api/admin/stripe/settings"] });
                              toast({ title: "Switched to Test Mode" });
                            }
                          }}
                        >
                          <TestTube2 className="w-4 h-4 mr-2" />
                          Test Mode
                        </Button>
                        <Button
                          size="sm"
                          variant={stripeSettings?.mode === "live" ? "default" : "outline"}
                          className={stripeSettings?.mode === "live" ? "bg-green-600 hover:bg-green-700" : ""}
                          onClick={async () => {
                            const res = await adminFetch("/api/admin/stripe/mode", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ mode: "live" }),
                            });
                            if (res.ok) {
                              queryClient.invalidateQueries({ queryKey: ["/api/admin/stripe/settings"] });
                              toast({ title: "Switched to Live Mode", description: "Real payments are now active!" });
                            }
                          }}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Live Mode
                        </Button>
                      </div>
                      <Badge variant={stripeSettings?.mode === "live" ? "default" : "secondary"}>
                        {stripeSettings?.mode === "live" ? "PRODUCTION" : "TESTING"}
                      </Badge>
                    </div>

                    {/* Test Connection */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        try {
                          const res = await adminFetch("/api/admin/stripe/test", { method: "POST" });
                          const data = await res.json();
                          if (data.success) {
                            toast({ title: "Connection Successful!", description: data.message });
                          } else {
                            toast({ title: "Connection Failed", description: data.error, variant: "destructive" });
                          }
                        } catch {
                          toast({ title: "Error", description: "Could not test connection", variant: "destructive" });
                        }
                      }}
                    >
                      <TestTube2 className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>

                  {/* API Keys */}
                  <div className="bg-card rounded-xl border border-border p-6 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">API Keys</h3>
                    </div>

                    {/* Test Keys */}
                    <div className="space-y-4 p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                      <div className="flex items-center gap-2">
                        <TestTube2 className="w-4 h-4 text-yellow-500" />
                        <p className="font-medium text-yellow-600 dark:text-yellow-400">Test Keys</p>
                      </div>
                      <div>
                        <Label>Test Publishable Key</Label>
                        <Input
                          value={stripeTestPublishable}
                          onChange={(e) => setStripeTestPublishable(e.target.value)}
                          placeholder="pk_test_..."
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label>Test Secret Key</Label>
                        <Input
                          type="password"
                          value={stripeTestSecret}
                          onChange={(e) => setStripeTestSecret(e.target.value)}
                          placeholder="sk_test_..."
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label>Test Webhook Secret</Label>
                        <Input
                          type="password"
                          value={stripeTestWebhook}
                          onChange={(e) => setStripeTestWebhook(e.target.value)}
                          placeholder="whsec_..."
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Live Keys */}
                    <div className="space-y-4 p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-green-500" />
                        <p className="font-medium text-green-600 dark:text-green-400">Live Keys (Production)</p>
                      </div>
                      <div>
                        <Label>Live Publishable Key</Label>
                        <Input
                          value={stripeLivePublishable}
                          onChange={(e) => setStripeLivePublishable(e.target.value)}
                          placeholder="pk_live_..."
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label>Live Secret Key</Label>
                        <Input
                          type="password"
                          value={stripeLiveSecret}
                          onChange={(e) => setStripeLiveSecret(e.target.value)}
                          placeholder="sk_live_..."
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label>Live Webhook Secret</Label>
                        <Input
                          type="password"
                          value={stripeLiveWebhook}
                          onChange={(e) => setStripeLiveWebhook(e.target.value)}
                          placeholder="whsec_..."
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Payment Settings */}
                    <div className="space-y-4 p-4 rounded-lg border border-border">
                      <p className="font-medium">Payment Settings</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Currency</Label>
                          <Select value={stripeCurrency} onValueChange={setStripeCurrency}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="usd">USD ($)</SelectItem>
                              <SelectItem value="eur">EUR (€)</SelectItem>
                              <SelectItem value="gbp">GBP (£)</SelectItem>
                              <SelectItem value="aed">AED (د.إ)</SelectItem>
                              <SelectItem value="sar">SAR (ر.س)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Min Payment ($)</Label>
                          <Input
                            type="number"
                            value={stripeMinAmount}
                            onChange={(e) => setStripeMinAmount(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Max Payment ($)</Label>
                          <Input
                            type="number"
                            value={stripeMaxAmount}
                            onChange={(e) => setStripeMaxAmount(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <Button
                      className="w-full"
                      onClick={async () => {
                        try {
                          const res = await adminFetch("/api/admin/stripe/settings", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              testPublishableKey: stripeTestPublishable || undefined,
                              testSecretKey: stripeTestSecret || undefined,
                              testWebhookSecret: stripeTestWebhook || undefined,
                              livePublishableKey: stripeLivePublishable || undefined,
                              liveSecretKey: stripeLiveSecret || undefined,
                              liveWebhookSecret: stripeLiveWebhook || undefined,
                              currency: stripeCurrency,
                              minPaymentAmount: parseFloat(stripeMinAmount) || 5,
                              maxPaymentAmount: parseFloat(stripeMaxAmount) || 10000,
                            }),
                          });
                          if (res.ok) {
                            queryClient.invalidateQueries({ queryKey: ["/api/admin/stripe/settings"] });
                            toast({ title: "Stripe Settings Saved", description: "All keys and settings have been updated" });
                          } else {
                            const errData = await res.json().catch(() => ({}));
                            toast({ title: "Error", description: errData?.details || errData?.error || `Failed to save settings (${res.status})`, variant: "destructive" });
                          }
                        } catch (err: any) {
                          toast({ title: "Error", description: err?.message || "Network error", variant: "destructive" });
                        }
                      }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save All Settings
                    </Button>

                    {/* Webhook URL Info */}
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Webhook Endpoint</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono block overflow-x-auto">
                        {typeof window !== "undefined" ? `${window.location.origin}/api/stripe/webhook` : "/api/stripe/webhook"}
                      </code>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add this URL in your Stripe Dashboard → Developers → Webhooks
                      </p>
                    </div>
                  </div>

                  {/* Payment History */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">Recent Payments</h3>
                      <Badge variant="secondary">{stripePayments.length} total</Badge>
                    </div>
                    {stripePayments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No payments yet</p>
                        <p className="text-sm">Payments will appear here once customers start paying</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stripePayments.slice().reverse().map((payment: any) => (
                              <TableRow key={payment.id}>
                                <TableCell className="text-xs">
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-xs font-mono">
                                  {payment.userId?.slice(0, 8)}...
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm font-medium">{payment.productName || "—"}</p>
                                    <p className="text-xs text-muted-foreground">{payment.productType}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  ${payment.amount?.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      payment.status === "succeeded"
                                        ? "default"
                                        : payment.status === "failed"
                                        ? "destructive"
                                        : payment.status === "refunded"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className={payment.status === "succeeded" ? "bg-green-600" : ""}
                                  >
                                    {payment.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {payment.status === "succeeded" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        try {
                                          const res = await adminFetch(`/api/admin/stripe/refund/${payment.id}`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({}),
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            queryClient.invalidateQueries({ queryKey: ["/api/admin/stripe/payments"] });
                                            toast({ title: "Refunded", description: "Payment has been refunded" });
                                          } else {
                                            toast({ title: "Error", description: data.error, variant: "destructive" });
                                          }
                                        } catch {
                                          toast({ title: "Error", description: "Refund failed", variant: "destructive" });
                                        }
                                      }}
                                    >
                                      Refund
                                    </Button>
                                  )}
                                  {payment.receiptUrl && (
                                    <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                                      <Button size="sm" variant="ghost">
                                        <ExternalLink className="w-3 h-3" />
                                      </Button>
                                    </a>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Config Tab */}
              {activeNav === "config" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Configuration Management</h2>
                    <p className="text-muted-foreground">Manage wallet addresses and app settings</p>
                  </div>

                  {/* Add New Config */}
                  <div className="bg-card rounded-xl border border-border p-4 md:p-6 space-y-4">
                    <h3 className="font-semibold">Add New Configuration</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Category</Label>
                          <Select value={newConfigCategory} onValueChange={(value) => {
                            setNewConfigCategory(value);
                            setNewConfigKey(""); // Reset key when category changes
                          }}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="wallet">Wallet Addresses</SelectItem>
                              <SelectItem value="pricing">Pricing</SelectItem>
                              <SelectItem value="contracts">Mining Contracts</SelectItem>
                              <SelectItem value="discount">Discounts & Sales</SelectItem>
                              <SelectItem value="forceUpdate">Force Update</SelectItem>
                              <SelectItem value="settings">App Settings</SelectItem>
                              <SelectItem value="compliance">Compliance Mode</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Config Key</Label>
                          <Select 
                            value={newConfigKey} 
                            onValueChange={(value) => {
                              setNewConfigKey(value);
                              // Auto-fill description
                              const key = CONFIG_KEYS[newConfigCategory as keyof typeof CONFIG_KEYS]?.find(
                                (k) => k.key === value
                              );
                              if (key) setNewConfigDescription(key.description);
                            }}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder="Select config key" />
                            </SelectTrigger>
                            <SelectContent>
                              {CONFIG_KEYS[newConfigCategory as keyof typeof CONFIG_KEYS]?.map((key) => (
                                <SelectItem key={key.key} value={key.key}>
                                  {key.description}
                                </SelectItem>
                              )) || <SelectItem value="">No keys available</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Value</Label>
                        <Input
                          className="mt-1.5"
                          value={newConfigValue}
                          onChange={(e) => setNewConfigValue(e.target.value)}
                          placeholder={
                            newConfigCategory === "wallet" ? "bc1q... or 0x..." :
                            newConfigCategory === "pricing" ? "0.00" :
                            newConfigCategory === "discount" ? "10" :
                            "Value"
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Description (Auto-filled)</Label>
                        <Input
                          className="mt-1.5"
                          value={newConfigDescription}
                          onChange={(e) => setNewConfigDescription(e.target.value)}
                          placeholder="Description"
                          disabled
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() =>
                        addConfig.mutate({
                          key: newConfigKey,
                          value: newConfigValue,
                          category: newConfigCategory,
                          description: newConfigDescription,
                        })
                      }
                      disabled={!newConfigKey || !newConfigValue}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Configuration
                    </Button>
                  </div>

                  {/* Existing Config */}
                  <div>
                    <h3 className="font-semibold mb-4">Current Configuration</h3>
                    
                    {/* Card Layout */}
                    <div className="space-y-3">
                      {config.map((cfg) => (
                        <div key={cfg.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <Badge variant="outline" className="mb-2">{cfg.category}</Badge>
                              <p className="text-xs text-muted-foreground">{cfg.description || "—"}</p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {editingConfig?.id === cfg.id ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      updateConfig.mutate({ id: cfg.id, value: editConfigValue });
                                    }}
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingConfig(null)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingConfig(cfg);
                                      setEditConfigValue(cfg.value);
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setDeleteConfigId(cfg.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Key</p>
                              <p className="font-mono text-sm break-all">{cfg.key}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Value</p>
                              {editingConfig?.id === cfg.id ? (
                                <Input
                                  value={editConfigValue}
                                  onChange={(e) => setEditConfigValue(e.target.value)}
                                  className="w-full"
                                />
                              ) : (
                                <p className="font-mono text-sm break-all text-primary">{cfg.value}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Confirm Deposit Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deposit</DialogTitle>
            <DialogDescription>
              Approve this deposit and credit {selectedDeposit?.amount} {selectedDeposit?.currency} to user's account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedDeposit && confirmDeposit.mutate(selectedDeposit.id)}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog
        open={userDetailsDialogOpen}
        onOpenChange={(open) => {
          setUserDetailsDialogOpen(open);
          if (!open) setSelectedUserId(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              {selectedUser ? `${selectedUser.email}${selectedUser.displayName ? ` • ${selectedUser.displayName}` : ""}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Wallet Balances</p>
                <div className="mt-2 space-y-1">
                  {selectedBalancesList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No balances</p>
                  ) : (
                    selectedBalancesList
                      .slice()
                      .sort((a, b) => a.symbol.localeCompare(b.symbol))
                      .map((b) => (
                        <div key={b.symbol} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{b.symbol}</span>
                          <span>{Number(b.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Active Products</p>
                <div className="mt-2 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Mining:</span> {activeMiningOrders.length}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Earn:</span> {activeEarnOrders.length}
                  </div>
                  {(activeMiningOrders.length > 0 || activeEarnOrders.length > 0) && (
                    <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                      {[...activeMiningOrders, ...activeEarnOrders].slice(0, 4).map((o) => (
                        <div key={o.id} className="truncate">• {o.productName}</div>
                      ))}
                      {[...activeMiningOrders, ...activeEarnOrders].length > 4 && (
                        <div>…and more</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="mt-2 text-2xl font-bold">{totalSpent.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">Sum of recorded orders</p>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Mining Purchases</h3>
                  <p className="text-xs text-muted-foreground">Active and past mining packages</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setGiftMinerId(selectedUserId);
                    setGiftMinerDialogOpen(true);
                  }}
                  className="gap-1"
                >
                  <Gift className="w-3 h-3" /> Gift Miner
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hashrate</TableHead>
                      <TableHead>Bought</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrders.filter((o) => o.type === "mining_purchase").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No mining purchases found
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedOrders
                        .filter((o) => o.type === "mining_purchase")
                        .slice(0, 50)
                        .map((o) => {
                          const status = o.details?.status || o.status || "—";
                          const bought = o.details?.purchaseDate || o.createdAt;
                          const expires = o.details?.expiryDate;
                          const isExpired = expires ? new Date(expires).getTime() < Date.now() : false;

                          return (
                            <TableRow key={o.id}>
                              <TableCell className="font-medium">{o.productName}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant={status === "active" ? "default" : status === "paused" ? "secondary" : "outline"}>
                                    {status}
                                  </Badge>
                                  {isExpired && status === "active" ? (
                                    <Badge variant="destructive">Expired</Badge>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell>
                                {o.details?.hashrate ? `${o.details.hashrate} ${o.details.hashrateUnit}` : "—"}
                              </TableCell>
                              <TableCell>{bought ? new Date(bought).toLocaleDateString() : "—"}</TableCell>
                              <TableCell>{expires ? new Date(expires).toLocaleDateString() : "—"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {status === "active" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={toggleMinerStatus.isPending}
                                      onClick={() => toggleMinerStatus.mutate({ purchaseId: o.productId, action: "pause" })}
                                    >
                                      <Pause className="w-3 h-3 mr-1" /> Pause
                                    </Button>
                                  )}
                                  {status === "paused" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={toggleMinerStatus.isPending}
                                      onClick={() => toggleMinerStatus.mutate({ purchaseId: o.productId, action: "activate" })}
                                    >
                                      <Play className="w-3 h-3 mr-1" /> Activate
                                    </Button>
                                  )}
                                  {(status === "active" || status === "paused") && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={terminateMiningPurchase.isPending}
                                      onClick={() => openTerminateDialog(o.productId)}
                                    >
                                      Terminate
                                    </Button>
                                  )}
                                  {status !== "active" && status !== "paused" && "—"}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <AlertDialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Terminate this purchase?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the mining purchase as completed and stop it from counting as active.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-3">
                  <Label>Message to user</Label>
                  <RadioGroup
                    value={terminateReasonPreset}
                    onValueChange={(v) => setTerminateReasonPreset(v as any)}
                    className="grid gap-3"
                  >
                    <Label className="flex items-center gap-3 cursor-pointer">
                      <RadioGroupItem value="expired" />
                      <span>Expired</span>
                    </Label>
                    <Label className="flex items-center gap-3 cursor-pointer">
                      <RadioGroupItem value="out_of_stock" />
                      <span>Out of stock</span>
                    </Label>
                    <Label className="flex items-center gap-3 cursor-pointer">
                      <RadioGroupItem value="custom" />
                      <span>Custom message</span>
                    </Label>
                  </RadioGroup>

                  {terminateReasonPreset === "custom" ? (
                    <Textarea
                      value={terminateCustomMessage}
                      onChange={(e) => setTerminateCustomMessage(e.target.value)}
                      placeholder="Write a message the user will see…"
                      rows={3}
                    />
                  ) : null}
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      setTerminateDialogOpen(false);
                      setTerminatePurchaseId(null);
                      setTerminateReasonPreset("expired");
                      setTerminateCustomMessage("");
                    }}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (!terminatePurchaseId) return;
                      terminateMiningPurchase.mutate({ purchaseId: terminatePurchaseId, reason: computedTerminateReason });
                    }}
                    disabled={
                      terminateMiningPurchase.isPending ||
                      !terminatePurchaseId ||
                      (terminateReasonPreset === "custom" && computedTerminateReason.length === 0)
                    }
                  >
                    Terminate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Spend / Order History</h3>
                <p className="text-xs text-muted-foreground">Latest orders for this user</p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedOrders.slice(0, 50).map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : (o.details?.purchaseDate ? new Date(o.details.purchaseDate).toLocaleDateString() : "—")}
                          </TableCell>
                          <TableCell className="font-medium">{o.type}</TableCell>
                          <TableCell>{o.productName}</TableCell>
                          <TableCell>
                            {Number(o.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} {o.currency}
                          </TableCell>
                          <TableCell>{o.status || o.details?.status || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Deposit Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Deposit</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this deposit</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
            />
            <div className="flex flex-wrap gap-2">
              {["Deposit not detected on blockchain", "Incorrect amount sent", "Sent to wrong address"].map(
                (template) => (
                  <Button
                    key={template}
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectionReason(template)}
                  >
                    {template}
                  </Button>
                )
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedDeposit &&
                rejectDeposit.mutate({ depositId: selectedDeposit.id, reason: rejectionReason })
              }
              disabled={!rejectionReason}
            >
              Reject Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Config Dialog */}
      <Dialog open={!!deleteConfigId} onOpenChange={(open) => !open && setDeleteConfigId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Configuration</DialogTitle>
            <DialogDescription>Are you sure you want to delete this configuration entry?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteConfigId(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => deleteConfigId && deleteConfig.mutate(deleteConfigId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Article Dialog */}
      <Dialog open={!!deleteArticleId} onOpenChange={() => setDeleteArticleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>Are you sure you want to delete this article?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteArticleId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteArticleId && deleteArticle.mutate(deleteArticleId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={!!editingArticle} onOpenChange={() => setEditingArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} />
              </div>
              <div>
                <Label>Icon</Label>
                <Input value={articleIcon} onChange={(e) => setArticleIcon(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={articleImage} onChange={(e) => setArticleImage(e.target.value)} />
            </div>
            <div>
              <Label>Description (HTML)</Label>
              <Textarea
                value={articleDescription}
                onChange={(e) => setArticleDescription(e.target.value)}
                rows={8}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={articleCategory} onValueChange={setArticleCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingArticle(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                editingArticle &&
                updateArticle.mutate({
                  id: editingArticle.id,
                  title: articleTitle,
                  description: articleDescription,
                  category: articleCategory,
                  icon: articleIcon || undefined,
                  image: articleImage || undefined,
                  order: editingArticle.order,
                })
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Estimate Dialog */}
      <Dialog open={userEstimateDialogOpen} onOpenChange={setUserEstimateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Estimates</DialogTitle>
            <DialogDescription>
              Set custom "Estimated earnings today" values for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Mining Multiplier</Label>
              <Input 
                value={userMiningMultiplier} 
                onChange={(e) => setUserMiningMultiplier(e.target.value)}
                placeholder="1.0"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                1.0 = normal • 2.0 = double earnings display • 0.5 = half
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Yield APR (%)</Label>
              <Input 
                value={userInvestApr} 
                onChange={(e) => setUserInvestApr(e.target.value)}
                placeholder="19"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Controls the APR shown in Yield earnings. Default: 19%
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Solo Mining Multiplier</Label>
              <Input 
                value={userSoloMultiplier} 
                onChange={(e) => setUserSoloMultiplier(e.target.value)}
                placeholder="1.0"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                1.0 = normal • 2.0 = double solo earnings display
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUserEstimateDialogOpen(false);
              setSelectedUserEstimate(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedUserEstimate) return;
                
                try {
                  // Save all three configs
                  await Promise.all([
                    addConfig.mutateAsync({
                      key: `user_estimate_${selectedUserEstimate}_mining`,
                      value: String(Number(userMiningMultiplier) || 1),
                      category: "user_estimates",
                      description: `User-specific mining multiplier`,
                    }),
                    addConfig.mutateAsync({
                      key: `user_estimate_${selectedUserEstimate}_invest`,
                      value: String(Number(userInvestApr) || 19),
                      category: "user_estimates",
                      description: `User-specific yield APR`,
                    }),
                    addConfig.mutateAsync({
                      key: `user_estimate_${selectedUserEstimate}_solo`,
                      value: String(Number(userSoloMultiplier) || 1),
                      category: "user_estimates",
                      description: `User-specific solo multiplier`,
                    }),
                  ]);
                  
                  // Explicitly invalidate config queries to refresh the UI
                  await queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
                  
                  toast({ title: "User estimates saved" });
                  setUserEstimateDialogOpen(false);
                  setSelectedUserEstimate(null);
                } catch (error) {
                  toast({ title: "Error saving estimates", description: "Please try again", variant: "destructive" });
                }
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Estimates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Block Dialog */}
      <Dialog open={awardBlockDialogOpen} onOpenChange={(open) => {
        setAwardBlockDialogOpen(open);
        if (!open) {
          setSelectedSoloPurchase(null);
          setBlockRewardAmount("3.125");
          setBlockTxHash("");
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Award Block Reward
            </DialogTitle>
            <DialogDescription>
              Award a Bitcoin block reward to this solo miner. This will add BTC to their wallet and send them a notification.
            </DialogDescription>
          </DialogHeader>
          {selectedSoloPurchase && (
            <div className="space-y-4 py-4">
              {/* User Info */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedSoloPurchase.userDisplayName || "Unknown User"}</p>
                    <p className="text-xs text-muted-foreground">{selectedSoloPurchase.userEmail}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Package:</span>{" "}
                    <span className="font-medium">{selectedSoloPurchase.packageName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hashpower:</span>{" "}
                    <span className="font-medium">{selectedSoloPurchase.hashrate} {selectedSoloPurchase.hashrateUnit}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Earned:</span>{" "}
                    <span className="font-medium text-green-500">
                      {Number(selectedSoloPurchase.totalEarned || 0).toFixed(8)} BTC
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <span className={`font-medium ${selectedSoloPurchase.status === "active" ? "text-green-500" : "text-gray-500"}`}>
                      {selectedSoloPurchase.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Block Reward Amount */}
              <div>
                <Label className="text-sm font-medium">Block Reward (BTC)</Label>
                <Input 
                  type="number"
                  step="0.00000001"
                  value={blockRewardAmount} 
                  onChange={(e) => setBlockRewardAmount(e.target.value)}
                  placeholder="3.125"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current BTC block reward is 3.125 BTC (after 2024 halving)
                </p>
              </div>

              {/* Optional TX Hash */}
              <div>
                <Label className="text-sm font-medium">Transaction Hash (Optional)</Label>
                <Input 
                  value={blockTxHash} 
                  onChange={(e) => setBlockTxHash(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Include a blockchain transaction hash for reference
                </p>
              </div>

              {/* Preview */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-sm text-green-400 font-medium">
                  🎉 Will award {blockRewardAmount || "0"} BTC to user's wallet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  User will receive a "BLOCK FOUND!" notification
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAwardBlockDialogOpen(false);
              setSelectedSoloPurchase(null);
              setBlockRewardAmount("3.125");
              setBlockTxHash("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedSoloPurchase) return;
                awardBlockMutation.mutate({
                  purchaseId: selectedSoloPurchase.id,
                  blockReward: parseFloat(blockRewardAmount),
                  txHash: blockTxHash || undefined,
                });
              }}
              disabled={awardBlockMutation.isPending || !blockRewardAmount || Number(blockRewardAmount) <= 0}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Zap className="w-4 h-4 mr-2" />
              {awardBlockMutation.isPending ? "Awarding..." : "Award Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Miner Dialog */}
      <Dialog open={giftMinerDialogOpen} onOpenChange={setGiftMinerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🎁 Gift a Miner</DialogTitle>
            <DialogDescription>Add a mining package to user's account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Package Name</Label>
              <Input value={giftPackageName} onChange={(e) => setGiftPackageName(e.target.value)} placeholder="e.g. Antminer S19 Pro" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Crypto</Label>
                <Input value={giftCrypto} onChange={(e) => setGiftCrypto(e.target.value)} placeholder="BTC" />
              </div>
              <div>
                <Label>Hashrate</Label>
                <Input type="number" value={giftHashrate} onChange={(e) => setGiftHashrate(e.target.value)} placeholder="6" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unit</Label>
                <Input value={giftHashrateUnit} onChange={(e) => setGiftHashrateUnit(e.target.value)} placeholder="TH/s" />
              </div>
              <div>
                <Label>Daily BTC</Label>
                <Input type="number" step="0.00000001" value={giftDailyBTC} onChange={(e) => setGiftDailyBTC(e.target.value)} placeholder="0.00000630" />
              </div>
            </div>
            <div>
              <Label>Duration (days)</Label>
              <Input type="number" value={giftDurationDays} onChange={(e) => setGiftDurationDays(e.target.value)} placeholder="730" />
              <p className="text-xs text-muted-foreground mt-1">
                Expires: {new Date(Date.now() + Number(giftDurationDays) * 86400000).toLocaleDateString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGiftMinerDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={giftMiner.isPending}
              onClick={() => giftMiner.mutate({
                packageName: giftPackageName,
                crypto: giftCrypto,
                hashrate: Number(giftHashrate),
                hashrateUnit: giftHashrateUnit,
                dailyReturnBTC: Number(giftDailyBTC),
                durationDays: Number(giftDurationDays),
                amount: 0,
                returnPercent: 0,
                paybackMonths: 0,
              })}
            >
              {giftMiner.isPending ? "Gifting..." : "Gift Miner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Weekly Profit Confirmation Dialog */}
      <AlertDialog open={weeklyProfitDialog} onOpenChange={setWeeklyProfitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Distribute Weekly Profit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will pay 7× daily BTC return to all active miners' wallets right now. This should typically run automatically every Sunday.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={distributeWeeklyProfit.isPending}
              onClick={() => distributeWeeklyProfit.mutate()}
            >
              {distributeWeeklyProfit.isPending ? "Distributing..." : "Distribute Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
