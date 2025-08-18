#!/usr/bin/env node

import { Command } from 'commander';
import { Connection, Keypair } from '@solana/web3.js';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';

import { WalletManager } from './features/walletManager';
import { TransferService } from './features/transfer';
import { WrappingSolService } from './features/wrappingSol';
import { JupiterService } from './features/jupiter';
import { PortfolioService } from './features/portfolio';
import { config } from './config';
import { Logger } from './utils/logger';

class SolanaWalletManager {
  private connection: Connection;
  private walletManager: WalletManager;
  private keypair?: Keypair;
  private transferService?: TransferService;
  private wrappingService?: WrappingSolService;
  private jupiterService?: JupiterService;
  private portfolioService?: PortfolioService;

  constructor() {
    this.connection = new Connection(config.rpcUrl, config.commitment);
    this.walletManager = new WalletManager(config.rpcUrl);

    if (config.privateKey) {
      try {
        const parsed = JSON.parse(config.privateKey);
        this.keypair = this.walletManager.loadWallet(parsed);
        this.initializeServices(this.keypair);
        Logger.success('Loaded wallet from PRIVATE_KEY in environment.');
      } catch (e) {
        Logger.error('Failed to load PRIVATE_KEY from environment.');
      }
    }
  }

  private initializeServices(keypair: Keypair): void {
    this.keypair = keypair;
    this.transferService = new TransferService(this.connection, keypair);
    this.wrappingService = new WrappingSolService(this.connection, keypair);
    this.jupiterService = new JupiterService(this.connection, keypair);
    this.portfolioService = new PortfolioService(this.connection, keypair);
  }

