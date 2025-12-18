import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Copy, Check, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { CryptoCard } from "@/components/CryptoCard";
import { TransactionItem } from "@/components/TransactionItem";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { WalletBalance, Transaction } from "@/lib/types";
import walletImage from "@assets/Bitcoin_Wallet_1766014388613.png";
import btcLogo from "@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png";
import ltcLogo from "@assets/litecoin-3d-icon-png-download-4466121_1766014388608.png";
import usdtLogo from "@assets/tether-usdt-coin-3d-icon-png-download-3478983@0_1766038564971.webp";
import usdcLogo from "@assets/usd-coin-3d-icon-png-download-4102016_1766038596188.webp";

type CryptoType = "BTC" | "LTC" | "USDT" | "USDC";

interface NetworkOption {
  id: string;
  name: string;
  fee: number;
}

const cryptoNetworks: Record<CryptoType, NetworkOption[]> = {
  BTC: [
    { id: "btc-native", name: "Bitcoin (Native)", fee: 0.0001 },
    { id: "btc-lightning", name: "Lightning Network", fee: 0.000001 },
  ],
  LTC: [
    { id: "ltc-native", name: "Litecoin (Native)", fee: 0.001 },
  ],
  USDT: [
    { id: "usdt-erc20", name: "Ethereum (ERC-20)", fee: 5 },
    { id: "usdt-trc20", name: "Tron (TRC-20)", fee: 1 },
    { id: "usdt-bep20", name: "BSC (BEP-20)", fee: 0.5 },
    { id: "usdt-spl", name: "Solana (SPL)", fee: 0.1 },
  ],
  USDC: [
    { id: "usdc-erc20", name: "Ethereum (ERC-20)", fee: 5 },
    { id: "usdc-spl", name: "Solana (SPL)", fee: 0.1 },
    { id: "usdc-polygon", name: "Polygon", fee: 0.1 },
    { id: "usdc-arbitrum", name: "Arbitrum", fee: 0.5 },
  ],
};

const mockAddresses: Record<CryptoType, Record<string, string>> = {
  BTC: {
    "btc-native": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "btc-lightning": "lnbc1500n1psd9j2ypp5v4t6n7x5d9z0w5",
  },
  LTC: {
    "ltc-native": "ltc1qnwgk7zq9pmfd4kf8xyv7szpq3sn9v2hkz8xl7c",
  },
  USDT: {
    "usdt-erc20": "0x742d35Cc6634C0532925a3b844Bc9e7595f8fD0E",
    "usdt-trc20": "TJYkrshGGkQdXbQpACT6Zy8SiNmvk9kLd4",
    "usdt-bep20": "0x8B4FA6c928bc9c3E5b72f8B3F20E4C3B5f1e9D2A",
    "usdt-spl": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  },
  USDC: {
    "usdc-erc20": "0x4Dc20B7E5D2e4F8f11c7E6A9E3C1F5d8e2A7B6c3",
    "usdc-spl": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "usdc-polygon": "0x9aB4c8E2F7d3A6B1c5D0E9F8a7C6B5D4E3F2A1B0",
    "usdc-arbitrum": "0x1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D",
  },
};

const cryptoConfig: Record<CryptoType, { name: string; color: string; iconBg: string }> = {
  BTC: { name: "Bitcoin", color: "text-amber-400", iconBg: "bg-amber-500/20" },
  LTC: { name: "Litecoin", color: "text-blue-300", iconBg: "bg-blue-400/20" },
  USDT: { name: "Tether", color: "text-emerald-400", iconBg: "bg-emerald-500/20" },
  USDC: { name: "USD Coin", color: "text-blue-400", iconBg: "bg-blue-500/20" },
};

const defaultBalances: WalletBalance[] = [
  { id: "btc", symbol: "BTC", name: "Bitcoin", balance: 0.00234567, usdValue: 156.78, change24h: 2.34, icon: "bitcoin" },
  { id: "ltc", symbol: "LTC", name: "Litecoin", balance: 1.45678901, usdValue: 98.45, change24h: -1.23, icon: "litecoin" },
  { id: "usdt", symbol: "USDT", name: "Tether", balance: 250.00, usdValue: 250.00, change24h: 0.01, icon: "tether" },
  { id: "usdc", symbol: "USDC", name: "USD Coin", balance: 175.50, usdValue: 175.50, change24h: 0.02, icon: "usdc" },
];

interface WalletProps {
  balances?: WalletBalance[];
  transactions: Transaction[];
  totalBalance?: number;
  change24h?: number;
}

