import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ethers } from 'ethers';

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

// BIP-44 coin types
const COIN_TYPES = {
  BITCOIN: 0,
  LITECOIN: 2,
  ETHEREUM: 60,
  ZCASH: 133,
};

// Bitcoin networks
const BITCOIN_NETWORKS = {
  mainnet: bitcoin.networks.bitcoin,
  testnet: bitcoin.networks.testnet,
};

export interface HDWalletAddress {
  address: string;
  publicKey: string;
  derivationPath: string;
  index: number;
}

export class HDWalletService {
  private mnemonic: string;
  private seed: Buffer;

  /**
   * Initialize HD wallet from mnemonic
   */
  constructor(mnemonic?: string) {
    if (mnemonic) {
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      this.mnemonic = mnemonic;
    } else {
      // Generate new 24-word mnemonic
      this.mnemonic = bip39.generateMnemonic(256);
    }
    this.seed = bip39.mnemonicToSeedSync(this.mnemonic);
  }

  /**
   * Get the mnemonic phrase
   */
  getMnemonic(): string {
    return this.mnemonic;
  }

  /**
   * Generate Bitcoin address (Native SegWit - bc1...)
   * Path: m/84'/0'/0'/0/index (BIP-84 for Native SegWit)
   */
  generateBitcoinAddress(index: number = 0, testnet: boolean = false): HDWalletAddress {
    const network = testnet ? BITCOIN_NETWORKS.testnet : BITCOIN_NETWORKS.mainnet;
    const path = `m/84'/${COIN_TYPES.BITCOIN}'/0'/0/${index}`;
    
    const root = bip32.fromSeed(this.seed, network);
    const child = root.derivePath(path);
    
    if (!child.publicKey) {
      throw new Error('Failed to generate public key');
    }

    // Create Native SegWit address (bc1...)
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network,
    });

    if (!address) {
      throw new Error('Failed to generate address');
    }

    return {
      address,
      publicKey: child.publicKey.toString('hex'),
      derivationPath: path,
      index,
    };
  }

  /**
   * Generate Litecoin address (Native SegWit - ltc1...)
   * Path: m/84'/2'/0'/0/index
   */
  generateLitecoinAddress(index: number = 0): HDWalletAddress {
    // Litecoin mainnet settings
    const litecoinNetwork = {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bech32: 'ltc',
      bip32: {
        public: 0x019da462,
        private: 0x019d9cfe,
      },
      pubKeyHash: 0x30,
      scriptHash: 0x32,
      wif: 0xb0,
    };

    const path = `m/84'/${COIN_TYPES.LITECOIN}'/0'/0/${index}`;
    
    const root = bip32.fromSeed(this.seed, litecoinNetwork);
    const child = root.derivePath(path);
    
    if (!child.publicKey) {
      throw new Error('Failed to generate public key');
    }

    // Create Native SegWit address (ltc1...)
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network: litecoinNetwork,
    });

    if (!address) {
      throw new Error('Failed to generate address');
    }

    return {
      address,
      publicKey: child.publicKey.toString('hex'),
      derivationPath: path,
      index,
    };
  }

  /**
   * Generate Ethereum address
   * Path: m/44'/60'/0'/0/index (BIP-44)
   */
  generateEthereumAddress(index: number = 0): HDWalletAddress {
    const path = `m/44'/${COIN_TYPES.ETHEREUM}'/0'/0/${index}`;
    
    try {
      const hdNode = ethers.HDNodeWallet.fromPhrase(this.mnemonic);
      const wallet = hdNode.derivePath(path);
      
      return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        derivationPath: path,
        index,
      };
    } catch (error) {
      throw new Error(`Failed to generate Ethereum address: ${error}`);
    }
  }

  /**
   * Generate Zcash address (Transparent address - t1...)
   * Path: m/44'/133'/0'/0/index
   */
  generateZcashAddress(index: number = 0): HDWalletAddress {
    // Zcash mainnet settings (transparent addresses)
    const zcashNetwork = {
      messagePrefix: '\x18Zcash Signed Message:\n',
      bech32: 'zs',
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
      },
      pubKeyHash: 0x1cb8,
      scriptHash: 0x1cbd,
      wif: 0x80,
    };

    const path = `m/44'/${COIN_TYPES.ZCASH}'/0'/0/${index}`;
    
    const root = bip32.fromSeed(this.seed, zcashNetwork);
    const child = root.derivePath(path);
    
    if (!child.publicKey) {
      throw new Error('Failed to generate public key');
    }

    // Create P2PKH address (t1...)
    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: zcashNetwork,
    });

    if (!address) {
      throw new Error('Failed to generate address');
    }

    return {
      address,
      publicKey: child.publicKey.toString('hex'),
      derivationPath: path,
      index,
    };
  }

  /**
   * Generate all addresses for a user at a specific index
   */
  generateAllAddresses(index: number = 0): {
    bitcoin: HDWalletAddress;
    litecoin: HDWalletAddress;
    ethereum: HDWalletAddress;
    zcash: HDWalletAddress;
  } {
    return {
      bitcoin: this.generateBitcoinAddress(index),
      litecoin: this.generateLitecoinAddress(index),
      ethereum: this.generateEthereumAddress(index),
      zcash: this.generateZcashAddress(index),
    };
  }

  /**
   * Validate a mnemonic phrase
   */
  static validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  /**
   * Generate a new random mnemonic
   */
  static generateMnemonic(strength: 128 | 256 = 256): string {
    return bip39.generateMnemonic(strength);
  }

  /**
   * Check if an address is valid for a specific cryptocurrency
   */
  static isValidAddress(address: string, crypto: 'BTC' | 'LTC' | 'ETH' | 'ZCASH'): boolean {
    try {
      switch (crypto) {
        case 'BTC':
          // Bitcoin addresses: bc1 (Native SegWit), 3 (P2SH), 1 (Legacy)
          return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
        
        case 'LTC':
          // Litecoin addresses: ltc1 (SegWit), M (P2SH), L (Legacy)
          return /^(ltc1|[LM])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
        
        case 'ETH':
          // Ethereum addresses (checksummed or not)
          return /^0x[a-fA-F0-9]{40}$/.test(address);
        
        case 'ZCASH':
          // Zcash transparent addresses: t1, t3
          return /^t[13][a-zA-Z0-9]{33}$/.test(address);
        
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
}

// Singleton instance with master mnemonic from environment
let masterWalletService: HDWalletService | null = null;

export function getMasterWalletService(): HDWalletService | null {
  if (!masterWalletService) {
    const mnemonic = process.env.MASTER_WALLET_MNEMONIC;
    if (mnemonic) {
      try {
        masterWalletService = new HDWalletService(mnemonic);
        console.log('Master HD wallet service initialized');
      } catch (error) {
        console.error('Failed to initialize master HD wallet:', error);
        return null;
      }
    } else {
      console.warn('MASTER_WALLET_MNEMONIC not set in environment');
      return null;
    }
  }
  return masterWalletService;
}
