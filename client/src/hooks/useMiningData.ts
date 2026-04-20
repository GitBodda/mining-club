import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useCryptoPrices, CryptoType } from "./useCryptoPrices";
import { trackMiningStarted, trackMiningStopped, trackPoolSelected } from "@/lib/analytics";
import type { 
  MiningStats, 
  WalletBalance, 
  Transaction, 
  MiningPool, 
  ChartDataPoint, 
  UserSettings,
  MiningContract,
  PoolStatus
} from "@/lib/types";

interface WalletResponse {
  balances: WalletBalance[];
  totalBalance: number;
  change24h: number;
}

interface PortfolioHistoryPoint {
  day: string;
  value: number;
  timestamp: string;
}

const stableQueryOptions = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function useMiningData() {
  // Get user ID from localStorage
  const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.dbId || user?.id || user?.uid;

  const { prices: cryptoPrices } = useCryptoPrices();

  const miningStatsQuery = useQuery<MiningStats>({
    ...stableQueryOptions,
    queryKey: ["/api/mining/stats"],
    refetchInterval: 30000, // Increased from 15s to 30s
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
    staleTime: 15000,
  });

  const walletQuery = useQuery<any>({
    ...stableQueryOptions,
    queryKey: ["/api/balances", userId],
    queryFn: async () => {
      if (!userId) {
        return { balances: [], pending: {} };
      }
      const res = await fetch(`/api/balances/${userId}`);
      if (!res.ok) return { balances: [], pending: {} };
      const data = await res.json();
      return {
        balances: data.balances || [],
        pending: data.pending || {},
      };
    },
    enabled: !!userId,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });

  const totalBalance = (walletQuery.data?.balances ?? []).reduce((sum: number, wallet: any) => {
    const price = cryptoPrices[wallet.symbol as CryptoType]?.price ?? 0;
    return sum + (wallet.balance * price);
  }, 0);

  const transactionsQuery = useQuery<Transaction[]>({
    ...stableQueryOptions,
    queryKey: ["/api/wallet/activity", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/wallet/activity/${userId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    refetchIntervalInBackground: true, // Keep refreshing in background for mobile
    placeholderData: keepPreviousData,
    staleTime: 15000,
  });

  const poolsQuery = useQuery<MiningPool[]>({
    ...stableQueryOptions,
    queryKey: ["/api/pools"],
    placeholderData: keepPreviousData,
  });

  const chartQuery = useQuery<ChartDataPoint[]>({
    ...stableQueryOptions,
    queryKey: ["/api/chart"],
    placeholderData: keepPreviousData,
  });

  const portfolioHistoryQuery = useQuery<PortfolioHistoryPoint[]>({
    ...stableQueryOptions,
    queryKey: ["/api/portfolio/history"],
    refetchInterval: 120000, // Refresh every 2 minutes
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });

  const settingsQuery = useQuery<UserSettings>({
    ...stableQueryOptions,
    queryKey: ["/api/settings"],
    placeholderData: keepPreviousData,
  });

  const contractsQuery = useQuery<MiningContract[]>({
    ...stableQueryOptions,
    queryKey: ["/api/mining/contracts"],
    refetchInterval: 60000, // Increased from 20s to 60s
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });

  const poolStatusQuery = useQuery<PoolStatus>({
    ...stableQueryOptions,
    queryKey: ["/api/mining/pool-status"],
    refetchInterval: 60000, // Increased from 20s to 60s
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });

  const toggleMiningMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/mining/toggle");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mining/stats"] });
      if (data?.isActive) {
        trackMiningStarted(data?.poolName ?? 'unknown', data?.coin ?? 'BTC');
      } else {
        trackMiningStopped(data?.poolName ?? 'unknown', data?.coin ?? 'BTC');
      }
    },
  });

  const selectPoolMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/pools/${id}/select`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mining/stats"] });
      trackPoolSelected(data?.name ?? 'unknown', data?.coin ?? 'BTC');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const response = await apiRequest("PATCH", "/api/settings", settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  const defaultMiningStats: MiningStats = {
    hashRate: 0,
    hashRateUnit: "MH/s",
    miningTime: 0,
    powerUsage: 0,
    temperature: 35,
    isActive: false,
    poolName: "CryptoPool Pro",
    efficiency: 0,
  };

  const defaultSettings: UserSettings = {
    notificationsEnabled: true,
    selectedPool: "1",
    twoFactorEnabled: false,
    biometricEnabled: false,
    pinLockEnabled: false,
    currency: "USD",
    language: "English",
    sessionTimeout: 30,
  };

  return {
    miningStats: miningStatsQuery.data ?? defaultMiningStats,
    balances: walletQuery.data?.balances ?? [],
    transactions: transactionsQuery.data ?? [],
    pools: poolsQuery.data ?? [],
    settings: settingsQuery.data ?? defaultSettings,
    chartData: chartQuery.data ?? [],
    portfolioHistory: portfolioHistoryQuery.data ?? [],
    contracts: contractsQuery.data ?? [],
    poolStatus: poolStatusQuery.data ?? { connected: false, poolName: "", hashRate: "0 TH/s", uptime: 0, workers: 0 },
    totalBalance,
    change24h: 0,
    isPending: toggleMiningMutation.isPending || contractsQuery.isPending,
    isLoading: miningStatsQuery.isLoading || walletQuery.isLoading || contractsQuery.isLoading,
    isFetching: walletQuery.isFetching,
    toggleMining: () => toggleMiningMutation.mutate(),
    selectPool: (id: string) => selectPoolMutation.mutate(id),
    updateSettings: (settings: Partial<UserSettings>) => updateSettingsMutation.mutate(settings),
    refetchBalances: () => walletQuery.refetch(),
  };
}
