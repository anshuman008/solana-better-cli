import { 
  Connection, 
  Keypair, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  clusterApiUrl
} from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import bs58 from 'bs58';
import { WalletInfo } from '../types';
import { config } from '../config';
import { Logger } from '../utils/logger';

export class WalletManager {
  private connection: Connection;

  constructor(rpcUrl?: string) {
    this.connection = new Connection(
      rpcUrl || config.rpcUrl,
      config.commitment
    );
  }

  generateWallet(): Keypair {
    return Keypair.generate();
  }


  loadWallet(privateKey: number[] | string): Keypair {
    try {
      if (typeof privateKey === 'string') {
        if (privateKey.length >= 80 && privateKey.length <= 90 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(privateKey)) {
          try {
            const decoded = bs58.decode(privateKey);
            return Keypair.fromSecretKey(decoded);
          } catch {
            throw new Error('Invalid base58 private key');
          }
        } else {
          try {
            const parsed = JSON.parse(privateKey);
            if (Array.isArray(parsed)) {
              try {
                return Keypair.fromSecretKey(new Uint8Array(parsed));
              } catch (keypairError) {
                throw new Error('Invalid private key values in array');
              }
            }
            throw new Error('Parsed JSON is not an array');
          } catch (parseError) {
            try {
              const decoded = bs58.decode(privateKey);
              return Keypair.fromSecretKey(decoded);
            } catch {
              throw new Error('Invalid private key format. Expected JSON array or base58 string.');
            }
          }
        }
      } else {
        return Keypair.fromSecretKey(new Uint8Array(privateKey));
      }
    } catch (error) {
      Logger.error(`Failed to load wallet: ${error}`);
      throw error;
    }
  }


  loadWalletFromFile(filePath: string): Keypair {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Wallet file not found: ${filePath}`);
      }

      const walletData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return this.loadWallet(walletData);
    } catch (error) {
      Logger.error(`Failed to load wallet from file: ${error}`);
      throw error;
    }
  }

  saveWalletToFile(keypair: Keypair, filePath: string): void {
    try {
      const walletData = Array.from(keypair.secretKey);
      fs.writeFileSync(filePath, JSON.stringify(walletData, null, 2));
      Logger.success(`Wallet saved to ${filePath}`);
    } catch (error) {
      Logger.error(`Failed to save wallet: ${error}`);
      throw error;
    }
  }


  async getSOLBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      Logger.error(`Failed to get SOL balance: ${error}`);
      throw error;
    }
  }


  async getWalletInfo(keypair: Keypair): Promise<WalletInfo> {
    try {
      const balance = await this.getSOLBalance(keypair.publicKey);
      
      return {
        publicKey: keypair.publicKey,
        privateKey: keypair.secretKey,
        balance
      };
    } catch (error) {
      Logger.error(`Failed to get wallet info: ${error}`);
      throw error;
    }
  }


  async displayWalletInfo(keypair: Keypair): Promise<void> {
    try {
      const walletInfo = await this.getWalletInfo(keypair);
      
      Logger.header('WALLET INFORMATION');
      Logger.wallet(walletInfo.publicKey.toBase58());
      Logger.balance('SOL Balance', walletInfo.balance, 'SOL');
    } catch (error) {
      Logger.error(`Failed to display wallet info: ${error}`);
    }
  }


  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }


  ensureWalletDirectory(): string {
    const walletDir = path.join(process.cwd(), 'wallets');
    if (!fs.existsSync(walletDir)) {
      fs.mkdirSync(walletDir, { recursive: true });
    }
    return walletDir;
  }


  getConnection(): Connection {
    return this.connection;
  }

  async initializeWallet(privateKeyInput: string): Promise<Keypair> {
    try {
      let keypair: Keypair;

      if (privateKeyInput.endsWith('.json') || privateKeyInput.includes('/') || privateKeyInput.includes('\\')) {
        keypair = this.loadWalletFromFile(privateKeyInput);
      } else {
        keypair = this.loadWallet(privateKeyInput);
      }

      const publicKey = keypair.publicKey.toBase58();
      Logger.success(`Wallet initialized successfully!`);
      Logger.wallet(publicKey);
      
      return keypair;
    } catch (error) {
      Logger.error(`Failed to initialize wallet: ${error}`);
      throw error;
    }
  }
} 