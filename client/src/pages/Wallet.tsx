import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Copy, Check, AlertCircle, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Info } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlassCard } from "@/components/GlassCard";
import { CryptoCard } from "@/components/CryptoCard";
import { TransactionItem } from "@/components/TransactionItem";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import btcLogo from "@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png";
import ltcLogo from "@assets/litecoin-3d-icon-png-download-4466121_1766014388608.png";
import ethLogo from "@assets/ethereum-eth-logo.png";
import zcashLogo from "@assets/zcash-zec-logo.png";

type CryptoType = "BTC" | "LTC" | "ETH" | "ZCASH" | "TON";

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
  ZCASH: [
    { id: "zcash-native", name: "Zcash (Native)", fee: 0.0001, estimatedTime: "5-10 min" },
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
    "zcash-native": "t1",
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
  ZCASH: { name: "Zcash", color: "text-amber-400", iconBg: "bg-amber-500/20" },
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
  onNavigateToHome?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToInvest?: () => void;
  onOpenSettings?: () => void;
}

export function Wallet({ 
  balances = defaultBalances, 
  transactions, 
  totalBalance, 
  change24h = 0,
  onOpenExchange,
  onOpenDeposit,
  onOpenWithdraw,
  onNavigateToHome,
  onNavigateToWallet,
  onNavigateToInvest,
  onOpenSettings
}: WalletProps) {
  const { convert, getSymbol } = useCurrency();
  const { toast } = useToast();
  const { prices: cryptoPricesData } = useCryptoPrices();
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

  const cryptoPrices: Record<CryptoType, number> = {
    BTC: cryptoPricesData.BTC?.price || 67000,
    LTC: cryptoPricesData.LTC?.price || 85,
    ETH: cryptoPricesData.ETH?.price || 3500,
    USDT: cryptoPricesData.USDT?.price || 1,
    USDC: cryptoPricesData.USDC?.price || 1,
    TON: cryptoPricesData.TON?.price || 5.5,
  };

  const pricedBalances = useMemo(() => {
    return balances.map((balance) => {
      const symbol = balance.symbol as CryptoType;
      const price = cryptoPrices[symbol] ?? 0;
      const usdValue = (balance.balance ?? 0) * price;
      const change24h = cryptoPricesData[symbol]?.change24h ?? balance.change24h ?? 0;

      return {
        ...balance,
        usdValue,
        change24h,
      };
    });
  }, [balances, cryptoPrices, cryptoPricesData]);

  const calculatedTotalBalance = pricedBalances.length > 0
    ? pricedBalances.reduce((sum, b) => sum + (b.usdValue ?? 0), 0)
    : (totalBalance ?? 0);

  const convertedBalance = convert(calculatedTotalBalance);
  const isPositive = change24h >= 0;
  const hasNoBalance = calculatedTotalBalance === 0;

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
    ETH: ethLogo,
    ZCASH: zcashLogo,
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
    <>
      <GlobalHeader
        onOpenSettings={onOpenSettings}
        onNavigateToHome={onNavigateToHome}
        onNavigateToWallet={onNavigateToWallet}
        onNavigateToInvest={onNavigateToInvest}
      />
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
        >
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Multi-crypto portfolio</p>
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
              <Popover open={depositOpen} onOpenChange={setDepositOpen}>
                <PopoverTrigger asChild>
                  <Button
                    data-testid="button-wallet-deposit"
                    variant="secondary"
                    className="flex-1 liquid-glass border-0 bg-emerald-500/20"
                    onClick={() => openDepositModal()}
                  >
                    <ArrowDownToLine className="w-5 h-5 mr-2" />
                    Deposit
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  sideOffset={10}
                  className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl w-[min(400px,calc(100vw-1.5rem))] max-h-[85vh] overflow-y-auto"
                  data-testid="popover-wallet-deposit"
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Deposit Crypto</p>
                      <p className="text-xs text-muted-foreground">Select a cryptocurrency and network to receive funds</p>
                    </div>

                    <div className="space-y-4">
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
                            {(["BTC", "LTC", "ETH", "ZCASH", "TON"] as CryptoType[]).map((crypto) => (
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

                      <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/20">
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-200/80">
                          Only send {selectedCrypto} via {cryptoNetworks[selectedCrypto]?.find(n => n.id === selectedNetwork)?.name || "selected network"} to this address. Sending via wrong network may result in permanent loss of funds.
                        </p>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Popover open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <PopoverTrigger asChild>
                  <Button
                    data-testid="button-wallet-withdraw"
                    variant="secondary"
                    className="flex-1 liquid-glass border-0 bg-amber-500/20"
                    onClick={() => openWithdrawModal()}
                  >
                    <ArrowUpFromLine className="w-5 h-5 mr-2" />
                    Withdraw
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="end"
                  sideOffset={10}
                  className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl w-[min(400px,calc(100vw-1.5rem))] max-h-[85vh] overflow-y-auto"
                  data-testid="popover-wallet-withdraw"
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Withdraw Crypto</p>
                      <p className="text-xs text-muted-foreground">Transfer funds to your external wallet</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="withdraw-crypto">Cryptocurrency</Label>
                        <Select
                          value={selectedCrypto}
                          onValueChange={(value) => setSelectedCrypto(value as CryptoType)}
                        >
                          <SelectTrigger 
                            id="withdraw-crypto" 
                            className="liquid-glass border-white/10"
                            data-testid="select-withdraw-crypto"
                          >
                            <SelectValue placeholder="Select crypto" />
                          </SelectTrigger>
                          <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                            {(["BTC", "LTC", "ETH", "ZCASH", "TON"] as CryptoType[]).map((crypto) => (
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
                                <span>{network.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="withdraw-address">Withdrawal Address</Label>
                        <Input
                          id="withdraw-address"
                          placeholder={`Enter ${selectedCrypto} address`}
                          value={withdrawAddress}
                          onChange={(e) => setWithdrawAddress(e.target.value)}
                          className="liquid-glass border-white/10 font-mono text-sm"
                          data-testid="input-withdraw-address"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="withdraw-amount">Amount</Label>
                          <button
                            type="button"
                            className="text-xs text-primary hover:text-primary/80 font-medium"
                            onClick={handleMaxWithdraw}
                          >
                            MAX
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            id="withdraw-amount"
                            type="number"
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            step="0.00000001"
                            className="liquid-glass border-white/10 pr-16"
                            data-testid="input-withdraw-amount"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            {selectedCrypto}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Available: {currentBalance.toFixed(8)} {selectedCrypto}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Network Fee</span>
                          <span>{getSelectedNetworkFee()} {selectedCrypto}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">You Will Receive</span>
                          <span className="font-semibold">{getWithdrawReceiveAmount()} {selectedCrypto}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Time</span>
                          <span>{getSelectedNetworkTime()}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/20">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-200/80">
                          Double check the address and network before confirming. Transactions cannot be reversed.
                        </p>
                      </div>

                      <Button
                        onClick={handleWithdraw}
                        className="w-full liquid-glass border-0 bg-primary/20 hover:bg-primary/30"
                        disabled={!withdrawAddress || !withdrawAmount || Number(withdrawAmount) <= 0}
                        data-testid="button-confirm-withdraw"
                      >
                        Confirm Withdrawal
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
          {pricedBalances.map((crypto, index) => (
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
      </motion.div>
    </>
  );
}
