import { ethers } from "ethers";

// EVM-compatible networks
export const EVM_NETWORKS = {
  ERC20: {
    chainId: 1,
    rpcUrl: process.env.ETH_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
    explorerUrl: "https://etherscan.io",
    nativeSymbol: "ETH",
    requiredConfirmations: 12,
  },
  BSC20: {
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
    nativeSymbol: "BNB",
    requiredConfirmations: 15,
  },
  Arbitrum: {
    chainId: 42161,
    rpcUrl: process.env.ARB_RPC_URL || "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    nativeSymbol: "ETH",
    requiredConfirmations: 6,
  },
  Optimism: {
    chainId: 10,
    rpcUrl: process.env.OP_RPC_URL || "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    nativeSymbol: "ETH",
    requiredConfirmations: 6,
  },
};

// Common ERC20 token contract addresses
export const TOKEN_CONTRACTS: Record<string, Record<string, string>> = {
  ERC20: {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  BSC20: {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  },
  Arbitrum: {
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  Optimism: {
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  },
};

// HD wallet path (BIP-44)
// m / purpose' / coin_type' / account' / change / address_index
// Purpose: 44' for BIP-44
// Coin types: 60 for Ethereum (also used for EVM chains)
const HD_PATH_PREFIX = "m/44'/60'/0'/0";

export interface DerivedAddress {
  address: string;
  derivationIndex: number;
  network: string;
}

export class BlockchainService {
  private masterMnemonic: string | undefined;
  private hdNode: ethers.HDNodeWallet | undefined;

  constructor() {
    this.masterMnemonic = process.env.MASTER_WALLET_MNEMONIC;
    if (this.masterMnemonic) {
      try {
        this.hdNode = ethers.HDNodeWallet.fromPhrase(
          this.masterMnemonic,
          undefined,
          HD_PATH_PREFIX
        );
        console.log("HD wallet initialized successfully");
      } catch (error) {
        console.error("Failed to initialize HD wallet:", error);
      }
    } else {
      console.warn("MASTER_WALLET_MNEMONIC not set - wallet functions disabled");
    }
  }

  /**
   * Derive a unique deposit address for a user at a specific index
   * Same index will always produce the same address
   */
  deriveDepositAddress(derivationIndex: number): string | null {
    if (!this.hdNode) {
      console.error("HD wallet not initialized");
      return null;
    }

    try {
      const childWallet = this.hdNode.deriveChild(derivationIndex);
      return childWallet.address;
    } catch (error) {
      console.error("Failed to derive address:", error);
      return null;
    }
  }

  /**
   * Generate addresses for all supported EVM networks at the same index
   * All EVM networks share the same address for a given derivation index
   */
  generateAddressesForUser(derivationIndex: number): DerivedAddress[] {
    const address = this.deriveDepositAddress(derivationIndex);
    if (!address) return [];

    // EVM networks share the same address
    return Object.keys(EVM_NETWORKS).map((network) => ({
      address,
      derivationIndex,
      network,
    }));
  }

  /**
   * Get provider for a specific network
   */
  getProvider(network: keyof typeof EVM_NETWORKS): ethers.JsonRpcProvider | null {
    const config = EVM_NETWORKS[network];
    if (!config) return null;

    try {
      return new ethers.JsonRpcProvider(config.rpcUrl);
    } catch (error) {
      console.error(`Failed to create provider for ${network}:`, error);
      return null;
    }
  }

  /**
   * Get native balance (ETH, BNB, etc.)
   */
  async getNativeBalance(network: keyof typeof EVM_NETWORKS, address: string): Promise<string> {
    const provider = this.getProvider(network);
    if (!provider) return "0";

    try {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(`Failed to get balance for ${address} on ${network}:`, error);
      return "0";
    }
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(
    network: keyof typeof EVM_NETWORKS,
    tokenSymbol: string,
    address: string
  ): Promise<string> {
    const provider = this.getProvider(network);
    const contracts = TOKEN_CONTRACTS[network];
    if (!provider || !contracts || !contracts[tokenSymbol]) return "0";

    const tokenAddress = contracts[tokenSymbol];
    const abi = ["function balanceOf(address) view returns (uint256)"];

    try {
      const contract = new ethers.Contract(tokenAddress, abi, provider);
      const balance = await contract.balanceOf(address);
      // USDT and USDC typically use 6 decimals
      return ethers.formatUnits(balance, 6);
    } catch (error) {
      console.error(`Failed to get ${tokenSymbol} balance on ${network}:`, error);
      return "0";
    }
  }

  /**
   * Check if HD wallet is initialized
   */
  isInitialized(): boolean {
    return !!this.hdNode;
  }

  /**
   * Get master wallet address (for receiving swept funds)
   */
  getMasterAddress(): string | null {
    if (!this.hdNode) return null;
    // Index 0 is reserved for the master/owner wallet
    return this.hdNode.deriveChild(0).address;
  }

  /**
   * Validate an Ethereum/EVM address
   */
  isValidAddress(address: string): boolean {
    try {
      ethers.getAddress(address);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const blockchainService = new BlockchainService();
