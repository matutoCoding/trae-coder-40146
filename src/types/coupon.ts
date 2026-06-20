export type CouponType = 'discount' | 'fullReduce' | 'deduct';

export type CouponStatus = 'available' | 'used' | 'expired';

export interface Coupon {
  id: string;
  name: string;
  type: CouponType;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  description: string;
  status: CouponStatus;
  validStart: string;
  validEnd: string;
  stock?: number;
}

export interface DiscountStep {
  id: string;
  name: string;
  type: CouponType;
  order: number;
  enabled: boolean;
}

export const COUPON_TYPE_LABEL: Record<CouponType, string> = {
  discount: '折扣券',
  fullReduce: '满减券',
  deduct: '抵扣券'
};

export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  available: '可使用',
  used: '已使用',
  expired: '已过期'
};
