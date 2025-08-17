import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { TokenBalance, Portfolio } from '../types';
import { config } from '../config';
import { Logger } from '../utils/logger';
import { JupiterService } from './jupiter';

export class PortfolioService {
  private jupiterService: JupiterService;

  constructor(
    private connection: Connection,
    private keypair: Keypair
  ) {
    this.jupiterService = new JupiterService(connection, keypair);
  }


  async getSOLBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.keypair.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      Logger.error(`Failed to get SOL balance: ${error}`);
      return 0;
    }
  }


  async getTokenBalances(): Promise<TokenBalance[]> {
    try {
      Logger.info('Fetching token balances...');

      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        this.keypair.publicKey,
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        }
      );

      const balances: TokenBalance[] = [];

      for (const tokenAccount of tokenAccounts.value) {
        const parsedInfo = tokenAccount.account.data.parsed.info;
        const mint = parsedInfo.mint;
        const amount = parseFloat(parsedInfo.tokenAmount.amount);
        const decimals = parsedInfo.tokenAmount.decimals;
        const uiAmount = parseFloat(parsedInfo.tokenAmount.uiAmount) || 0;

        if (amount > 0) {
          try {
            const tokenInfo = await this.getTokenInfo(mint);
            const price = await this.getTokenPrice(mint);

            balances.push({
              mint,
              symbol: tokenInfo?.symbol || 'Unknown',
              name: tokenInfo?.name || 'Unknown Token',
              amount,
              decimals,
              uiAmount,
              price,
              value: price ? uiAmount * price : undefined
            });
          } catch (error) {
            balances.push({
              mint,
              symbol: 'Unknown',
              name: 'Unknown Token',
              amount,
              decimals,
              uiAmount,
              price: 0,
              value: 0
            });
          }
        }
      }

      return balances.sort((a, b) => (b.value || 0) - (a.value || 0));
    } catch (error) {
      Logger.error(`Failed to get token balances: ${error}`);
      return [];
    }
  }


  async getTokenInfo(mint: string): Promise<any> {
    try {
      const tokens = await this.jupiterService.getTokenList();
      return tokens.find(token => token.address === mint);
    } catch (error) {
      Logger.warning(`Could not get token info for ${mint}: ${error}`);
      return null;
    }
  }


  async getTokenPrice(mint: string): Promise<number> {
    try {
      return await this.jupiterService.getTokenPrice(mint);
    } catch (error) {
      Logger.warning(`Could not get price for ${mint}: ${error}`);
      return 0;
    }
  }

  async getPortfolio(): Promise<Portfolio> {
    try {
      Logger.info('Building portfolio overview...');

      const [solBalance, tokenBalances] = await Promise.all([
        this.getSOLBalance(),
        this.getTokenBalances()
      ]);

      const solPrice = await this.getTokenPrice(config.tokens.WSOL);
      const solValue = solBalance * solPrice;

      const tokenValue = tokenBalances.reduce((sum, token) => sum + (token.value || 0), 0);
      const totalValue = solValue + tokenValue;

      return {
        solBalance,
        totalValue,
        tokens: tokenBalances,
        lastUpdated: new Date()
      };
    } catch (error) {
      Logger.error(`Failed to build portfolio: ${error}`);
      throw error;
    }
  }

  async displayPortfolio(): Promise<void> {
    try {
      const portfolio = await this.getPortfolio();

      Logger.header('PORTFOLIO OVERVIEW');
      
      Logger.balance('SOL Balance', portfolio.solBalance, 'SOL');
      
      if (portfolio.totalValue > 0) {
        Logger.balance('Total Value', portfolio.totalValue, 'USD');
      }

      Logger.separator();

      if (portfolio.tokens.length > 0) {
        Logger.header('TOKEN BALANCES');
        
        for (const token of portfolio.tokens) {
          if (token.uiAmount > 0) {
            const valueText = token.value ? ` ($${token.value.toFixed(2)})` : '';
            Logger.balance(
              `${token.symbol || token.mint.slice(0, 8)}...`,
              token.uiAmount,
              token.symbol + valueText
            );
          }
        }
      } else {
        Logger.info('No token balances found');
      }

      Logger.separator();
      Logger.info(`Portfolio last updated: ${portfolio.lastUpdated.toLocaleString()}`);
    } catch (error) {
      Logger.error(`Failed to display portfolio: ${error}`);
    }
  }


  async getTokenBalance(mint: string): Promise<TokenBalance | null> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        new PublicKey(mint),
        this.keypair.publicKey
      );

      const accountInfo = await this.connection.getAccountInfo(tokenAccount);
      if (!accountInfo) {
        return null;
      }

      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      const tokenInfo = await this.getTokenInfo(mint);
      const price = await this.getTokenPrice(mint);

      return {
        mint,
        symbol: tokenInfo?.symbol || 'Unknown',
        name: tokenInfo?.name || 'Unknown Token',
        amount: parseFloat(balance.value.amount),
        decimals: balance.value.decimals,
        uiAmount: parseFloat(String(balance.value.uiAmount)) || 0,
        price,
        value: price ? parseFloat(String(balance.value.uiAmount)) * price : undefined
      };
    } catch (error) {
      Logger.warning(`Could not get balance for token ${mint}: ${error}`);
      return null;
    }
  }


  async getTokenBalanceBySymbol(symbol: string): Promise<TokenBalance | null> {
    try {
      const token = await this.jupiterService.findTokenBySymbol(symbol);
      if (!token) {
        Logger.warning(`Token with symbol ${symbol} not found`);
        return null;
      }

      return await this.getTokenBalance(token.address);
    } catch (error) {
      Logger.error(`Failed to get balance for ${symbol}: ${error}`);
      return null;
    }
  }

  async trackPortfolioChange(hours: number = 24): Promise<void> {
    Logger.info(`Portfolio tracking over ${hours} hours not implemented yet`);
    Logger.info('This would require storing historical data');
  }


  async getTopHoldings(limit: number = 5): Promise<TokenBalance[]> {
    try {
      const portfolio = await this.getPortfolio();
      return portfolio.tokens
        .filter(token => token.value && token.value > 0)
        .slice(0, limit);
    } catch (error) {
      Logger.error(`Failed to get top holdings: ${error}`);
      return [];
    }
  }
} 