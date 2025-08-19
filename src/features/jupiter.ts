import axios from 'axios';
import { 
  Connection, 
  Keypair, 
  Transaction, 
  VersionedTransaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { SwapParams, SwapQuote, JupiterSwapResponse } from '../types';
import { config } from '../config';
import { Logger } from '../utils/logger';

export class JupiterService {
  private apiUrl: string;

  constructor(
    private connection: Connection,
    private keypair: Keypair
  ) {
    this.apiUrl = config.jupiterApiUrl;
  }

  async getQuote(params: SwapParams): Promise<SwapQuote> {
    try {
      const { fromTokenMint, toTokenMint, amount, slippageBps = config.slippageBps } = params;
      
      // Convert amount to base units (assuming input is in token units)
      const inputAmount = fromTokenMint === "So11111111111111111111111111111111111111112" ? Math.floor(amount * 1e9) : Math.floor(amount * 1e6); // Assuming 6 decimals for simplicity


      const response = await axios.get(`${this.apiUrl}/quote`, {
        params: {
          inputMint: fromTokenMint,
          outputMint: toTokenMint,
          amount: inputAmount,
          slippageBps,
          swapMode: 'ExactIn'
        }
      });

      Logger.info(`Got quote: ${amount} tokens → ${Number(response.data.outAmount) / 1e6} tokens`);
      return response.data;
    } catch (error) {
      Logger.error(`Failed to get swap quote: ${error}`);
      throw error;
    }
  }

  async executeSwap(quote: SwapQuote): Promise<string> {
    try {
      Logger.info('Executing swap transaction...');

      // Get swap transaction from Jupiter
      const response = await axios.post(`${this.apiUrl}/swap`, {
        quoteResponse: quote,
        userPublicKey: this.keypair.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: config.priorityFee
      });

      const swapData: JupiterSwapResponse = response.data;
      
      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      // Sign the transaction
      transaction.sign([this.keypair]);

      // Send and confirm the transaction
      const signature = await this.connection.sendTransaction(transaction);
      
      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash: (await this.connection.getLatestBlockhash()).blockhash,
        lastValidBlockHeight: swapData.lastValidBlockHeight
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      Logger.success('Swap completed successfully!');
      Logger.transaction(signature);
      return signature;
    } catch (error) {
      Logger.error(`Swap execution failed: ${error}`);
      throw error;
    }
  }

  async swap(params: SwapParams): Promise<string> {
    const quote = await this.getQuote(params);
    return this.executeSwap(quote);
  }

  async getTokenPrice(tokenMint: string): Promise<number> {
    try {
      const response = await axios.get(`${this.apiUrl}/price`, {
        params: {
          ids: tokenMint
        }
      });

      return response.data.data[tokenMint]?.price || 0;
    } catch (error) {
      Logger.warning(`Failed to get price for ${tokenMint}: ${error}`);
      return 0;
    }
  }

  async getTokenList(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/tokens`);
      return response.data;
    } catch (error) {
      Logger.error(`Failed to get token list: ${error}`);
      throw error;
    }
  }

  async findTokenBySymbol(symbol: string): Promise<any | null> {
    try {
      const tokens = await this.getTokenList();
      return tokens.find(token => 
        token.symbol.toLowerCase() === symbol.toLowerCase()
      ) || null;
    } catch (error) {
      Logger.error(`Failed to find token ${symbol}: ${error}`);
      return null;
    }
  }
} 