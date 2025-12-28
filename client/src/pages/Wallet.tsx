import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Copy, Check, AlertCircle, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Info } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { CryptoCard } from "@/components/CryptoCard";
import { TransactionItem } from "@/components/TransactionItem";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import type { WalletBalance, Transaction } from "@/lib/types";
import walletImage from "@assets/Bitcoin_Wallet_1766014388613.png";
import btcLogo from "@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png";
import ltcLogo from "@assets/litecoin-3d-icon-png-download-4466121_1766014388608.png";
import usdtLogo from "@assets/tether-usdt-coin-3d-icon-png-download-3478983@0_1766038564971.webp";
import usdcLogo from "@assets/usd-coin-3d-icon-png-download-4102016_1766038596188.webp";

type CryptoType = "BTC" | "LTC" | "ETH" | "USDT" | "USDC" | "TON";

interface NetworkOption {
  id: string;
  name: string;
  fee: number;
  estimatedTime: string;
}

const cryptoNetworks: Record<CryptoType, NetworkOption[]> = {
  BTC: [
    { id: "btc-native", name: "Bitcoin (Native)", fee: 0.0001, estimatedTime: "30-60 min" },
    { id: "btc-lightning", name: "Lightning Network", fee: 0.000001, estimatedTime: "Instant" },
  ],
  LTC: [
    { id: "ltc-native", name: "Litecoin (Native)", fee: 0.001, estimatedTime: "5-10 min" },
  ],
  ETH: [
    { id: "eth-erc20", name: "Ethereum (ERC-20)", fee: 0.005, estimatedTime: "5-15 min" },
    { id: "eth-arbitrum", name: "Arbitrum", fee: 0.0005, estimatedTime: "1-5 min" },
    { id: "eth-optimism", name: "Optimism", fee: 0.0005, estimatedTime: "1-5 min" },
  ],
  USDT: [
    { id: "usdt-erc20", name: "Ethereum (ERC-20)", fee: 5, estimatedTime: "5-15 min" },
    { id: "usdt-trc20", name: "Tron (TRC-20)", fee: 1, estimatedTime: "1-3 min" },
    { id: "usdt-bep20", name: "BSC (BEP-20)", fee: 0.5, estimatedTime: "1-5 min" },
    { id: "usdt-ton", name: "TON Network", fee: 0.3, estimatedTime: "1-2 min" },
  ],
  USDC: [
    { id: "usdc-erc20", name: "Ethereum (ERC-20)", fee: 5, estimatedTime: "5-15 min" },
    { id: "usdc-trc20", name: "Tron (TRC-20)", fee: 1, estimatedTime: "1-3 min" },
    { id: "usdc-bep20", name: "BSC (BEP-20)", fee: 0.5, estimatedTime: "1-5 min" },
    { id: "usdc-polygon", name: "Polygon", fee: 0.1, estimatedTime: "1-3 min" },
    { id: "usdc-arbitrum", name: "Arbitrum", fee: 0.5, estimatedTime: "1-5 min" },
  ],
  TON: [
    { id: "ton-native", name: "TON Network", fee: 0.01, estimatedTime: "1-2 min" },
  ],
};