  async setupWallet(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'How would you like to set up your wallet?',
        choices: [
          'Generate new wallet',
          'Load from private key',
          'Load from file',
          'Initialize from private key (JSON/base58)',
          'Exit'
        ]
      }
    ]);

    switch (answers.action) {
      case 'Generate new wallet':
        await this.generateNewWallet();
        break;
      case 'Load from private key':
        await this.loadFromPrivateKey();
        break;
      case 'Load from file':
        await this.loadFromFile();
        break;
      case 'Initialize from private key (JSON/base58)':
        await this.initializeFromPrivateKey();
        break;
      case 'Exit':
        process.exit(0);
    }
  }

  private async generateNewWallet(): Promise<void> {
    const keypair = this.walletManager.generateWallet();
    
    Logger.success('New wallet generated!');
    Logger.wallet(keypair.publicKey.toBase58());

    const saveAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'save',
        message: 'Would you like to save this wallet to a file?',
        default: true
      }
    ]);

    if (saveAnswer.save) {
      const filename = `wallet-${Date.now()}.json`;
      const walletDir = this.walletManager.ensureWalletDirectory();
      const filePath = path.join(walletDir, filename);
      
      this.walletManager.saveWalletToFile(keypair, filePath);
    }

    this.initializeServices(keypair);
  }

  private async loadFromPrivateKey(): Promise<void> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'privateKey',
        message: 'Enter your private key (as JSON array):',
        validate: (input: string) => {
          try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed) && parsed.length === 64) {
              return true;
            }
            return 'Please enter a valid private key array with 64 numbers';
          } catch {
            return 'Please enter a valid JSON array';
          }
        }
      }
    ]);

    try {
      const keypair = this.walletManager.loadWallet(JSON.parse(answer.privateKey));
      Logger.success('Wallet loaded successfully!');
      await this.walletManager.displayWalletInfo(keypair);
      this.initializeServices(keypair);
    } catch (error) {
      Logger.error(`Failed to load wallet: ${error}`);
      await this.setupWallet();
    }
  }

  private async loadFromFile(): Promise<void> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'filePath',
        message: 'Enter the path to your wallet file:',
        validate: (input: string) => {
          if (fs.existsSync(input)) {
            return true;
          }
          return 'File does not exist';
        }
      }
    ]);

    try {
      const keypair = this.walletManager.loadWalletFromFile(answer.filePath);
      Logger.success('Wallet loaded successfully!');
      await this.walletManager.displayWalletInfo(keypair);
      this.initializeServices(keypair);
    } catch (error) {
      Logger.error(`Failed to load wallet: ${error}`);
      await this.setupWallet();
    }
  }

  private async initializeFromPrivateKey(): Promise<void> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'privateKey',
        message: 'Enter your private key (JSON array, base58 string, or file path):',
        validate: (input: string) => {
          if (input.trim()) {
            return true;
          }
          return 'Please enter a private key';
        }
      }
    ]);

    try {
      const keypair = await this.walletManager.initializeWallet(answer.privateKey);
      Logger.success('Wallet initialized successfully!');
      await this.walletManager.displayWalletInfo(keypair);
      this.initializeServices(keypair);
    } catch (error) {
      Logger.error(`Failed to initialize wallet: ${error}`);
      await this.setupWallet();
    }
  }

  async showMainMenu(): Promise<void> {
    if (!this.keypair) {
      await this.setupWallet();
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'View Portfolio',
          'Transfer SOL',
          'Wrap/Unwrap SOL',
          'Swap Tokens',
          'Check Balance',
          'Change Wallet',
          'Exit'
        ]
      }
    ]);

    switch (answers.action) {
      case 'View Portfolio':
        await this.viewPortfolio();
        break;
      case 'Transfer SOL':
        await this.transferSOL();
        break;
      case 'Wrap/Unwrap SOL':
        await this.wrapUnwrapSOL();
        break;
      case 'Swap Tokens':
        await this.swapTokens();
        break;
      case 'Check Balance':
        await this.checkBalance();
        break;
      case 'Change Wallet':
        this.keypair = undefined;
        await this.setupWallet();
        return this.showMainMenu();
      case 'Exit':
        Logger.success('Thank you for using Solana Wallet Manager!');
        process.exit(0);
    }

    setTimeout(() => this.showMainMenu(), 1000);
  }

  private async viewPortfolio(): Promise<void> {
    if (!this.portfolioService) return;
    
    Logger.header('Loading Portfolio...');
    await this.portfolioService.displayPortfolio();
  }

  private async transferSOL(): Promise<void> {
    if (!this.transferService) return;

    //@ts-ignore
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'toAddress',
        message: 'Enter recipient address:',
        validate: (input: string) => {
          if (this.walletManager.isValidAddress(input)) {
            return true;
          }
          return 'Please enter a valid Solana address';
        }
      },
      {
        type: 'number',
        name: 'amount',
        message: 'Enter amount to transfer (SOL):',
        validate: (input: number) => input > 0 ? true : 'Amount must be greater than 0'
      },
      {
        type: 'input',
        name: 'memo',
        message: 'Enter memo (optional):',
        default: ''
      }
    ]);

    try {
      await this.transferService.transferSOL({
        toAddress: answers.toAddress,
        amount: answers.amount,
        memo: answers.memo || undefined
      });
    } catch (error) {
      Logger.error(`Transfer failed: ${error}`);
    }
  }

  private async wrapUnwrapSOL(): Promise<void> {
    if (!this.wrappingService) return;

    //@ts-ignore
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: ['Wrap SOL to WSOL', 'Unwrap WSOL to SOL']
      },
      {
        type: 'number',
        name: 'amount',
        message: 'Enter amount:',
        validate: (input: number) => input > 0 ? true : 'Amount must be greater than 0'
      }
    ]);

    try {
      if (answers.action === 'Wrap SOL to WSOL') {
        await this.wrappingService.wrapSOL(answers.amount);
      } else {
        await this.wrappingService.unwrapSOL(answers.amount);
      }
    } catch (error) {
      Logger.error(`${answers.action} failed: ${error}`);
    }
  }

  private async swapTokens(): Promise<void> {
    if (!this.jupiterService) return;

    Logger.info('Getting available tokens...');
    

    //@ts-ignore
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'fromToken',
        message: 'Enter token to swap FROM (symbol or mint):',
        default: 'SOL'
      },
      {
        type: 'input',
        name: 'toToken',
        message: 'Enter token to swap TO (symbol or mint):',
        default: 'USDC'
      },
      {
        type: 'number',
        name: 'amount',
        message: 'Enter amount to swap:',
        validate: (input: number) => input > 0 ? true : 'Amount must be greater than 0'
      }
    ]);

    try {
      let fromMint = answers.fromToken;
      let toMint = answers.toToken;

      if (answers.fromToken.length < 32) {
        const fromToken = await this.jupiterService.findTokenBySymbol(answers.fromToken);
        fromMint = fromToken?.address || config.tokens.WSOL; // Default to SOL
      }

      if (answers.toToken.length < 32) {
        const toToken = await this.jupiterService.findTokenBySymbol(answers.toToken);
        toMint = toToken?.address || config.tokens.USDC; // Default to USDC
      }

      Logger.info(`Swapping ${answers.amount} ${answers.fromToken} to ${answers.toToken}`);
      
      await this.jupiterService.swap({
        fromTokenMint: fromMint,
        toTokenMint: toMint,
        amount: answers.amount
      });
    } catch (error) {
      Logger.error(`Swap failed: ${error}`);
    }
  }

  private async checkBalance(): Promise<void> {
    if (!this.portfolioService || !this.keypair) return;

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What balance would you like to check?',
        choices: ['SOL Balance', 'Specific Token', 'All Balances']
      }
    ]);

    try {
      switch (answers.type) {
        case 'SOL Balance':
          const solBalance = await this.portfolioService.getSOLBalance();
          Logger.balance('SOL Balance', solBalance, 'SOL');
          break;
        
        case 'Specific Token':
          const tokenAnswer = await inquirer.prompt([
            {
              type: 'input',
              name: 'token',
              message: 'Enter token symbol or mint address:'
            }
          ]);
          
          const tokenBalance = tokenAnswer.token.length < 32 
            ? await this.portfolioService.getTokenBalanceBySymbol(tokenAnswer.token)
            : await this.portfolioService.getTokenBalance(tokenAnswer.token);
          
          if (tokenBalance) {
            Logger.balance(tokenBalance.symbol, tokenBalance.uiAmount, tokenBalance.symbol);
          } else {
            Logger.warning('Token not found or zero balance');
          }
          break;
        
        case 'All Balances':
          await this.portfolioService.displayPortfolio();
          break;
      }
    } catch (error) {
      Logger.error(`Balance check failed: ${error}`);
    }
  }
}

