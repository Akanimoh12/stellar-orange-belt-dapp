# 🔒 StellarVault — Token Vault dApp

> **Level 3 — Orange Belt Submission**
> A Stellar/Soroban Token Vault with deposit, timelock, and withdrawal functionality.

![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue?logo=stellar)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Smart Contract](#smart-contract)
- [Testing](#testing)
- [Loading States & Caching](#loading-states--caching)
- [Deployment](#deployment)
- [Demo](#demo)
- [Submission Checklist](#submission-checklist)

---

## Overview

StellarVault is a token vault dApp built on Stellar's Soroban smart contract platform. Users can:

- **Deposit** XLM into a personal on-chain vault
- **Set a timelock** to protect funds from premature withdrawal
- **Withdraw** funds after the timelock expires
- **Monitor** vault activity through a live event feed

The dApp showcases end-to-end smart contract interaction with quality engineering practices: loading states, transaction progress indicators, caching, comprehensive tests, and error handling.

---

## Features

| Feature | Description |
|---------|-------------|
| **Vault Deposit** | Deposit XLM from your wallet into the vault contract |
| **Timelock Protection** | Set a time-based lock to prevent early withdrawal |
| **Secure Withdrawal** | Withdraw funds with timelock enforcement |
| **Dashboard Stats** | Total deposited, active depositors, lock status |
| **Loading States** | Skeleton loaders, spinners, and transaction progress bars |
| **Caching** | LocalStorage-based TTL cache for vault data |
| **Multi-Wallet Support** | Freighter, xBull, and Albedo wallets via Stellar Wallets Kit |
| **Event Feed** | Real-time polling of on-chain vault events |
| **Error Handling** | Typed errors with user-friendly messages |
| **Responsive Design** | Works on desktop and mobile |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contract** | Rust / Soroban SDK 20.3.1 |
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite 4 |
| **Testing** | Vitest + React Testing Library |
| **Styling** | Vanilla CSS (Indigo theme) |
| **Wallet** | @creit.tech/stellar-wallets-kit |
| **Blockchain** | Stellar Testnet / Soroban RPC |
| **Deployment** | Vercel |

---

## Project Structure

```
stellar-orange-belt-dapp/
├── contracts/vault/          # Soroban smart contract
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs            # Vault contract (deposit, withdraw, timelock)
│       └── test.rs           # 10 Rust unit tests
├── src/
│   ├── main.tsx              # Entry point with ErrorBoundary
│   ├── App.tsx               # Tab layout (Vault/Deposit/Withdraw/Activity)
│   ├── index.css             # Complete stylesheet (indigo theme)
│   ├── test-setup.ts         # Vitest setup
│   ├── __tests__/
│   │   ├── cache.test.ts     # Cache service tests (7 tests)
│   │   ├── helpers.test.ts   # Utility function tests (13 tests)
│   │   └── App.test.tsx      # Component render tests (4 tests)
│   ├── components/
│   │   ├── VaultDashboard.tsx # Stats grid + user vault display
│   │   ├── DepositForm.tsx   # Deposit form with progress indicator
│   │   ├── WithdrawPanel.tsx # Withdraw + timelock management
│   │   ├── EventFeed.tsx     # Live event polling feed
│   │   ├── WalletConnect.tsx # Header wallet badge
│   │   └── WalletModal.tsx   # Wallet selection modal
│   ├── config/
│   │   └── network.ts        # Network config & contract IDs
│   ├── hooks/
│   │   ├── useWallet.tsx     # Wallet context provider
│   │   ├── useVault.ts       # Vault data fetching with cache
│   │   ├── useDeposit.ts     # Deposit transaction hook
│   │   ├── useWithdraw.ts    # Withdraw transaction hook
│   │   └── useEvents.ts      # Event polling hook
│   ├── services/
│   │   ├── soroban.ts        # RPC server instances
│   │   ├── contract.ts       # Contract interaction layer
│   │   ├── cache.ts          # TTL cache service
│   │   └── events.ts         # Event polling service
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── utils/
│   │   └── helpers.tsx        # Utility functions + loading components
│   └── wallet/
│       ├── kit.ts            # Stellar Wallets Kit setup
│       └── types.ts          # Wallet type definitions
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── vercel.json
└── README.md                 # This file
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Stellar testnet wallet (Freighter, xBull, or Albedo)
- Rust + Soroban CLI (for contract deployment)

### Install Dependencies

```bash
cd stellar-orange-belt-dapp
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

---

## Smart Contract

### Contract: `VaultContract`

The vault contract is written in Rust using Soroban SDK 20.3.1.

#### Functions

| Function | Description |
|----------|-------------|
| `initialize(admin, token)` | Initialize vault with admin and token address |
| `deposit(user, amount)` | Deposit tokens into user's vault |
| `withdraw(user, amount)` | Withdraw tokens (respects timelock) |
| `set_timelock(user, unlock_time)` | Set a timelock on user's vault |
| `get_balance(user)` → `i128` | Get user's vault balance |
| `get_timelock(user)` → `u64` | Get user's timelock timestamp |
| `get_vault_info()` → `VaultInfo` | Get global vault statistics |

#### Data Storage

| Key | Type | Description |
|-----|------|-------------|
| `Admin` | `Address` | Vault administrator |
| `Token` | `Address` | Token contract address (XLM SAC) |
| `Balance(Address)` | `i128` | Per-user deposited balance |
| `Timelock(Address)` | `u64` | Per-user unlock timestamp |
| `TotalDeposited` | `i128` | Total deposited across all users |
| `DepositCount` | `u32` | Number of unique depositors |

#### Building the Contract

```bash
cd contracts/vault
cargo build --target wasm32-unknown-unknown --release
```

#### Deploying to Testnet

```bash
# Install Soroban CLI if needed
cargo install --locked soroban-cli

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/vault.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet

# Initialize
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <YOUR_SECRET_KEY> \
  --network testnet \
  -- initialize \
  --admin <YOUR_PUBLIC_KEY> \
  --token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

After deployment, update `src/config/network.ts` with your contract ID.

#### Contract Tests (Rust)

The contract includes 10 unit tests:

```bash
cd contracts/vault
cargo test
```

Tests cover: initialization, double-init prevention, deposit, multiple deposits, withdraw, insufficient balance, timelock set, withdraw-during-lock, withdraw-after-lock, depositor count tracking.

---

## Testing

### Frontend Tests

The project uses **Vitest** + **React Testing Library** for frontend testing.

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Test Suites

| Suite | Tests | Description |
|-------|-------|-------------|
| `cache.test.ts` | 7 | Cache set/get, TTL expiry, invalidation, error handling |
| `helpers.test.ts` | 13 | formatXLM, truncateAddress, isValidAmount, timeUntil |
| `App.test.tsx` | 4 | Component rendering, navigation, structure |
| **Total** | **24** | **All passing** |

---

## Loading States & Caching

### Loading States

| Component | Loading Indicator |
|-----------|-------------------|
| VaultDashboard | **Skeleton loaders** on stat cards and vault info |
| DepositForm | **TxProgress bar** (idle → submitting → confirming → done) |
| WithdrawPanel | **TxProgress bar** + disabled buttons during transaction |
| EventFeed | **Pulse dot** animation while polling |
| WalletConnect | **Spinner** during wallet connection |

### Caching Implementation

The cache service (`src/services/cache.ts`) provides:

- **TTL-based caching**: Each entry expires after a configurable time
- **LocalStorage persistence**: Cache survives page refreshes
- **Automatic invalidation**: Cache is cleared after deposit/withdraw transactions
- **Prefix isolation**: All keys use `sv_` prefix to avoid collisions

| Data | Cache TTL |
|------|-----------|
| Vault Info (global stats) | 20 seconds |
| User Vault (balance, timelock) | 15 seconds |

---

## Deployment

### Deploy to Vercel

```bash
npm run build
# Deploy the `dist/` folder to Vercel
npx vercel --prod
```

The project includes `vercel.json` for SPA routing.

### Live Demo

> 🔗 **Live URL**: `__REPLACE_WITH_VERCEL_URL__`

---

## Demo

### Demo Video

> 🎬 **Video URL**: `__REPLACE_WITH_VIDEO_URL__`

The demo video covers:
1. Connecting a wallet (Freighter/xBull)
2. Viewing vault dashboard with loading states
3. Depositing XLM with transaction progress
4. Setting a timelock
5. Attempting withdrawal during lock (shows error)
6. Withdrawing after lock expires
7. Viewing activity feed

### Screenshots

> Add screenshots to `screenshot_of_application/` folder.

---

## Submission Checklist

### Level 3 — Orange Belt Requirements

- [x] **Mini-dApp functional and complete end-to-end**
  - Vault deposit, timelock, withdraw, dashboard, event feed
- [x] **Loading states and progress indicators**
  - Skeleton loaders, TxProgress bar, spinners, pulse dots
- [x] **Basic caching implemented**
  - LocalStorage TTL cache for vault info (20s) and user data (15s)
- [x] **Minimum 3 tests passing**
  - 24 tests across 3 suites (cache, helpers, app component)
- [x] **README fully completed**
  - Features, tech stack, structure, setup, contract API, testing, deployment
- [ ] **Demo video (1 min)**
  - ``
- [x] **3+ meaningful commits**
  - Initial scaffold, contract + services, UI + tests
- [ ] **Live demo on Vercel**
  - ``
- [ ] **Screenshot of passing tests**
  - Added to `screenshot_of_application/`

### Contract Details

| Field | Value |
|-------|-------|
| Contract ID | `CDTN2SBMIXR2A6XHGBIUYTTMEMZJO4JM56KFR67K444L7XATAI34HSRP` |
| Network | Stellar Testnet |
| Token | XLM (Native SAC) — `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Deployer | `GDHQ6TNWZ4V2JVCDWEUVW7YKFBXCOQZRRUCT27LAKES3PGOE6JSZMSMD` |

---

## License

MIT

---

> Built with 💜 for the Stellar Developer Program — Orange Belt Challenge
