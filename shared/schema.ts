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

// ============ EARN/YIELD PLANS (Binance-style) ============

// Earn plan types (daily, weekly, monthly, quarterly, yearly)
export const earnPlanTypes = pgTable("earn_plan_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // daily, weekly, monthly, quarterly, yearly
  displayName: text("display_name").notNull(),
  periodDays: integer("period_days").notNull(),
  aprRate: real("apr_rate").notNull(), // Annual Percentage Rate
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertEarnPlanTypeSchema = createInsertSchema(earnPlanTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEarnPlanType = z.infer<typeof insertEarnPlanTypeSchema>;
export type EarnPlanType = typeof earnPlanTypes.$inferSelect;

// Earn plans for each cryptocurrency
export const earnPlans = pgTable("earn_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(), // BTC, ETH, USDT, etc.
  name: text("name").notNull(), // Bitcoin, Ethereum, etc.
  icon: text("icon"), // Icon character or URL
  colorPrimary: text("color_primary"), // Gradient start color
  colorSecondary: text("color_secondary"), // Gradient end color
  minAmount: real("min_amount").notNull().default(50),
  maxAmount: real("max_amount"),
  dailyApr: real("daily_apr").notNull().default(17.9),
  weeklyApr: real("weekly_apr").notNull().default(18.0),
  monthlyApr: real("monthly_apr").notNull().default(18.25),
  quarterlyApr: real("quarterly_apr").notNull().default(18.7),
  yearlyApr: real("yearly_apr").notNull().default(19.25),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertEarnPlanSchema = createInsertSchema(earnPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEarnPlan = z.infer<typeof insertEarnPlanSchema>;
export type EarnPlan = typeof earnPlans.$inferSelect;

// User earn subscriptions (deposits)
export const earnSubscriptions = pgTable("earn_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: varchar("plan_id").notNull().references(() => earnPlans.id),
  amount: real("amount").notNull(),
  symbol: text("symbol").notNull(),
  durationType: text("duration_type").notNull(), // daily, weekly, monthly, quarterly, yearly
  aprRate: real("apr_rate").notNull(),
  status: text("status").notNull().default("active"), // active, completed, withdrawn
  totalEarned: real("total_earned").notNull().default(0),
  lastEarningAt: timestamp("last_earning_at"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  withdrawnAt: timestamp("withdrawn_at"),
});

export const insertEarnSubscriptionSchema = createInsertSchema(earnSubscriptions).omit({
  id: true,
  startDate: true,
  totalEarned: true,
  lastEarningAt: true,
  withdrawnAt: true,
});

export type InsertEarnSubscription = z.infer<typeof insertEarnSubscriptionSchema>;
export type EarnSubscription = typeof earnSubscriptions.$inferSelect;

// Earn FAQs (admin-controlled)
export const earnFaqs = pgTable("earn_faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertEarnFaqSchema = createInsertSchema(earnFaqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEarnFaq = z.infer<typeof insertEarnFaqSchema>;
export type EarnFaq = typeof earnFaqs.$inferSelect;

// Earn page settings (trust badges, marketing content)
export const earnPageSettings = pgTable("earn_page_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  type: text("type").notNull().default("string"), // string, json, number, boolean
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEarnPageSettingSchema = createInsertSchema(earnPageSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertEarnPageSetting = z.infer<typeof insertEarnPageSettingSchema>;
export type EarnPageSetting = typeof earnPageSettings.$inferSelect;

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

// Master wallet for centralized control (owner's main wallet)
export const masterWallet = pgTable("main_wallet", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  network: text("network").notNull(),
  symbol: text("symbol").notNull(),
  address: text("address").notNull(),
  privateKeyEncrypted: text("private_key_encrypted"),
  balance: real("balance").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMasterWalletSchema = createInsertSchema(masterWallet).omit({
  id: true,
  updatedAt: true,
});

export type InsertMasterWallet = z.infer<typeof insertMasterWalletSchema>;
export type MasterWallet = typeof masterWallet.$inferSelect;

// User deposit addresses - HD derived unique addresses per user per network
export const depositAddresses = pgTable("deposit_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  network: text("network").notNull(),
  symbol: text("symbol").notNull(),
  address: text("address").notNull(),
  derivationIndex: integer("derivation_index").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDepositAddressSchema = createInsertSchema(depositAddresses).omit({
  id: true,
  createdAt: true,
});

export type InsertDepositAddress = z.infer<typeof insertDepositAddressSchema>;
export type DepositAddress = typeof depositAddresses.$inferSelect;

// Ledger entries for double-entry accounting
export const ledgerEntries = pgTable("ledger_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  network: text("network"),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  balanceBefore: real("balance_before").notNull().default(0),
  balanceAfter: real("balance_after").notNull().default(0),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  txHash: text("tx_hash"),
  note: text("note"),
  adminId: varchar("admin_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;

// Blockchain deposits detected
export const blockchainDeposits = pgTable("blockchain_deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  depositAddressId: varchar("deposit_address_id").notNull().references(() => depositAddresses.id),
  network: text("network").notNull(),
  symbol: text("symbol").notNull(),
  amount: real("amount").notNull(),
  txHash: text("tx_hash").notNull(),
  fromAddress: text("from_address"),
  confirmations: integer("confirmations").notNull().default(0),
  requiredConfirmations: integer("required_confirmations").notNull().default(3),
  status: text("status").notNull().default("pending"),
  sweptToMaster: boolean("swept_to_master").notNull().default(false),
  sweepTxHash: text("sweep_tx_hash"),
  creditedToLedger: boolean("credited_to_ledger").notNull().default(false),
  detectedAt: timestamp("detected_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  sweptAt: timestamp("swept_at"),
});

export const insertBlockchainDepositSchema = createInsertSchema(blockchainDeposits).omit({
  id: true,
  detectedAt: true,
  confirmedAt: true,
  sweptAt: true,
});

export type InsertBlockchainDeposit = z.infer<typeof insertBlockchainDepositSchema>;
export type BlockchainDeposit = typeof blockchainDeposits.$inferSelect;

// Withdrawal requests
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  network: text("network").notNull(),
  amount: real("amount").notNull(),
  fee: real("fee").notNull().default(0),
  netAmount: real("net_amount").notNull(),
  toAddress: text("to_address").notNull(),
  status: text("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  adminId: varchar("admin_id").references(() => users.id),
  adminNote: text("admin_note"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  requestedAt: true,
  processedAt: true,
  completedAt: true,
  rejectedAt: true,
});

export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

// Admin actions audit log
export const adminActions = pgTable("admin_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  targetUserId: varchar("target_user_id").references(() => users.id),
  actionType: text("action_type").notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminActionSchema = createInsertSchema(adminActions).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type AdminAction = typeof adminActions.$inferSelect;

// Network configuration for supported chains
export const networkConfig = pgTable("network_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  network: text("network").notNull().unique(),
  chainId: integer("chain_id"),
  rpcUrl: text("rpc_url"),
  explorerUrl: text("explorer_url"),
  nativeSymbol: text("native_symbol").notNull(),
  requiredConfirmations: integer("required_confirmations").notNull().default(3),
  withdrawalFee: real("withdrawal_fee").notNull().default(0),
  minWithdrawal: real("min_withdrawal").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNetworkConfigSchema = createInsertSchema(networkConfig).omit({
  id: true,
  updatedAt: true,
});

export type InsertNetworkConfig = z.infer<typeof insertNetworkConfigSchema>;
export type NetworkConfig = typeof networkConfig.$inferSelect;

// Interest/reward payments
export const interestPayments = pgTable("interest_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  amount: real("amount").notNull(),
  ratePercent: real("rate_percent").notNull(),
  principalAmount: real("principal_amount").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  status: text("status").notNull().default("pending"),
  ledgerEntryId: varchar("ledger_entry_id").references(() => ledgerEntries.id),
  adminId: varchar("admin_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const insertInterestPaymentSchema = createInsertSchema(interestPayments).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

export type InsertInterestPayment = z.infer<typeof insertInterestPaymentSchema>;
export type InterestPayment = typeof interestPayments.$inferSelect;

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

// ============ NOTIFICATIONS SYSTEM ============

// Notification types for users and admins
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // deposit, withdrawal, reward, daily_return, promotion, system, admin_alert
  category: text("category").notNull().default("user"), // user, admin
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional data like txHash, amount, etc.
  isRead: boolean("is_read").notNull().default(false),
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ============ SUPPORT TICKETS SYSTEM ============

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"), // general, deposit, withdrawal, mining, technical, other
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  resolvedAt: timestamp("resolved_at"),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

// Support ticket messages
export const ticketMessages = pgTable("ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => supportTickets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;

// ============ ADMIN CONFIGURATION SYSTEM (SaaS-Style) ============

// API Keys and Service Configurations
export const apiConfigs = pgTable("api_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceName: text("service_name").notNull().unique(), // blockchain_api, payment_gateway, firebase, messaging, etc.
  displayName: text("display_name").notNull(),
  description: text("description"),
  apiKey: text("api_key"), // Encrypted
  apiSecret: text("api_secret"), // Encrypted
  endpoint: text("endpoint"),
  additionalConfig: jsonb("additional_config"), // Extra config like webhookUrl, projectId, etc.
  isEnabled: boolean("is_enabled").notNull().default(false),
  isRequired: boolean("is_required").notNull().default(false),
  lastTestedAt: timestamp("last_tested_at"),
  testStatus: text("test_status"), // success, failed, pending
  category: text("category").notNull().default("other"), // blockchain, payment, messaging, analytics, other
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertApiConfigSchema = createInsertSchema(apiConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTestedAt: true,
});

export type InsertApiConfig = z.infer<typeof insertApiConfigSchema>;
export type ApiConfig = typeof apiConfigs.$inferSelect;

// Feature Toggles for enabling/disabling app features
export const featureToggles = pgTable("feature_toggles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  featureName: text("feature_name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  isEnabled: boolean("is_enabled").notNull().default(false),
  category: text("category").notNull().default("general"), // mining, wallet, social, admin, general
  dependsOn: text("depends_on"), // Another feature this depends on
  config: jsonb("config"), // Feature-specific configuration
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertFeatureToggleSchema = createInsertSchema(featureToggles).omit({
  id: true,
  updatedAt: true,
});

export type InsertFeatureToggle = z.infer<typeof insertFeatureToggleSchema>;
export type FeatureToggle = typeof featureToggles.$inferSelect;

// Daily Returns Configuration
export const dailyReturnConfig = pgTable("daily_return_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").references(() => investmentPlans.id),
  baseRate: real("base_rate").notNull().default(1), // Base daily return percentage
  minRate: real("min_rate").notNull().default(0.5),
  maxRate: real("max_rate").notNull().default(2),
  isAutomatic: boolean("is_automatic").notNull().default(true),
  processingTime: text("processing_time").notNull().default("00:00"), // UTC time for auto-processing
  lastProcessedAt: timestamp("last_processed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertDailyReturnConfigSchema = createInsertSchema(dailyReturnConfig).omit({
  id: true,
  updatedAt: true,
  lastProcessedAt: true,
});

export type InsertDailyReturnConfig = z.infer<typeof insertDailyReturnConfigSchema>;
export type DailyReturnConfig = typeof dailyReturnConfig.$inferSelect;

// UI Theme Configuration
export const themeConfig = pgTable("theme_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  colors: jsonb("colors").notNull(), // { primary, secondary, accent, background, etc. }
  fonts: jsonb("fonts"), // { heading, body, mono }
  isActive: boolean("is_active").notNull().default(false),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertThemeConfigSchema = createInsertSchema(themeConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertThemeConfig = z.infer<typeof insertThemeConfigSchema>;
export type ThemeConfig = typeof themeConfig.$inferSelect;

// Admin Emails Configuration (who can be admin)
export const adminEmails = pgTable("admin_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("admin"), // admin, super_admin
  permissions: jsonb("permissions"), // Granular permissions
  addedBy: varchar("added_by").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminEmailSchema = createInsertSchema(adminEmails).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminEmail = z.infer<typeof insertAdminEmailSchema>;
export type AdminEmail = typeof adminEmails.$inferSelect;

// Reward Rules for automated rewards
export const rewardRules = pgTable("reward_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // signup, deposit, referral, milestone, daily_login, etc.
  triggerCondition: jsonb("trigger_condition"), // { minAmount: 100, currency: "USDT" }
  rewardType: text("reward_type").notNull(), // bonus, hashpower, discount, free_plan
  rewardAmount: real("reward_amount").notNull(),
  rewardCurrency: text("reward_currency"),
  maxRewardsPerUser: integer("max_rewards_per_user").default(1),
  totalBudget: real("total_budget"),
  usedBudget: real("used_budget").default(0),
  isActive: boolean("is_active").notNull().default(true),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertRewardRuleSchema = createInsertSchema(rewardRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usedBudget: true,
});

export type InsertRewardRule = z.infer<typeof insertRewardRuleSchema>;
export type RewardRule = typeof rewardRules.$inferSelect;

// User notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  deposits: boolean("deposits").notNull().default(true),
  withdrawals: boolean("withdrawals").notNull().default(true),
  rewards: boolean("rewards").notNull().default(true),
  dailyReturns: boolean("daily_returns").notNull().default(true),
  promotions: boolean("promotions").notNull().default(true),
  systemAlerts: boolean("system_alerts").notNull().default(true),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  updatedAt: true,
});

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

// Promotional offers/banners for slider
export const promotionalOffers = pgTable("promotional_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  imageUrl: text("image_url"),
  backgroundType: integer("background_type").notNull().default(1), // 1-10 predefined backgrounds
  ctaText: text("cta_text"), // Call-to-action button text
  ctaLink: text("cta_link"), // Link when clicked
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertPromotionalOfferSchema = createInsertSchema(promotionalOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPromotionalOffer = z.infer<typeof insertPromotionalOfferSchema>;
export type PromotionalOffer = typeof promotionalOffers.$inferSelect;
