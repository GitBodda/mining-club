import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { 
  MiningStats, 
  WalletBalance, 
  Transaction, 
  MiningPool, 
  ChartDataPoint, 
  UserSettings 
} from "@/lib/types";

interface WalletResponse {
  balances: WalletBalance[];
  totalBalance: number;
  change24h: number;
}

export function useMiningData() {
  const miningStatsQuery = useQuery<MiningStats>({
    queryKey: ["/api/mining/stats"],
    refetchInterval: 3000,
  });

  const walletQuery = useQuery<WalletResponse>({
    queryKey: ["/api/wallet/balances"],
  });

  const transactionsQuery = useQuery<Transaction[]>({
    queryKey: ["/api/wallet/transactions"],
  });

  const poolsQuery = useQuery<MiningPool[]>({
    queryKey: ["/api/pools"],
  });

  const chartQuery = useQuery<ChartDataPoint[]>({
    queryKey: ["/api/chart"],
  });

  const settingsQuery = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
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
    miningIntensity: 75,
    notificationsEnabled: true,
    autoMining: false,
    powerSaver: true,
    selectedPool: "1",
  };

  return {
    miningStats: miningStatsQuery.data ?? defaultMiningStats,
    balances: walletQuery.data?.balances ?? [],
    transactions: transactionsQuery.data ?? [],
    pools: poolsQuery.data ?? [],
    settings: settingsQuery.data ?? defaultSettings,
    chartData: chartQuery.data ?? [],
    totalBalance: walletQuery.data?.totalBalance ?? 0,
    change24h: walletQuery.data?.change24h ?? 0,
    isPending: toggleMiningMutation.isPending,
    isLoading: miningStatsQuery.isLoading || walletQuery.isLoading,
    toggleMining: () => toggleMiningMutation.mutate(),
    selectPool: (id: string) => selectPoolMutation.mutate(id),
    updateSettings: (settings: Partial<UserSettings>) => updateSettingsMutation.mutate(settings),
  };
}