export function Wallet({ balances = defaultBalances, transactions, totalBalance, change24h = 1.45 }: WalletProps) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>("BTC");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [copied, setCopied] = useState(false);

  const calculatedTotalBalance = totalBalance ?? balances.reduce((sum, b) => sum + b.usdValue, 0);
  const isPositive = change24h >= 0;

  const handleCryptoChange = (crypto: CryptoType) => {
    setSelectedCrypto(crypto);
    setSelectedNetwork(cryptoNetworks[crypto][0].id);
  };

  const getCurrentAddress = () => {
    if (!selectedNetwork) return "";
    return mockAddresses[selectedCrypto]?.[selectedNetwork] || "";
  };

  const copyAddress = async () => {
    const address = getCurrentAddress();
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSelectedNetworkFee = () => {
    const network = cryptoNetworks[selectedCrypto]?.find(n => n.id === selectedNetwork);
    return network?.fee || 0;
  };

  const logoMap: Record<CryptoType, string> = {
    BTC: btcLogo,
    LTC: ltcLogo,
    USDT: usdtLogo,
    USDC: usdcLogo,
  };

  const openDepositModal = (crypto?: string) => {
    const cryptoType = (crypto as CryptoType) || "BTC";
    setSelectedCrypto(cryptoType);
    setSelectedNetwork(cryptoNetworks[cryptoType][0].id);
    setDepositOpen(true);
  };

  const openWithdrawModal = (crypto?: string) => {
    const cryptoType = (crypto as CryptoType) || "BTC";
    setSelectedCrypto(cryptoType);
    setSelectedNetwork(cryptoNetworks[cryptoType][0].id);
    setWithdrawAmount("");
    setWithdrawAddress("");
    setWithdrawOpen(true);
  };

  const CryptoIcon = ({ crypto, className }: { crypto: CryptoType; className?: string }) => (
    <img 
      src={logoMap[crypto]} 
      alt={crypto} 
      className={cn("w-5 h-5 object-contain", className)} 
    />
  );

  return (
    <motion.div
      className="flex flex-col gap-6 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4"
      >
        <img 
          src={walletImage} 
          alt="Crypto Wallet" 
          className="w-16 h-16 object-contain"
          data-testid="img-wallet-hero"
        />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Multi-crypto portfolio</p>
        </div>
      </motion.header>

      <GlassCard delay={0.1} className="relative overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5 rounded-2xl" />
        
        <div className="relative z-10">
          <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
          <div className="flex items-baseline gap-2 mb-2">
            <AnimatedCounter
              value={calculatedTotalBalance}
              decimals={2}
              prefix="$"
              className="text-4xl font-bold text-foreground"
              data-testid="text-total-balance"
            />
          </div>
          <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            <span data-testid="text-balance-change">{isPositive ? "+" : ""}{change24h.toFixed(2)}%</span>
            <span className="text-muted-foreground">today</span>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              data-testid="button-wallet-withdraw"
              variant="secondary"
              className="flex-1 liquid-glass border-0 bg-white/[0.08]"
              onClick={openWithdrawModal}
            >
              <ArrowUpRight className="w-5 h-5 mr-2" />
              Withdraw
            </Button>
            <Button
              data-testid="button-wallet-deposit"
              variant="secondary"
              className="flex-1 liquid-glass border-0 bg-white/[0.08]"
              onClick={openDepositModal}
            >
              <ArrowDownLeft className="w-5 h-5 mr-2" />
              Deposit
            </Button>
            <Button
              data-testid="button-wallet-swap"
              size="icon"
              variant="secondary"
              className="liquid-glass border-0 bg-white/[0.08]"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </GlassCard>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Assets</h2>
        <div className="flex flex-col gap-3">
          {balances.map((crypto, index) => (
            <CryptoCard 
              key={crypto.id} 
              crypto={crypto} 
              index={index}
              onDeposit={openDepositModal}
              onWithdraw={openWithdrawModal}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <GlassCard delay={0.3} className="p-4">
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <TransactionItem key={tx.id} transaction={tx} index={index} />
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Start mining to earn rewards
              </p>
            </div>
          )}
        </GlassCard>
      </div>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl max-w-md" data-testid="modal-deposit">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Deposit Crypto</DialogTitle>
            <DialogDescription>
              Select a cryptocurrency and network to receive funds
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-crypto">Cryptocurrency</Label>
              <Select
                value={selectedCrypto}
                onValueChange={(value) => handleCryptoChange(value as CryptoType)}
              >
                <SelectTrigger 
                  id="deposit-crypto" 
                  className="liquid-glass border-white/10"
                  data-testid="select-deposit-crypto"
                >
                  <SelectValue placeholder="Select crypto" />
                </SelectTrigger>
                <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                  {(["BTC", "LTC", "USDT", "USDC"] as CryptoType[]).map((crypto) => (
                    <SelectItem key={crypto} value={crypto} data-testid={`option-deposit-crypto-${crypto.toLowerCase()}`}>
                      <div className="flex items-center gap-2">
                        <CryptoIcon crypto={crypto} className="w-4 h-4" />
                        <span>{cryptoConfig[crypto].name}</span>
                        <span className="text-muted-foreground">({crypto})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit-network">Network</Label>
              <Select
                value={selectedNetwork}
                onValueChange={setSelectedNetwork}
              >
                <SelectTrigger 
                  id="deposit-network" 
                  className="liquid-glass border-white/10"
                  data-testid="select-deposit-network"
                >
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                  {cryptoNetworks[selectedCrypto]?.map((network) => (
                    <SelectItem key={network.id} value={network.id} data-testid={`option-deposit-network-${network.id}`}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deposit Address</Label>
              <div className="liquid-glass rounded-xl p-4 border border-white/10">
                <p 
                  className="text-sm font-mono break-all text-foreground mb-3"
                  data-testid="text-deposit-address"
                >
                  {getCurrentAddress()}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full liquid-glass border-0"
                  onClick={copyAddress}
                  data-testid="button-copy-address"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/80">
                Only send {selectedCrypto} via {cryptoNetworks[selectedCrypto]?.find(n => n.id === selectedNetwork)?.name || "selected network"} to this address.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl max-w-md" data-testid="modal-withdraw">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Withdraw Crypto</DialogTitle>
            <DialogDescription>
              Send cryptocurrency to an external wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-crypto">Cryptocurrency</Label>
              <Select
                value={selectedCrypto}
                onValueChange={(value) => handleCryptoChange(value as CryptoType)}
              >
                <SelectTrigger 
                  id="withdraw-crypto" 
                  className="liquid-glass border-white/10"
                  data-testid="select-withdraw-crypto"
                >
                  <SelectValue placeholder="Select crypto" />
                </SelectTrigger>
                <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                  {(["BTC", "LTC", "USDT", "USDC"] as CryptoType[]).map((crypto) => (
                    <SelectItem key={crypto} value={crypto} data-testid={`option-withdraw-crypto-${crypto.toLowerCase()}`}>
                      <div className="flex items-center gap-2">
                        <CryptoIcon crypto={crypto} className="w-4 h-4" />
                        <span>{cryptoConfig[crypto].name}</span>
                        <span className="text-muted-foreground">({crypto})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-network">Network</Label>
              <Select
                value={selectedNetwork}
                onValueChange={setSelectedNetwork}
              >
                <SelectTrigger 
                  id="withdraw-network" 
                  className="liquid-glass border-white/10"
                  data-testid="select-withdraw-network"
                >
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                  {cryptoNetworks[selectedCrypto]?.map((network) => (
                    <SelectItem key={network.id} value={network.id} data-testid={`option-withdraw-network-${network.id}`}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{network.name}</span>
                        <span className="text-muted-foreground text-xs">Fee: {network.fee} {selectedCrypto}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount</Label>
              <div className="relative">
                <Input
                  id="withdraw-amount"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="liquid-glass border-white/10 pr-16"
                  data-testid="input-withdraw-amount"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {selectedCrypto}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {balances.find(b => b.symbol === selectedCrypto)?.balance.toFixed(6) || "0.00"} {selectedCrypto}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-address">Destination Address</Label>
              <Input
                id="withdraw-address"
                type="text"
                placeholder={`Enter ${selectedCrypto} address`}
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="liquid-glass border-white/10 font-mono text-sm"
                data-testid="input-withdraw-address"
              />
            </div>

            <div className="liquid-glass rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span data-testid="text-withdraw-fee">{getSelectedNetworkFee()} {selectedCrypto}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You will receive</span>
                <span className="font-semibold" data-testid="text-withdraw-receive">
                  {withdrawAmount ? (parseFloat(withdrawAmount) - getSelectedNetworkFee()).toFixed(6) : "0.00"} {selectedCrypto}
                </span>
              </div>
            </div>

            <Button
              className="w-full liquid-glass bg-primary/80 border-0"
              disabled={!withdrawAmount || !withdrawAddress || parseFloat(withdrawAmount) <= getSelectedNetworkFee()}
              data-testid="button-confirm-withdraw"
            >
              Confirm Withdrawal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
