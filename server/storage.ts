import { type User, type InsertUser } from "@shared/schema";
import type { 
  MiningStats, 
  WalletBalance, 
  LegacyTransaction, 
  MiningPool, 
  ChartDataPoint, 
  UserSettings 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMiningStats(): Promise<MiningStats>;
  updateMiningStats(stats: Partial<MiningStats>): Promise<MiningStats>;
  getWalletBalances(): Promise<WalletBalance[]>;
  getTransactions(): Promise<LegacyTransaction[]>;
  getMiningPools(): Promise<MiningPool[]>;
  selectPool(id: string): Promise<MiningPool[]>;
  getChartData(): Promise<ChartDataPoint[]>;
  getSettings(): Promise<UserSettings>;
  updateSettings(settings: Partial<UserSettings>): Promise<UserSettings>;
}

const generateChartData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString("en-US", { hour: "2-digit", hour12: true }),
      hashRate: 45 + Math.random() * 15 + (i % 6) * 2,
      earnings: 0.0001 + Math.random() * 0.0002,
    });
  }
  
  return data;
};

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private miningStats: MiningStats;
  private balances: WalletBalance[];
  private transactions: LegacyTransaction[];
  private pools: MiningPool[];
  private chartData: ChartDataPoint[];
  private settings: UserSettings;

  constructor() {
    this.users = new Map();
    
    this.miningStats = {
      hashRate: 0,
      hashRateUnit: "MH/s",
      miningTime: 0,
      powerUsage: 0,
      temperature: 35,
      isActive: false,
      poolName: "CryptoPool Pro",
      efficiency: 0,
    };

    this.balances = [
      {
        id: "1",
        symbol: "BTC",
        name: "Bitcoin",
        balance: 0,
        usdValue: 0,
        change24h: 2.45,
        icon: "btc",
      },
      {
        id: "2",
        symbol: "LTC",
        name: "Litecoin",
        balance: 0,
        usdValue: 0,
        change24h: 3.12,
        icon: "ltc",
      },
      {
        id: "3",
        symbol: "USDT",
        name: "Tether",
        balance: 0,
        usdValue: 0,
        change24h: 0.01,
        icon: "usdt",
      },
      {
        id: "4",
        symbol: "USDC",
        name: "USD Coin",
        balance: 0,
        usdValue: 0,
        change24h: -0.02,
        icon: "usdc",
      },
    ];

    this.transactions = [];

    this.pools = [
      {
        id: "1",
        name: "CryptoPool Pro",
        apy: 12.5,
        miners: 15420,
        hashRate: "458 TH/s",
        fee: 1,
        isActive: true,
      },
      {
        id: "2",
        name: "MegaHash",
        apy: 11.2,
        miners: 22150,
        hashRate: "892 TH/s",
        fee: 1.5,
        isActive: false,
      },
      {
        id: "3",
        name: "LightningPool",
        apy: 13.1,
        miners: 8750,
        hashRate: "215 TH/s",
        fee: 2,
        isActive: false,
      },
    ];

    this.chartData = generateChartData();

    this.settings = {
      miningIntensity: 75,
      notificationsEnabled: true,
      powerSaver: true,
      selectedPool: "1",
      twoFactorEnabled: false,
      biometricEnabled: false,
      currency: "USD",
      language: "English",
      sessionTimeout: 30,
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      firebaseUid: insertUser.firebaseUid || null,
      displayName: insertUser.displayName || null,
      photoUrl: insertUser.photoUrl || null,
      role: insertUser.role || "user",
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
      lastLoginAt: insertUser.lastLoginAt || null,
    };
    this.users.set(id, user);
    return user;
  }

  async getMiningStats(): Promise<MiningStats> {
    if (this.miningStats.isActive) {
      const fluctuation = (Math.random() - 0.5) * 4;
      const tempFluctuation = (Math.random() - 0.45) * 0.5;
      const timeIncrement = 0.05;
      
      this.miningStats.hashRate = parseFloat(Math.max(40, Math.min(65, this.miningStats.hashRate + fluctuation)).toFixed(2));
      this.miningStats.temperature = parseFloat(Math.min(78, Math.max(55, this.miningStats.temperature + tempFluctuation)).toFixed(1));
      this.miningStats.miningTime = parseFloat((this.miningStats.miningTime + timeIncrement).toFixed(2));
      this.miningStats.efficiency = parseFloat(Math.max(85, Math.min(98, this.miningStats.efficiency + (Math.random() - 0.5) * 0.5)).toFixed(1));
      this.miningStats.powerUsage = Math.round(Math.max(100, Math.min(150, this.miningStats.powerUsage + (Math.random() - 0.5) * 3)));
    }
    return { ...this.miningStats };
  }

  async updateMiningStats(stats: Partial<MiningStats>): Promise<MiningStats> {
    if (stats.isActive !== undefined) {
      if (stats.isActive) {
        const baseHashRate = 48 + Math.random() * 10;
        const baseTemp = 58 + Math.random() * 8;
        const basePower = 115 + Math.random() * 20;
        const efficiency = 90 + Math.random() * 8;
        
        this.miningStats = {
          hashRate: parseFloat(baseHashRate.toFixed(2)),
          hashRateUnit: "MH/s",
          miningTime: parseFloat((Math.random() * 2).toFixed(2)),
          powerUsage: Math.round(basePower),
          temperature: parseFloat(baseTemp.toFixed(1)),
          isActive: true,
          poolName: this.miningStats.poolName,
          efficiency: parseFloat(efficiency.toFixed(1)),
        };
      } else {
        this.miningStats = {
          hashRate: 0,
          hashRateUnit: "MH/s",
          miningTime: 0,
          powerUsage: 0,
          temperature: 35,
          isActive: false,
          poolName: this.miningStats.poolName,
          efficiency: 0,
        };
      }
    } else {
      this.miningStats = { ...this.miningStats, ...stats };
    }
    return { ...this.miningStats };
  }

  async getWalletBalances(): Promise<WalletBalance[]> {
    return [...this.balances];
  }

  async getTransactions(): Promise<LegacyTransaction[]> {
    return [...this.transactions];
  }

  async getMiningPools(): Promise<MiningPool[]> {
    return [...this.pools];
  }

  async selectPool(id: string): Promise<MiningPool[]> {
    this.pools = this.pools.map(pool => ({
      ...pool,
      isActive: pool.id === id,
    }));
    this.settings.selectedPool = id;
    const activePool = this.pools.find(p => p.isActive);
    if (activePool) {
      this.miningStats.poolName = activePool.name;
    }
    return [...this.pools];
  }

  async getChartData(): Promise<ChartDataPoint[]> {
    return [...this.chartData];
  }

  async getSettings(): Promise<UserSettings> {
    return { ...this.settings };
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    this.settings = { ...this.settings, ...settings };
    return { ...this.settings };
  }
}

export const storage = new MemStorage();
