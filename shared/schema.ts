import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with Firebase UID
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firebaseUid: text("firebase_uid").unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoUrl: text("photo_url"),
  role: text("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User wallets table
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  balance: real("balance").notNull().default(0),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

// Investment plans table
export const investmentPlans = pgTable("investment_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  minAmount: real("min_amount").notNull(),
  maxAmount: real("max_amount"),
  dailyReturnPercent: real("daily_return_percent").notNull().default(1),
  durationDays: integer("duration_days").notNull(),
  currency: text("currency").notNull().default("USDT"),
  isActive: boolean("is_active").notNull().default(true),
  iconUrl: text("icon_url"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvestmentPlanSchema = createInsertSchema(investmentPlans).omit({
  id: true,
  createdAt: true,
});

export type InsertInvestmentPlan = z.infer<typeof insertInvestmentPlanSchema>;
export type InvestmentPlan = typeof investmentPlans.$inferSelect;

// User investments table
export const investments = pgTable("investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: varchar("plan_id").notNull().references(() => investmentPlans.id),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("active"),
  totalEarned: real("total_earned").notNull().default(0),
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  startDate: true,
  totalEarned: true,
});

export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investments.$inferSelect;

// Earnings ledger for daily earnings
export const earnings = pgTable("earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  investmentId: varchar("investment_id").notNull().references(() => investments.id),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
  type: text("type").notNull().default("daily"),
});

export const insertEarningSchema = createInsertSchema(earnings).omit({
  id: true,
  earnedAt: true,
});

export type InsertEarning = z.infer<typeof insertEarningSchema>;
export type Earning = typeof earnings.$inferSelect;

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  walletId: varchar("wallet_id").references(() => wallets.id),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  toAddress: text("to_address"),
  fromAddress: text("from_address"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Miner pricing table
export const minerPricing = pgTable("miner_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  hashRate: real("hash_rate").notNull(),
  hashRateUnit: text("hash_rate_unit").notNull().default("TH/s"),
  priceUsd: real("price_usd").notNull(),
  powerConsumption: real("power_consumption"),
  algorithm: text("algorithm").notNull().default("SHA-256"),
  coin: text("coin").notNull().default("BTC"),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMinerPricingSchema = createInsertSchema(minerPricing).omit({
  id: true,
  createdAt: true,
});

export type InsertMinerPricing = z.infer<typeof insertMinerPricingSchema>;
export type MinerPricing = typeof minerPricing.$inferSelect;

// App content (pages, popups, banners)
export const appContent = pgTable("app_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content"),
  imageUrl: text("image_url"),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertAppContentSchema = createInsertSchema(appContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppContent = z.infer<typeof insertAppContentSchema>;
export type AppContent = typeof appContent.$inferSelect;

// Discounts/Promotions table
export const discounts = pgTable("discounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountPercent: real("discount_percent").notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDiscountSchema = createInsertSchema(discounts).omit({
  id: true,
  createdAt: true,
  usedCount: true,
});

export type InsertDiscount = z.infer<typeof insertDiscountSchema>;
export type Discount = typeof discounts.$inferSelect;

// App settings table
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  type: text("type").notNull().default("string"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type AppSetting = typeof appSettings.$inferSelect;

// Main app wallet (for withdrawals)
export const mainWallet = pgTable("main_wallet", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull().unique(),
  balance: real("balance").notNull().default(0),
  address: text("address"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMainWalletSchema = createInsertSchema(mainWallet).omit({
  id: true,
  updatedAt: true,
});

export type InsertMainWallet = z.infer<typeof insertMainWalletSchema>;
export type MainWallet = typeof mainWallet.$inferSelect;

// Legacy in-memory types for compatibility
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

export interface LegacyTransaction {
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
  powerSaver: boolean;
  selectedPool: string;
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  currency: 'USD' | 'EUR' | 'GBP';
  language: string;
  sessionTimeout: number;
}
