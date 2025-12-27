import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Currency = 'USD' | 'EUR' | 'GBP' | 'AED';

interface ExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
  AED: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: ExchangeRates;
  isLoading: boolean;
  convert: (usdAmount: number) => number;
  format: (usdAmount: number, showSymbol?: boolean) => string;
  getSymbol: () => string;
}

const defaultRates: ExchangeRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
};

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('preferredCurrency');
    return (saved as Currency) || 'USD';
  });
  const [rates, setRates] = useState<ExchangeRates>(defaultRates);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExchangeRates = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        setRates({
          USD: 1,
          EUR: data.rates.EUR || defaultRates.EUR,
          GBP: data.rates.GBP || defaultRates.GBP,
          AED: data.rates.AED || defaultRates.AED,
        });
      }
    } catch (error) {
      console.log('Using fallback exchange rates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 3600000);
    return () => clearInterval(interval);
  }, [fetchExchangeRates]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  const convert = useCallback((usdAmount: number): number => {
    return usdAmount * rates[currency];
  }, [currency, rates]);

  const getSymbol = useCallback((): string => {
    return currencySymbols[currency];
  }, [currency]);

  const format = useCallback((usdAmount: number, showSymbol: boolean = true): string => {
    const converted = convert(usdAmount);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
    
    if (showSymbol) {
      if (currency === 'AED') {
        return `${formatted} ${currencySymbols[currency]}`;
      }
      return `${currencySymbols[currency]}${formatted}`;
    }
    return formatted;
  }, [convert, currency]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      rates,
      isLoading,
      convert,
      format,
      getSymbol,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
