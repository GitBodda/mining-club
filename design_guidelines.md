# Design Guidelines: Crypto Mining iOS App

## Design Approach

**Selected Approach:** Reference-Based with Modern iOS Patterns

Drawing inspiration from leading crypto/fintech apps (Coinbase, Robinhood, Rainbow Wallet) combined with iOS 17 design language. Emphasis on glassmorphism, depth layering, and fluid animations to create a premium, futuristic mining experience.

## Core Design Principles

1. **Depth Through Layering:** Multi-level card stacking with backdrop blur effects
2. **Fluid Motion:** Physics-based animations for all state changes
3. **Data Clarity:** Real-time metrics displayed with hierarchical prominence
4. **Touch-First:** Large tap targets (min 44pt) with generous padding
5. **Safe Area Respect:** All critical content respects iOS safe areas and notch

## Typography System

**Font Family:** SF Pro Display (iOS native) via system fonts

**Hierarchy:**
- Hero Numbers: 48pt, Bold (mining hash rate, balance)
- Section Headers: 24pt, Semibold
- Card Titles: 18pt, Semibold
- Body Text: 16pt, Regular
- Captions/Labels: 14pt, Medium
- Micro Labels: 12pt, Regular

**Line Heights:** 1.2 for headers, 1.5 for body text

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: mb-6 to mb-8
- Card gaps: gap-4
- Safe area padding: pt-12 (top), pb-6 (bottom)

**Container Strategy:**
- Full-width sections with px-4 inner padding
- Cards use rounded-2xl (16pt radius)
- Maximum content width: 428pt (iPhone Pro Max)

## Screen Layouts

### Dashboard (Home Screen)
- **Status Bar:** Mining status indicator, notifications bell
- **Hero Card:** Large glassmorphic card with current hash rate, animated particle background
- **Quick Stats Grid:** 2-column grid (Mining time, Power usage)
- **Mining Control:** Prominent centered button with glow effect
- **Earnings Preview Card:** Compact balance display with 24h change
- **Bottom Navigation:** 5 tabs with icon + label

### Wallet Screen
- **Balance Header:** Large balance with currency converter
- **Portfolio Cards:** Vertical stack of crypto holdings (BTC, ETH, etc.)
- **Transaction List:** Scrollable history with icons and amounts

### Mining Control Screen
- **Visual Intensity Slider:** Custom range input with real-time preview
- **Pool Selection Cards:** Grid of mining pools with APY badges
- **Performance Graph:** Interactive line chart showing hash rate over time

### Settings Screen
- **Profile Header:** User avatar with mining rank badge
- **Settings Groups:** Grouped list items (Notifications, Security, Advanced)
- **Toggle Switches:** iOS-style switches for preferences

## Component Library

### Cards
- Glassmorphic containers with backdrop-blur-xl
- Subtle border treatment for depth
- Padding: p-6 for content cards
- Shadow: Multi-layer shadow for floating effect

### Buttons
- **Primary (Mining Control):** Large pill-shaped (h-14), full-width
- **Secondary:** Outlined style with border-2
- **Icon Buttons:** Circular, 44pt minimum tap area
- All buttons include scale transform on press (0.95)

### Charts & Visualizations
- **Line Charts:** Smooth curves with gradient fills
- **Progress Rings:** Circular indicators for mining progress
- **Stat Cards:** Number + sparkline combination

### Navigation
- **Bottom Tab Bar:** Backdrop blur, safe area aware, 80pt height
- **Top Navigation:** Transparent with blur-on-scroll effect
- **Modals:** Sheet-style presentation with drag handle

### Status Indicators
- **Mining Active:** Pulsing glow animation
- **Hash Rate Display:** Animated counter with units
- **Connection Status:** Dot indicators (online/offline)

## Animation Guidelines

**Core Animations Only:**
- Mining button pulse when active (subtle, 2s loop)
- Number counter animations when values update
- Card entrance: Stagger fade + slide from bottom (0.1s delay each)
- Tab switching: Crossfade transition (0.2s)
- Pull-to-refresh: iOS standard spring animation

**NO Animations For:**
- Background decorative elements (static gradients)
- Text content
- Icon states
- Chart grid lines

## iOS-Specific Patterns

- **Haptic Feedback:** Visual cues for touches (scale transforms)
- **Swipe Gestures:** Horizontal swipe on transaction cards for actions
- **Long Press:** Pool cards reveal detailed stats on press-hold
- **Pull to Refresh:** Standard iOS refresh control on lists
- **Safe Areas:** All screens account for notch, home indicator, Dynamic Island

## Content Density

**Dashboard:** Medium density - 3-4 visible cards above fold
**Wallet:** High density - List view with 5-6 items visible
**Settings:** Low density - Generous spacing between groups

## Images

**No hero images required** - This is a data-focused dashboard app. Visual interest comes from:
- Animated gradient backgrounds
- Real-time data visualizations
- Glassmorphic card treatments
- Particle effects on mining interface

## Accessibility

- Minimum 16pt body text throughout
- Tap targets: 44pt minimum
- High contrast text-to-background ratios
- VoiceOver labels on all interactive elements
- Dynamic Type support for text scaling