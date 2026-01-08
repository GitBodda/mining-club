import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  const miningStatsQuery = useQuery<MiningStats>({
    ...stableQueryOptions,
    queryKey: ["/api/mining/stats"],
    refetchInterval: 30000, // Increased from 15s to 30s
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
    staleTime: 15000,
  });

  const walletQuery = useQuery<WalletResponse>({
    ...stableQueryOptions,
    queryKey: ["/api/wallet/balances"],
    refetchInterval: 120000, // Refresh every 2 minutes
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData, // Prevents flickering
    staleTime: 60000,
  });

  const transactionsQuery = useQuery<Transaction[]>({
    ...stableQueryOptions,
    queryKey: ["/api/wallet/transactions"],
    placeholderData: keepPreviousData,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mining/stats"] });
    },
  });

  const selectPoolMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/pools/${id}/select`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mining/stats"] });
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
    totalBalance: walletQuery.data?.totalBalance ?? 0,
    change24h: walletQuery.data?.change24h ?? 0,
    isPending: toggleMiningMutation.isPending || contractsQuery.isPending,
    isLoading: miningStatsQuery.isLoading || walletQuery.isLoading || contractsQuery.isLoading,
    isFetching: walletQuery.isFetching,
    toggleMining: () => toggleMiningMutation.mutate(),
    selectPool: (id: string) => selectPoolMutation.mutate(id),
    updateSettings: (settings: Partial<UserSettings>) => updateSettingsMutation.mutate(settings),
    refetchBalances: () => walletQuery.refetch(),
  };
}
