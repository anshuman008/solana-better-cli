import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  rpcUrl: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
  network: process.env.SOLANA_NETWORK || 'mainnet-beta',
  
  jupiterApiUrl: 'https://quote-api.jup.ag/v6',
  
  slippageBps: parseInt(process.env.SLIPPAGE_BPS || '300'), // 3% default slippage
  priorityFee: parseInt(process.env.PRIORITY_FEE || '1000'), // 1000 lamports
  
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