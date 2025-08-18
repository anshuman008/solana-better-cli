import { PublicKey } from '@solana/web3.js';


export interface SwapParams {
  fromTokenMint: string;
  toTokenMint: string;
  amount: number;
  slippageBps?: number;
}

export interface SwapQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: any;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot: number;
  timeTaken: number;
}

export interface RoutePlan {
  swapInfo: SwapInfo;
  percent: number;
}

export interface SwapInfo {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}

export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}



export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  price?: number;
  value?: number;
}

export interface TransferParams {
  toAddress: string;
  amount: number;
  memo?: string;
}


export interface Portfolio {
  solBalance: number;
  totalValue: number;
  tokens: TokenBalance[];
  lastUpdated: Date;
}


export interface WrapParams {
  amount: number;
  unwrap?: boolean;
}


export interface WalletInfo {
  publicKey: PublicKey;
  privateKey: Uint8Array;
  balance: number;
}


export const KNOWN_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  WSOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  SRM: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt'
} as const; 