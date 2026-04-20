// Google Analytics GA4 utility — Measurement ID: G-JD2NVFJ6KD

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_ID = 'G-JD2NVFJ6KD';

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

// ─── Page Views ────────────────────────────────────────────────────────────

export function trackPageView(path: string, title?: string) {
  gtag('event', 'page_view', {
    page_location: window.location.origin + path,
    page_path: path,
    page_title: title ?? document.title,
    send_to: GA_ID,
  });
}

// ─── Authentication ─────────────────────────────────────────────────────────

export function trackSignUp(method: string) {
  gtag('event', 'sign_up', { method });
}

export function trackLogin(method: string) {
  gtag('event', 'login', { method });
}

export function trackLogout() {
  gtag('event', 'logout');
}

// ─── Mining ─────────────────────────────────────────────────────────────────

export function trackMiningStarted(poolName: string, coin: string) {
  gtag('event', 'mining_started', {
    pool_name: poolName,
    coin,
  });
}

export function trackMiningStopped(poolName: string, coin: string, durationSeconds?: number) {
  gtag('event', 'mining_stopped', {
    pool_name: poolName,
    coin,
    duration_seconds: durationSeconds,
  });
}

export function trackPoolSelected(poolName: string, coin: string) {
  gtag('event', 'pool_selected', {
    pool_name: poolName,
    coin,
  });
}

// ─── Contracts / Purchases ───────────────────────────────────────────────────

export function trackPurchaseBegin(contractName: string, valueCurrency: string, valueAmount: number) {
  gtag('event', 'begin_checkout', {
    currency: valueCurrency,
    value: valueAmount,
    items: [{ item_name: contractName }],
  });
}

export function trackPurchaseComplete(
  transactionId: string,
  contractName: string,
  valueCurrency: string,
  valueAmount: number
) {
  gtag('event', 'purchase', {
    transaction_id: transactionId,
    currency: valueCurrency,
    value: valueAmount,
    items: [{ item_name: contractName }],
  });
}

// ─── Wallet ──────────────────────────────────────────────────────────────────

export function trackDeposit(currency: string, amount: number) {
  gtag('event', 'deposit', { currency, amount });
}

export function trackWithdrawal(currency: string, amount: number) {
  gtag('event', 'withdrawal', { currency, amount });
}

export function trackWalletAddressCopied(currency: string) {
  gtag('event', 'wallet_address_copied', { currency });
}

// ─── Referral / Growth ───────────────────────────────────────────────────────

export function trackReferralCodeCopied() {
  gtag('event', 'referral_code_copied');
}

export function trackReferralLinkShared(method: string) {
  gtag('event', 'share', {
    method,
    content_type: 'referral_link',
  });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function trackSettingsChanged(setting: string, value: string | boolean | number) {
  gtag('event', 'settings_changed', { setting, value: String(value) });
}

export function trackNotificationsEnabled() {
  gtag('event', 'notifications_enabled');
}

// ─── Support ─────────────────────────────────────────────────────────────────

export function trackSupportTicketOpened(category: string) {
  gtag('event', 'support_ticket_opened', { category });
}
