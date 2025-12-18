import { motion } from "framer-motion";
import { Bell, ArrowDownToLine, ArrowUpFromLine, Settings, DollarSign } from "lucide-react";
import { GlassCard, LiquidGlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import type { WalletBalance, Transaction } from "@/lib/types";

import mixedMain from "@assets/Mixed_main_1766014388605.png";
import gpuMining from "@assets/Gpu_Mining_1766014388614.png";
import btcWallet from "@assets/Bitcoin_Wallet_1766014388613.png";
import btcCalc from "@assets/Bitcoin_calculation_1766014388615.png";
import serverMining from "@assets/Server_Mining_1766014388610.png";
import btcShop from "@assets/Bitcoin_shop_1766014388611.png";
import btcLogo from "@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png";
import ltcLogo from "@assets/litecoin-3d-icon-png-download-4466121_1766014388608.png";
import usdtLogo from "@assets/stock_images/usdt_tether_cryptocu_4498e890.jpg";
import usdcLogo from "@assets/stock_images/usdc_usd_coin_crypto_278bc2c1.jpg";

interface DashboardProps {
  balances: WalletBalance[];
  totalBalance: number;
  change24h: number;
  transactions?: Transaction[];
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onOpenSettings?: () => void;
}

export function Dashboard({ 
  balances = [], 
  totalBalance = 0, 
  change24h = 0,
  transactions = [],
  onDeposit, 
  onWithdraw,
  onOpenSettings
}: DashboardProps) {
  const safeChange24h = change24h ?? 0;
  const isPositiveChange = safeChange24h >= 0;
  const activeContracts = 3;
  const totalEarned = 0.00847;
  const miningPower = "125 TH/s";
  const daysActive = 45;

  return (
    <motion.div
      className="flex flex-col gap-6 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.header
        className="flex items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-bold text-foreground font-display">Miners Clab</h1>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            data-testid="button-settings"
            onClick={onOpenSettings}
            className="relative w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate"
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <motion.button
            data-testid="button-notifications"
            className="relative w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate"
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </motion.button>
        </div>
      </motion.header>

      <LiquidGlassCard glow="btc" delay={0.1} variant="strong" className="relative">
        <div className="absolute -right-4 -top-4 w-32 h-32 opacity-90 pointer-events-none">
          <motion.img 
            src={mixedMain}
            alt="Mining GPU"
            className="w-full h-full object-contain"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-muted-foreground">Portfolio Value</span>
          </div>

          <div className="mb-1">
            <div className="flex items-baseline gap-1">
              <span className="text-lg text-muted-foreground">$</span>
              <AnimatedCounter
                value={totalBalance}
                decimals={2}
                className="text-4xl font-bold text-foreground tracking-tight"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className={`text-sm font-medium ${isPositiveChange ? "text-emerald-400" : "text-red-400"}`}>
              {isPositiveChange ? "+" : ""}{safeChange24h.toFixed(2)}%
            </span>
            <span className="text-sm text-muted-foreground">24h change</span>
          </div>

          <div className="flex gap-3">
            <Button
              data-testid="button-deposit"
              onClick={onDeposit}
              className="flex-1 liquid-glass border-0 bg-primary/20 text-foreground gap-2"
              variant="ghost"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Deposit
            </Button>
            <Button
              data-testid="button-withdraw"
              onClick={onWithdraw}
              className="flex-1 liquid-glass border-0 bg-white/5 text-foreground gap-2"
              variant="ghost"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              Withdraw
            </Button>
          </div>
        </div>
      </LiquidGlassCard>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4 font-display">Mining Performance</h2>
        <GlassCard delay={0.25} className="p-5 relative overflow-hidden" glow="primary">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-5">
              <motion.img 
                src={gpuMining} 
                alt="Mining" 
                className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Total Hashrate</p>
                <p className="text-3xl font-bold text-foreground font-display" data-testid="text-hash-power">{miningPower}</p>
                <p className="text-xs text-emerald-400 mt-1">Active & Mining</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="liquid-glass rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground font-display" data-testid="text-active-contracts">{activeContracts}</p>
                <p className="text-xs text-muted-foreground">Contracts</p>
              </div>
              <div className="liquid-glass rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400 font-display" data-testid="text-total-earned">{totalEarned}</p>
                <p className="text-xs text-muted-foreground">Earned (BTC)</p>
              </div>
              <div className="liquid-glass rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground font-display" data-testid="text-days-active">{daysActive}</p>
                <p className="text-xs text-muted-foreground">Days</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Assets</h2>
        <GlassCard delay={0.5} className="p-4">
          <div className="space-y-4">
            {balances.length > 0 ? (
              balances.slice(0, 3).map((balance, index) => (
                <motion.div
                  key={balance.id}
                  className="flex items-center justify-between gap-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  data-testid={`asset-row-${balance.id}`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={
                        balance.symbol === 'BTC' ? btcLogo : 
                        balance.symbol === 'LTC' ? ltcLogo : 
                        balance.symbol === 'USDT' ? usdtLogo : usdcLogo
                      } 
                      alt={balance.symbol}
                      className="w-10 h-10 shrink-0 object-contain rounded-full"
                    />
                    <div>
                      <p className="font-medium text-foreground">{balance.name}</p>
                      <p className="text-sm text-muted-foreground">{(balance.balance ?? 0).toFixed(6)} {balance.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">${(balance.usdValue ?? 0).toFixed(2)}</p>
                    <p className={`text-sm ${(balance.change24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(balance.change24h ?? 0) >= 0 ? '+' : ''}{(balance.change24h ?? 0).toFixed(2)}%
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No assets yet</p>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4 font-display">Premium Features</h2>
        <div className="space-y-3">
          <GlassCard delay={0.6} className="p-4 hover-elevate cursor-pointer" glow="primary">
            <div className="flex items-center gap-4">
              <motion.img 
                src={serverMining}
                alt="Buy Hashpower"
                className="w-14 h-14 object-contain"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <div className="flex-1">
                <p className="font-semibold text-foreground font-display">Buy Hashpower</p>
                <p className="text-sm text-muted-foreground">Upgrade your mining capacity</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.65} className="p-4 hover-elevate cursor-pointer" glow="btc">
            <div className="flex items-center gap-4">
              <motion.img 
                src={btcShop}
                alt="Solo Mining"
                className="w-14 h-14 object-contain"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <div className="flex-1">
                <p className="font-semibold text-foreground font-display">Solo Mining Jackpot</p>
                <p className="text-sm text-muted-foreground">Win full 3 BTC block rewards</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 font-bold text-sm">3</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </motion.div>
  );
}
