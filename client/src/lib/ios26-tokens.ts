/**
 * iOS 26 "Liquid Glass" Design Tokens
 * Extracted directly from Apple's official iOS & iPadOS 26 Figma Design Kit
 * File: figma.com/design/3Kd9nT4Vl3doNRj1zomD66
 *
 * These are the EXACT values from the Figma source — not approximations.
 */

// ─── Typography (SF Pro) ────────────────────────────────────────────────────
export const typography = {
  largeTitle: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: 0.4,
  },
  title1: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  headline: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 590,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.43,
  },
  body: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 400,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.43,
  },
  callout: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 400,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  subheadline: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 400,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  footnote: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 400,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  caption1: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 400,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 400,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
  tabLabel: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 590,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: -0.1,
  },
  tabIcon: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 590,
    fontSize: 18,
    lineHeight: 28,
  },
  buttonIcon: {
    fontFamily: "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontWeight: 510,
    fontSize: 17,
    lineHeight: 22,
  },
} as const;

// ─── Colors — iOS 26 System Colors ──────────────────────────────────────────
export const colors = {
  light: {
    // Labels
    labelPrimary: "#000000",
    labelSecondary: "#3c3c43", // 60% opacity
    labelTertiary: "#3c3c43", // 30% opacity
    labelQuaternary: "#3c3c43", // 18% opacity
    // Vibrant labels (on glass)
    labelVibrantPrimary: "#1a1a1a",
    labelVibrantSecondary: "#727272",
    // Backgrounds
    bgPrimary: "#ffffff",
    bgSecondary: "#f2f2f7",
    bgTertiary: "#ffffff",
    bgElevated: "#ffffff",
    // Fills
    fillVibrantPrimary: "#cccccc",
    fillVibrantSecondary: "#ededed",
    fillVibrantTertiary: "#ededed",
    // Glass
    glassBase: "rgba(255, 255, 255, 0.65)",
    glassBurn: "#dddddd",
    glassDarken: "#f7f7f7",
    glassEffect: "rgba(0, 0, 0, 0)",
    // Accents
    blue: "#0088ff",
    green: "#34c759",
    red: "#ff3b30",
    orange: "#ff9500",
    yellow: "#ffcc00",
    teal: "#5ac8fa",
    // Separator
    separator: "rgba(60, 60, 67, 0.29)",
    opaqueSeparator: "#c6c6c8",
  },
  dark: {
    // Labels
    labelPrimary: "#ffffff",
    labelSecondary: "rgba(235, 235, 245, 0.6)",
    labelTertiary: "rgba(235, 235, 245, 0.3)",
    labelQuaternary: "rgba(235, 235, 245, 0.18)",
    // Vibrant labels (on glass)
    labelVibrantPrimary: "#f5f5f5",
    labelVibrantSecondary: "#a0a0a0",
    // Backgrounds
    bgPrimary: "#000000",
    bgSecondary: "#1c1c1e",
    bgTertiary: "#2c2c2e",
    bgElevated: "#1c1c1e",
    // Fills
    fillVibrantPrimary: "#3a3a3a",
    fillVibrantSecondary: "#2a2a2a",
    fillVibrantTertiary: "#2a2a2a",
    // Glass
    glassBase: "rgba(40, 40, 40, 0.65)",
    glassBurn: "#262626",
    glassDarken: "#1a1a1a",
    glassEffect: "rgba(255, 255, 255, 0)",
    // Accents
    blue: "#0a84ff",
    green: "#30d158",
    red: "#ff453a",
    orange: "#ff9f0a",
    yellow: "#ffd60a",
    teal: "#64d2ff",
    // Separator
    separator: "rgba(84, 84, 88, 0.65)",
    opaqueSeparator: "#38383a",
  },
} as const;

// ─── Shadows (from Figma) ───────────────────────────────────────────────────
export const shadows = {
  glass: "0px 8px 40px 0px rgba(0, 0, 0, 0.12)",
  sheetFullscreen: "0px 15px 75px 0px rgba(0, 0, 0, 0.18)",
  elevated: "0px 4px 20px 0px rgba(0, 0, 0, 0.08)",
  /** Dark mode variants */
  glassDark: "0px 8px 40px 0px rgba(0, 0, 0, 0.45)",
  sheetFullscreenDark: "0px 15px 75px 0px rgba(0, 0, 0, 0.55)",
} as const;

// ─── Radii ──────────────────────────────────────────────────────────────────
export const radii = {
  pill: 296,
  tabBar: 296,
  screen: 50,
  sheetTop: 34,
  sheetBottom: 58,
  card: 20,
  button: 100,
  faceIdBezel: 40,
} as const;

// ─── Scroll Edge Effect ─────────────────────────────────────────────────────
export const scrollEdge = {
  topHeight: 167,
  bottomHeight: 110,
  blurRadius: 30,
  opacity: 0.9,
  /** CSS variable override */
  cssVar: "--scroll-edge-effect-blur-radius",
  defaultBlur: 5,
} as const;

// ─── Layout ─────────────────────────────────────────────────────────────────
export const layout = {
  statusBar: {
    paddingTop: 21,
    paddingBottom: 19,
    paddingHorizontal: 24,
    height: 62, // 21 + 22 line-height + 19
  },
  tabBar: {
    paddingTop: 16,
    paddingBottom: 25,
    paddingHorizontal: 25,
    tabIconSize: 18,
    tabLabelSize: 10,
    tabHitTarget: 54,
    selectionRadius: 100,
  },
  toolbar: {
    controlsPadding: 16,
    buttonGroupHeight: 44,
    buttonIconSize: 36,
    buttonGroupRadius: 296,
    buttonGroupGap: 20,
  },
  grabber: {
    width: 36,
    height: 5,
    radius: 100,
  },
  sheet: {
    inspectorTopRadius: 34,
    inspectorBottomRadius: 58,
  },
  faceId: {
    bezelSize: 151,
    bezelRadius: 40,
    iconSize: 70,
  },
} as const;

// ─── Motion ─────────────────────────────────────────────────────────────────
export const motion = {
  /** Spring for tab bar / nav transitions */
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  /** Gentle spring for page transitions */
  pageSpring: { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 },
  /** Quick ease for micro-interactions */
  quick: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
  /** Smooth ease for blur/gradient transitions */
  smooth: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  /** iOS-native feeling drag constraints */
  dragElastic: 0.15,
} as const;