const generateDepositAddress = (crypto: CryptoType, network: string): string => {
  const addressPrefixes: Record<string, string> = {
    "btc-native": "bc1q",
    "btc-lightning": "lnbc",
    "ltc-native": "ltc1q",
    "eth-erc20": "0x",
    "eth-arbitrum": "0x",
    "eth-optimism": "0x",
    "usdt-erc20": "0x",
    "usdt-trc20": "T",
    "usdt-bep20": "0x",
    "usdt-ton": "UQ",
    "usdc-erc20": "0x",
    "usdc-trc20": "T",
    "usdc-bep20": "0x",
    "usdc-polygon": "0x",
    "usdc-arbitrum": "0x",
    "ton-native": "UQ",
  };
  
  const prefix = addressPrefixes[network] || "0x";
  const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  if (prefix === "0x") {
    return prefix + "742d35Cc6634C0532925a3b844Bc9e7595f8" + randomPart.substring(0, 4).toUpperCase();
  } else if (prefix === "T") {
    return prefix + "JYkrshGGkQdXbQpACT6Zy8SiNmvk9kL" + randomPart.substring(0, 3);
  } else if (prefix === "UQ") {
    return prefix + "B3mWpBrjI2TxGwMKl_JxZTMVvQ1TChJtR" + randomPart.substring(0, 8);
  } else if (prefix === "bc1q" || prefix === "ltc1q") {
    return prefix + "nwgk7zq9pmfd4kf8xyv7szpq3sn9v2hkz8xl7c";
  } else {
    return prefix + "1500n1psd9j2ypp5v4t6n7x5d9z0w5";
  }
};

const cryptoConfig: Record<CryptoType, { name: string; color: string; iconBg: string }> = {
  BTC: { name: "Bitcoin", color: "text-amber-400", iconBg: "bg-amber-500/20" },
  LTC: { name: "Litecoin", color: "text-blue-300", iconBg: "bg-blue-400/20" },
  ETH: { name: "Ethereum", color: "text-purple-400", iconBg: "bg-purple-500/20" },
  USDT: { name: "Tether", color: "text-emerald-400", iconBg: "bg-emerald-500/20" },
  USDC: { name: "USD Coin", color: "text-blue-400", iconBg: "bg-blue-500/20" },
  TON: { name: "Toncoin", color: "text-cyan-400", iconBg: "bg-cyan-500/20" },
};

const defaultBalances: WalletBalance[] = [
  { id: "btc", symbol: "BTC", name: "Bitcoin", balance: 0, usdValue: 0, change24h: 2.34, icon: "bitcoin" },
  { id: "ltc", symbol: "LTC", name: "Litecoin", balance: 0, usdValue: 0, change24h: -1.23, icon: "litecoin" },
  { id: "usdt", symbol: "USDT", name: "Tether", balance: 0, usdValue: 0, change24h: 0.01, icon: "tether" },
  { id: "usdc", symbol: "USDC", name: "USD Coin", balance: 0, usdValue: 0, change24h: 0.02, icon: "usdc" },
];

