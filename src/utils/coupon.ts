import { Coupon, CouponType, DiscountStep } from '@/types/coupon';

export interface CalculationStep {
  stepName: string;
  couponType: CouponType;
  beforeAmount: number;
  discountAmount: number;
  afterAmount: number;
  couponId?: string;
  couponName?: string;
}

export interface CalculationResult {
  originalAmount: number;
  totalDiscount: number;
  finalAmount: number;
  steps: CalculationStep[];
  hasNegativeFloor: boolean;
}

export const calculateDiscount = (
  coupon: Coupon,
  currentAmount: number
): { discountAmount: number; afterAmount: number } => {
  let discountAmount = 0;

  switch (coupon.type) {
    case 'discount': {
      if (coupon.minAmount && currentAmount < coupon.minAmount) {
        discountAmount = 0;
      } else {
        discountAmount = currentAmount * (1 - coupon.value / 10);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      }
      break;
    }
    case 'fullReduce': {
      if (coupon.minAmount && currentAmount >= coupon.minAmount) {
        discountAmount = coupon.value;
      }
      break;
    }
    case 'deduct': {
      if (coupon.minAmount && currentAmount < coupon.minAmount) {
        discountAmount = 0;
      } else {
        discountAmount = Math.min(coupon.value, currentAmount);
      }
      break;
    }
  }

  const afterAmount = currentAmount - discountAmount;

  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    afterAmount: Math.round(afterAmount * 100) / 100
  };
};

export const calculateWithCoupons = (
  originalAmount: number,
  coupons: Coupon[],
  steps: DiscountStep[]
): CalculationResult => {
  console.log('[CouponCalc] 开始优惠计算', {
    originalAmount,
    couponCount: coupons.length,
    couponTypes: coupons.map(c => ({ id: c.id, type: c.type, name: c.name }))
  });

  const enabledSteps = steps
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  console.log('[CouponCalc] 启用的计算步骤:', enabledSteps.map(s => ({ type: s.type, order: s.order, name: s.name })));

  const result: CalculationResult = {
    originalAmount,
    totalDiscount: 0,
    finalAmount: originalAmount,
    steps: [],
    hasNegativeFloor: false
  };

  let currentAmount = originalAmount;
  const usedCouponIds = new Set<string>();

  for (const step of enabledSteps) {
    const coupon = coupons.find(
      c => c.type === step.type && c.status === 'available' && !usedCouponIds.has(c.id)
    );

    if (!coupon) {
      console.log('[CouponCalc] 跳过步骤:', step.name, '未找到可用优惠券');
      continue;
    }

    console.log('[CouponCalc] 应用优惠券:', coupon.name, '类型:', coupon.type, '当前金额:', currentAmount);
    usedCouponIds.add(coupon.id);

    const { discountAmount, afterAmount } = calculateDiscount(coupon, currentAmount);

    result.steps.push({
      stepName: step.name,
      couponType: coupon.type,
      beforeAmount: currentAmount,
      discountAmount,
      afterAmount,
      couponId: coupon.id,
      couponName: coupon.name
    });

    result.totalDiscount += discountAmount;
    currentAmount = afterAmount;
  }

  if (currentAmount < 0) {
    console.warn('[CouponCalc] 优惠后金额为负，触发负值兜底', {
      beforeFloor: currentAmount
    });
    result.hasNegativeFloor = true;
    result.totalDiscount = originalAmount;
    result.finalAmount = 0;
  } else {
    result.finalAmount = Math.round(currentAmount * 100) / 100;
    result.totalDiscount = Math.round(result.totalDiscount * 100) / 100;
  }

  console.log('[CouponCalc] 优惠计算完成', {
    originalAmount,
    totalDiscount: result.totalDiscount,
    finalAmount: result.finalAmount,
    hasNegativeFloor: result.hasNegativeFloor,
    steps: result.steps.map(s => ({ name: s.couponName, discount: s.discountAmount }))
  });

  return result;
};

export const getDefaultDiscountSteps = (): DiscountStep[] => [
  { id: 'step-1', name: '满减券', type: 'fullReduce', order: 1, enabled: true },
  { id: 'step-2', name: '折扣券', type: 'discount', order: 2, enabled: true },
  { id: 'step-3', name: '抵扣券', type: 'deduct', order: 3, enabled: true }
];

export const validateCouponApplicable = (
  coupon: Coupon,
  amount: number
): { valid: boolean; reason?: string } => {
  if (coupon.status !== 'available') {
    return { valid: false, reason: '优惠券不可用' };
  }

  const now = new Date();
  const validStart = new Date(coupon.validStart);
  const validEnd = new Date(coupon.validEnd);

  if (now < validStart) {
    return { valid: false, reason: '优惠券尚未生效' };
  }

  if (now > validEnd) {
    return { valid: false, reason: '优惠券已过期' };
  }

  if (coupon.minAmount && amount < coupon.minAmount) {
    return { valid: false, reason: `满${coupon.minAmount}元可用` };
  }

  return { valid: true };
};

export const formatCouponValue = (coupon: Coupon): string => {
  switch (coupon.type) {
    case 'discount':
      return `${coupon.value}折`;
    case 'fullReduce':
      return `减${coupon.value}`;
    case 'deduct':
      return `抵${coupon.value}`;
    default:
      return '';
  }
};
