import { supabase } from '../lib/supabase';

export const DEFAULT_PRIMARY_FEE_PCT = 0.15;
export const DEFAULT_RESALE_FEE_PCT = 0.12;
export const DEFAULT_PUBLISH_FEE = 2500;
export const DEFAULT_PUBLISH_FEE_THRESHOLD = 25;

export interface MonetizationConfig {
  primaryFeePct: number;
  resaleFeePct: number;
  publishFee: number;
  publishFeeThreshold: number;
}

const normalizePct = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return value / 100;
  return value;
};

export const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const calculatePrimaryPricing = (basePrice: number, feePct: number) => {
  const platformFee = roundMoney(basePrice * Math.max(feePct, 0));
  const finalAmount = roundMoney(basePrice + platformFee);

  return {
    basePrice,
    platformFee,
    finalAmount,
  };
};

export const calculateResalePricing = (askingPrice: number, feePct: number) => {
  const platformFee = roundMoney(askingPrice * Math.max(feePct, 0));
  const buyerPays = roundMoney(askingPrice + platformFee);

  return {
    askingPrice,
    platformFee,
    sellerReceives: roundMoney(askingPrice),
    buyerPays,
  };
};

export const getPlatformConfig = async (): Promise<MonetizationConfig> => {
  const fallback: MonetizationConfig = {
    primaryFeePct: DEFAULT_PRIMARY_FEE_PCT,
    resaleFeePct: DEFAULT_RESALE_FEE_PCT,
    publishFee: DEFAULT_PUBLISH_FEE,
    publishFeeThreshold: DEFAULT_PUBLISH_FEE_THRESHOLD,
  };

  try {
    const { data, error } = await supabase.rpc('get_platform_config_public');

    if (error || !data) {
      return fallback;
    }

    return {
      primaryFeePct: normalizePct(Number(data.primary_fee_pct), DEFAULT_PRIMARY_FEE_PCT),
      resaleFeePct: normalizePct(Number(data.resale_fee_pct), DEFAULT_RESALE_FEE_PCT),
      publishFee: Number(data.publish_fee) || DEFAULT_PUBLISH_FEE,
      publishFeeThreshold: Number(data.publish_fee_threshold) || DEFAULT_PUBLISH_FEE_THRESHOLD,
    };
  } catch (error) {
    console.error('Error fetching platform config:', error);
    return fallback;
  }
};
