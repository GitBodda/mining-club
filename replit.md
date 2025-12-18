# Mining Club - Premium Hashpower Sales App

## Overview

Mining Club is a mobile-first cryptocurrency hashpower sales app built as a web application with iOS 26 Liquid Glass design language. The app provides a premium, native-feeling experience for users to purchase Bitcoin and Litecoin mining contracts, manage multi-crypto wallets (BTC, LTC, USDT, USDC), and participate in Solo Mining for lottery-style block rewards. This is hashpower sales, NOT mobile mining—users purchase contracts that mine passively.

## User Preferences

- Preferred communication style: Simple, everyday language
- Design language: iOS 26 Liquid Glass with translucent glass effects, 24-32px blur, inner highlights, rounded corners
- Primary accent color: Blue (not yellow/amber)
- Fonts: Inter (UI text) + Space Grotesk (headings/display) from Google Fonts
- Focus on eye-catching 3D graphics and animations to convert users
- iOS 26 features: Status bar with battery/network, home indicator bar

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Styling**: Tailwind CSS with custom liquid glass design tokens
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **State Management**: TanStack Query (React Query) for server state
- **Animations**: Framer Motion for fluid, physics-based animations
- **Charts**: Recharts for data visualization
- **Fonts**: Inter (body), Space Grotesk (display)

The frontend follows a component-based architecture with:
- Page components in `client/src/pages/` (Dashboard, Wallet, Invest, Mining, SoloMining, Settings, Onboarding, AuthPage)
- Reusable UI components in `client/src/components/`
- Custom hooks in `client/src/hooks/` for data fetching and mobile detection
- Shared type definitions in `client/src/lib/types.ts`

### App Structure
- **Bottom Navigation**: 5 tabs (Home, Wallet, Invest, Mining, Solo)
- **Header**: Profile icon (for non-logged-in users), Settings icon, Notifications
- **iOS 26 Components**: IOSStatusBar (battery, network, time) and IOSHomeIndicator
- **Onboarding**: 3 premium onboarding pages for first-time users
- **Authentication**: Sign-in/Register pages with Google and Apple SSO
- **Solo Mining**: Lottery-style mining where users buy massive hashpower (50 PH/s for 6 months recommended) to win full 3 BTC block rewards

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Schema Validation**: Zod with drizzle-zod integration

### API Routes
- `GET /api/mining/stats` - Get current mining statistics
- `POST /api/mining/toggle` - Toggle mining on/off
- `GET /api/wallet/balances` - Get wallet cryptocurrency balances (BTC, LTC, USDT, USDC)
- `GET /api/wallet/transactions` - Get transaction history
- `GET /api/pools` - Get available mining pools
- `POST /api/pools/:id/select` - Select a mining pool
- `GET /api/chart` - Get chart data for hash rate visualization
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update user settings
- `GET /api/login` - Replit Auth login flow (Google, Apple, Email)
- `GET /api/logout` - Logout flow

### Database Schema
Located in `shared/schema.ts`:
- `users` table with id, username, password fields
- TypeScript interfaces for in-memory data: MiningStats, WalletBalance, Transaction, MiningPool, ChartDataPoint, UserSettings

### Design System
The app follows iOS 26 Liquid Glass design patterns with:
- Dark mode by default with liquid glass effects (24-32px backdrop blur)
- Blue primary accent color
- Custom CSS variables for theming in `client/src/index.css`
- 3D graphics and coin logos for visual appeal
- Touch-optimized tap targets (minimum 44pt)
- Safe area padding for notch devices
- Inter font (UI) + Space Grotesk font (display/headings)
- iOS status bar simulation with battery, signal, wifi icons
- iOS home indicator bar with proper spacing from navigation

### Supported Cryptocurrencies
- BTC (Bitcoin) - gold accent, 3D logo
- LTC (Litecoin) - silver/blue accent, 3D logo
- USDT (Tether) - emerald accent, 3D logo
- USDC (USD Coin) - blue accent, 3D logo

## How to Change Cryptocurrency Icons

All cryptocurrency icons are stored in the `attached_assets/` folder and imported in the component files. To change an icon:

### Step 1: Add your new image
Upload your new icon image to the `attached_assets/` folder.

### Step 2: Update the imports
The icons are imported in these files:
- **Dashboard.tsx** (`client/src/pages/Dashboard.tsx`) - Line ~7-18
- **Wallet.tsx** (`client/src/pages/Wallet.tsx`) - Line ~28-35
- **CryptoCard.tsx** (`client/src/components/CryptoCard.tsx`) - Line ~3-10

Example import change:
```typescript
// Old import
import usdtLogo from "@assets/tether-usdt-coin-3d-icon-png-download-3478983@0_1766038564971.webp";

// New import (replace with your new file)
import usdtLogo from "@assets/your-new-usdt-icon.png";
```

### Step 3: Verify the logo map (if applicable)
In CryptoCard.tsx and Wallet.tsx, there's a `logoMap` object that maps symbol to image:
```typescript
const logoMap: Record<string, string> = {
  BTC: btcLogo,
  LTC: ltcLogo,
  USDT: usdtLogo,
  USDC: usdcLogo,
};
```

### Current Icon Files
- **BTC**: `@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png`
- **LTC**: `@assets/litecoin-3d-icon-png-download-4466121_1766014388608.png`
- **USDT**: `@assets/tether-usdt-coin-3d-icon-png-download-3478983@0_1766038564971.webp`
- **USDC**: `@assets/usd-coin-3d-icon-png-download-4102016_1766038596188.webp`
- **USDC Flat**: `@assets/usd-coin-usdc-logo_1766038726866.png`

### Other 3D Graphics Used
- **Mixed Main**: `@assets/Mixed_main_1766014388605.png` (portfolio hero)
- **GPU Mining**: `@assets/Gpu_Mining_1766014388614.png`
- **Server Mining**: `@assets/Server_Mining_1766014388610.png`
- **Bitcoin Shop**: `@assets/Bitcoin_shop_1766014388611.png`
- **Bitcoin Wallet**: `@assets/Bitcoin_Wallet_1766014388613.png`

## External Dependencies

### Database
- **PostgreSQL**: Primary database configured via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migration tool (`npm run db:push`)

### Frontend Libraries
- **@tanstack/react-query**: Server state management with automatic refetching
- **framer-motion**: Animation library for iOS-like transitions
- **recharts**: Charting library for hash rate visualization
- **lucide-react**: General UI icons
- **react-icons**: Company logos (Google, Apple)

### Backend Libraries
- **express**: Web server framework
- **drizzle-orm**: Type-safe database ORM
- **connect-pg-simple**: PostgreSQL session store
- **zod**: Runtime type validation

### Build & Development
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Backend bundling for production
- **tsx**: TypeScript execution for development
- **@replit/vite-plugin-***: Replit-specific development tools

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (required for database operations)
- `SESSION_SECRET`: Session encryption secret (required for auth)
