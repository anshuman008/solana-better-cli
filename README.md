# Solana Better CLI

A comprehensive Solana wallet management CLI tool with portfolio tracking, token swapping, and more.

## Features

- 🏦 **Wallet Management**: Generate new wallets, load existing ones from private keys (JSON array, base58, or files), and manage multiple accounts
- 💰 **Portfolio Tracking**: View your complete Solana portfolio with real-time balances
- 🔄 **Token Swapping**: Swap tokens using Jupiter aggregator for best rates
- 💸 **SOL Transfers**: Send SOL to other addresses with optional memos
- 🎁 **SOL Wrapping**: Wrap and unwrap SOL to/from WSOL
- 📊 **Balance Checking**: Check SOL and token balances individually or all at once
- 🎯 **Interactive CLI**: User-friendly command-line interface with guided workflows

## Installation

### Global Installation (Recommended)

```bash
npm install -g solana-better-cli
```

### Local Installation

```bash
npm install solana-better-cli
```

## Usage

### Quick Start

```bash
# Start the interactive wallet manager
solana-better start

# Or use the short alias
sol start
```

### Available Commands

```bash
# Generate a new wallet
solana-better create-wallet

# Generate and save wallet to file
solana-better create-wallet -o wallet.json

# Initialize wallet from private key
solana-better init "[1,2,3,...]"  # JSON array format
solana-better init "base58string" # Base58 format
solana-better init wallet.json    # File path

# Initialize and save to file
solana-better init "[1,2,3,...]" -s my-wallet.json

# Start interactive mode
solana-better start

# Show help
solana-better --help
```

### Interactive Features

Once you start the tool, you'll have access to:

1. **Wallet Setup**
   - Generate new wallet
   - Load from private key
   - Load from file

2. **Main Operations**
   - View Portfolio
   - Transfer SOL
   - Wrap/Unwrap SOL
   - Swap Tokens
   - Check Balance
   - Change Wallet

## Configuration

The tool uses environment variables for configuration. Create a `.env` file in your project root:

```env
# Solana RPC URL (default: https://api.mainnet-beta.solana.com)
RPC_URL=https://api.mainnet-beta.solana.com

# Your private key (optional, for automated usage)
PRIVATE_KEY=[your-private-key-array]

# Commitment level (default: confirmed)
COMMITMENT=confirmed
```

## Examples

### Generate a New Wallet

```bash
solana-better create-wallet -o my-wallet.json
```

### Transfer SOL

```bash
solana-better start
# Then select "Transfer SOL" from the menu
```

### Swap Tokens

```bash
solana-better start
# Then select "Swap Tokens" from the menu
```

### Initialize from Private Key

```bash
# From JSON array
solana-better init "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]"

# From base58 string
solana-better init "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtrP1V5xih"

# From file
solana-better init wallet.json
```

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/solana-better-cli.git
cd solana-better-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Scripts

- `npm run build` - Build the TypeScript project
- `npm run start` - Run the built version
- `npm run dev` - Run in development mode with ts-node
- `npm run clean` - Clean the dist folder

## Publishing

To publish to npm:

```bash
# Login to npm (if not already logged in)
npm login

# Publish the package
npm publish
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Create an issue on GitHub
- Check the documentation
- Join our community discussions

## Disclaimer

This tool is for educational and development purposes. Always test with small amounts before using with significant funds. The developers are not responsible for any financial losses.
