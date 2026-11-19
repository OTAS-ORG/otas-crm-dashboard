import type { DiscountType, InvoiceItem } from '../types';

export type InvoiceCurrency = 'MMK' | 'USD';

export const roundMoney = (value: number, currency: InvoiceCurrency = 'MMK'): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return currency === 'USD' ? Math.round(num * 100) / 100 : Math.round(num);
};

export const formatMoney = (value: number, currency: InvoiceCurrency = 'MMK'): string => {
  const safe = Number.isFinite(value) ? value : 0;
  if (currency === 'USD') {
    return `${safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
  }
  return `${Math.round(safe).toLocaleString()} MMK`;
};

export const getItemOriginalAmount = (item: Partial<InvoiceItem>): number => {
  if (item.originalAmount !== undefined && item.originalAmount !== null) {
    if (
      item.originalAmount === 0 &&
      !item.isFoc &&
      (!item.discountType || item.discountType === 'none') &&
      Number(item.amount) > 0
    ) {
      return Number(item.amount);
    }
    return Math.max(0, Number(item.originalAmount) || 0);
  }
  return Math.max(0, Number(item.amount) || 0);
};

export const calculateDiscount = (
  baseAmount: number,
  discountType: DiscountType = 'none',
  discountValue = 0,
  currency: InvoiceCurrency = 'MMK',
): { discountType: DiscountType; discountValue: number; discountAmount: number } => {
  const safeBase = Math.max(0, roundMoney(baseAmount, currency));
  const rawVal = Math.max(0, Number(discountValue) || 0);

  if (discountType === 'percent') {
    const clampedVal = Math.min(100, rawVal);
    const discountAmount = Math.min(safeBase, roundMoney(safeBase * (clampedVal / 100), currency));
    return { discountType, discountValue: clampedVal, discountAmount };
  }

  if (discountType === 'fixed') {
    const clampedVal = Math.min(safeBase, roundMoney(rawVal, currency));
    return { discountType, discountValue: clampedVal, discountAmount: clampedVal };
  }

  return { discountType: 'none', discountValue: 0, discountAmount: 0 };
};

export const calculateItemPricing = (
  item: InvoiceItem,
  currency: InvoiceCurrency = 'MMK',
): InvoiceItem => {
  const originalAmount = roundMoney(getItemOriginalAmount(item), currency);

  if (item.isFoc) {
    return {
      ...item,
      originalAmount,
      isFoc: true,
      discountType: 'none',
      discountValue: 0,
      discountAmount: 0,
      discountReason: '',
      amount: 0,
    };
  }

  const dType: DiscountType =
    item.discountType === 'fixed' || item.discountType === 'percent' ? item.discountType : 'none';
  const discount = calculateDiscount(originalAmount, dType, item.discountValue || 0, currency);
  const amount = Math.max(0, roundMoney(originalAmount - discount.discountAmount, currency));

  return {
    ...item,
    originalAmount,
    isFoc: false,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountAmount: discount.discountAmount,
    discountReason: discount.discountType === 'none' ? '' : item.discountReason || '',
    amount,
  };
};

export const hydrateInvoiceItem = (
  item: InvoiceItem,
  currency: InvoiceCurrency = 'MMK',
): InvoiceItem => {
  return calculateItemPricing(
    {
      ...item,
      originalAmount: getItemOriginalAmount(item),
      isFoc: Boolean(item.isFoc),
      discountType: item.discountType || 'none',
      discountValue: item.discountValue || 0,
      discountAmount: item.discountAmount || 0,
      discountReason: item.discountReason || '',
    },
    currency,
  );
};

export const calculateInvoiceTotals = (params: {
  items?: InvoiceItem[];
  amount?: number;
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount?: number;
  platformFeeRate?: number;
  platformFee?: number;
  additionalCharges?: { name: string; amount: number }[];
  currency?: InvoiceCurrency;
}) => {
  const currency: InvoiceCurrency = params.currency === 'USD' ? 'USD' : 'MMK';
  const subtotal = Array.isArray(params.items)
    ? roundMoney(
        params.items.reduce((sum, item) => sum + (calculateItemPricing(item, currency).amount || 0), 0),
        currency,
      )
    : roundMoney(params.amount || 0, currency);

  const dType: DiscountType =
    params.discountType === 'fixed' || params.discountType === 'percent'
      ? params.discountType
      : 'none';
  const invoiceDiscount =
    dType !== 'none'
      ? calculateDiscount(subtotal, dType, params.discountValue || 0, currency)
      : {
          discountType: 'none' as DiscountType,
          discountValue: 0,
          discountAmount: Math.min(subtotal, Math.max(0, roundMoney(params.discountAmount || 0, currency))),
        };

  const afterDiscount = Math.max(0, roundMoney(subtotal - invoiceDiscount.discountAmount, currency));
  const platformFeeRate = params.platformFeeRate || 0;
  const platformFee =
    params.platformFee !== undefined && platformFeeRate === 0
      ? roundMoney(params.platformFee, currency)
      : roundMoney(afterDiscount * (platformFeeRate / 100), currency);
  const additionalTotal = roundMoney(
    (params.additionalCharges || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
    currency,
  );
  const grandTotal = Math.max(0, roundMoney(afterDiscount + platformFee + additionalTotal, currency));

  return {
    subtotal,
    discountAmount: invoiceDiscount.discountAmount,
    afterDiscount,
    platformFee,
    additionalTotal,
    grandTotal,
  };
};

export const formatDiscountLabel = (
  discountType: DiscountType | undefined,
  discountValue: number | undefined,
  discountAmount: number | undefined,
  discountReason: string | undefined,
  currency: InvoiceCurrency = 'MMK',
): string => {
  const parts: string[] = [];
  if (discountType === 'percent' && (discountValue || 0) > 0) {
    parts.push(`${discountValue}%`);
  } else if (discountType === 'fixed' && (discountAmount || 0) > 0) {
    parts.push(formatMoney(discountAmount || 0, currency));
  }
  if (discountReason && discountReason.trim()) {
    parts.push(discountReason.trim());
  }
  return parts.join(' — ');
};
