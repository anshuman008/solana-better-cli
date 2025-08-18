import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import {
  createSyncNativeInstruction,
  createCloseAccountInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { WrapParams } from '../types';
import { config } from '../config';
import { Logger } from '../utils/logger';

export class WrappingSolService {
  constructor(
    private connection: Connection,
    private keypair: Keypair
  ) {}

  async wrapSOL(amount: number): Promise<string> {
    try {
      Logger.info(`Wrapping ${amount} SOL to WSOL`);

      const balance = await this.connection.getBalance(this.keypair.publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      
      if (balanceSOL < amount) {
        throw new Error(`Insufficient balance. Available: ${balanceSOL} SOL, Required: ${amount} SOL`);
      }

      const associatedTokenAccount = await getAssociatedTokenAddress(
        NATIVE_MINT,
        this.keypair.publicKey
      );

      const transaction = new Transaction();

      const accountInfo = await this.connection.getAccountInfo(associatedTokenAccount);
      
      if (!accountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.keypair.publicKey,
            associatedTokenAccount,
            this.keypair.publicKey,
            NATIVE_MINT
          )
        );
        Logger.info('Creating WSOL token account...');
      }

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.keypair.publicKey,
          toPubkey: associatedTokenAccount,
          lamports: amount * LAMPORTS_PER_SOL
        })
      );

      // Sync native (this converts the SOL to WSOL)
      transaction.add(
        createSyncNativeInstruction(associatedTokenAccount)
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.keypair.publicKey;

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair],
        { commitment: config.commitment }
      );

      Logger.success(`Successfully wrapped ${amount} SOL to WSOL`);
      Logger.transaction(signature);
      Logger.info(`WSOL Account: ${associatedTokenAccount.toBase58()}`);

      return signature;
    } catch (error) {
      Logger.error(`SOL wrapping failed: ${error}`);
      throw error;
    }
  }


  async unwrapSOL(amount?: number): Promise<string> {
    try {
      Logger.info(amount ? `Unwrapping ${amount} WSOL to SOL` : 'Unwrapping all WSOL to SOL');

      const associatedTokenAccount = await getAssociatedTokenAddress(
        NATIVE_MINT,
        this.keypair.publicKey
      );

      const accountInfo = await this.connection.getAccountInfo(associatedTokenAccount);
      if (!accountInfo) {
        throw new Error('No WSOL account found');
      }

      const tokenBalance = await this.connection.getTokenAccountBalance(associatedTokenAccount);
      const wsolBalance = parseFloat(tokenBalance.value.amount) / LAMPORTS_PER_SOL;

      if (wsolBalance === 0) {
        throw new Error('No WSOL balance to unwrap');
      }

      if (amount && amount > wsolBalance) {
        throw new Error(`Insufficient WSOL balance. Available: ${wsolBalance} WSOL, Required: ${amount} WSOL`);
      }

      const transaction = new Transaction();

      if (amount && amount < wsolBalance) {
        Logger.warning('Partial unwrap not fully implemented. Unwrapping all WSOL instead.');
      }

      transaction.add(
        createCloseAccountInstruction(
          associatedTokenAccount,
          this.keypair.publicKey,
          this.keypair.publicKey
        )
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.keypair.publicKey;

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair],
        { commitment: config.commitment }
      );

      Logger.success(`Successfully unwrapped ${wsolBalance} WSOL to SOL`);
      Logger.transaction(signature);

      return signature;
    } catch (error) {
      Logger.error(`WSOL unwrapping failed: ${error}`);
      throw error;
    }
  }


  async getWSOLBalance(): Promise<number> {
    try {
      const associatedTokenAccount = await getAssociatedTokenAddress(
        NATIVE_MINT,
        this.keypair.publicKey
      );

      const accountInfo = await this.connection.getAccountInfo(associatedTokenAccount);
      if (!accountInfo) {
        return 0;
      }

      const tokenBalance = await this.connection.getTokenAccountBalance(associatedTokenAccount);
      return parseFloat(tokenBalance.value.amount) / LAMPORTS_PER_SOL;
    } catch (error) {
      Logger.warning(`Could not get WSOL balance: ${error}`);
      return 0;
    }
  }


  async getWSOLTokenAccount(): Promise<PublicKey> {
    return await getAssociatedTokenAddress(
      NATIVE_MINT,
      this.keypair.publicKey
    );
  }

  async hasWSOLAccount(): Promise<boolean> {
    try {
      const associatedTokenAccount = await getAssociatedTokenAddress(
        NATIVE_MINT,
        this.keypair.publicKey
      );

      const accountInfo = await this.connection.getAccountInfo(associatedTokenAccount);
      return accountInfo !== null;
    } catch {
      return false;
    }
  }

  async processWrap(params: WrapParams): Promise<string> {
    const { amount, unwrap = false } = params;

    if (unwrap) {
      return await this.unwrapSOL(amount);
    } else {
      return await this.wrapSOL(amount);
    }
  }
} 