# MinersClub - Mobile Crypto Mining App

## Overview

MinersClub is a mobile-first cryptocurrency hashpower sales app built as a web application with iOS 26 Liquid Glass design language. The app provides a premium, native-feeling experience for users to purchase Bitcoin and Litecoin mining contracts, manage multi-crypto wallets (BTC, LTC, USDT, USDC), and participate in Solo Mining for lottery-style block rewards. This is hashpower sales, NOT mobile mining—users purchase contracts that mine passively.

## User Preferences

- Preferred communication style: Simple, everyday language
- Design language: iOS 26 Liquid Glass with translucent glass effects, 24-32px blur, inner highlights, rounded corners
- Primary accent color: Blue (not yellow/amber)
- Font: Space Grotesk from Google Fonts
- Focus on eye-catching 3D graphics and animations to convert users

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Styling**: Tailwind CSS with custom liquid glass design tokens
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **State Management**: TanStack Query (React Query) for server state
- **Animations**: Framer Motion for fluid, physics-based animations
- **Charts**: Recharts for data visualization
- **Font**: Space Grotesk (Google Fonts)

The frontend follows a component-based architecture with:
- Page components in `client/src/pages/` (Dashboard, Wallet, Invest, Mining, SoloMining, Settings)
- Reusable UI components in `client/src/components/`
- Custom hooks in `client/src/hooks/` for data fetching and mobile detection
- Shared type definitions in `client/src/lib/types.ts`

### App Structure
- **Bottom Navigation**: 5 tabs (Home, Wallet, Invest, Mining, Solo)
- **Header**: Settings icon next to Notifications (Settings accessible via overlay)
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
- Space Grotesk font family

### Supported Cryptocurrencies
- BTC (Bitcoin) - gold accent
- LTC (Litecoin) - silver/blue accent
- USDT (Tether) - emerald accent
- USDC (USD Coin) - sky/blue accent

## External Dependencies

### Database
- **PostgreSQL**: Primary database configured via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migration tool (`npm run db:push`)

### Frontend Libraries
- **@tanstack/react-query**: Server state management with automatic refetching
- **framer-motion**: Animation library for iOS-like transitions
- **recharts**: Charting library for hash rate visualization
- **lucide-react**: General UI icons

### Backend Libraries
- **express**: Web server framework
- **drizzle-orm**: Type-safe database ORM
- **connect-pg-simple**: PostgreSQL session store (available but not currently used)
- **zod**: Runtime type validation

### Build & Development
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Backend bundling for production
- **tsx**: TypeScript execution for development
- **@replit/vite-plugin-***: Replit-specific development tools

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (required for database operations)
