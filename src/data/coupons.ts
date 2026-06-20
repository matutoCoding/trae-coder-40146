import { Coupon, CouponStatus } from '@/types/coupon';

const today = new Date();
const oneMonthLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
const twoMonthsLater = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
const lastMonth = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const mockCoupons: Coupon[] = [
  {
    id: 'c001',
    name: '新人8折券',
    type: 'discount',
    value: 8,
    description: '全场通用，首次消费专享',
    status: 'available',
    validStart: formatDate(today),
    validEnd: formatDate(oneMonthLater),
    stock: 100
  },
  {
    id: 'c002',
    name: '满200减50',
    type: 'fullReduce',
    value: 50,
    minAmount: 200,
    description: '满200元立减50元',
    status: 'available',
    validStart: formatDate(today),
    validEnd: formatDate(twoMonthsLater),
    stock: 50
  },
  {
    id: 'c003',
    name: '100元抵扣券',
    type: 'deduct',
    value: 100,
    minAmount: 0,
    description: '无门槛抵扣100元',
    status: 'available',
    validStart: formatDate(today),
    validEnd: formatDate(oneMonthLater),
    stock: 20
  },
  {
    id: 'c004',
    name: '会员75折',
    type: 'discount',
    value: 7.5,
    minAmount: 100,
    maxDiscount: 80,
    description: '会员专享，最高减80元',
    status: 'available',
    validStart: formatDate(today),
    validEnd: formatDate(twoMonthsLater),
    stock: 0
  },
  {
    id: 'c005',
    name: '满100减20',
    type: 'fullReduce',
    value: 20,
    minAmount: 100,
    description: '满100元立减20元',
    status: 'available',
    validStart: formatDate(today),
    validEnd: formatDate(oneMonthLater),
    stock: 200
  },
  {
    id: 'c006',
    name: '周三特惠券',
    type: 'discount',
    value: 6.5,
    minAmount: 50,
    description: '仅限周三使用，超低折扣',
    status: 'available',
    validStart: formatDate(today),
    validEnd: formatDate(twoMonthsLater),
    stock: 30
  },
  {
    id: 'c007',
    name: '50元抵扣券',
    type: 'deduct',
    value: 50,
    minAmount: 100,
    description: '满100元可用',
    status: 'used',
    validStart: formatDate(oneMonthAgo),
    validEnd: formatDate(lastMonth)
  },
  {
    id: 'c008',
    name: '新手体验券',
    type: 'fullReduce',
    value: 30,
    minAmount: 50,
    description: '新用户专享',
    status: 'expired',
    validStart: formatDate(oneMonthAgo),
    validEnd: formatDate(lastMonth)
  }
];

export const getAvailableCoupons = (): Coupon[] => {
  return mockCoupons.filter(c => c.status === 'available');
};

export const getCouponById = (id: string): Coupon | undefined => {
  return mockCoupons.find(c => c.id === id);
};

export const getCouponsByType = (type: string): Coupon[] => {
  return mockCoupons.filter(c => c.type === type);
};
