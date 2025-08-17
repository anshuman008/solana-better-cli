import chalk from 'chalk';

export class Logger {
  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  static success(message: string): void {
    console.log(chalk.green('✅'), message);
  }

  static warning(message: string): void {
    console.log(chalk.yellow('⚠️'), message);
  }

  static error(message: string | Error): void {
    const errorMessage = message instanceof Error ? message.message : message;
    console.log(chalk.red('❌'), errorMessage);
  }

  static transaction(signature: string): void {
    console.log(chalk.cyan('🔗 Transaction:'), `https://solscan.io/tx/${signature}`);
  }

  static wallet(publicKey: string): void {
    console.log(chalk.magenta('👛 Wallet:'), publicKey);
  }

  static balance(token: string, amount: number, symbol: string = ''): void {
    const formattedAmount = amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
    console.log(chalk.green('💰'), `${token}: ${formattedAmount} ${symbol}`);
  }

  static header(text: string): void {
    console.log('\n' + chalk.bold.cyan('=' + '='.repeat(text.length + 2) + '='));
    console.log(chalk.bold.cyan(`| ${text} |`));
    console.log(chalk.bold.cyan('=' + '='.repeat(text.length + 2) + '=') + '\n');
  }

  static separator(): void {
    console.log(chalk.gray('-'.repeat(50)));
  }
} 