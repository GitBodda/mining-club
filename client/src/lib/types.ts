export interface MiningStats {
  hashRate: number;
  hashRateUnit: string;
  miningTime: number;
  powerUsage: number;
  temperature: number;
  isActive: boolean;
  poolName: string;
  efficiency: number;
}

export interface WalletBalance {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  change24h: number;
  icon: string;
}

export interface Transaction {
  id: string;
  type: 'earned' | 'withdrawn' | 'received';
  amount: number;
  symbol: string;
  usdValue: number;
  timestamp: Date;
  status: 'completed' | 'pending';
}

export interface MiningPool {
  id: string;
  name: string;
  apy: number;
  miners: number;
  hashRate: string;
  fee: number;
  isActive: boolean;
}

export interface ChartDataPoint {
  time: string;
  hashRate: number;
  earnings: number;
}

export interface UserSettings {
  miningIntensity: number;
  notificationsEnabled: boolean;
  autoMining: boolean;
  powerSaver: boolean;
  selectedPool: string;
}