const program = new Command();
const walletManager = new SolanaWalletManager();

program
  .name('solana-wallet-manager')
  .description('Comprehensive Solana wallet management tool')
  .version('1.0.0');

function createAndSaveWallet(outputFile?: string) {
  const wm = new WalletManager(config.rpcUrl);
  const keypair = wm.generateWallet();
  Logger.success('New wallet generated!');
  Logger.wallet(keypair.publicKey.toBase58());
  console.log('Private key (JSON array):');
  console.log(JSON.stringify(Array.from(keypair.secretKey)));

  if (outputFile) {
    wm.saveWalletToFile(keypair, outputFile);
  } else {
    import('inquirer').then(({ default: inquirer }) => {
      inquirer.prompt([
        {
          type: 'confirm',
          name: 'save',
          message: 'Would you like to save this wallet to a file?',
          default: true
        },
        {
          type: 'input',
          name: 'file',
          message: 'Enter file path to save:',
          default: `wallet-${Date.now()}.json`,
          when: (answers) => answers.save
        }
      ]).then(answer => {
        if (answer.save) {
          wm.saveWalletToFile(keypair, answer.file);
        }
      });
    });
  }
}

program
  .command('create-wallet')
  .description('Generate a new Solana wallet and display the public key')
  .option('-o, --output <file>', 'Save the wallet to a file')
  .action(async (options) => {
    createAndSaveWallet(options.output);
  });

program
  .command('init')
  .description('Initialize wallet from private key (JSON array, base58, or file path)')
  .argument('<private-key>', 'Private key as JSON array, base58 string, or file path')
  .option('-s, --save <file>', 'Save the initialized wallet to a file')
  .action(async (privateKey, options) => {
    try {
      const wm = new WalletManager(config.rpcUrl);
      const keypair = await wm.initializeWallet(privateKey);
      
      if (options.save) {
        wm.saveWalletToFile(keypair, options.save);
        Logger.success(`Wallet saved to ${options.save}`);
      }
      
      // Display wallet info
      await wm.displayWalletInfo(keypair);
      
    } catch (error) {
      Logger.error(`Failed to initialize wallet: ${error}`);
      process.exit(1);
    }
  });

program
  .command('start')
  .description('Start the interactive wallet manager')
  .action(async () => {
    Logger.header('SOLANA WALLET MANAGER');
    Logger.info('Welcome to the comprehensive Solana wallet management tool!');
    Logger.separator();
    
    await walletManager.showMainMenu();
  });

if (process.argv.length === 2) {
  process.argv.push('start');
}

program.parse(); 