interface WalletProps {
  balances?: WalletBalance[];
  transactions: Transaction[];
  totalBalance?: number;
  change24h?: number;
  onOpenExchange?: () => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

export function Wallet({ 
  balances = defaultBalances, 
  transactions, 
  totalBalance, 
  change24h = 0,
  onOpenExchange,
  onOpenDeposit,
  onOpenWithdraw 
}: WalletProps) {
  const { convert, getSymbol } = useCurrency();
  const { toast } = useToast();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>("BTC");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [depositAddress, setDepositAddress] = useState("");
  
  const [exchangeFrom, setExchangeFrom] = useState<CryptoType>("BTC");
  const [exchangeTo, setExchangeTo] = useState<CryptoType>("USDT");
  const [exchangeAmount, setExchangeAmount] = useState("");

  const calculatedTotalBalance = totalBalance ?? balances.reduce((sum, b) => sum + b.usdValue, 0);
  const convertedBalance = convert(calculatedTotalBalance);
  const isPositive = change24h >= 0;
  const hasNoBalance = calculatedTotalBalance === 0;

  const cryptoPrices: Record<CryptoType, number> = {
    BTC: 67000,
    LTC: 85,
    ETH: 3500,
    USDT: 1,
    USDC: 1,
    TON: 5.5,
  };

  const handleCryptoChange = (crypto: CryptoType) => {
    setSelectedCrypto(crypto);
    const networks = cryptoNetworks[crypto];
    if (networks && networks.length > 0) {
      setSelectedNetwork(networks[0].id);
      setDepositAddress(generateDepositAddress(crypto, networks[0].id));
    }
  };

  const handleNetworkChange = (network: string) => {
    setSelectedNetwork(network);
    setDepositAddress(generateDepositAddress(selectedCrypto, network));
  };

  const copyAddress = async () => {
    if (depositAddress) {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSelectedNetworkFee = () => {
    const network = cryptoNetworks[selectedCrypto]?.find(n => n.id === selectedNetwork);
    return network?.fee || 0;
  };

  const getSelectedNetworkTime = () => {
    const network = cryptoNetworks[selectedCrypto]?.find(n => n.id === selectedNetwork);
    return network?.estimatedTime || "Unknown";
  };

  const getCurrentBalance = (crypto: CryptoType) => {
    return balances.find(b => b.symbol === crypto)?.balance || 0;
  };

  const logoMap: Record<string, string> = {
    BTC: btcLogo,
    LTC: ltcLogo,
    USDT: usdtLogo,
    USDC: usdcLogo,
  };

  const openDepositModal = (crypto?: string) => {
    const cryptoType = (crypto as CryptoType) || "BTC";
    setSelectedCrypto(cryptoType);
    const networks = cryptoNetworks[cryptoType];
    if (networks && networks.length > 0) {
      setSelectedNetwork(networks[0].id);
      setDepositAddress(generateDepositAddress(cryptoType, networks[0].id));
    }
    setDepositOpen(true);
  };

  const openWithdrawModal = (crypto?: string) => {
    const cryptoType = (crypto as CryptoType) || "BTC";
    setSelectedCrypto(cryptoType);
    const networks = cryptoNetworks[cryptoType];
    if (networks && networks.length > 0) {
      setSelectedNetwork(networks[0].id);
    }
    setWithdrawAmount("");
    setWithdrawAddress("");
    setWithdrawOpen(true);
  };

  const handleWithdraw = () => {
    const balance = getCurrentBalance(selectedCrypto);
    const amount = parseFloat(withdrawAmount);
    const fee = getSelectedNetworkFee();
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${selectedCrypto} to complete this withdrawal.`,
        variant: "destructive",
      });
      return;
    }
    
    if (amount <= fee) {
      toast({
        title: "Amount Too Low",
        description: "Withdrawal amount must be greater than the network fee.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Withdrawal Submitted",
      description: `Your withdrawal of ${(amount - fee).toFixed(6)} ${selectedCrypto} is being processed.`,
    });
    setWithdrawOpen(false);
  };

  const calculateExchangeOutput = () => {
    if (!exchangeAmount || parseFloat(exchangeAmount) <= 0) return "0.00";
    const inputValue = parseFloat(exchangeAmount) * cryptoPrices[exchangeFrom];
    const outputAmount = inputValue / cryptoPrices[exchangeTo];
    return outputAmount.toFixed(6);
  };

  const handleExchange = () => {
    const fromBalance = getCurrentBalance(exchangeFrom);
    const amount = parseFloat(exchangeAmount);
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid exchange amount.",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > fromBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${exchangeFrom} to complete this exchange.`,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Exchange Submitted",
      description: `Converting ${amount} ${exchangeFrom} to ${calculateExchangeOutput()} ${exchangeTo}. We handle all blockchain bridging for you.`,
    });
    setExchangeOpen(false);
  };

  const CryptoIcon = ({ crypto, className }: { crypto: CryptoType; className?: string }) => {
    if (logoMap[crypto]) {
      return <img src={logoMap[crypto]} alt={crypto} className={cn("w-5 h-5 object-contain", className)} />;
    }
    return (
      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold", cryptoConfig[crypto].iconBg, cryptoConfig[crypto].color, className)}>
        {crypto.charAt(0)}
      </div>
    );
  };

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
              value={convertedBalance}
              decimals={2}
              prefix={getSymbol()}
              className="text-4xl font-bold text-foreground"
              data-testid="text-total-balance"
            />
          </div>
          <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            <span data-testid="text-balance-change">{isPositive ? "+" : ""}{change24h.toFixed(2)}%</span>
            <span className="text-muted-foreground">today</span>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <div className="flex gap-3">
              <Button
                data-testid="button-wallet-deposit"
                variant="secondary"
                className="flex-1 liquid-glass border-0 bg-emerald-500/20"
                onClick={() => openDepositModal()}
              >
                <ArrowDownToLine className="w-5 h-5 mr-2" />
                Deposit
              </Button>
              <Button
                data-testid="button-wallet-withdraw"
                variant="secondary"
                className="flex-1 liquid-glass border-0 bg-amber-500/20"
                onClick={() => openWithdrawModal()}
              >
                <ArrowUpFromLine className="w-5 h-5 mr-2" />
                Withdraw
              </Button>
            </div>
            <Link href="/exchange">
              <Button
                data-testid="button-wallet-exchange"
                variant="secondary"
                className="w-full liquid-glass border-0 bg-primary/20"
              >
                <ArrowLeftRight className="w-5 h-5 mr-2" />
                Exchange
              </Button>
            </Link>
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
                Start mining or deposit funds to see activity
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

          <div className="space-y-5 mt-4">
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
                  {(["BTC", "LTC", "ETH", "USDT", "USDC", "TON"] as CryptoType[]).map((crypto) => (
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
                onValueChange={handleNetworkChange}
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
                      <div className="flex items-center justify-between w-full">
                        <span>{network.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Your Deposit Address</Label>
              <div className="liquid-glass rounded-xl p-4 border border-white/10">
                <p 
                  className="text-sm font-mono break-all text-foreground mb-3"
                  data-testid="text-deposit-address"
                >
                  {depositAddress || "Select network to generate address"}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full liquid-glass border-0"
                  onClick={copyAddress}
                  disabled={!depositAddress}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Arrival</span>
                <span>{getSelectedNetworkTime()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Minimum Deposit</span>
                <span>{getSelectedNetworkFee() * 2} {selectedCrypto}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/80">
                Only send {selectedCrypto} via {cryptoNetworks[selectedCrypto]?.find(n => n.id === selectedNetwork)?.name || "selected network"} to this address. Sending via wrong network may result in permanent loss of funds.
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
            {hasNoBalance && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">No Balance Available</p>
                  <p className="text-xs text-red-300/80 mt-1">
                    You don't have any funds to withdraw. Please deposit or earn mining rewards first.
                  </p>
                </div>
              </div>
            )}

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
                  {(["BTC", "LTC", "ETH", "USDT", "USDC", "TON"] as CryptoType[]).map((crypto) => (
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
              <p className="text-xs text-muted-foreground">
                Available: {getCurrentBalance(selectedCrypto).toFixed(6)} {selectedCrypto}
              </p>
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
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary"
                onClick={() => {
                  const balance = getCurrentBalance(selectedCrypto);
                  const fee = getSelectedNetworkFee();
                  if (balance > fee) {
                    setWithdrawAmount((balance - fee).toFixed(6));
                  }
                }}
              >
                Use Max
              </Button>
            </div>

            <div className="liquid-glass rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span data-testid="text-withdraw-fee">{getSelectedNetworkFee()} {selectedCrypto}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated Time</span>
                <span>{getSelectedNetworkTime()}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-2">
                <span className="text-muted-foreground">You will receive</span>
                <span className="font-semibold" data-testid="text-withdraw-receive">
                  {withdrawAmount && parseFloat(withdrawAmount) > getSelectedNetworkFee() 
                    ? (parseFloat(withdrawAmount) - getSelectedNetworkFee()).toFixed(6) 
                    : "0.00"} {selectedCrypto}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Important Warning</p>
                <p className="text-xs text-red-300/80 mt-1">
                  Please ensure the destination address and network are correct. Sending funds to the wrong address or network may result in permanent loss of your cryptocurrency.
                </p>
              </div>
            </div>

            <Button
              className="w-full liquid-glass bg-primary/80 border-0"
              disabled={!withdrawAmount || !withdrawAddress || parseFloat(withdrawAmount) <= getSelectedNetworkFee() || parseFloat(withdrawAmount) > getCurrentBalance(selectedCrypto)}
              onClick={handleWithdraw}
              data-testid="button-confirm-withdraw"
            >
              Confirm Withdrawal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={exchangeOpen} onOpenChange={setExchangeOpen}>
        <DialogContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl max-w-md" data-testid="modal-exchange">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Exchange Crypto</DialogTitle>
            <DialogDescription>
              Swap between supported cryptocurrencies instantly
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {hasNoBalance && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Insufficient Balance</p>
                  <p className="text-xs text-red-300/80 mt-1">
                    You don't have any funds to exchange. Please deposit funds first.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-200/80">
                We handle all blockchain bridging and network conversions for you. Your exchange will be processed at the current market rate.
              </p>
            </div>

            <div className="space-y-2">
              <Label>From</Label>
              <div className="flex gap-2">
                <Select
                  value={exchangeFrom}
                  onValueChange={(value) => setExchangeFrom(value as CryptoType)}
                >
                  <SelectTrigger className="w-32 liquid-glass border-white/10" data-testid="select-exchange-from">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                    {(["BTC", "LTC", "ETH", "USDT", "USDC", "TON"] as CryptoType[]).map((crypto) => (
                      <SelectItem key={crypto} value={crypto} data-testid={`option-exchange-from-${crypto.toLowerCase()}`}>
                        <div className="flex items-center gap-2">
                          <CryptoIcon crypto={crypto} className="w-4 h-4" />
                          <span>{crypto}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={exchangeAmount}
                  onChange={(e) => setExchangeAmount(e.target.value)}
                  className="flex-1 liquid-glass border-white/10"
                  data-testid="input-exchange-amount"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {getCurrentBalance(exchangeFrom).toFixed(6)} {exchangeFrom}
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  const temp = exchangeFrom;
                  setExchangeFrom(exchangeTo);
                  setExchangeTo(temp);
                }}
                data-testid="button-swap-direction"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>To</Label>
              <div className="flex gap-2">
                <Select
                  value={exchangeTo}
                  onValueChange={(value) => setExchangeTo(value as CryptoType)}
                >
                  <SelectTrigger className="w-32 liquid-glass border-white/10" data-testid="select-exchange-to">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                    {(["BTC", "LTC", "ETH", "USDT", "USDC", "TON"] as CryptoType[]).filter(c => c !== exchangeFrom).map((crypto) => (
                      <SelectItem key={crypto} value={crypto} data-testid={`option-exchange-to-${crypto.toLowerCase()}`}>
                        <div className="flex items-center gap-2">
                          <CryptoIcon crypto={crypto} className="w-4 h-4" />
                          <span>{crypto}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  value={calculateExchangeOutput()}
                  readOnly
                  className="flex-1 liquid-glass border-white/10 bg-white/5"
                  data-testid="text-exchange-output"
                />
              </div>
            </div>

            <div className="liquid-glass rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span>1 {exchangeFrom} = {(cryptoPrices[exchangeFrom] / cryptoPrices[exchangeTo]).toFixed(6)} {exchangeTo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Processing Fee</span>
                <span>0.5%</span>
              </div>
            </div>

            <Button
              className="w-full liquid-glass bg-primary/80 border-0"
              disabled={!exchangeAmount || parseFloat(exchangeAmount) <= 0 || parseFloat(exchangeAmount) > getCurrentBalance(exchangeFrom)}
              onClick={handleExchange}
              data-testid="button-confirm-exchange"
            >
              Confirm Exchange
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
