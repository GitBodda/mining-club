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

export function useMiningData() {
  const miningStatsQuery = useQuery<MiningStats>({
    queryKey: ["/api/mining/stats"],
    refetchInterval: 3000,
    placeholderData: keepPreviousData,
  });

  const walletQuery = useQuery<WalletResponse>({
    queryKey: ["/api/wallet/balances"],
    refetchInterval: 60000, // Refresh every minute
    placeholderData: keepPreviousData, // Prevents flickering
  });

  const transactionsQuery = useQuery<Transaction[]>({
    queryKey: ["/api/wallet/transactions"],
    placeholderData: keepPreviousData,
  });

  const poolsQuery = useQuery<MiningPool[]>({
    queryKey: ["/api/pools"],
    placeholderData: keepPreviousData,
  });

  const chartQuery = useQuery<ChartDataPoint[]>({
    queryKey: ["/api/chart"],
    placeholderData: keepPreviousData,
  });

  const portfolioHistoryQuery = useQuery<PortfolioHistoryPoint[]>({
    queryKey: ["/api/portfolio/history"],
    refetchInterval: 60000, // Refresh every minute
    placeholderData: keepPreviousData,
  });

  const settingsQuery = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    placeholderData: keepPreviousData,
  });

  const contractsQuery = useQuery<MiningContract[]>({
    queryKey: ["/api/mining/contracts"],
    refetchInterval: 5000,
    placeholderData: keepPreviousData,
  });

  const poolStatusQuery = useQuery<PoolStatus>({
    queryKey: ["/api/mining/pool-status"],
    refetchInterval: 10000,
    placeholderData: keepPreviousData,
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
