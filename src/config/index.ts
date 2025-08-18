import * as dotenv from 'dotenv';
dotenv.config();

export interface CliOptions {
  rpcUrl?: string;
  network?: string;
  commitment?: string;
  slippageBps?: number;
  priorityFee?: number;
}

export const defaultConfig = {
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  network: 'mainnet-beta',
  
  jupiterApiUrl: 'https://quote-api.jup.ag/v6',
  
  slippageBps: 300, // 3% default slippage
  priorityFee: 1000, // 1000 lamports
  
  commitment: 'confirmed' as const,
  privateKey: process.env.PRIVATE_KEY,
  
  tokens: {
    WSOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    SRM: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt'
  },
  
  decimals: 9, 
  displayPrecision: 6
} as const;

export function getConfig(cliOptions: CliOptions = {}) {
  return {
    rpcUrl: cliOptions.rpcUrl || process.env.RPC_URL || defaultConfig.rpcUrl,
    network: cliOptions.network || process.env.SOLANA_NETWORK || defaultConfig.network,
    
    jupiterApiUrl: defaultConfig.jupiterApiUrl,
    
    slippageBps: cliOptions.slippageBps || parseInt(process.env.SLIPPAGE_BPS || defaultConfig.slippageBps.toString()),
    priorityFee: cliOptions.priorityFee || parseInt(process.env.PRIORITY_FEE || defaultConfig.priorityFee.toString()),
    
    commitment: (cliOptions.commitment as 'confirmed' | 'finalized' | 'processed') || defaultConfig.commitment,
    privateKey: defaultConfig.privateKey,
    
    tokens: defaultConfig.tokens,
    decimals: defaultConfig.decimals,
    displayPrecision: defaultConfig.displayPrecision
  };
}

// Legacy export for backward compatibility
export const config = getConfig(); 